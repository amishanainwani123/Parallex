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