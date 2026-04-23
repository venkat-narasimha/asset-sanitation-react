from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, time, datetime
from enum import Enum


class SanitationType(str, Enum):
    NORMAL = "Normal"
    THOROUGH = "Thorough"
    ALLERGEN_SPECIFIC = "Allergen-specific"


class SanitationStatus(str, Enum):
    PENDING = "Pending"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"


class ChecklistItem(BaseModel):
    item: str
    cleaned: bool = False
    method: Optional[str] = None


class CleaningChecklist(BaseModel):
    mode: str  # "template", "dynamic", "manual"
    items: List[ChecklistItem] = []
    source: Optional[str] = None  # allergen name if dynamic


# ─── Asset Group Schemas ────────────────────────────────────────────────────

class AssetGroupBase(BaseModel):
    group_name: str
    group_type: str = "Production Line"
    assets: List[str] = []
    is_active: bool = True
    notes: Optional[str] = None
    location: Optional[str] = None


class AssetGroupCreate(AssetGroupBase):
    pass


class AssetGroupUpdate(BaseModel):
    group_name: Optional[str] = None
    group_type: Optional[str] = None
    assets: Optional[List[str]] = None
    is_active: Optional[bool] = None
    notes: Optional[str] = None
    location: Optional[str] = None


class AssetGroupResponse(AssetGroupBase):
    id: str
    last_production_order: Optional[str] = None
    last_production_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssetGroupListResponse(BaseModel):
    success: bool = True
    count: int
    data: List[AssetGroupResponse]


class AssetGroupBrief(BaseModel):
    id: str
    group_name: str
    group_type: str
    is_active: bool

    class Config:
        from_attributes = True


# ─── Sanitation Order Schemas ───────────────────────────────────────────────

class SanitationOrderBase(BaseModel):
    production_order: str
    asset_group_id: str
    allergen_triggered: Optional[str] = None
    sanitation_type: SanitationType = SanitationType.NORMAL
    start_date: Optional[date] = None
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    status: SanitationStatus = SanitationStatus.PENDING
    cleaning_checklist: Optional[CleaningChecklist] = None
    cleaning_notes: Optional[str] = None
    completed_by: Optional[str] = None


class SanitationOrderCreate(BaseModel):
    production_order: str
    asset_group_id: str
    allergen_triggered: Optional[str] = None
    sanitation_type: SanitationType = SanitationType.NORMAL
    cleaning_checklist: Optional[CleaningChecklist] = None


class SanitationOrderUpdate(BaseModel):
    start_date: Optional[date] = None
    start_time: Optional[time] = None
    end_date: Optional[date] = None
    end_time: Optional[time] = None
    status: Optional[SanitationStatus] = None
    cleaning_checklist: Optional[CleaningChecklist] = None
    cleaning_notes: Optional[str] = None


class SanitationOrderComplete(BaseModel):
    completed_by: str
    cleaning_notes: Optional[str] = None


class SanitationOrderResponse(SanitationOrderBase):
    id: str
    so_number: str
    group_name: Optional[str] = None  # from asset_group join
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SanitationOrderListResponse(BaseModel):
    success: bool = True
    count: int
    data: List[SanitationOrderResponse]


class PendingOrderBrief(BaseModel):
    id: str
    so_number: str
    production_order: str
    sanitation_type: SanitationType
    status: SanitationStatus
    asset_group_name: str


class PendingOrdersResponse(BaseModel):
    pending: bool
    count: int
    orders: List[PendingOrderBrief] = []


# ─── Trigger Schemas ───────────────────────────────────────────────────────────

class TriggerRequest(BaseModel):
    production_order: str
    bom_no: Optional[str] = None   # If omitted, looked up from Work Order's BOM
    asset_group_id: Optional[str] = None  # If omitted, uses Work Order's custom_asset_group
    completed_at: Optional[datetime] = None


class TriggerResponse(BaseModel):
    id: str
    so_number: str
    sanitation_type: SanitationType
    status: SanitationStatus


class TriggerSkippedResponse(BaseModel):
    skipped: bool = True
    reason: str


class TriggerErrorResponse(BaseModel):
    error: str
    asset_group_id: Optional[str] = None
