from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
import models, crud, schemas
from database import engine, SessionLocal, Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()