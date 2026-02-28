from sqlalchemy.orm import Session
import models, schemas

# Create User
def create_user(db: Session, user: schemas.UserCreate):
    db_user = models.User(
        name=user.name,
        email=user.email,
        password=user.password
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