#!/usr/bin/env python
"""
Test script to check Blender installation and functionality.
"""

import os
import sys
import django
import subprocess

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

def test_blender_path():
    """Test if Blender executable exists at the expected path."""
    print("Testing Blender installation...")
    
    # Check the specific path from settings
    from django.conf import settings
    blender_path = getattr(settings, 'BLENDER_EXECUTABLE_PATH', None)
    print(f"Blender path from settings: {blender_path}")
    
    if blender_path and os.path.exists(blender_path):
        print(f"✅ Blender found at: {blender_path}")
        return blender_path
    
    # Check common paths
    possible_paths = [
        r"C:\Users\Abdul Rehman\Downloads\blender-4.0.2-windows-x64\blender-4.0.2-windows-x64\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 4.0\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender 3.6\blender.exe",
        r"C:\Program Files\Blender Foundation\Blender\blender.exe",
    ]
    
    for path in possible_paths:
        if os.path.exists(path):
            print(f"✅ Blender found at: {path}")
            return path
    
    print("❌ Blender not found in common locations")
    return None

def test_blender_execution(blender_path):
    """Test if Blender can be executed."""
    if not blender_path:
        return False
    
    try:
        print(f"Testing Blender execution: {blender_path}")
        result = subprocess.run(
            [blender_path, "--version"],
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0:
            print(f"✅ Blender version: {result.stdout.split()[1] if len(result.stdout.split()) > 1 else 'Unknown'}")
            return True
        else:
            print(f"❌ Blender execution failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Blender execution timed out")
        return False
    except Exception as e:
        print(f"❌ Blender execution error: {e}")
        return False

def test_blender_script():
    """Test if Blender can run a simple script."""
    blender_path = test_blender_path()
    if not blender_path or not test_blender_execution(blender_path):
        return False
    
    # Create a simple test script
    test_script = '''
import bpy
print("Blender Python script test successful!")
bpy.ops.mesh.primitive_cube_add()
print("Cube created successfully!")
'''
    
    import tempfile
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_script)
        script_path = f.name
    
    try:
        print("Testing Blender script execution...")
        result = subprocess.run(
            [blender_path, "--background", "--python", script_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        
        print(f"Blender stdout: {result.stdout}")
        if result.stderr:
            print(f"Blender stderr: {result.stderr}")
        
        if result.returncode == 0 and "Blender Python script test successful!" in result.stdout:
            print("✅ Blender script execution successful!")
            return True
        else:
            print("❌ Blender script execution failed")
            return False
            
    except Exception as e:
        print(f"❌ Blender script test error: {e}")
        return False
    finally:
        os.unlink(script_path)

def main():
    """Run all Blender tests."""
    print("=" * 50)
    print("Blender Installation Test")
    print("=" * 50)
    
    tests = [
        ("Blender Path", test_blender_path),
        ("Blender Execution", lambda: test_blender_execution(test_blender_path())),
        ("Blender Script", test_blender_script),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n--- {test_name} ---")
        if test_func():
            passed += 1
        print()
    
    print("=" * 50)
    print(f"Tests passed: {passed}/{total}")
    
    if passed == total:
        print("🎉 All Blender tests passed!")
        return True
    else:
        print("❌ Some Blender tests failed. Please check Blender installation.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1) 