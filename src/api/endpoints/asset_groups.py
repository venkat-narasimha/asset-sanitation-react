from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from sqlalchemy import text
from app.db.session import get_sanitation_db
import uuid

router = APIRouter(prefix="/asset-groups", tags=["Asset Groups"])

class AssetGroupCreate(BaseModel):
    group_name: str
    assets: Optional[str] = None  # legacy, ignored
    location: Optional[str] = None
    notes: Optional[str] = None

class ErpAssetLink(BaseModel):
    erp_asset_id: int
    erp_asset_name: str
    asset_name: str
    asset_category: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

class AddAssetsRequest(BaseModel):
    erp_asset_ids: List[int]

# ── List all groups ────────────────────────────────────────────────────────────

@router.get("")
async def list_asset_groups():
    db = next(get_sanitation_db())
    try:
        rows = db.execute(text(
            "SELECT id, group_name, is_active, location, notes, created_at FROM asset_group ORDER BY group_name"
        )).fetchall()
        return {"success": True, "data": [
            {"id": r[0], "group_name": r[1], "assets": None, "is_active": bool(r[2]),
             "location": r[3], "notes": r[4], "created_at": str(r[5])}
            for r in rows
        ]} if rows else {"success": True, "data": []}
    finally:
        db.close()

# ── Get one group with stats + history ───────────────────────────────────────

@router.get("/{ag_id}")
async def get_asset_group(ag_id: str):
    db = next(get_sanitation_db())
    try:
        row = db.execute(text(
            "SELECT id, group_name, is_active, location, notes, created_at FROM asset_group WHERE id=:id"
        ), {"id": ag_id}).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Not found")

        group = {
            "id": row[0], "group_name": row[1], "assets": None,
            "is_active": bool(row[2]), "location": row[3], "notes": row[4],
            "created_at": str(row[5])
        }

        # Stats
        stats = db.execute(text("""
            SELECT
                COUNT(*),
                SUM(CASE WHEN status='Pending' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status='In Progress' THEN 1 ELSE 0 END),
                SUM(CASE WHEN status='Completed' THEN 1 ELSE 0 END)
            FROM sanitation_order WHERE asset_group_id=:id
        """), {"id": ag_id}).fetchone()

        avg_row = db.execute(text("""
            SELECT AVG(TIMESTAMPDIFF(MINUTE,
                CONCAT(start_date, ' ', COALESCE(start_time, '00:00')),
                CONCAT(end_date, ' ', COALESCE(end_time, '00:00'))))
            FROM sanitation_order
            WHERE asset_group_id=:id AND status='Completed'
            AND start_date IS NOT NULL AND end_date IS NOT NULL
        """), {"id": ag_id}).fetchone()

        history_rows = db.execute(text("""
            SELECT id, so_number, production_order, sanitation_type, status,
                   allergen_triggered, created_at,
                   start_date, start_time, end_date, end_time, completed_by, cleaning_notes
            FROM sanitation_order WHERE asset_group_id=:id ORDER BY created_at DESC LIMIT 50
        """), {"id": ag_id}).fetchall()

        allergen_rows = db.execute(text("""
            SELECT allergen_triggered, COUNT(*) as cnt
            FROM sanitation_order
            WHERE asset_group_id=:id AND allergen_triggered IS NOT NULL AND allergen_triggered != ''
            GROUP BY allergen_triggered ORDER BY cnt DESC
        """), {"id": ag_id}).fetchall()

        # Linked assets via junction
        linked_rows = db.execute(text("""
            SELECT ea.id, ea.erp_asset_name, ea.asset_name, ea.asset_category, ea.location, ea.status
            FROM asset_group_asset aga
            JOIN erp_assets ea ON aga.erp_asset_id = ea.id
            WHERE aga.asset_group_id = :id
            ORDER BY ea.asset_name
        """), {"id": ag_id}).fetchall()

        return {"success": True, "data": {
            "group": group,
            "linked_assets": [
                {"erp_asset_id": r[0], "erp_asset_name": r[1], "asset_name": r[2],
                 "asset_category": r[3], "location": r[4], "status": r[5]}
                for r in linked_rows
            ],
            "stats": {
                "total": stats[0] or 0,
                "pending": stats[1] or 0,
                "in_progress": stats[2] or 0,
                "completed": stats[3] or 0,
                "avg_completion_min": round(avg_row[0], 1) if avg_row[0] else None,
            },
            "history": [
                {"id": r[0], "so_number": r[1], "production_order": r[2],
                 "sanitation_type": r[3], "status": r[4], "allergen_triggered": r[5],
                 "created_at": str(r[6]),
                 "started_at": f"{r[7]} {r[8]}" if r[7] else None,
                 "completed_at": f"{r[9]} {r[10]}" if r[9] else None,
                 "completed_by": r[11], "cleaning_notes": r[12]}
                for r in history_rows
            ],
            "allergen_breakdown": [
                {"allergen": r[0], "count": r[1]} for r in allergen_rows
            ]
        }}
    finally:
        db.close()

