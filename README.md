# NAO Humanoid Robot - Office Assistant Demo

Full-stack web control system for NAO humanoid robot in Webots simulation environment.

## Overview

This project demonstrates a NAO robot functioning as an intelligent office assistant with advanced perception capabilities and web-based control interface.

## Features

### S2 - Perception & Sensing
- **IMU Sensors** - Real-time orientation and motion tracking
- **360° LIDAR** - Environmental scanning with 5m range
- **RealSense Depth Camera** - RGB + Depth sensing (640x480)
- **Odometry** - Position tracking with velocity estimation

### S3 - Control & Interaction
- **Arm Joint Control** - Individual motor control for both arms
- **Gesture Animations** - Wave, point, stand, sit behaviors
- **Head Movement** - Pan and tilt control
- **Walking System** - Forward, backward, turn left/right with motion files

## Architecture

```
klarix-humanoid-bot/
├── backend/           # FastAPI server (Python)
│   └── app/
│       ├── api/       # REST endpoints
│       ├── models/    # Pydantic data models
│       └── services/  # Robot controller & bridge
├── frontend/          # Next.js 15 + React 18 (TypeScript)
│   ├── app/           # Next.js app directory
│   └── components/    # React components
└── webots/
    ├── controllers/   # NAO controller (Python)
    └── worlds/        # Simulation environment
```

## Tech Stack

**Backend:**
- FastAPI (async Python web framework)
- WebSocket for real-time status updates
- MJPEG camera streaming

**Frontend:**
- Next.js 15 with App Router
- React 18 with TypeScript
- Tailwind CSS for styling
- Real-time sensor visualization

**Simulation:**
- Webots R2023b
- NAO robot model (SoftBank Robotics)
- Office environment with Bosch branding

## Setup

### Prerequisites
- Webots R2023b
- Python 3.8+
- Node.js 18+

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Webots Setup
1. Open Webots R2023b
2. Open world file: `webots/worlds/nao_office_demo.wbt`
3. Press Play to start simulation
4. Controller automatically connects to backend

## Usage

1. Start backend server (port 8000)
2. Start frontend (port 3000)
3. Start Webots simulation
4. Open browser: `http://localhost:3000`

### Controls
- **Gestures** - Wave, Point, Stand, Sit
- **Head Movement** - Left, Right, Up, Down, Center
- **Walking** - Forward, Backward, Turn Left, Turn Right
- **Motor Control** - Individual joint position control

### Real-time Monitoring
- Live camera feed (MJPEG stream)
- IMU data (accelerometer + gyroscope)
- LIDAR visualization (360° radar)
- Depth camera heatmap
- Odometry tracking
- Robot status indicators

## API Endpoints

- `POST /api/robot/gesture` - Execute gesture
- `POST /api/robot/head/move` - Move head
- `POST /api/robot/walk` - Walking movement
- `POST /api/robot/motor` - Single motor control
- `POST /api/robot/motors` - Batch motor control
- `GET /api/robot/status` - Current status
- `WS /api/robot/ws` - WebSocket status stream
- `GET /api/robot/camera/stream` - MJPEG camera feed

## Environment

Office simulation includes:
- Desks, chairs, and monitors
- Conference table
- Coffee station
- Filing cabinets and bookshelves
- Bosch branding panels on all walls
- Proper lighting setup

## License

Bosch Internal Project

## Contributors

Bosch Robotics Team
