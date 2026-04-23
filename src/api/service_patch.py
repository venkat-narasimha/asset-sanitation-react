"""
Patched service — adds group_name via LEFT JOIN on asset_group
"""
import json
from datetime import date, datetime, timedelta
from typing import Optional, List


def _delta_to_time(val):
    if val is None:
        return None
    if isinstance(val, timedelta):
        total = int(val.total_seconds())
        h, rem = divmod(total, 3600)
        m, s = divmod(rem, 60)
        return time(h, m, s)
    return val


def _row_to_sanitation_order(row, group_name: Optional[str] = None):
    """Convert a SQL row to SanitationOrderResponse."""
    checklist = row.cleaning_checklist
    if checklist and isinstance(checklist, str):
        checklist = json.loads(checklist)
    return SanitationOrderResponse(
        id=row.id,
        so_number=row.so_number,
        production_order=row.production_order,
        asset_group_id=row.asset_group_id,
        group_name=group_name,
        allergen_triggered=row.allergen_triggered,
        sanitation_type=SanitationType(row.sanitation_type),
        start_date=row.start_date,
        start_time=_delta_to_time(row.start_time),
        end_date=row.end_date,
        end_time=_delta_to_time(row.end_time),
        status=SanitationStatus(row.status),
        cleaning_checklist=checklist,
        cleaning_notes=row.cleaning_notes,
        completed_by=row.completed_by,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )


def get_sanitation_orders(
    db,
    status: Optional[str] = None,
    asset_group_id: Optional[str] = None,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
):
    """List sanitation orders with optional filters. Does LEFT JOIN with asset_group."""
    query = """
        SELECT so.*, ag.group_name
        FROM sanitation_order so
        LEFT JOIN asset_group ag ON so.asset_group_id = ag.id
        WHERE 1=1
    """
    params = {}
    if status:
        query += " AND so.status = :status"
        params["status"] = status
    if asset_group_id:
        query += " AND so.asset_group_id = :asset_group_id"
        params["asset_group_id"] = asset_group_id
    if from_date:
        query += " AND so.start_date >= :from_date"
        params["from_date"] = from_date
    if to_date:
        query += " AND so.start_date <= :to_date"
        params["to_date"] = to_date
    query += " ORDER BY so.created_at DESC"

    rows = db.execute(text(query), params).fetchall()
    data = [_row_to_sanitation_order(row, group_name=getattr(row, 'group_name', None)) for row in rows]
    return SanitationOrderListResponse(success=True, count=len(data), data=data)
