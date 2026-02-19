"""
Dash24 V1 - Retention Trigger Models (Minimal)
Phase 0: Converted status fields to SQL Enum, fixed mutable defaults, added indexes
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, ForeignKey, Text, Index, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from datetime import datetime, timezone
import uuid

from app.database import Base
from app.models.enums import TriggerType, TriggerStatus


class RetentionTrigger(Base):
    """
    Retention triggers - V1 supports only:
    - cart_abandonment (2-hour rule)
    - first_order_followup
    - lapsed_customer (7-day)
    """
    __tablename__ = "retention_triggers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    
    # Trigger details
    trigger_type = Column(String(50), nullable=False, index=True)
    trigger_source = Column(String(50), nullable=False)  # 'event', 'scheduled'
    
    # Context - Phase 0: Fixed mutable default
    context = Column(JSONB, nullable=False, default=dict)
    
    # Timing
    triggered_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Status - Phase 0: Using SQL Enum instead of String
    status = Column(
        SQLEnum(TriggerStatus, name='trigger_status', create_constraint=True),
        nullable=False,
        default=TriggerStatus.PENDING
    )
    
    # Actions - Phase 0: Fixed mutable default
    eligible_actions = Column(JSONB, default=list)
    
    # Outcome
    converted_at = Column(DateTime(timezone=True))
    conversion_order_id = Column(UUID(as_uuid=True), ForeignKey("orders.id", ondelete="SET NULL"))
    
    # Processing
    priority = Column(Integer, default=5)
    suppress_reason = Column(Text)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    
    # Phase 0: Added composite index for common queries
    __table_args__ = (
        Index("ix_retention_user_status", "user_id", "status"),
    )
    
    def to_dict(self):
        return {
            "id": str(self.id),
            "user_id": str(self.user_id),
            "trigger_type": self.trigger_type,
            "status": self.status.value if isinstance(self.status, TriggerStatus) else self.status,
            "context": self.context,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class RetentionAction(Base):
    """Prepared retention actions"""
    __tablename__ = "retention_actions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    trigger_id = Column(UUID(as_uuid=True), ForeignKey("retention_triggers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Action type: push_notification only for V1
    action_type = Column(String(50), nullable=False)
    
    # Prepared payload - Phase 0: Fixed mutable default
    payload = Column(JSONB, nullable=False, default=dict)
    
    # Scheduling
    scheduled_for = Column(DateTime(timezone=True))
    
    # Status - Phase 0: Using SQL Enum instead of String
    status = Column(
        SQLEnum(TriggerStatus, name='action_status', create_constraint=True),
        nullable=False,
        default=TriggerStatus.PENDING
    )
    
    # Execution tracking
    executed_at = Column(DateTime(timezone=True))
    execution_response = Column(JSONB, default=dict)  # Phase 0: Fixed mutable default
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
