# REST API Specification

## Base URL
```
http://localhost:8000
```

## Authentication
Currently no authentication required for development. Production deployment should implement JWT-based authentication.

---

## Robot Control Endpoints

### 1. Execute Gesture

**Endpoint:** `POST /api/robot/gesture`

**Description:** Execute a pre-defined gesture animation.

**Request Body:**
```json
{
  "gesture": "wave" | "point" | "stand" | "sit"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Gesture 'wave' executed successfully",
  "timestamp": "2025-11-30T12:00:00Z"
}
```

**Status Codes:**
- `200 OK` - Gesture executed successfully
- `400 Bad Request` - Invalid gesture name
- `503 Service Unavailable` - Robot not connected

---

### 2. Walk Command

**Endpoint:** `POST /api/robot/walk`

**Description:** Move the robot in a specified direction for a given duration.

**Request Body:**
```json
{
  "direction": "forward" | "backward" | "left" | "right",
  "duration": 2.0,
  "speed": 1.0
}
```

**Parameters:**
- `direction` (required): Walking direction
- `duration` (required): Duration in seconds (0.5-10.0)
- `speed` (optional): Speed multiplier (0.5-2.0), default 1.0

**Response:**
```json
{
  "status": "success",
  "message": "Walking forward for 2.0 seconds",
  "estimated_completion": "2025-11-30T12:00:02Z"
}
```

**Status Codes:**
- `200 OK` - Walk command accepted
- `400 Bad Request` - Invalid parameters
- `503 Service Unavailable` - Robot not connected

---

### 3. Move Head

**Endpoint:** `POST /api/robot/head/move`

**Description:** Move the robot's head in a specified direction.

**Request Body:**
```json
{
  "direction": "up" | "down" | "left" | "right" | "center"
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Head moved to center position"
}
```

**Status Codes:**
- `200 OK` - Head movement executed
- `400 Bad Request` - Invalid direction
- `503 Service Unavailable` - Robot not connected

---

### 4. Manual Joint Control

**Endpoint:** `POST /api/robot/joint`

**Description:** Set a specific joint to a target position.

**Request Body:**
```json
{
  "joint_name": "LShoulderPitch",
  "position": 1.57,
  "speed": 0.5
}
```

**Parameters:**
- `joint_name` (required): Motor name (e.g., "LShoulderPitch")
- `position` (required): Target position in radians
- `speed` (optional): Movement speed (0.0-1.0), default 0.5

**Response:**
```json
{
  "status": "success",
  "joint": "LShoulderPitch",
  "target_position": 1.57,
  "current_position": 0.85
}
```

**Valid Joint Names:**
- Head: `HeadYaw`, `HeadPitch`
- Left Arm: `LShoulderPitch`, `LShoulderRoll`, `LElbowYaw`, `LElbowRoll`, `LWristYaw`, `LHand`
- Right Arm: `RShoulderPitch`, `RShoulderRoll`, `RElbowYaw`, `RElbowRoll`, `RWristYaw`, `RHand`
- Left Leg: `LHipYawPitch`, `LHipRoll`, `LHipPitch`, `LKneePitch`, `LAnklePitch`, `LAnkleRoll`
- Right Leg: `RHipYawPitch`, `RHipRoll`, `RHipPitch`, `RKneePitch`, `RAnklePitch`, `RAnkleRoll`

---

### 5. Robot Status

**Endpoint:** `GET /api/robot/status`

**Description:** Get current robot connection and status information.

**Response:**
```json
{
  "connected": true,
  "robot_id": "NAO_001",
  "uptime": 3600,
  "last_command": "wave",
  "last_command_time": "2025-11-30T11:55:00Z"
}
```

**Status Codes:**
- `200 OK` - Status retrieved successfully

---

### 6. Connect to Robot

**Endpoint:** `POST /api/robot/connect`

**Description:** Establish connection to the robot.

**Response:**
```json
{
  "status": "connected",
  "message": "Successfully connected to robot",
  "robot_info": {
    "model": "NAO H25",
    "version": "2.8",
    "motors": 24
  }
}
```

---

### 7. Disconnect from Robot

**Endpoint:** `POST /api/robot/disconnect`

**Description:** Safely disconnect from the robot.

**Response:**
```json
{
  "status": "disconnected",
  "message": "Successfully disconnected from robot"
}
```

---

## Vision Service Endpoints

### 8. Vision Service Status

**Endpoint:** `GET /api/vision/status`

**Description:** Check if vision service is available and configured.

**Response:**
```json
{
  "enabled": true,
  "provider": "azure",
  "model": "gpt-4o",
  "cache_ttl": 30,
  "last_analysis_time": "2025-11-30T12:00:00Z"
}
```

---

### 9. Analyze Scene

**Endpoint:** `POST /api/vision/analyze`

**Description:** Trigger AI vision analysis of current camera view.

