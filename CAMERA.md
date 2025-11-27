# Camera Streaming

Live video streaming from NAO's top camera to the web interface.

## Quick Start

**1. Install Pillow:**
```bash
pip install pillow
```

**2. Start services in order:**
```bash
# Terminal 1
cd backend && python -m app.main

# Terminal 2
webots webots/worlds/nao_office_demo.wbt

# Terminal 3
cd frontend && npm run dev
```

**3. Verify in Webots console:**
```
✓ PIL/Pillow available for camera streaming
✓ Camera enabled (320x240)
✓ Connected to backend at localhost:10020
```

**4. Open browser:** http://localhost:3000

## How It Works

```
NAO Camera → Capture (5 FPS) → JPEG encode → Base64 → Backend → MJPEG stream → Browser
```

## Troubleshooting

### Black screen?

**Run diagnostic:**
```bash
python test_camera_setup.py
```

**Most common fix:**
```bash
pip install pillow
# Restart Webots
```

**Check Webots console for:**
- `✓ PIL/Pillow available` (if missing, install pillow)
- `✓ Camera enabled` (if missing, camera not initialized)
- `✓ Connected to backend` (if missing, start backend first)

**Check backend logs for:**
- `✓ Received camera frame from Webots (xxxxx bytes)` (should appear every ~0.2s)

### Still not working?

**Test camera endpoint:**
```bash
curl http://localhost:8000/api/robot/camera/status
# Should return: {"has_frame": true, ...}
```

**Common issues:**
- PIL not installed in Webots' Python environment
- Backend not running when Webots starts
- Browser cache (try Ctrl+Shift+R to hard refresh)

## Performance Tuning

### Adjust frame rate
Edit `webots/controllers/nao_office_assistant/nao_office_assistant.py:236`:
```python
if camera_counter >= 10:  # Change this value
    # 5 = ~10 FPS (faster)
    # 10 = ~5 FPS (default)
    # 20 = ~2.5 FPS (slower, less CPU)
```

### Adjust quality
Edit line 253:
```python
img_rgb.save(buffer, format='JPEG', quality=85)  # 1-100
# 85 = High quality (default)
# 70 = Medium quality, smaller size
# 50 = Lower quality, less CPU/bandwidth
```

## Two Views

1. **NAO's Camera** (web browser) - First-person view from robot, 320x240 @ ~5 FPS
2. **Environment View** (Webots window) - Third-person view of office, camera follows NAO

Both work together - control from browser, watch in Webots!

## API

**Stream endpoint:**
```
GET http://localhost:8000/api/robot/camera/stream
```

**Status endpoint:**
```
GET http://localhost:8000/api/robot/camera/status
```
