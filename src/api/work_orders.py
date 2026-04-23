"""
GET /api/v1/work-orders — List ERPNext Work Orders (via REST API)
GET /api/v1/work-orders/{name} — Get single Work Order
"""
from fastapi import APIRouter, HTTPException, Query
import requests

router = APIRouter(prefix="/work-orders", tags=["Work Orders"])
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
def list_work_orders(
    status: str = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
):
    sid = _get_frappe_sid()
    filters = []
    if status:
        filters.append(["Work Order", "status", "=", status])
    # Only submitted docs (docstatus=1)
    filters.append(["Work Order", "docstatus", "=", 1])

    params = {
        "fields": '["*"]',
        "limit": limit,
        "offset": offset,
        "filters": str(filters).replace("'", '"'),
        "order_by": "modified desc",
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


@router.get("/{wo_name}")
def get_work_order(wo_name: str):
    sid = _get_frappe_sid()
    resp = requests.get(
        f"{ERPNEXT_SITE}/api/resource/Work Order/{wo_name}",
        cookies={"sid": sid},
        timeout=15,
    )
    if resp.status_code == 404:
        raise HTTPException(status_code=404, detail="Work Order not found")
    if resp.status_code != 200:
        raise HTTPException(status_code=resp.status_code, detail=resp.text)
    return resp.json()
