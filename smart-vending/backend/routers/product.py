from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/products")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)

@router.post("/buy/{product_id}")
def buy(product_id: int, db: Session = Depends(get_db)):
    result = crud.buy_product(db, product_id)
    
    if result is None:
        return {"error": "Product not found"}
    
    if result == "Out of stock":
        return {"error": "Out of stock"}
    
    return {"message": "Purchase successful"}

@router.get("/search")
def search(name: str, db: Session = Depends(get_db)):
    return crud.search_product(db, name)