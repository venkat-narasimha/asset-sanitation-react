"""
GET /api/v1/boms — List all ERPNext BOMs
GET /api/v1/boms/{name} — Get single BOM detail
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
