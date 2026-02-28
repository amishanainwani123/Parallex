from pydantic import BaseModel

class UserCreate(BaseModel):
    name: str
    email: str
    password: str


class ProductResponse(BaseModel):
    id: int
    name: str
    price: float
    stock: int

    class Config:
        from_attributes = True

class ProductSearchResponse(BaseModel):
    id: int
    name: str
    price: float
    stock: int
    machine_id: int
    machine_name: str
    location: str
    latitude: float
    longitude: float

    class Config:
        from_attributes = True

class PaymentVerification(BaseModel):
    order_id: str
    payment_id: str
    signature: str

class FCMTokenUpdate(BaseModel):
    fcm_token: str

class DemandRequestCreate(BaseModel):
    machine_id: int
    product_name: str

class ProductRestock(BaseModel):
    product_id: int
    amount: int