# ── Create group ─────────────────────────────────────────────────────────────

@router.post("")
async def create_asset_group(payload: AssetGroupCreate):
    db = next(get_sanitation_db())
    try:
        gid = str(uuid.uuid4())
        db.execute(text(
            "INSERT INTO asset_group (id, group_name, location, notes, is_active) VALUES (:id, :gn, :loc, :notes, 1)"
        ), {"id": gid, "gn": payload.group_name, "loc": payload.location, "notes": payload.notes})
        db.commit()
        return {"success": True, "id": gid}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

# ── Update group ─────────────────────────────────────────────────────────────

@router.put("/{ag_id}")
async def update_asset_group(ag_id: str, payload: AssetGroupCreate):
    db = next(get_sanitation_db())
    try:
        db.execute(text(
            "UPDATE asset_group SET group_name=:gn, location=:loc, notes=:notes WHERE id=:id"
        ), {"gn": payload.group_name, "loc": payload.location, "notes": payload.notes, "id": ag_id})
        db.commit()
        return {"success": True}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

# ── Delete (soft) ─────────────────────────────────────────────────────────────

@router.delete("/{ag_id}")
async def delete_asset_group(ag_id: str):
    db = next(get_sanitation_db())
    try:
        db.execute(text("UPDATE asset_group SET is_active=0 WHERE id=:id"), {"id": ag_id})
        db.commit()
        return {"success": True}
    finally:
        db.close()

# ── All available ERP assets (for dropdowns) ────────────────────────

@router.get("/all-assets")
async def list_erp_assets():
    db = next(get_sanitation_db())
    try:
        rows = db.execute(text(
            "SELECT id, erp_asset_name, asset_name, asset_category, location, status "
            "FROM erp_assets ORDER BY asset_name"
        )).fetchall()
        return {"success": True, "data": [
            {"id": r[0], "name": r[1], "asset_name": r[2], "asset_category": r[3],
             "location": r[4], "status": r[5]}
            for r in rows
        ]}
    finally:
        db.close()

# ── List linked assets for a group ─────────────────────────────────────────

@router.get("/{ag_id}/assets")
async def list_group_assets(ag_id: str):
    db = next(get_sanitation_db())
    try:
        rows = db.execute(text("""
            SELECT ea.id, ea.erp_asset_name, ea.asset_name, ea.asset_category, ea.location, ea.status
            FROM asset_group_asset aga
            JOIN erp_assets ea ON aga.erp_asset_id = ea.id
            WHERE aga.asset_group_id = :id
            ORDER BY ea.asset_name
        """), {"id": ag_id}).fetchall()
        return {"success": True, "data": [
            {"erp_asset_id": r[0], "erp_asset_name": r[1], "asset_name": r[2],
             "asset_category": r[3], "location": r[4], "status": r[5]}
            for r in rows
        ]}
    finally:
        db.close()

# ── Add assets to group ─────────────────────────────────────────────────────

@router.post("/{ag_id}/assets")
async def add_assets_to_group(ag_id: str, payload: AddAssetsRequest):
    db = next(get_sanitation_db())
    try:
        # Verify group exists
        exists = db.execute(text("SELECT id FROM asset_group WHERE id=:id"), {"id": ag_id}).fetchone()
        if not exists:
            raise HTTPException(status_code=404, detail="Asset group not found")

        # Get existing links
        existing = db.execute(text(
            "SELECT erp_asset_id FROM asset_group_asset WHERE asset_group_id=:ag_id"
        ), {"ag_id": ag_id}).fetchall()
        existing_ids = {r[0] for r in existing}

        added = []
        errors = []
        for eid in payload.erp_asset_ids:
            if eid in existing_ids:
                continue  # already linked
            # Verify erp_asset exists
            asset = db.execute(text("SELECT id FROM erp_assets WHERE id=:id"), {"id": eid}).fetchone()
            if not asset:
                errors.append(f"ERP asset id {eid} not found")
                continue
            try:
                db.execute(text(
                    "INSERT INTO asset_group_asset (id, asset_group_id, erp_asset_id) VALUES (:id, :ag_id, :eid)"
                ), {"id": str(uuid.uuid4()), "ag_id": ag_id, "eid": eid})
                existing_ids.add(eid)
                added.append(eid)
            except Exception as ex:
                errors.append(f"Error linking asset {eid}: {ex}")

        db.commit()
        return {"success": True, "added": added, "errors": errors}
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        db.close()

# ── Remove asset from group ──────────────────────────────────────────────────

@router.delete("/{ag_id}/assets/{erp_asset_id}")
async def remove_asset_from_group(ag_id: str, erp_asset_id: int):
    db = next(get_sanitation_db())
    try:
        result = db.execute(text(
            "DELETE FROM asset_group_asset WHERE asset_group_id=:ag_id AND erp_asset_id=:eid"
        ), {"ag_id": ag_id, "eid": erp_asset_id})
        db.commit()
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Link not found")
        return {"success": True}
    finally:
        db.close()
