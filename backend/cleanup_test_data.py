#!/usr/bin/env python
"""
Cleanup script to remove old test data that might be causing conflicts.
"""

import os
import sys
import django

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def cleanup_test_data():
    """Clean up old test data."""
    print("Cleaning up old test data...")
    
    try:
        from ai_3d_generation.models import GenerationRequest, GenerationImage
        from products.models import Product, ProductImage
        from users.models import CustomUser
        
        # Clean up old generation requests
        old_requests = GenerationRequest.objects.filter(
            product__name__icontains='Test Product'
        )
        print(f"Found {old_requests.count()} old generation requests")
        
        for request in old_requests:
            print(f"Deleting generation request: {request.id}")
            request.delete()
        
        # Clean up old test products
        old_products = Product.objects.filter(
            name__icontains='Test Product'
        )
        print(f"Found {old_products.count()} old test products")
        
        for product in old_products:
            print(f"Deleting test product: {product.id} - {product.name}")
            product.delete()
        
        # Clean up old test users
        old_users = CustomUser.objects.filter(
            username__startswith='test_user'
        )
        print(f"Found {old_users.count()} old test users")
        
        for user in old_users:
            print(f"Deleting test user: {user.id} - {user.username}")
            user.delete()
        
        print("✅ Cleanup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Cleanup failed: {e}")
        return False

if __name__ == "__main__":
    success = cleanup_test_data()
    sys.exit(0 if success else 1) 