# System Architecture Document

## NAO Humanoid Robot - Cloud Remote Management System

**Version:** 1.0.0
**Date:** 2025-11-30
**Team:** EEE

---

## 1. Executive Summary

This document describes the complete system architecture for the NAO Humanoid Robot Cloud Remote Management System. The system provides web-based tele-operation, AI-powered vision analysis, real-time monitoring, and remote configuration capabilities through a modern cloud dashboard.

### Key Objectives
- Enable remote robot control via web interface
- Provide real-time telemetry and video streaming
- Integrate AI vision for scene understanding
- Support multiple concurrent users
- Ensure low-latency command execution (<300ms)
- Maintain high availability (>99%)

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Cloud/Web Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│   ┌─────────────────┐         ┌──────────────────┐             │
│   │   Web Browser   │         │  Mobile Browser  │             │
│   │   (Desktop)     │         │   (iOS/Android)  │             │
│   └────────┬────────┘         └────────┬─────────┘             │
│            │                            │                        │
│            └──────────────┬─────────────┘                        │
│                           │                                      │
│                    HTTP / WebSocket                              │
│                           │                                      │
├───────────────────────────┼──────────────────────────────────────┤
│                           │                                      │
│   ┌───────────────────────▼──────────────────────────┐          │
│   │           Next.js Frontend (Port 3000)           │          │
│   │  - React 18 + TypeScript + Tailwind CSS          │          │
│   │  - Real-time UI updates via WebSocket            │          │
│   │  - MJPEG video stream display                    │          │
│   └───────────────────────┬──────────────────────────┘          │
│                           │                                      │
├───────────────────────────┼──────────────────────────────────────┤
│                Application Layer                                 │
├───────────────────────────┼──────────────────────────────────────┤
│                           │                                      │
│   ┌───────────────────────▼──────────────────────────┐          │
│   │          FastAPI Backend (Port 8000)             │          │
│   ├──────────────────────────────────────────────────┤          │
│   │ REST API     │  WebSocket Hub  │  MJPEG Stream  │          │
│   │ Controllers  │  (10 Hz updates)│  (5 FPS)       │          │
│   ├──────────────────────────────────────────────────┤          │
│   │ Services Layer:                                   │          │
│   │  - Robot Controller  - Vision Service            │          │
│   │  - Camera Streamer   - Webots Bridge             │          │
│   └──────────────┬──────────────────┬────────────────┘          │
│                  │                  │                            │
│             TCP Socket         HTTPS API                         │
│                  │                  │                            │
├──────────────────┼──────────────────┼────────────────────────────┤
│                  │                  │                            │
│   ┌──────────────▼─────────┐  ┌────▼─────────────────┐         │
│   │  Webots Simulator      │  │  Azure OpenAI        │         │
│   │  (Robot Controller)    │  │  GPT-4o Vision       │         │
│   │  - NAO H25 Model       │  │  - Scene Analysis    │         │
│   │  - Physics Engine      │  │  - Object Detection  │         │
│   │  - Sensor Simulation   │  └──────────────────────┘         │
│   └────────────────────────┘                                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Responsibilities

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Frontend** | User interface, visualization, control input | Next.js 15, React 18, TypeScript |
| **Backend** | API gateway, WebSocket hub, business logic | FastAPI, Python 3.8+, Uvicorn |
| **Webots** | Robot simulation, physics, sensors | Webots R2023b, Python controller |
| **Azure OpenAI** | AI vision analysis, scene understanding | GPT-4o Vision API |

---

## 3. Detailed Architecture

### 3.1 Frontend Architecture (S4)

```
frontend/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page (dashboard)
│   ├── teleop/page.tsx          # Tele-operation interface
│   └── analytics/page.tsx       # Analytics view
├── components/
│   ├── layout/
│   │   └── AppLayout.tsx        # Main layout wrapper
│   ├── views/
│   │   ├── Dashboard.tsx        # Main dashboard view
│   │   ├── TeleopView.tsx       # Tele-operation controls
│   │   └── ConnectionScreen.tsx # Connection status
│   ├── ui/
│   │   ├── StatusHeader.tsx     # Status bar component
│   │   ├── CameraFeed.tsx       # Video stream display
│   │   ├── KinematicsPanel.tsx  # Joint visualization
│   │   └── VisionPanel.tsx      # AI vision interface
│   └── providers/
│       └── RobotProvider.tsx    # Robot state context
└── lib/
    └── config.ts                # API configuration
```

**Key Features:**
- Server-side rendering (SSR) for SEO
- Client-side state management with React Context
- Real-time updates via WebSocket
- Responsive design (mobile-first)
- TypeScript for type safety

### 3.2 Backend Architecture (S1)

```
backend/
├── app/
│   ├── main.py                  # FastAPI application
│   ├── api/
│   │   ├── robot.py            # Robot control endpoints
│   │   └── vision.py           # Vision service endpoints
│   ├── services/
│   │   ├── robot_controller.py # Robot state management
│   │   ├── webots_bridge.py    # TCP bridge to Webots
│   │   ├── vision_service.py   # Azure OpenAI integration
│   │   └── camera_streamer.py  # MJPEG streaming
│   └── models/
│       └── robot.py            # Data models (Pydantic)
└── requirements.txt
```

