# NAO Robot Control - Backend API

FastAPI backend for controlling NAO humanoid robot in Webots simulation.

## Features

- RESTful API for robot control
- WebSocket for real-time status updates
- Gesture control (wave, point, stand, sit, bow)
- Head movement control
- Walking commands
- Direct motor control
- Batch motor commands

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Run the Server

```bash
# Development mode with auto-reload
python -m app.main

# Or using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Access API Documentation

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API Endpoints

### Robot Control

- `POST /api/robot/gesture` - Execute predefined gesture
- `POST /api/robot/head/move` - Move robot head
- `POST /api/robot/walk` - Execute walking movement
- `POST /api/robot/motor` - Set single motor position
- `POST /api/robot/motors` - Set multiple motor positions
- `GET /api/robot/status` - Get robot status
- `POST /api/robot/connect` - Connect to robot
- `POST /api/robot/disconnect` - Disconnect from robot

### WebSocket

- `WS /api/robot/ws` - Real-time status updates

## Example Usage

### Gesture Control

```python
import requests

response = requests.post(
    "http://localhost:8000/api/robot/gesture",
    json={"gesture": "wave"}
)
print(response.json())
```

### Head Movement

```python
response = requests.post(
    "http://localhost:8000/api/robot/head/move",
    json={"direction": "left"}
)
```

### Walking

```python
response = requests.post(
    "http://localhost:8000/api/robot/walk",
    json={"movement": "forward", "duration": 3.0}
)
```

### WebSocket Client

```python
import asyncio
import websockets
import json

async def watch_robot():
    uri = "ws://localhost:8000/api/robot/ws"
    async with websockets.connect(uri) as websocket:
        while True:
            status = await websocket.recv()
            print(json.loads(status))

asyncio.run(watch_robot())
```

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── api/
│   │   └── robot.py         # Robot control endpoints
│   ├── models/
│   │   └── robot.py         # Pydantic models
│   └── services/
│       └── robot_controller.py  # Robot control logic
├── requirements.txt
└── README.md
```

## Environment Variables

Create a `.env` file:

```env
# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# CORS
CORS_ORIGINS=http://localhost:3000

# Webots Connection
WEBOTS_HOST=localhost
WEBOTS_PORT=10020
```
