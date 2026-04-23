"""
Auth Endpoints — session-based SPA auth
"""
from fastapi import APIRouter, HTTPException, Response, Cookie
from pydantic import BaseModel
from typing import Optional
import requests

router = APIRouter(prefix="/auth", tags=["auth"])
ERPNEXT_SITE = "https://pberpDEV.duckdns.org"


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/login")
async def spa_login(body: LoginRequest, response: Response):
    """Login to ERPNext, set HttpOnly session cookie."""
    try:
        login_res = requests.post(
            f"{ERPNEXT_SITE}/api/method/login",
            data={
                "usr": body.username,
                "pwd": body.password,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=10,
        )
        if login_res.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        cookies = login_res.cookies
        sid = cookies.get("sid")
        if not sid:
            raise HTTPException(status_code=401, detail="No session cookie")

        me_res = requests.get(
            f"{ERPNEXT_SITE}/api/method/frappe.auth.get_logged_user",
            cookies={"sid": sid},
            timeout=10,
        )
        username = body.username
        if me_res.status_code == 200:
            username = me_res.json().get("message", body.username)

        response.set_cookie(
            key="sid",
            value=sid,
            httponly=True,
            samesite="lax",
            secure=True,
            max_age=60 * 60 * 24 * 7,
        )
        return {
            "sid": sid,
            "username": username,
            "home_page": "desk",
        }
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Cannot reach ERPNext")


@router.get("/session")
async def check_session(sid: Optional[str] = Cookie(None)):
    """Validate session via HttpOnly cookie and return user info."""
    if not sid:
        raise HTTPException(status_code=401, detail="No session cookie")

    try:
        res = requests.get(
            f"{ERPNEXT_SITE}/api/method/frappe.auth.get_logged_user",
            cookies={"sid": sid},
            timeout=10,
        )
        if res.status_code != 200 or res.json().get("message") == "Guest":
            raise HTTPException(status_code=401, detail="Invalid session")

        data = res.json()
        return {
            "name": data.get("message", ""),
            "full_name": data.get("message", ""),
            "home_page": "desk",
        }
    except requests.exceptions.ConnectionError:
        raise HTTPException(status_code=503, detail="Cannot reach ERPNext")
