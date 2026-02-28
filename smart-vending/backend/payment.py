import razorpay
import os
import time
from dotenv import load_dotenv

load_dotenv()

RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "test_key_id")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "test_key_secret")

razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

def create_razorpay_order(amount: float):
    # If using test dummy keys for a DEMO, intercept the real API call to prevent a 500 Auth exception
    if RAZORPAY_KEY_ID == "test_key_id":
        return {
            "id": f"order_DEMO_{int(time.time())}",
            "amount": int(amount * 100),
            "currency": "INR",
            "status": "created"
        }

    data = {
        "amount": int(amount * 100),  # Razorpay expects amount in paise
        "currency": "INR",
        "payment_capture": "1"
    }
    return razorpay_client.order.create(data=data)

def verify_razorpay_payment(order_id: str, payment_id: str, signature: str):
    # Mock verification for DEMO keys
    if RAZORPAY_KEY_ID == "test_key_id":
        return True
        
    try:
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': order_id,
            'razorpay_payment_id': payment_id,
            'razorpay_signature': signature
        })
        return True
    except razorpay.errors.SignatureVerificationError:
        return False
