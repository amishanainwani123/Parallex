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
        orm_mode = True