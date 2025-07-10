# test_imports.py
try:
    import celery
    print("✓ Celery imported successfully")
except ImportError as e:
    print(f"✗ Celery import failed: {e}")

try:
    import numpy
    print("✓ NumPy imported successfully")
except ImportError as e:
    print(f"✗ NumPy import failed: {e}")

try:
    import scipy
    print("✓ SciPy imported successfully")
except ImportError as e:
    print(f"✗ SciPy import failed: {e}")

try:
    from PIL import Image
    print("✓ Pillow imported successfully")
except ImportError as e:
    print(f"✗ Pillow import failed: {e}")

try:
    import bpy
    print("✓ Blender Python API imported successfully")
except ImportError as e:
    print(f"✗ Blender Python API import failed: {e}")

print("\nTesting Blender executable...")
import subprocess
import os

# Your specific Blender path
blender_path = r"C:\Users\Abdul Rehman\Downloads\blender-4.0.2-windows-x64\blender-4.0.2-windows-x64\blender.exe"

try:
    if os.path.exists(blender_path):
        print(f"✓ Blender file exists at: {blender_path}")
        
        # Test if Blender runs
        result = subprocess.run([blender_path, "--version"], 
                              capture_output=True, 
                              timeout=15,
                              text=True)
        
        if result.returncode == 0:
            print(f"✓ Blender runs successfully!")
            print(f"Version info: {result.stdout.split()[0:3]}")
        else:
            print(f"✗ Blender failed to run: {result.stderr}")
    else:
        print(f"✗ Blender file not found at: {blender_path}")
        
except Exception as e:
    print(f"✗ Error testing Blender: {e}")

print("\nInstallation Summary:")
print("=" * 40)
