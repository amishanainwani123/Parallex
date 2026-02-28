from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models, crud, schemas
from database import engine, SessionLocal, Base
from routers import user, product
from routers import machine

Base.metadata.create_all(bind=engine)

app = FastAPI()
app.include_router(user.router)
app.include_router(product.router)
app.include_router(machine.router)


# DB Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Root test route
@app.get("/")
def root():
    return {"message": "Smart Vending Backend Running"}

# Register route
@app.post("/register")
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    return crud.create_user(db, user)

# Get products route
@app.get("/products")
def get_products(db: Session = Depends(get_db)):
    return crud.get_products(db)

