# 🤖 NAO Humanoid Robot - Office Assistant with AI Vision

Full-stack web control system for NAO humanoid robot in Webots simulation with **Azure OpenAI GPT-4 Vision** integration.

---

## ✨ Features

### 🎯 Core Capabilities
- 🕹️ **Web-based control** - Next.js dashboard with real-time updates
- 🎭 **Gesture animations** - Wave, point, stand, sit
- 🚶 **Walking controls** - Forward, backward, turn left/right
- 👀 **Head movement** - 5-direction pan/tilt control
- 🦾 **24 motor control** - Individual joint positioning

### 🔷 AI Vision (Azure OpenAI)
- **GPT-4o Vision** - Real-time scene understanding and object recognition
- **Interactive Q&A** - Ask the robot questions about what it sees
- **Safety detection** - Identifies obstacles and hazards
- **Spatial awareness** - Understands object positions and layout

### 📡 Advanced Sensors
- 📷 **RGB Camera** - Live MJPEG stream (320x240 @ 5 FPS)
- 🧭 **IMU Sensors** - Accelerometer + Gyroscope orientation tracking
- 🔵 **360° LIDAR** - 5m range environmental scanning
- 📐 **RealSense Depth** - 3D depth perception (640x480)
- 📍 **Odometry** - Position tracking with velocity estimation

### 🌐 Remote Management
- 📊 **Real-time dashboard** - Sensor visualization and monitoring
- 📹 **Multi-view cameras** - Robot perspective + overview
- 📝 **Command logging** - Timestamped action history
- ⚡ **WebSocket streaming** - Low-latency updates

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+
- Webots R2023b
- **Azure OpenAI access** ([apply here](https://aka.ms/oai/access))

### 1. Install Dependencies

```bash
# Backend
cd backend
pip install -r requirements.txt

# Frontend
cd frontend
npm install
```

### 2. Configure Azure OpenAI

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your Azure credentials:
```env
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

📖 **Detailed setup:** See [SETUP.md](SETUP.md)

### 3. Start System

```bash
# Terminal 1: Open Webots → webots/worlds/nao_office_demo.wbt

# Terminal 2: Backend
cd backend
python -m app.main

# Terminal 3: Frontend
cd frontend
npm run dev
```

### 4. Access Dashboard

Open: **http://localhost:3000**

---

## 🎮 Usage

### Basic Controls
- **Gestures** - Click Wave, Point, or Stand buttons
- **Head** - Use 5-direction control pad
- **Walking** - Select direction + duration (0.5-5s)

### AI Vision Features
1. Scroll to **"Vision Analysis"** panel
2. Click **"Analyze Now"** for scene understanding
3. Ask questions like:
   - "What objects do you see?"
   - "Is there any obstacle ahead?"
   - "Describe the environment"

---

## 🏗️ Architecture

```
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│   Next.js    │◄────►│   FastAPI    │◄────►│   Webots     │
│  Frontend    │ HTTP │   Backend    │ TCP  │  Simulator   │
│  (Port 3000) │  WS  │ (Port 8000)  │Socket│  (NAO Robot) │
└──────────────┘      └──────────────┘      └──────────────┘
                             │
                             ↓
                      ┌──────────────┐
                      │ Azure OpenAI │
                      │   GPT-4o     │
                      └──────────────┘
```

### Tech Stack

**Frontend:**
- Next.js 15 + React 18 + TypeScript
- Tailwind CSS 3.4
- Lucide React icons
- WebSocket real-time updates

**Backend:**
- FastAPI + Uvicorn (async Python)
- Azure OpenAI Python SDK
- WebSocket streaming
- PIL/Pillow image processing

**Simulation:**
- Webots R2023b
- NAO robot model
- Office environment with Bosch branding

---

## 📊 API Endpoints

### Robot Control
- `POST /api/robot/gesture` - Execute gesture
- `POST /api/robot/head/move` - Move head
- `POST /api/robot/walk` - Walking movement
- `GET /api/robot/status` - Current status
- `WS /api/robot/ws` - WebSocket updates

### Vision Service
- `GET /api/vision/status` - Service status
- `GET /api/vision/latest` - Latest analysis
- `POST /api/vision/analyze` - Trigger analysis
- `POST /api/vision/query` - Ask questions

📖 **Interactive docs:** http://localhost:8000/docs

---

## 📁 Project Structure

```
klarix-humanoid-bot/
├── backend/                 # FastAPI server
│   ├── app/
│   │   ├── api/            # REST endpoints
│   │   │   ├── robot.py    # Robot control
│   │   │   └── vision.py   # Vision AI
│   │   ├── services/       # Core services
│   │   │   ├── vision_service.py       # Azure OpenAI
│   │   │   ├── robot_controller.py    # Robot control
│   │   │   ├── webots_bridge.py       # TCP bridge
│   │   │   └── camera_streamer.py     # MJPEG stream
│   │   └── main.py
│   └── requirements.txt
├── frontend/               # Next.js app
│   ├── app/
│   ├── components/
│   │   ├── RobotControl.tsx    # Main dashboard
│   │   └── VisionPanel.tsx     # AI vision UI
│   └── package.json
└── webots/                # Simulation
    ├── controllers/       # Robot controllers
    └── worlds/           # Environments
```

---

## 💰 Cost Estimation

**Azure OpenAI GPT-4o:**
- ~$0.003-0.005 per vision analysis
- Rate limited to 6 requests/minute
- Smart caching (30s TTL)
- **Typical usage:** $0.50-3.00/day

---

## 🐛 Troubleshooting

### "Vision service not enabled"
✅ Check `.env` has all 4 Azure variables
✅ Restart backend after editing `.env`

### "No camera frame available"
✅ Ensure Webots is running
✅ Check robot shows green "Connected"

### "Invalid API key"
✅ Verify key in Azure Portal
✅ Check for trailing spaces

📖 **Full troubleshooting:** See [SETUP.md](SETUP.md)

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| **[QUICK_START_AZURE.md](QUICK_START_AZURE.md)** | ⚡ 6-step quick start |
| **[SETUP.md](SETUP.md)** | 📖 Complete setup guide |
| **[AZURE_OPENAI_SETUP.md](AZURE_OPENAI_SETUP.md)** | 🔷 Azure-specific details |
| **[CLEANUP_SUMMARY.md](CLEANUP_SUMMARY.md)** | 📝 Recent changes |

---

## 🎓 Next Steps

**Current:** Phase 1 - AI Vision ✅
**Next:** Phase 2 - 3D Point Cloud Visualization
**Future:** Autonomous navigation, SLAM, path planning

---

## 📄 License

Bosch Internal Demo Project

---

## 🆘 Support

- Check [SETUP.md](SETUP.md) for troubleshooting
- Review backend console logs
- Test API: http://localhost:8000/docs
- Azure status: https://status.azure.com/

---

**Built with ❤️ for Bosch Robotics**
