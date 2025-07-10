#!/usr/bin/env python
"""
Test script for 3D generation functionality
"""
import os
import sys
import django
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).resolve().parent
sys.path.insert(0, str(project_root))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from ai_3d_generation.blender_service import BlenderModelGenerator
from ai_3d_generation.advanced_blender_service import AdvancedBlenderModelGenerator
from django.conf import settings

def test_blender_detection():
    """Test if Blender can be detected"""
    print("Testing Blender detection...")
    
    try:
        # Test standard generator
        generator = BlenderModelGenerator()
        print(f"✓ Standard Blender generator initialized")
        print(f"  Blender path: {generator.blender_executable}")
        
        # Test advanced generator
        advanced_generator = AdvancedBlenderModelGenerator()
        print(f"✓ Advanced Blender generator initialized")
        print(f"  Blender path: {advanced_generator.blender_executable}")
        
        # Test Blender verification
        generator._verify_blender()
        print("✓ Blender verification successful")
        
        return True
        
    except Exception as e:
        print(f"✗ Blender detection failed: {str(e)}")
        return False

def test_settings():
    """Test if 3D generation settings are configured"""
    print("\nTesting 3D generation settings...")
    
    try:
        blender_path = getattr(settings, 'BLENDER_EXECUTABLE_PATH', None)
        if blender_path:
            print(f"✓ BLENDER_EXECUTABLE_PATH configured: {blender_path}")
            if os.path.exists(blender_path):
                print("✓ Blender executable exists")
            else:
                print("✗ Blender executable not found at configured path")
        else:
            print("⚠ BLENDER_EXECUTABLE_PATH not configured, will use auto-detection")
        
        max_queue = getattr(settings, 'MAX_GENERATION_QUEUE_SIZE', None)
        if max_queue:
            print(f"✓ MAX_GENERATION_QUEUE_SIZE: {max_queue}")
        
        timeout = getattr(settings, 'GENERATION_TIMEOUT_MINUTES', None)
        if timeout:
            print(f"✓ GENERATION_TIMEOUT_MINUTES: {timeout}")
        
        return True
        
    except Exception as e:
        print(f"✗ Settings test failed: {str(e)}")
        return False

def test_celery_setup():
    """Test if Celery is configured for background tasks"""
    print("\nTesting Celery setup...")
    
    try:
        broker_url = getattr(settings, 'CELERY_BROKER_URL', None)
        if broker_url:
            print(f"✓ CELERY_BROKER_URL configured: {broker_url}")
        else:
            print("⚠ CELERY_BROKER_URL not configured")
        
        result_backend = getattr(settings, 'CELERY_RESULT_BACKEND', None)
        if result_backend:
            print(f"✓ CELERY_RESULT_BACKEND configured: {result_backend}")
        else:
            print("⚠ CELERY_RESULT_BACKEND not configured")
        
        return True
        
    except Exception as e:
        print(f"✗ Celery test failed: {str(e)}")
        return False

def main():
    """Run all tests"""
    print("=== 3D Generation Setup Test ===\n")
    
    tests = [
        test_settings,
        test_blender_detection,
        test_celery_setup
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"✗ Test {test.__name__} failed with exception: {str(e)}")
            results.append(False)
    
    print("\n=== Test Summary ===")
    passed = sum(results)
    total = len(results)
    
    if passed == total:
        print(f"✓ All {total} tests passed! 3D generation setup is ready.")
    else:
        print(f"✗ {total - passed} out of {total} tests failed.")
        print("\nTo fix issues:")
        print("1. Install Blender and ensure it's in PATH or configure BLENDER_EXECUTABLE_PATH")
        print("2. Configure Celery broker (Redis recommended)")
        print("3. Check Django settings for 3D generation configuration")

if __name__ == "__main__":
    main() 