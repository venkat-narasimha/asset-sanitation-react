from fastapi import APIRouter, HTTPException
from sqlalchemy import text
from app.db.session import get_sanitation_db

router = APIRouter(prefix="/erp-assets", tags=["ERP Assets"])

@router.get("")
async def list_erp_assets():
    """List all locally-cached ERPNext assets for the asset group UI."""
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