from sqlalchemy import Column, Integer, String, Float, ForeignKey, TIMESTAMP
from sqlalchemy.sql import func
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    email = Column(String(100), unique=True)
    password = Column(String(255))
    fcm_token = Column(String(255), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

class Machine(Base):
    __tablename__ = "machines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    location = Column(String(255))
    latitude = Column(Float)
    longitude = Column(Float)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    machine_id = Column(Integer, ForeignKey("machines.id"))
    name = Column(String(100))
    price = Column(Float)
    stock = Column(Integer)


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    amount = Column(Float)
    payment_status = Column(String(50))

class DemandRequest(Base):
    __tablename__ = "demand_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    machine_id = Column(Integer, ForeignKey("machines.id"))
    product_name = Column(String(100))
    is_fulfilled = Column(Integer, default=0) # 0 for pending, 1 for fulfilled
    requested_at = Column(TIMESTAMP, server_default=func.now())