#!/usr/bin/env python
"""
Test script to verify 3D generation for all supported clothing types.
"""

import os
import sys
import django
import tempfile
import json
from PIL import Image
import time

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def create_test_image(color):
    """Create a simple test image with a given color."""
    img = Image.new('RGB', (512, 512), color=color)
    temp_dir = tempfile.mkdtemp()
    image_path = os.path.join(temp_dir, f'test_clothing_image_{color}.jpg')
    img.save(image_path, 'JPEG')
    return image_path, temp_dir

def get_jwt_token_for_user(user):
    """Get a JWT access token for the given user."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def test_clothing_type(client, user, clothing_type, color1, color2):
    """Test 3D generation for a specific clothing type."""
    print(f"\n--- Testing {clothing_type.upper()} ---")
    
    try:
        from products.models import Product, ProductImage
        
        # Create a unique product name for each test run
        unique_name = f"Test Product {clothing_type} {int(time.time() * 1000)}"
        product = Product.objects.create(
            name=unique_name,
            description=f"A {clothing_type} for testing.",
            price=10.0,
            seller=user
        )
        
        # Create two test images
        image_path1, temp_dir1 = create_test_image(color1)
        image_path2, temp_dir2 = create_test_image(color2)
        
        # Upload both images to product
        with open(image_path1, 'rb') as f1, open(image_path2, 'rb') as f2:
            from django.core.files import File
            product_image1 = ProductImage.objects.create(
                product=product,
                file=File(f1, name=f'test_{clothing_type}_image1.jpg'),
                file_type='image'
            )
            product_image2 = ProductImage.objects.create(
                product=product,
                file=File(f2, name=f'test_{clothing_type}_image2.jpg'),
                file_type='image'
            )
        
        print(f"Created test product: {product.id}")
        print(f"Created test images: {product_image1.id}, {product_image2.id}")
        
        # Test generation status endpoint
        status_url = f'/api/products/{product.id}/generation-status/'
        response = client.get(status_url)
        print(f"Generation status response: {response.status_code}")
        
        # Test 3D generation endpoint
        generation_url = f'/api/products/{product.id}/generate-3d-model/'
        generation_data = {
            'angle_mapping': {
                'front': product_image1.id,
                'back': product_image2.id
            },
            'detail_level': 'low',
            'clothing_type': clothing_type
        }
        
        print(f"Sending {clothing_type} generation request...")
        
        response = client.post(
            generation_url,
            data=json.dumps(generation_data),
            content_type='application/json'
        )
        
        print(f"Generation response status: {response.status_code}")
        
        if response.status_code == 202:
            response_data = response.json()
            print(f"✅ {clothing_type} generation request accepted: {response_data}")
            
            # Wait a bit and check status
            time.sleep(3)
            
            response = client.get(status_url)
            if response.status_code == 200:
                status_data = response.json()
                print(f"Status: {status_data.get('status', 'unknown')}")
            
            return True
        else:
            print(f"❌ {clothing_type} generation request failed: {response.status_code}")
            print(f"Response: {response.content.decode()}")
            return False
            
    except Exception as e:
        print(f"❌ {clothing_type} test failed: {e}")
        return False
    finally:
        # Clean up
        try:
            import shutil
            shutil.rmtree(temp_dir1)
            shutil.rmtree(temp_dir2)
        except:
            pass

def main():
    """Run tests for all clothing types."""
    print("=" * 60)
    print("3D Generation Test for All Clothing Types")
    print("=" * 60)
    
    try:
        from django.test import Client
        from django.contrib.auth import get_user_model
        
        User = get_user_model()
        
        # Create test user
        user, created = User.objects.get_or_create(
            username='clothing_test_user',
            defaults={
                'email': 'clothing_test@example.com',
                'role': 'seller',
                'password': 'clothingtestpass123',
            }
        )
        if not created:
            user.set_password('clothingtestpass123')
            user.save()
        
        # Get JWT token for user
        access_token = get_jwt_token_for_user(user)
        
        # Create Django test client with JWT auth
        client = Client(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test all clothing types
        clothing_tests = [
            ('tshirt', 'red', 'blue'),
            ('pants', 'darkblue', 'black'),
            ('shirts', 'white', 'lightblue'),
            ('shoes', 'black', 'brown'),
        ]
        
        passed = 0
        total = len(clothing_tests)
        
        for clothing_type, color1, color2 in clothing_tests:
            if test_clothing_type(client, user, clothing_type, color1, color2):
                passed += 1
        
        print("\n" + "=" * 60)
        print(f"Tests passed: {passed}/{total}")
        
        if passed == total:
            print("🎉 All clothing type tests passed!")
            print("Your 3D generation system supports all clothing types.")
        else:
            print("❌ Some clothing type tests failed.")
            print("Please check the error messages above.")
        
        return passed == total
        
    except Exception as e:
        print(f"❌ Test setup failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 