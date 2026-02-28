from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
import models
import math

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