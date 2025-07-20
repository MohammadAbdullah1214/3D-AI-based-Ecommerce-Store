#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import CustomUser

def check_users():
    """Check all users and their email addresses"""
    users = CustomUser.objects.all()
    
    print("=== Existing Users ===")
    if not users.exists():
        print("No users found in database.")
        return
    
    for user in users:
        print(f"ID: {user.id}")
        print(f"Username: {user.username}")
        print(f"Email: '{user.email}'")  # Quotes to show exact email
        print(f"First Name: {user.first_name}")
        print(f"Last Name: {user.last_name}")
        print(f"Role: {user.role}")
        print(f"Active: {user.is_active}")
        print("-" * 50)
    
    print(f"\nTotal users: {users.count()}")

if __name__ == "__main__":
    check_users() 