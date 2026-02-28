from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import crud
from database import SessionLocal
from fastapi import Request, HTTPException
import notifications
import json
from websocket_manager import manager

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

import schemas, payment, models

@router.post("/create-order/{product_id}")
def create_order(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return {"error": "Product not found"}
    if product.stock <= 0:
        return {"error": "Out of stock"}
    
    order = payment.create_razorpay_order(product.price)
    return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"]}

@router.post("/buy/{product_id}")
async def buy(product_id: int, payment_data: schemas.PaymentVerification, user_id: int, db: Session = Depends(get_db)):
    # Verify payment signature
    is_valid = payment.verify_razorpay_payment(
        payment_data.order_id, 
        payment_data.payment_id, 
        payment_data.signature
    )
    
    if not is_valid:
        return {"error": "Invalid payment signature"}
    
    result = crud.buy_product(db, product_id)
    
    if result is None:
        return {"error": "Product not found"}
    
    if result == "Out of stock":
        return {"error": "Out of stock"}
        
    # FCM Notification on successful purchase (and alert if low stock)
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user and user.fcm_token:
        notifications.send_push_notification(
            user.fcm_token, 
            "Purchase Successful", 
            f"You have successfully bought {result.name}!"
        )
        if result.stock < 5:
            # Low stock alert (Mock sending to vendor)
            print(f"ALERT: Stock for {result.name} is low ({result.stock} left).")

    # Broadcast to all connected WebSockets that inventory changed
    await manager.broadcast(json.dumps({
        "action": "inventory_deducted",
        "product_id": product_id,
        "machine_id": result.machine_id if hasattr(result, 'machine_id') else None
    }))

    return {"message": "Purchase successful", "product": result.name}


@router.get("/search")
def search(name: str, db: Session = Depends(get_db)):
    return crud.search_product(db, name)

@router.post("/demand")
def submit_demand(user_id: int, request: schemas.DemandRequestCreate, db: Session = Depends(get_db)):
    return crud.create_demand_request(db, user_id, request)

@router.post("/restock")
def restock(restock_data: schemas.ProductRestock, db: Session = Depends(get_db)):
    product, tokens_to_notify = crud.restock_product(db, restock_data.product_id, restock_data.amount)
    
    if not product:
        return {"error": "Product not found"}
        
    for token in set(tokens_to_notify): # Use set to avoid duplicate notifications to same user
        notifications.send_push_notification(
            token,
            "Item Restocked! 🎉",
            f"The item '{product.name}' you requested has been restocked at the vending machine!"
        )
        
    return {
        "message": f"Successfully restocked {product.name}. New stock: {product.stock}",
        "users_notified": len(set(tokens_to_notify))
    }

@router.post("/webhook/razorpay")
async def razorpay_webhook(request: Request):
    # Webhook signature verification should be here
    # For Phase 1, we mock standard webhook consumption
    body = await request.json()
    print("Received Razorpay Webhook:", body)
    return {"status": "ok"}