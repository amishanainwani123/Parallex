from sqlalchemy.orm import Session
import models, schemas, auth

# Create User
def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.hash_password(user.password)
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=hashed_password
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# Get All Products
def get_products(db: Session):
    return db.query(models.Product).all()

def buy_product(db: Session, product_id: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    
    if not product:
        return None
    
    if product.stock <= 0:
        return "Out of stock"
    
    product.stock -= 1
    db.commit()
    return product

def search_product(db: Session, name: str):
    return db.query(models.Product).filter(models.Product.name.ilike(f"%{name}%")).all()

def update_fcm_token(db: Session, user_id: int, fcm_token: str):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user:
        user.fcm_token = fcm_token
        db.commit()
    return user

def create_demand_request(db: Session, user_id: int, request: schemas.DemandRequestCreate):
    db_demand = models.DemandRequest(
        user_id=user_id,
        machine_id=request.machine_id,
        product_name=request.product_name,
        is_fulfilled=0
    )
    db.add(db_demand)
    db.commit()
    db.refresh(db_demand)
    return db_demand

def restock_product(db: Session, product_id: int, amount: int):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        return None, []
    
    # Increase stock
    product.stock += amount
    
    # Find all pending demands for this product at this machine
    pending_demands = db.query(models.DemandRequest).filter(
        models.DemandRequest.machine_id == product.machine_id,
        models.DemandRequest.product_name.ilike(product.name),
        models.DemandRequest.is_fulfilled == 0
    ).all()
    
    users_to_notify = []
    for demand in pending_demands:
        demand.is_fulfilled = 1
        # Fetch user's FCM token
        user = db.query(models.User).filter(models.User.id == demand.user_id).first()
        if user and user.fcm_token:
            users_to_notify.append(user.fcm_token)
            
    db.commit()
    return product, users_to_notify