#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from users.models import CustomUser, PasswordResetToken
from users.serializers import ForgotPasswordSerializer
from django.core.mail import send_mail
from django.conf import settings
import random

def test_step_by_step():
    """Test the forgot password functionality step by step"""
    print("=== Testing Forgot Password Step by Step ===")
    
    # Step 1: Check if user exists
    email = "a122jcapricorn@gmail.com"
    print(f"1. Checking if user with email '{email}' exists...")
    try:
        users = CustomUser.objects.filter(email=email, is_active=True)
        if not users.exists():
            print(f"❌ No active user found with email: {email}")
            return
        
        user = users.first()
        print(f"✅ User found: {user.username} (using first active user)")
    except Exception as e:
        print(f"❌ Error finding user: {e}")
        return
    
    # Step 2: Test serializer
    print("\n2. Testing serializer...")
    data = {"email": email}
    serializer = ForgotPasswordSerializer(data=data)
    if serializer.is_valid():
        print("✅ Serializer validation passed")
    else:
        print(f"❌ Serializer validation failed: {serializer.errors}")
        return
    
    # Step 3: Test OTP generation
    print("\n3. Testing OTP generation...")
    try:
        otp = str(random.randint(100000, 999999))
        print(f"✅ OTP generated: {otp}")
    except Exception as e:
        print(f"❌ OTP generation failed: {e}")
        return
    
    # Step 4: Test PasswordResetToken creation
    print("\n4. Testing PasswordResetToken creation...")
    try:
        reset_token, created = PasswordResetToken.objects.get_or_create(
            user=user,
            defaults={'otp': otp}
        )
        if not created:
            reset_token.otp = otp
            reset_token.is_used = False
            reset_token.save()
        print(f"✅ PasswordResetToken {'created' if created else 'updated'}")
    except Exception as e:
        print(f"❌ PasswordResetToken creation failed: {e}")
        return
    
    # Step 5: Test email sending
    print("\n5. Testing email sending...")
    try:
        subject = "Password Reset OTP"
        message = f"""
        Hello,
        
        You have requested to reset your password. Your OTP is: {otp}
        
        This OTP is valid for 24 hours. If you didn't request this, please ignore this email.
        
        Best regards,
        Your E-commerce Team
        """
        
        result = send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL,
            [email],
            fail_silently=False,
        )
        print(f"✅ Email sent successfully. Result: {result}")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
        return
    
    print("\n✅ All tests passed! The forgot password functionality should work.")

if __name__ == "__main__":
    test_step_by_step() 