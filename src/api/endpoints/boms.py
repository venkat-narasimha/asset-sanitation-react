"""
GET /api/v1/boms — List all ERPNext BOMs
GET /api/v1/boms/{name} — Get single BOM detail
GET /api/v1/boms/{name}/items — Get BOM items with allergen flags
GET /api/v1/boms/{name}/work-orders — Get Work Orders referencing this BOM
"""
from fastapi import APIRouter, HTTPException, Query
import requests

router = APIRouter(prefix="/boms", tags=["BOMs"])
ERPNEXT_SITE = "https://pberpDEV.duckdns.org"


def _get_frappe_sid():
    login_url = f"{ERPNEXT_SITE}/api/method/login"
    resp = requests.post(
        login_url,
        data={"usr": "Administrator", "pwd": "admin123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )
    for cookie in resp.cookies:
        if cookie.name == "sid":
            return cookie.value
    raise HTTPException(status_code=500, detail="Failed to get Frappe session cookie")


@router.get("")
def list_boms(
    search: str = Query(None, description="Search by BOM name or item"),
    is_active: int = Query(None, description="Filter by is_active (1 or 0)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    sid = _get_frappe_sid()
    params = {"fields": '["*"]', "limit": limit, "offset": offset}
    if is_active is not None:
        params["filters"] = f'[["BOM","is_active","=",{is_active}]]'

    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/BOM",
        params=params,
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.get("/{name}")
def get_bom(name: str):
    sid = _get_frappe_sid()
    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/BOM/{name}",
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="BOM not found")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.get("/{name}/items")
def get_bom_items(name: str):
    """Fetch BOM items (from embedded items array in BOM doc) with allergen flags."""
    sid = _get_frappe_sid()
    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/BOM/{name}",
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="BOM not found")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)

    bom_data = resp.json().get("data", {})
    items = bom_data.get("items", [])

    for item in items:
        item_code = item.get("item_code") or item.get("item")
        if item_code:
            try:
                ir = requests.get(
                    f"{ERPNEXT_SITE}/api/resource/Item/{item_code}",
                    cookies={"sid": sid},
                    timeout=10,
                )
                if ir.status_code == 200:
                    idata = ir.json().get("data", {})
                    item["custom_is_allergen"] = idata.get("custom_is_allergen", 0)
                    item["allergen_names"] = idata.get("custom_allergen_names", "")
                else:
                    item["custom_is_allergen"] = 0
                    item["allergen_names"] = ""
            except Exception:
                item["custom_is_allergen"] = 0
                item["allergen_names"] = ""
        else:
            item["custom_is_allergen"] = 0
            item["allergen_names"] = ""

    return {"success": True, "data": items}


@router.get("/{name}/work-orders")
def get_bom_work_orders(name: str):
    """Fetch ERPNext Work Orders that reference this BOM."""
    sid = _get_frappe_sid()
    params = {
        "fields": '["name","status","production_item","qty","wip_warehouse"]',
        "filters": f'[["Work Order","bom","=","{name}"]]',
        "limit": 50,
    }
    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/Work Order",
        params=params,
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()