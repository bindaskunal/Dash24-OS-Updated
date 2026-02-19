"""
Dash24 V1 - Brand Analytics API Router (Basic)
Only implements V1 scope: Overview, SKU Performance, Realtime
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.redis_client import get_redis
from app.models import Order, OrderItem, Product, Brand, BrandDailyMetrics
from app.models.enums import OrderStatus, PaymentMethod
from app.services.order_state_machine import is_within_cutoff

router = APIRouter(prefix="/api/brand/analytics", tags=["brand-analytics"])


# Response Models

class RevenueMetric(BaseModel):
    current: float
    previous: float = 0
    change_percent: float = 0


class OverviewResponse(BaseModel):
    period: dict
    metrics: dict
    delivery: dict


class SKUMetric(BaseModel):
    product_id: str
    sku: str
    name: str
    brand_name: str
    units_sold: int
    revenue: float
    current_stock: int
    is_low_stock: bool


class SKUPerformanceResponse(BaseModel):
    period: dict
    skus: List[SKUMetric]


class RealtimeResponse(BaseModel):
    as_of: str
    today: dict
    order_status: dict
    same_day_cutoff: dict


# Helpers

async def get_brand_id_from_user(db: AsyncSession) -> UUID:
    """Get brand ID from authenticated user (placeholder)"""
    # TODO: Extract from JWT token
    # For now, get first brand
    result = await db.execute(select(Brand).limit(1))
    brand = result.scalar_one_or_none()
    if brand:
        return brand.id
    raise HTTPException(status_code=404, detail="Brand not found")


# API Endpoints

@router.get("/overview", response_model=OverviewResponse)
async def get_overview(
    period: str = Query("7d", regex="^(today|7d|30d)$"),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """
    Get brand analytics overview.
    
    V1 Scope:
    - Revenue (current + previous period)
    - Orders
    - AOV
    - Same-day %
    - COD vs Prepaid %
    """
    brand_id = await get_brand_id_from_user(db)
    
    # Calculate date ranges
    today = date.today()
    
    if period == "today":
        start_date = today
        end_date = today
        prev_start = today - timedelta(days=1)
        prev_end = today - timedelta(days=1)
    elif period == "7d":
        start_date = today - timedelta(days=6)
        end_date = today
        prev_start = today - timedelta(days=13)
        prev_end = today - timedelta(days=7)
    else:  # 30d
        start_date = today - timedelta(days=29)
        end_date = today
        prev_start = today - timedelta(days=59)
        prev_end = today - timedelta(days=30)
    
    # Query current period metrics
    current_metrics = await _get_period_metrics(db, brand_id, start_date, end_date)
    prev_metrics = await _get_period_metrics(db, brand_id, prev_start, prev_end)
    
    # Calculate changes
    revenue_change = _calc_change(current_metrics["revenue"], prev_metrics["revenue"])
    orders_change = _calc_change(current_metrics["orders"], prev_metrics["orders"])
    
    return OverviewResponse(
        period={
            "start": start_date.isoformat(),
            "end": end_date.isoformat(),
            "label": f"Last {period}" if period != "today" else "Today"
        },
        metrics={
            "revenue": {
                "current": current_metrics["revenue"],
                "previous": prev_metrics["revenue"],
                "change_percent": revenue_change
            },
            "orders": {
                "current": current_metrics["orders"],
                "previous": prev_metrics["orders"],
                "change_percent": orders_change
            },
            "aov": current_metrics["aov"],
            "same_day_percent": current_metrics["same_day_percent"],
            "payment_split": {
                "cod_percent": current_metrics["cod_percent"],
                "prepaid_percent": current_metrics["prepaid_percent"]
            }
        },
        delivery={
            "same_day_orders": current_metrics["same_day_orders"],
            "next_day_orders": current_metrics["next_day_orders"]
        }
    )


@router.get("/skus", response_model=SKUPerformanceResponse)
async def get_sku_performance(
    period: str = Query("7d", regex="^(7d|30d)$"),
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """
    Get SKU performance - Top SKUs by revenue.
    
    V1 Scope:
    - Top 10 SKUs by revenue
    - Units sold
    - Current stock
    - Low stock flag
    """
    brand_id = await get_brand_id_from_user(db)
    
    today = date.today()
    days = 7 if period == "7d" else 30
    start_date = today - timedelta(days=days-1)
    
    # Query SKU performance
    start_datetime = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    
    result = await db.execute(
        select(
            OrderItem.product_id,
            OrderItem.sku,
            OrderItem.product_name,
            OrderItem.brand_name,
            func.sum(OrderItem.quantity).label("units_sold"),
            func.sum(OrderItem.subtotal).label("revenue")
        )
        .join(Order, Order.id == OrderItem.order_id)
        .where(
            OrderItem.brand_id == brand_id,
            Order.created_at >= start_datetime,
            Order.status.in_([
                OrderStatus.CONFIRMED.value,
                OrderStatus.PROCESSING.value,
                OrderStatus.PACKED.value,
                OrderStatus.SHIPPED.value,
                OrderStatus.OUT_FOR_DELIVERY.value,
                OrderStatus.DELIVERED.value
            ])
        )
        .group_by(OrderItem.product_id, OrderItem.sku, OrderItem.product_name, OrderItem.brand_name)
        .order_by(func.sum(OrderItem.subtotal).desc())
        .limit(limit)
    )
    
    rows = result.all()
    
    # Get current stock for each product
    skus = []
    for row in rows:
        product = await db.get(Product, row.product_id) if row.product_id else None
        
        skus.append(SKUMetric(
            product_id=str(row.product_id) if row.product_id else "",
            sku=row.sku,
            name=row.product_name,
            brand_name=row.brand_name,
            units_sold=int(row.units_sold or 0),
            revenue=float(row.revenue or 0),
            current_stock=product.stock_quantity if product else 0,
            is_low_stock=product.is_low_stock if product else False
        ))
    
    return SKUPerformanceResponse(
        period={
            "start": start_date.isoformat(),
            "end": today.isoformat(),
            "label": f"Last {days} days"
        },
        skus=skus
    )


@router.get("/realtime", response_model=RealtimeResponse)
async def get_realtime_metrics(
    db: AsyncSession = Depends(get_db),
    redis = Depends(get_redis)
):
    """
    Get realtime metrics for today.
    
    V1 Scope:
    - Orders today
    - Revenue today
    - Same-day cutoff countdown
    """
    brand_id = await get_brand_id_from_user(db)
    
    today = date.today()
    today_start = datetime.combine(today, datetime.min.time()).replace(tzinfo=timezone.utc)
    
    # Today's metrics
    result = await db.execute(
        select(
            func.count(Order.id).label("orders"),
            func.sum(Order.total).label("revenue")
        )
        .join(OrderItem, Order.id == OrderItem.order_id)
        .where(
            OrderItem.brand_id == brand_id,
            Order.created_at >= today_start,
            Order.status != OrderStatus.CANCELLED.value
        )
    )
    
    row = result.one()
    
    # Order status counts
    status_result = await db.execute(
        select(Order.status, func.count(Order.id))
        .join(OrderItem, Order.id == OrderItem.order_id)
        .where(
            OrderItem.brand_id == brand_id,
            Order.created_at >= today_start
        )
        .group_by(Order.status)
    )
    
    status_counts = {row[0]: row[1] for row in status_result.all()}
    
    # Calculate cutoff countdown
    from zoneinfo import ZoneInfo
    IST = ZoneInfo('Asia/Kolkata')
    now_ist = datetime.now(IST)
    cutoff_time = now_ist.replace(hour=14, minute=0, second=0, microsecond=0)
    
    if now_ist.time() < cutoff_time.time():
        time_remaining = cutoff_time - now_ist
        minutes_remaining = int(time_remaining.total_seconds() / 60)
    else:
        minutes_remaining = 0
    
    return RealtimeResponse(
        as_of=datetime.now(timezone.utc).isoformat(),
        today={
            "orders": row.orders or 0,
            "revenue": float(row.revenue or 0)
        },
        order_status={
            "pending": status_counts.get(OrderStatus.PENDING.value, 0),
            "confirmed": status_counts.get(OrderStatus.CONFIRMED.value, 0),
            "processing": status_counts.get(OrderStatus.PROCESSING.value, 0),
            "out_for_delivery": status_counts.get(OrderStatus.OUT_FOR_DELIVERY.value, 0),
            "delivered": status_counts.get(OrderStatus.DELIVERED.value, 0)
        },
        same_day_cutoff={
            "time": "14:00",
            "is_before_cutoff": is_within_cutoff(),
            "minutes_remaining": max(0, minutes_remaining)
        }
    )


# Helper functions

async def _get_period_metrics(
    db: AsyncSession,
    brand_id: UUID,
    start_date: date,
    end_date: date
) -> dict:
    """Get aggregated metrics for a period"""
    
    start_datetime = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
    end_datetime = datetime.combine(end_date, datetime.max.time()).replace(tzinfo=timezone.utc)
    
    # Base query for brand orders
    result = await db.execute(
        select(
            func.count(Order.id.distinct()).label("orders"),
            func.sum(OrderItem.subtotal).label("revenue"),
            func.sum(
                func.case((Order.payment_method == PaymentMethod.COD.value, 1), else_=0)
            ).label("cod_orders"),
            func.sum(
                func.case(
                    (Order.delivery_slot.op('->')('is_same_day').cast(Boolean) == True, 1),
                    else_=0
                )
            ).label("same_day_orders")
        )
        .join(OrderItem, Order.id == OrderItem.order_id)
        .where(
            OrderItem.brand_id == brand_id,
            Order.created_at >= start_datetime,
            Order.created_at <= end_datetime,
            Order.status.in_([
                OrderStatus.CONFIRMED.value,
                OrderStatus.PROCESSING.value,
                OrderStatus.PACKED.value,
                OrderStatus.SHIPPED.value,
                OrderStatus.OUT_FOR_DELIVERY.value,
                OrderStatus.DELIVERED.value
            ])
        )
    )
    
    row = result.one()
    
    orders = row.orders or 0
    revenue = float(row.revenue or 0)
    cod_orders = row.cod_orders or 0
    same_day_orders = row.same_day_orders or 0
    
    return {
        "orders": orders,
        "revenue": revenue,
        "aov": round(revenue / orders, 2) if orders > 0 else 0,
        "cod_orders": cod_orders,
        "cod_percent": round((cod_orders / orders) * 100, 1) if orders > 0 else 0,
        "prepaid_percent": round(((orders - cod_orders) / orders) * 100, 1) if orders > 0 else 0,
        "same_day_orders": same_day_orders,
        "next_day_orders": orders - same_day_orders,
        "same_day_percent": round((same_day_orders / orders) * 100, 1) if orders > 0 else 0
    }


def _calc_change(current: float, previous: float) -> float:
    """Calculate percentage change"""
    if previous == 0:
        return 100 if current > 0 else 0
    return round(((current - previous) / previous) * 100, 2)


# Need this import for the query
from sqlalchemy import Boolean
