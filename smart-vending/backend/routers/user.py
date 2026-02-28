from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import schemas, crud
from database import SessionLocal
from fastapi import HTTPException
import models, auth

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_user(db, user)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Registration failed. Email might already exist.")

@router.post("/login")
def login(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="User not found")

    if user.password != db_user.password:
        raise HTTPException(status_code=400, detail="Incorrect password")

    token = auth.create_access_token({"sub": db_user.email})
    return {"access_token": token, "user_id": db_user.id}

@router.put("/{user_id}/fcm-token")
def update_token(user_id: int, token_data: schemas.FCMTokenUpdate, db: Session = Depends(get_db)):
    user = crud.update_fcm_token(db, user_id, token_data.fcm_token)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "FCM token updated successfully"}

@router.get("/{user_id}/purchases")
def get_user_purchases(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    transactions = db.query(models.Transaction, models.Product).join(
        models.Product, models.Transaction.product_id == models.Product.id
    ).filter(
        models.Transaction.user_id == user_id,
        models.Transaction.payment_status == "Completed"
    ).all()

    total_spent = sum(t.Transaction.amount for t in transactions)

    history = [
        {
            "id": t.Transaction.id,
            "product_name": t.Product.name,
            "amount": t.Transaction.amount,
            "status": t.Transaction.payment_status
        }
        for t in transactions
    ]

    return {
        "user": {
            "name": user.name,
            "email": user.email
        },
        "total_spent": total_spent,
        "history": history
    }