**Request Body (Optional):**
```json
{
  "query": "What objects do you see and are there any obstacles?"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": "I can see an office environment with a desk, computer monitor, keyboard, and mouse. There are no immediate obstacles in the robot's path.",
  "timestamp": "2025-11-30T12:00:00Z",
  "cached": false,
  "confidence": 0.95
}
```

**Status Codes:**
- `200 OK` - Analysis completed
- `400 Bad Request` - Invalid request
- `503 Service Unavailable` - Vision service not enabled
- `429 Too Many Requests` - Rate limit exceeded

---

### 10. Query Vision

**Endpoint:** `POST /api/vision/query`

**Description:** Ask a specific question about the current scene.

**Request Body:**
```json
{
  "question": "How many people are in the room?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "I can see one person seated at the desk, working on the computer.",
  "timestamp": "2025-11-30T12:00:00Z",
  "cached": false
}
```

---

### 11. Latest Vision Analysis

**Endpoint:** `GET /api/vision/latest`

**Description:** Retrieve the most recent cached vision analysis.

**Response:**
```json
{
  "success": true,
  "analysis": "Office environment with desk and computer equipment.",
  "timestamp": "2025-11-30T11:59:30Z",
  "age_seconds": 30,
  "cached": true
}
```

---

## Sensor Data Endpoints

### 12. IMU Sensor Data

**Endpoint:** `GET /api/sensors/imu`

**Description:** Get current IMU (accelerometer + gyroscope) readings.

**Response:**
```json
{
  "accelerometer": {
    "x": 0.12,
    "y": -0.05,
    "z": 9.81
  },
  "gyroscope": {
    "x": 0.01,
    "y": -0.02,
    "z": 0.00
  },
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

### 13. LIDAR Scan Data

**Endpoint:** `GET /api/sensors/lidar`

**Description:** Get latest 360° LIDAR scan data.

**Response:**
```json
{
  "ranges": [2.5, 2.5, 2.6, 2.7, ...],  // 360 points
  "angle_min": -3.14,
  "angle_max": 3.14,
  "angle_increment": 0.0175,
  "range_min": 0.1,
  "range_max": 5.0,
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

### 14. Joint Positions

**Endpoint:** `GET /api/sensors/joints`

**Description:** Get all motor joint positions.

**Response:**
```json
{
  "joints": {
    "HeadYaw": 0.0,
    "HeadPitch": 0.0,
    "LShoulderPitch": 1.57,
    "LShoulderRoll": 0.26,
    ...
  },
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

### 15. Odometry Data

**Endpoint:** `GET /api/sensors/odometry`

**Description:** Get robot position and velocity estimation.

**Response:**
```json
{
  "position": {
    "x": 1.23,
    "y": 0.45,
    "z": 0.0
  },
  "orientation": {
    "roll": 0.0,
    "pitch": 0.0,
    "yaw": 0.12
  },
  "velocity": {
    "linear": 0.1,
    "angular": 0.0
  },
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

## Camera Endpoints

### 16. Camera Stream

**Endpoint:** `GET /api/camera/stream`

**Description:** MJPEG video stream from robot camera.

**Response:** Multipart MJPEG stream

**Headers:**
```
Content-Type: multipart/x-mixed-replace; boundary=frame
```

---

### 17. Camera Frame

**Endpoint:** `GET /api/camera/frame`

**Description:** Get single camera frame as JPEG.

**Response:** JPEG image

**Headers:**
```
Content-Type: image/jpeg
```

---

## System Endpoints

### 18. Health Check

**Endpoint:** `GET /`

**Description:** Basic health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "NAO Robot Control API",
  "version": "1.0.0",
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

### 19. API Documentation

**Endpoint:** `GET /docs`

**Description:** Interactive Swagger/OpenAPI documentation.

**Response:** HTML page with interactive API explorer

---

## Error Responses

### Standard Error Format
```json
{
  "error": {
    "code": "ROBOT_NOT_CONNECTED",
    "message": "Robot is not connected. Please connect first.",
    "details": "TCP connection to Webots failed",
    "timestamp": "2025-11-30T12:00:00Z"
  }
}
```

### Common Error Codes
- `ROBOT_NOT_CONNECTED` - Robot not connected
- `INVALID_PARAMETER` - Invalid request parameter
- `COMMAND_FAILED` - Command execution failed
- `VISION_SERVICE_UNAVAILABLE` - Vision service not enabled
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server error

---

## Rate Limits

### Vision API
- **Limit:** 6 requests per minute
- **Caching:** 30 second TTL
- **Header:** `X-RateLimit-Remaining`

### Robot Control
- **Limit:** 30 requests per minute
- **Burst:** 10 requests per second

---

## CORS Configuration

**Allowed Origins:**
- `http://localhost:3000` (Frontend dev)
- `https://yourdomain.com` (Production)

**Allowed Methods:**
- GET, POST, OPTIONS

**Allowed Headers:**
- Content-Type, Authorization

---

## WebSocket API

See `WebSocket_API_Specification.md` for real-time streaming API.

---

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
