# S1: OS, Communication Stacks, Diagnostics & Cloud Link

## Overview
Core backend infrastructure providing communication bridges, health monitoring, and cloud connectivity for the NAO humanoid robot system.

## Components

### 1. Communication Stack
- **FastAPI Backend** - Async Python web framework
- **WebSocket Server** - Real-time bidirectional communication
- **TCP Bridge** - Webots simulation integration
- **REST API** - HTTP endpoints for robot control

### 2. Diagnostics & Monitoring
- **Health Monitor** - System status tracking
- **Error Logging** - Comprehensive error handling
- **Performance Metrics** - Latency and throughput monitoring
- **Connection Status** - Real-time connection state

### 3. Cloud Integration
- **Azure OpenAI** - GPT-4o Vision API integration
- **WebSocket Hub** - Multi-client connection management
- **State Management** - Centralized robot state
- **Event Broadcasting** - Real-time updates to clients

## Source Code Location
```
backend/
├── app/
│   ├── main.py                    # FastAPI application entry point
│   ├── services/
│   │   ├── webots_bridge.py      # TCP bridge to Webots
│   │   ├── robot_controller.py   # Robot state management
│   │   └── camera_streamer.py    # MJPEG streaming service
│   ├── api/
│   │   ├── robot.py              # Robot control endpoints
│   │   └── vision.py             # Vision service endpoints
│   └── models/
│       └── robot.py              # Data models
└── requirements.txt
```

## Key Features

### Communication Protocols
- **REST API:** HTTP/JSON for commands
- **WebSocket:** Real-time telemetry streaming
- **TCP Socket:** Webots controller integration
- **MJPEG Stream:** Camera feed delivery

### Health Monitoring
- Connection status tracking
- Error detection and reporting
- Performance metrics collection
- Automatic reconnection handling

### Cloud Services
- Azure OpenAI vision analysis
- Real-time data synchronization
- Multi-client support
- Secure API authentication

## API Endpoints

### Health & Status
```
GET  /                    # Health check
GET  /api/robot/status    # Robot connection status
```

### WebSocket Streaming
```
WS   /api/robot/ws        # Real-time telemetry stream
```

## Configuration

### Environment Variables
```env
# FastAPI Server
HOST=0.0.0.0
PORT=8000

# Webots Bridge
WEBOTS_HOST=localhost
WEBOTS_PORT=10020

# Azure OpenAI (for S2 integration)
AZURE_OPENAI_API_KEY=your_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o
```

## Deployment

### Local Development
```bash
cd backend
pip install -r requirements.txt
python -m app.main
```

### Production
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Dependencies
- FastAPI 0.104+
- Uvicorn (ASGI server)
- WebSockets
- Python 3.8+

## Integration Points

### S1 ↔ S2 (Vision)
- Provides camera frames to vision service
- Receives vision analysis results
- Manages Azure OpenAI API calls

### S1 ↔ S3 (Motion Control)
- Forwards motion commands to Webots
- Receives joint positions and sensor data
- Manages robot state synchronization

### S1 ↔ S4 (Cloud Dashboard)
- WebSocket real-time updates
- REST API for command execution
- MJPEG camera streaming

## Monitoring & Diagnostics

### System Health Checks
- Backend server status
- Webots connection state
- WebSocket client count
- API response times

### Error Handling
- Connection failure recovery
- Command validation
- Timeout management
- Error logging and reporting

## Testing

### Unit Tests
```bash
pytest tests/
```

### Integration Tests
```bash
pytest tests/integration/
```

## Performance Characteristics
- **API Latency:** < 50ms
- **WebSocket Update Rate:** 10 Hz
- **Connection Recovery:** < 2s
- **Concurrent Clients:** 50+

## Security
- CORS configuration
- API key authentication for Azure
- WebSocket connection validation
- Input sanitization

---

**Status:** Production Ready
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
