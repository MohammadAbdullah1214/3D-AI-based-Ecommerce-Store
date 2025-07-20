#!/usr/bin/env python
import os
import sys
import django
import requests
import json

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_forgot_password():
    """Test the forgot password endpoint"""
    url = "http://127.0.0.1:8000/api/auth/forgot-password/"
    data = {
        "email": "a122jcapricorn@gmail.com"
    }
    
    try:
        response = requests.post(url, json=data, headers={
            'Content-Type': 'application/json'
        })
        
        print(f"Status Code: {response.status_code}")
        print(f"Response Headers: {response.headers}")
        print(f"Response Text: {response.text}")
        
        if response.status_code == 200:
            print("✅ Success! OTP should be sent.")
        elif response.status_code == 400:
            print("❌ Bad Request - Check the response for details")
        elif response.status_code == 404:
            print("❌ Not Found - User not found")
        elif response.status_code == 500:
            print("❌ Internal Server Error - Server issue")
        else:
            print(f"❌ Unexpected status code: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Connection Error - Django server is not running")
        print("Please start the server with: python manage.py runserver 8000")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_forgot_password() 