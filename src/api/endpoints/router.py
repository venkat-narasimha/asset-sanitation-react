from fastapi import APIRouter
from app.api.v1.endpoints import supplier, asset_groups, sanitation_orders, sanitation_trigger, polling, stats, wo_lookup, wo_list

api_router = APIRouter()

# Existing supplier routes
api_router.include_router(supplier.router)

# Asset Sanitation routes
api_router.include_router(asset_groups.router)
api_router.include_router(sanitation_orders.router)
api_router.include_router(sanitation_trigger.router)
api_router.include_router(polling.router)
api_router.include_router(stats.router)
api_router.include_router(wo_lookup.router)
api_router.include_router(wo_list.router)
