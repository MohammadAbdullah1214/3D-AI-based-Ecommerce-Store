#!/usr/bin/env python
"""
Test script to verify the API endpoint for 3D generation.
"""

import os
import sys
import django
import tempfile
import json
from PIL import Image

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def create_test_image(color):
    """Create a simple test image with a given color."""
    img = Image.new('RGB', (512, 512), color=color)
    temp_dir = tempfile.mkdtemp()
    image_path = os.path.join(temp_dir, f'test_api_image_{color}.jpg')
    img.save(image_path, 'JPEG')
    return image_path, temp_dir

def get_jwt_token_for_user(user):
    """Get a JWT access token for the given user."""
    from rest_framework_simplejwt.tokens import RefreshToken
    refresh = RefreshToken.for_user(user)
    return str(refresh.access_token)

def test_api_3d_generation():
    """Test the API endpoint for 3D generation."""
    print("Testing API 3D generation endpoint...")
    
    try:
        from django.test import Client
        from django.contrib.auth import get_user_model
        from products.models import Product, ProductImage
        from ai_3d_generation.models import GenerationRequest
        
        User = get_user_model()
        
        # Create test user
        user, created = User.objects.get_or_create(
            username='api_test_user',
            defaults={
                'email': 'api_test@example.com',
                'role': 'seller',
                'password': 'apitestpass123',
            }
        )
        if not created:
            user.set_password('apitestpass123')
            user.save()
        
        # Create test product
        product, created = Product.objects.get_or_create(
            name='API Test Product',
            defaults={
                'seller': user,
                'description': 'Test product for API 3D generation',
                'price': 15.00
            }
        )
        
        # Create two test images (front and back)
        image_path1, temp_dir1 = create_test_image('green')
        image_path2, temp_dir2 = create_test_image('blue')
        
        # Upload both images to product
        with open(image_path1, 'rb') as f1, open(image_path2, 'rb') as f2:
            from django.core.files import File
            product_image1 = ProductImage.objects.create(
                product=product,
                file=File(f1, name='test_api_image1.jpg'),
                file_type='image'
            )
            product_image2 = ProductImage.objects.create(
                product=product,
                file=File(f2, name='test_api_image2.jpg'),
                file_type='image'
            )
        
        print(f"Created test product: {product.id}")
        print(f"Created test images: {product_image1.id}, {product_image2.id}")
        
        # Get JWT token for user
        access_token = get_jwt_token_for_user(user)
        
        # Create Django test client with JWT auth
        client = Client(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test generation status endpoint
        status_url = f'/api/products/{product.id}/generation-status/'
        response = client.get(status_url)
        print(f"Generation status response: {response.status_code}")
        if response.status_code == 200:
            status_data = response.json()
            print(f"Status data: {status_data}")
        
        # Test 3D generation endpoint with two angles
        generation_url = f'/api/products/{product.id}/generate-3d-model/'
        generation_data = {
            'angle_mapping': {
                'front': product_image1.id,
                'back': product_image2.id
            },
            'detail_level': 'low',
            'clothing_type': 'tshirt'  # Test with t-shirt
        }
        
        print(f"Sending generation request to: {generation_url}")
        print(f"Generation data: {generation_data}")
        
        response = client.post(
            generation_url,
            data=json.dumps(generation_data),
            content_type='application/json'
        )
        
        print(f"Generation response status: {response.status_code}")
        print(f"Generation response: {response.content.decode()}")
        
        if response.status_code == 202:
            response_data = response.json()
            print(f"✅ Generation request accepted: {response_data}")
            
            # Wait a bit and check status
            import time
            time.sleep(5)
            
            response = client.get(status_url)
            if response.status_code == 200:
                status_data = response.json()
                print(f"Updated status: {status_data}")
            
            return True
        else:
            print(f"❌ Generation request failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ API test failed: {e}")
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
    """Run the API test."""
    print("=" * 50)
    print("API 3D Generation Test")
    print("=" * 50)
    
    success = test_api_3d_generation()
    
    print("=" * 50)
    if success:
        print("🎉 API test passed!")
        print("The 3D generation API should work correctly.")
    else:
        print("❌ API test failed.")
        print("Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 