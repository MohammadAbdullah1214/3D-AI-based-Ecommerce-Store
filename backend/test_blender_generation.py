#!/usr/bin/env python
"""
Test script to verify 3D model generation with the improved Blender service.
"""

import os
import sys
import django
import tempfile
from PIL import Image

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def create_test_image():
    """Create a simple test image."""
    # Create a simple test image
    img = Image.new('RGB', (512, 512), color='red')
    
    # Save to temp file
    temp_dir = tempfile.mkdtemp()
    image_path = os.path.join(temp_dir, 'test_image.jpg')
    img.save(image_path, 'JPEG')
    
    return image_path, temp_dir

def test_blender_generation():
    """Test the complete 3D generation process."""
    print("Testing 3D model generation...")
    
    try:
        from ai_3d_generation.blender_service import BlenderModelGenerator
        
        # Create test image
        image_path, temp_dir = create_test_image()
        
        # Create generator
        generator = BlenderModelGenerator()
        
        # Prepare test data
        images = [
            {
                'path': image_path,
                'angle': 'front',
                'order': 0
            }
        ]
        
        print("Starting 3D generation...")
        
        # Generate 3D model
        result = generator.generate_3d_model(
            images=images,
            detail_level='low',  # Use low detail for faster testing
            progress_callback=lambda stage, progress, message: print(f"{stage}: {progress}% - {message}")
        )
        
        if result['success']:
            print(f"✅ 3D generation successful!")
            print(f"   Model path: {result['model_path']}")
            print(f"   File size: {result['file_size']} bytes")
            print(f"   Polygon count: {result['polygon_count']}")
            print(f"   Generation time: {result['generation_time']:.2f} seconds")
            
            # Verify file exists
            if os.path.exists(result['model_path']):
                print(f"✅ Output file exists and is accessible")
                return True
            else:
                print(f"❌ Output file does not exist: {result['model_path']}")
                return False
        else:
            print(f"❌ 3D generation failed: {result['error']}")
            return False
            
    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False
    finally:
        # Clean up
        try:
            import shutil
            shutil.rmtree(temp_dir)
        except:
            pass

def main():
    """Run the test."""
    print("=" * 50)
    print("3D Model Generation Test")
    print("=" * 50)
    
    success = test_blender_generation()
    
    print("=" * 50)
    if success:
        print("🎉 3D generation test passed!")
        print("The Blender service should now work correctly.")
    else:
        print("❌ 3D generation test failed.")
        print("Please check the error messages above.")
    
    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 