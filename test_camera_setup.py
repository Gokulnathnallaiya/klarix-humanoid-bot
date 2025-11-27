#!/usr/bin/env python3
"""Quick camera setup test - Run before starting Webots"""

import sys

def check_pil():
    """Check if PIL/Pillow is installed"""
    try:
        from PIL import Image
        print("✓ PIL/Pillow installed")
        return True
    except ImportError:
        print("✗ PIL/Pillow NOT installed - Camera won't work!")
        print("  Fix: pip install pillow")
        return False

def check_backend():
    """Check if backend is running"""
    try:
        import urllib.request
        import json
        response = urllib.request.urlopen('http://localhost:8000/health', timeout=2)
        data = json.loads(response.read().decode())
        print(f"✓ Backend running (robot connected: {data.get('robot_connected', False)})")
        return True
    except:
        print("✗ Backend not running")
        print("  Fix: cd backend && python -m app.main")
        return False

def check_camera_endpoint():
    """Check camera endpoint status"""
    try:
        import urllib.request
        import json
        response = urllib.request.urlopen('http://localhost:8000/api/robot/camera/status', timeout=2)
        data = json.loads(response.read().decode())
        has_frame = data.get('has_frame', False)

        if has_frame:
            print(f"✓ Camera streaming active")
        else:
            print(f"⚠ Camera endpoint ready, waiting for frames")
            print(f"  (This is normal if Webots isn't running yet)")
        return True
    except:
        print("⚠ Camera endpoint not accessible")
        return False

def main():
    print("=" * 50)
    print("NAO Camera Setup Test")
    print("=" * 50)
    print()

    results = []

    # Critical checks
    results.append(check_pil())
    results.append(check_backend())

    # Optional check (only if backend is running)
    if results[1]:
        check_camera_endpoint()

    print()
    print("=" * 50)

    if all(results):
        print("✓ Ready for camera streaming!")
        print()
        print("Start Webots and check for:")
        print("  • 'PIL/Pillow available' in console")
        print("  • 'Camera enabled (320x240)' in console")
        print("  • Camera feed at http://localhost:3000")
        return 0
    else:
        print("✗ Fix the issues above before starting Webots")
        return 1

if __name__ == "__main__":
    sys.exit(main())