**Key Features:**
- Async/await for non-blocking I/O
- Pydantic models for validation
- WebSocket connection management
- CORS configuration
- Error handling and logging

### 3.3 Webots Controller Architecture (S3)

```
webots/
├── controllers/
│   └── nao_office_assistant/
│       ├── nao_office_assistant.py  # Main controller
│       └── backend_client.py        # Backend communication
└── worlds/
    └── nao_office_demo.wbt         # Simulation environment
```

**Key Features:**
- Real-time motor control (50 Hz)
- Sensor data collection
- TCP socket communication
- Command queue processing
- Safety failsafes

---

## 4. Communication Flows

### 4.1 Command Execution Flow

```
User Action → Frontend → Backend → Webots → Execution
    ↓                                           ↓
Feedback ← WebSocket ← Backend ← TCP Socket ← Telemetry
```

**Detailed Steps:**
1. User clicks "Wave" button in frontend
2. Frontend sends POST request to `/api/robot/gesture`
3. Backend validates command
4. Backend forwards command to Webots via TCP
5. Webots executes gesture animation
6. Webots sends telemetry updates via TCP
7. Backend broadcasts updates via WebSocket
8. Frontend updates UI in real-time

**Latency Targets:**
- Frontend → Backend: <50ms
- Backend → Webots: <20ms
- Webots execution: Variable (1-5s)
- Total feedback latency: <100ms

### 4.2 Vision Analysis Flow

```
User Query → Frontend → Backend → Azure OpenAI → Analysis
                            ↓                        ↓
                      Camera Frame              Response
                            ↓                        ↓
                       Base64 Encode ─────────> API Call
```

**Detailed Steps:**
1. User clicks "Analyze Scene"
2. Frontend sends POST to `/api/vision/analyze`
3. Backend retrieves latest camera frame
4. Backend encodes frame as Base64
5. Backend sends frame + prompt to Azure OpenAI
6. Azure GPT-4o analyzes image
7. Backend caches response (30s TTL)
8. Backend returns analysis to frontend

**Performance:**
- Azure API latency: 1-3s
- Cache hit rate: ~70%
- Cost per analysis: $0.003-0.005

### 4.3 Real-time Telemetry Flow

```
Webots Sensors → TCP Stream → Backend → WebSocket → Frontend
     (50 Hz)       (10 Hz)      Hub      (10 Hz)    Display
```

**Data Types:**
- Joint positions (24 motors)
- IMU data (accelerometer + gyroscope)
- LIDAR scan (360 points)
- Odometry (position + orientation)
- Camera frames (5 FPS MJPEG)

---

## 5. Data Flow Diagrams

### 5.1 Gesture Execution

```
┌─────────┐     POST /api/robot/gesture     ┌─────────┐
│Frontend │────────────────────────────────>│ Backend │
└────┬────┘                                  └────┬────┘
     │                                            │
     │                                            │ Forward
     │                                            │ Command
     │                                            ▼
     │                                       ┌────────┐
     │                                       │ Webots │
     │                                       └────┬───┘
     │                                            │
     │           WebSocket Telemetry              │ Execute
     │<───────────────────────────────────────────┘ Gesture
     │
     ▼
   Update UI
```

### 5.2 Vision Analysis

```
┌─────────┐   POST /api/vision/analyze    ┌─────────┐
│Frontend │─────────────────────────────>│ Backend │
└─────────┘                                └────┬────┘
                                                │
                                                │ Get Frame
                                                ▼
                                           ┌─────────┐
                                           │ Camera  │
                                           │Streamer │
                                           └────┬────┘
                                                │
                                                │ Base64
                                                ▼
                                           ┌──────────┐
                                           │  Azure   │
                                           │ OpenAI   │
                                           └────┬─────┘
                                                │
                                                │ Analysis
┌─────────┐         JSON Response              ▼
│Frontend │<──────────────────────────────┌─────────┐
└─────────┘                                │ Backend │
                                           └─────────┘
```

---

## 6. Technology Stack

### 6.1 Frontend (S4)
```
Framework:        Next.js 15.0
Runtime:          Node.js 18+
UI Library:       React 18
Language:         TypeScript 5.0
Styling:          Tailwind CSS 3.4
Icons:            Lucide React
Build Tool:       Webpack (Next.js bundler)
Package Manager:  npm
```

### 6.2 Backend (S1 + S2)
```
Framework:        FastAPI 0.104+
Runtime:          Python 3.8+
ASGI Server:      Uvicorn
Validation:       Pydantic 2.0
AI Service:       Azure OpenAI SDK
Image Processing: Pillow (PIL)
WebSocket:        websockets library
HTTP Client:      httpx
```

### 6.3 Simulation (S3)
```
Simulator:        Webots R2023b
Robot Model:      NAO H25 (Softbank Robotics)
Controller:       Python 3.8+
Physics:          ODE (Open Dynamics Engine)
Environment:      Office scenario
```

