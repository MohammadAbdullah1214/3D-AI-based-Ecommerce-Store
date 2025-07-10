import redis
import sys

def test_redis_connection():
    try:
        print("Testing Redis/Memurai connection...")
        
        # Try to connect to Redis/Memurai
        r = redis.Redis(host='localhost', port=6379, db=0, decode_responses=True)
        
        # Test the connection
        r.ping()
        print("✓ Redis/Memurai connection successful!")
        
        # Test basic operations
        r.set('test_key', 'test_value')
        value = r.get('test_key')
        print(f"✓ Redis read/write test: {value}")
        
        # Test expiration
        r.setex('temp_key', 5, 'temp_value')
        print("✓ Redis expiration test successful!")
        
        # Clean up
        r.delete('test_key', 'temp_key')
        print("✓ Redis cleanup successful!")
        
        # Get server info
        info = r.info('server')
        print(f"✓ Redis server version: {info.get('redis_version', 'Unknown')}")
        
        return True
        
    except redis.ConnectionError as e:
        print("✗ Redis connection failed!")
        print("Error:", str(e))
        print("\nTroubleshooting:")
        print("1. Make sure Memurai is installed and running")
        print("2. Check if port 6379 is available")
        print("3. Try restarting Memurai service")
        return False
    except Exception as e:
        print(f"✗ Redis test failed: {e}")
        return False

def check_redis_service():
    """Check if Redis/Memurai service is running on Windows"""
    import subprocess
    try:
        # Check if Memurai service is running
        result = subprocess.run(['sc', 'query', 'Memurai'], 
                              capture_output=True, text=True)
        if 'RUNNING' in result.stdout:
            print("✓ Memurai service is running")
            return True
        else:
            print("✗ Memurai service is not running")
            print("Try starting it with: sc start Memurai")
            return False
    except Exception as e:
        print(f"Could not check service status: {e}")
        return False

if __name__ == "__main__":
    print("=== Redis/Memurai Connection Test ===\n")
    
    # Check service status first
    service_running = check_redis_service()
    print()
    
    # Test connection
    if test_redis_connection():
        print("\n🎉 Redis/Memurai is ready for Celery!")
        print("You can now start Celery worker.")
    else:
        print("\n❌ Redis/Memurai setup needed")
        if not service_running:
            print("\nTo start Memurai service manually:")
            print("1. Open Command Prompt as Administrator")
            print("2. Run: sc start Memurai")
            print("3. Or restart your computer")
