"""
GET /api/v1/items — List all ERPNext items (via Frappe REST API)
GET /api/v1/items/{name} — Get single item detail
"""
from fastapi import APIRouter, HTTPException, Query
import requests

router = APIRouter(prefix="/items", tags=["Items"])
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
def list_items(
    search: str = Query(None, description="Search by item name or code"),
    item_group: str = Query(None, description="Filter by item group"),
    disabled: int = Query(None, description="Filter by disabled status (0 or 1)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    sid = _get_frappe_sid()
    params = {"fields": '["*"]', "limit": limit, "offset": offset}
    if search:
        params["filters"] = f'[["Item","item_name","like","%{search}%"]]'
    if item_group:
        f = f'[["Item","item_group","=","{item_group}"]]'
        params["filters"] = params.get("filters", f) + f"%2C[[\"Item\",\"item_group\",\"=\",\"{item_group}\"]]"
    if disabled is not None:
        params["filters"] = f'[["Item","disabled","=",{disabled}]]'

    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/Item",
        params=params,
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()


@router.get("/{name}")
def get_item(name: str):
    sid = _get_frappe_sid()
    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/Item/{name}",
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Item not found")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()
