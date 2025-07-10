#!/usr/bin/env python
# pyright: reportAttributeAccessIssue=false, reportArgumentType=false
"""
Test script to check Celery and 3D generation task execution.
"""

import os
import sys
import django
import tempfile
from PIL import Image

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_celery_connection():
    """Test if Celery can connect to the broker."""
    print("Testing Celery connection...")
    
    try:
        from django.conf import settings
        from celery import Celery
        
        # Create a test Celery app
        app = Celery('test')
        app.config_from_object('django.conf:settings', namespace='CELERY')
        
        # Test broker connection
        broker_url = getattr(settings, 'CELERY_BROKER_URL', 'redis://localhost:6379/0')
        print(f"Broker URL: {broker_url}")
        
        # Try to inspect the broker
        i = app.control.inspect()
        stats = i.stats()
        
        if stats:
            print("✅ Celery broker connection successful")
            return True
        else:
            print("⚠ Celery broker connected but no workers found")
            return False
            
    except Exception as e:
        print(f"❌ Celery connection failed: {e}")
        return False

def test_celery_task():
    """Test if a simple Celery task can be executed."""
    print("\nTesting Celery task execution...")
    
    try:
        from core.celery import app
        
        # Test the debug task
        result = app.send_task('core.celery.debug_task')
        print(f"✅ Debug task sent successfully: {result.id}")
        
        # Wait for result (with timeout)
        try:
            task_result = result.get(timeout=10)
            print(f"✅ Debug task completed: {task_result}")
            return True
        except Exception as e:
            print(f"⚠ Debug task timed out or failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ Celery task test failed: {e}")
        return False

def test_3d_generation_task():
    """Test if the 3D generation task can be executed."""
    print("\nTesting 3D generation task...")
    
    try:
        from ai_3d_generation.tasks import process_3d_generation
        from ai_3d_generation.models import GenerationRequest, GenerationImage
        from products.models import Product, ProductImage
        from users.models import CustomUser
        
        # Create test data
        # Get or create a test user
        user, created = CustomUser.objects.get_or_create(
            username='test_user_3d',
            defaults={
                'email': 'test@example.com',
                'role': 'seller'
            }
        )
        
        # Get or create a test product
        product, created = Product.objects.get_or_create(
            name='Test Product for 3D',
            defaults={
                'seller': user,
                'description': 'Test product for 3D generation',
                'price': 10.00
            }
        )
        
        # Create a test image with proper RGB color
        img = Image.new('RGB', (512, 512), color=(0, 0, 255))  # type: ignore
        temp_dir = tempfile.mkdtemp()
        image_path = os.path.join(temp_dir, 'test_image.jpg')
        img.save(image_path, 'JPEG')
        
        # Create ProductImage
        with open(image_path, 'rb') as f:
            from django.core.files import File
            product_image = ProductImage.objects.create(
                product=product,
                file=File(f, name='test_image.jpg'),
                file_type='image'
            )
        
        # Create GenerationRequest
        generation_request = GenerationRequest.objects.create(
            user=user,
            product=product,
            detail_level='low'
        )
        
        # Create GenerationImage
        GenerationImage.objects.create(
            request=generation_request,
            image=product_image.file,
            angle='front',
            order=0
        )
        
        print(f"Created test generation request: {generation_request.id}")
        
        # Try to execute the task
        result = process_3d_generation.delay(str(generation_request.id), 'tshirt')
        print(f"✅ 3D generation task sent: {result.id}")
        
        # Wait for result (with timeout)
        try:
            task_result = result.get(timeout=60)  # 1 minute timeout
            print(f"✅ 3D generation task completed")
            return True
        except Exception as e:
            print(f"⚠ 3D generation task timed out or failed: {e}")
            return False
            
    except Exception as e:
        print(f"❌ 3D generation task test failed: {e}")
        return False
    finally:
        # Clean up
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass

def main():
    """Run all tests."""
    print("=" * 50)
    print("Celery and 3D Generation Task Test")
    print("=" * 50)
    
    tests = [
        ("Celery Connection", test_celery_connection),
        ("Celery Task", test_celery_task),
        ("3D Generation Task", test_3d_generation_task),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:  # type: ignore[attr-defined]
        print(f"\n--- {test_name} ---")
        if test_func():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All tests passed! Celery and 3D generation should work.")
    else:
        print("❌ Some tests failed. Please check the issues above.")
        print("\nTroubleshooting tips:")
        print("1. Make sure Redis is running: redis-server")
        print("2. Start Celery worker: celery -A core worker --loglevel=info")
        print("3. Check if the broker URL is correct in settings")
    
    return passed == total

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 