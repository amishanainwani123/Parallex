import os
from dotenv import load_dotenv
import requests

load_dotenv()

# We can use Firebase Admin SDK or direct HTTP v1 API. 
# Here we provide a mock/HTTP based implementation for simplicity in phase 1.

FCM_SERVER_KEY = os.getenv("FCM_SERVER_KEY", "your_api_key_here")

def send_push_notification(device_token: str, title: str, body: str, data: dict = None):
    url = "https://fcm.googleapis.com/fcm/send"
    
    headers = {
        "Authorization": f"key={FCM_SERVER_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "to": device_token,
        "notification": {
            "title": title,
            "body": body
        },
        "data": data or {}
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Failed to send push notification: {e}")
        return None
