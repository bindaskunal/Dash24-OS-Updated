"""
Dash24 V1 - Dashboard Router
Brand dashboard metrics with proper access control and efficient queries
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_

from app.database import get_db
from app.models.order import Order
from app.models.enums import OrderStatus, PaymentStatus
from app.core.security import get_current_user, CurrentUser
from app.core.responses import success_response

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class StatusBreakdown(BaseModel):
    pending: int
    confirmed: int
    shipped: int
    delivered: int
    cancelled: int


class DashboardMetrics(BaseModel):
    total_orders: int
    total_revenue: float
    status_breakdown: StatusBreakdown


@router.get("/brand")
async def get_brand_dashboard(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    current_user: CurrentUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get brand dashboard metrics
    
    Access:
    - Only brand and admin roles allowed
    
    Metrics:
    - Total orders
    - Total revenue (confirmed/shipped/delivered with captured payment)
    - Status breakdown
    
    Filters:
    - start_date: Filter by order.created_at >= start_date
    - end_date: Filter by order.created_at <= end_date
    """
    
    if current_user.role.value not in ["brand", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Brand or admin role required"
        )
    
    brand_id = current_user.brand_id if hasattr(current_user, 'brand_id') else None
    
    if current_user.role.value == "brand" and not brand_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Brand ID not found for user"
        )
    
    base_filters = []
    
    if current_user.role.value == "brand":
        from app.models.order import OrderItem
        query_needs_join = True
        base_filters.append(OrderItem.brand_id == brand_id)
    else:
        query_needs_join = False
    
    if start_date:
        start_datetime = datetime.combine(start_date, datetime.min.time())
        base_filters.append(Order.created_at >= start_datetime)
    
    if end_date:
        end_datetime = datetime.combine(end_date, datetime.max.time())
        base_filters.append(Order.created_at <= end_datetime)
    
    if query_needs_join:
        total_query = (
            select(func.count(func.distinct(Order.id)))
            .select_from(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .where(and_(*base_filters))
        )
        
        revenue_query = (
            select(func.sum(Order.total))
            .select_from(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .where(
                and_(
                    *base_filters,
                    Order.payment_status == PaymentStatus.CAPTURED,
                    Order.status.in_([
                        OrderStatus.CONFIRMED,
                        OrderStatus.SHIPPED,
                        OrderStatus.DELIVERED
                    ])
                )
            )
        )
        
        status_query = (
            select(
                Order.status,
                func.count(func.distinct(Order.id))
            )
            .select_from(Order)
            .join(OrderItem, Order.id == OrderItem.order_id)
            .where(and_(*base_filters))
            .group_by(Order.status)
        )
    else:
        total_query = (
            select(func.count(Order.id))
            .where(and_(*base_filters) if base_filters else True)
        )
        
        revenue_query = (
            select(func.sum(Order.total))
            .where(
                and_(
                    *(base_filters + [
                        Order.payment_status == PaymentStatus.CAPTURED,
                        Order.status.in_([
                            OrderStatus.CONFIRMED,
                            OrderStatus.SHIPPED,
                            OrderStatus.DELIVERED
                        ])
                    ])
                )
            )
        )
        
        status_query = (
            select(Order.status, func.count(Order.id))
            .where(and_(*base_filters) if base_filters else True)
            .group_by(Order.status)
        )
    
    total_result = await db.execute(total_query)
    total_orders = total_result.scalar() or 0
    
    revenue_result = await db.execute(revenue_query)
    total_revenue = float(revenue_result.scalar() or 0)
    
    status_result = await db.execute(status_query)
    status_rows = status_result.all()
    
    status_counts = {row[0]: row[1] for row in status_rows}
    
    status_breakdown = StatusBreakdown(
        pending=status_counts.get(OrderStatus.PENDING, 0),
        confirmed=status_counts.get(OrderStatus.CONFIRMED, 0),
        shipped=status_counts.get(OrderStatus.SHIPPED, 0) + status_counts.get(OrderStatus.OUT_FOR_DELIVERY, 0),
        delivered=status_counts.get(OrderStatus.DELIVERED, 0),
        cancelled=status_counts.get(OrderStatus.CANCELLED, 0)
    )
    
    return success_response({
        "total_orders": total_orders,
        "total_revenue": total_revenue,
        "status_breakdown": {
            "pending": status_breakdown.pending,
            "confirmed": status_breakdown.confirmed,
            "shipped": status_breakdown.shipped,
            "delivered": status_breakdown.delivered,
            "cancelled": status_breakdown.cancelled
        }
    })