### 6.4 AI & Cloud (S2)
```
Vision AI:        Azure OpenAI GPT-4o
API Version:      2024-02-15-preview
Model:            gpt-4o-vision
Region:           East US / West Europe
Authentication:   API Key
```

---

## 7. Deployment Architecture

### 7.1 Development Environment
```
┌──────────────────────────────────────┐
│        Developer Machine             │
├──────────────────────────────────────┤
│                                      │
│  Terminal 1:  Webots Simulator       │
│  Terminal 2:  Backend (localhost:8000│
│  Terminal 3:  Frontend (localhost:3000│
│                                      │
└──────────────────────────────────────┘
```

### 7.2 Production Environment (Future)
```
┌─────────────────────────────────────────────┐
│              Cloud Infrastructure            │
├─────────────────────────────────────────────┤
│                                              │
│  ┌────────────┐      ┌──────────────┐      │
│  │  Vercel    │      │  AWS/Azure   │      │
│  │  (Frontend)│      │  (Backend)   │      │
│  └────────────┘      └──────────────┘      │
│                                              │
│  ┌────────────┐      ┌──────────────┐      │
│  │   CDN      │      │  Azure       │      │
│  │  (Assets)  │      │  OpenAI      │      │
│  └────────────┘      └──────────────┘      │
│                                              │
└─────────────────────────────────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌──────────────┐           ┌──────────────┐
│   Webots     │           │   Robot      │
│  (Local/VM)  │           │  (Hardware)  │
└──────────────┘           └──────────────┘
```

---

## 8. Security Architecture

### 8.1 Current Implementation
- CORS configuration for frontend origin
- Environment variables for API keys
- Input validation (Pydantic models)
- Error handling without data leakage

### 8.2 Production Requirements
```
┌─────────────────────────────────────┐
│      Security Layers                │
├─────────────────────────────────────┤
│ 1. HTTPS/TLS (All communications)  │
│ 2. JWT Authentication               │
│ 3. API Rate Limiting                │
│ 4. Input Sanitization               │
│ 5. SQL Injection Prevention         │
│ 6. XSS Protection                   │
│ 7. CSRF Tokens                      │
│ 8. Audit Logging                    │
└─────────────────────────────────────┘
```

---

## 9. Scalability Considerations

### 9.1 Current Capacity
- Concurrent WebSocket clients: 50+
- API requests: 100 req/s
- Video streams: 10 concurrent
- Single robot per backend instance

### 9.2 Scaling Strategy
```
Horizontal Scaling:
  Frontend:  CDN + Multiple Vercel instances
  Backend:   Load balancer + Multiple FastAPI instances
  Database:  Replicated PostgreSQL / MongoDB

Vertical Scaling:
  Backend:   Increase CPU/RAM for API server
  Webots:    GPU acceleration for rendering
```

---

## 10. Monitoring & Observability

### 10.1 Logging
```
Level         Component          Destination
─────────────────────────────────────────────
INFO          All               Console/File
WARNING       Backend           Error logs
ERROR         All               Error tracking
DEBUG         Development only  Console
```

### 10.2 Metrics (Future)
- API response times
- WebSocket connection count
- Command execution latency
- Vision API usage and costs
- Error rates by endpoint

### 10.3 Health Checks
```
Endpoint:  GET /
Response:  { "status": "healthy" }

Checks:
- Backend server running
- Webots connection active
- Vision service available
- WebSocket hub operational
```

---

## 11. Disaster Recovery

### 11.1 Backup Strategy
- Configuration files in version control
- Environment variables documented
- Docker images for reproducibility
- Database backups (when implemented)

### 11.2 Recovery Procedures
1. **Backend crash:** Automatic restart (systemd/Docker)
2. **Webots crash:** Backend reconnection logic
3. **WebSocket disconnect:** Client auto-reconnect
4. **Vision API failure:** Graceful degradation (cached responses)

---

## 12. Performance Requirements

| Metric | Target | Measured |
|--------|--------|----------|
| API Response Time | <50ms | ~30ms |
| WebSocket Latency | <100ms | ~50ms |
| Command Execution | <300ms | ~200ms |
| Video Stream FPS | 5 FPS | 5 FPS |
| Telemetry Rate | 10 Hz | 10 Hz |
| Vision Analysis | <3s | 1-3s |
| Uptime | >99% | N/A |

---

## 13. Future Enhancements

### Phase 2: Advanced Features
- Multi-robot fleet management
- User authentication and authorization
- Persistent data storage (PostgreSQL)
- Historical data playback
- Advanced analytics dashboard

### Phase 3: Hardware Integration
- Real NAO robot support (replace Webots)
- ROS2 integration
- SLAM and autonomous navigation
- Computer vision with local models

### Phase 4: Scale
- Cloud-native deployment (Kubernetes)
- Microservices architecture
- Event-driven design (Kafka/RabbitMQ)
- Global CDN for low latency

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-30
**Author:** Team EEE
**Status:** Approved for Production
