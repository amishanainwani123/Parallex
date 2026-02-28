from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import math
import crud
import json
from websocket_manager import manager

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Radius of Earth in KM

    lat1 = math.radians(lat1)
    lon1 = math.radians(lon1)
    lat2 = math.radians(lat2)
    lon2 = math.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = math.sin(dlat / 2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c

@router.get("/")
def get_all_machines(db: Session = Depends(get_db)):
    import crud
    return crud.get_machines(db)

@router.post("/nearest-machine")
def find_nearest(user_lat: float, user_lon: float, db: Session = Depends(get_db)):
    machines = db.query(models.Machine).all()

    nearest = None
    min_distance = float("inf")

    for machine in machines:
        distance = calculate_distance(user_lat, user_lon, machine.latitude, machine.longitude)

        if distance < min_distance:
            min_distance = distance
            nearest = machine

    if not nearest:
        return {"error": "No machines found"}

    return {
        "nearest_machine": nearest.name,
        "location": nearest.location,
        "distance_km": round(min_distance, 2)
    }

@router.post("/sync-offline-sales")
async def sync_offline_sales(product_id: int, db: Session = Depends(get_db)):
    # This endpoint acts as the physical Vending Machine Hardware Hook.
    # In real life, the UPI software on the machine calls this when a physical user pays.
    result = crud.buy_product(db, product_id)
    
    if result is None:
        return {"error": "Product not found"}
    if result == "Out of stock":
        return {"error": "Out of stock physically"}
        
    # Instantly blast to all open React Dashboards that a physical sale occurred!
    await manager.broadcast(json.dumps({
        "action": "inventory_deducted",
        "product_id": product_id,
        "machine_id": result.machine_id if hasattr(result, 'machine_id') else None,
        "source": "offline_hardware"
    }))

    return {"message": "Hardware Sync Successful", "product": result.name}