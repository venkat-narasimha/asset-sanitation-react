from fastapi import APIRouter
from sqlalchemy import text, func
from datetime import datetime, timedelta, date as date_cls
from app.db.session import get_sanitation_db

router = APIRouter(prefix="/stats", tags=["Stats"])


def _combine_datetime(row_date, row_time):
    """Combine date and time columns into a datetime object."""
    if row_date is None:
        return None
    if row_time is None:
        return datetime.combine(row_date, datetime.min.time())
    if isinstance(row_time, str):
        # time column may come as string "HH:MM:SS"
        parts = row_time.split(":")
        return datetime(row_date.year, row_date.month, row_date.day,
                       int(parts[0]), int(parts[1]), int(parts[2] if len(parts) > 2 else 0))
    return datetime.combine(row_date, row_time)


@router.get("")
async def get_stats():
    db = next(get_sanitation_db())
    try:
        now = datetime.now()
        week_ago = now - timedelta(days=7)
        fourteen_days_ago = now - timedelta(days=14)

        total = db.execute(text("SELECT COUNT(*) FROM sanitation_order")).scalar()
        pending = db.execute(text("SELECT COUNT(*) FROM sanitation_order WHERE status='Pending'")).scalar()
        in_progress = db.execute(text("SELECT COUNT(*) FROM sanitation_order WHERE status='In Progress'")).scalar()

        # completed_this_week: combine end_date + end_time
        completed_rows = db.execute(text(
            "SELECT end_date, end_time FROM sanitation_order WHERE status='Completed'"
        )).fetchall()
        completed_this_week = 0
        for (end_date, end_time) in completed_rows:
            if end_date is None:
                continue
            dt = _combine_datetime(end_date, end_time)
            if dt and dt >= week_ago:
                completed_this_week += 1

        # Type breakdown
        type_rows = db.execute(text(
            "SELECT sanitation_type, COUNT(*) as count FROM sanitation_order GROUP BY sanitation_type ORDER BY count DESC"
        )).fetchall()
        type_breakdown = [{"type": r[0] or "Normal", "count": r[1]} for r in type_rows]

        # Daily volume (last 14 days) — completed orders
        daily_map = {}
        completed_rows = db.execute(text(
            "SELECT end_date FROM sanitation_order WHERE status='Completed'"
        )).fetchall()
        for (end_date,) in completed_rows:
            if end_date is None:
                continue
            d = end_date.isoformat() if isinstance(end_date, date_cls) else str(end_date)
            if d not in daily_map:
                daily_map[d] = 0
            dt = _combine_datetime(end_date, None)
            if dt and dt >= fourteen_days_ago:
                daily_map[d] += 1
        daily_volume = sorted([{"date": d, "count": c} for d, c in daily_map.items()], key=lambda x: x["date"])

        # Orders by asset group
        group_rows = db.execute(text(
            "SELECT ag.group_name, COUNT(so.id) as count "
            "FROM sanitation_order so "
            "JOIN asset_group ag ON so.asset_group_id = ag.id "
            "GROUP BY ag.group_name ORDER BY count DESC"
        )).fetchall()
        orders_by_group = [{"group_name": r[0], "count": r[1]} for r in group_rows]

        # Avg completion time by asset group (in minutes)
        avg_rows = db.execute(text(
            "SELECT ag.group_name, so.start_date, so.start_time, so.end_date, so.end_time "
            "FROM sanitation_order so "
            "JOIN asset_group ag ON so.asset_group_id = ag.id "
            "WHERE so.status='Completed'"
        )).fetchall()

        group_times = {}
        for (name, sd, st, ed, et) in avg_rows:
            start_dt = _combine_datetime(sd, st)
            end_dt = _combine_datetime(ed, et)
            if start_dt and end_dt and name:
                diff_min = (end_dt - start_dt).total_seconds() / 60
                if name not in group_times:
                    group_times[name] = []
                group_times[name].append(diff_min)

        avg_time_by_group = [
            {"group_name": g, "avg_minutes": round(sum(times) / len(times), 1)}
            for g, times in group_times.items()
        ]
        avg_time_by_group.sort(key=lambda x: x["avg_minutes"], reverse=True)

        return {
            "success": True,
            "data": {
                "total": total or 0,
                "pending": pending or 0,
                "in_progress": in_progress or 0,
                "completed_this_week": completed_this_week,
                "type_breakdown": type_breakdown,
                "daily_volume": daily_volume,
                "orders_by_group": orders_by_group,
                "avg_time_by_group": avg_time_by_group,
            }
        }
    finally:
        db.close()
