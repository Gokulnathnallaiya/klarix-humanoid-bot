# WebSocket API Specification

## Overview
Real-time bidirectional communication for live telemetry streaming and low-latency command execution.

## Connection

### Endpoint
```
ws://localhost:8000/api/robot/ws
```

### Connection Example (JavaScript)
```javascript
const ws = new WebSocket('ws://localhost:8000/api/robot/ws');

ws.onopen = () => {
  console.log('Connected to robot');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleTelemetry(data);
};

ws.onerror = (error) => {
  console.error('WebSocket error:', error);
};

ws.onclose = () => {
  console.log('Disconnected from robot');
};
```

---

## Message Types

### 1. Connection Established

**Direction:** Server → Client

**Sent:** Immediately after connection

**Format:**
```json
{
  "type": "connection",
  "status": "connected",
  "robot_id": "NAO_001",
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

### 2. Telemetry Update

**Direction:** Server → Client

**Frequency:** 10 Hz (every 100ms)

**Format:**
```json
{
  "type": "telemetry",
  "timestamp": "2025-11-30T12:00:00.123Z",
  "data": {
    "joints": {
      "HeadYaw": 0.0,
      "HeadPitch": 0.0,
      "LShoulderPitch": 1.57,
      ...
    },
    "sensors": {
      "imu": {
        "accelerometer": {"x": 0.12, "y": -0.05, "z": 9.81},
        "gyroscope": {"x": 0.01, "y": -0.02, "z": 0.0}
      },
      "odometry": {
        "position": {"x": 1.23, "y": 0.45, "z": 0.0},
        "orientation": {"roll": 0.0, "pitch": 0.0, "yaw": 0.12}
      }
    },
    "status": {
      "battery": 85,
      "temperature": 42,
      "errors": []
    }
  }
}
```

---

### 3. Joint Position Update

**Direction:** Server → Client

**Frequency:** On change (max 50 Hz)

**Format:**
```json
{
  "type": "joint_update",
  "timestamp": "2025-11-30T12:00:00Z",
  "joint_name": "LShoulderPitch",
  "position": 1.57,
  "velocity": 0.5,
  "torque": 0.3
}
```

---

### 4. Sensor Update

**Direction:** Server → Client

**Frequency:** Varies by sensor type

**Format:**
```json
{
  "type": "sensor_update",
  "timestamp": "2025-11-30T12:00:00Z",
  "sensor": "imu" | "lidar" | "camera" | "force",
  "data": {
    // Sensor-specific data
  }
}
```

**Example - IMU:**
```json
{
  "type": "sensor_update",
  "timestamp": "2025-11-30T12:00:00Z",
  "sensor": "imu",
  "data": {
    "accelerometer": {"x": 0.12, "y": -0.05, "z": 9.81},
    "gyroscope": {"x": 0.01, "y": -0.02, "z": 0.0}
  }
}
```

**Example - LIDAR:**
```json
{
  "type": "sensor_update",
  "timestamp": "2025-11-30T12:00:00Z",
  "sensor": "lidar",
  "data": {
    "ranges": [2.5, 2.5, 2.6, ...],
    "angle_min": -3.14,
    "angle_max": 3.14
  }
}
```

---

### 5. Status Update

**Direction:** Server → Client

**Frequency:** On change

**Format:**
```json
{
  "type": "status",
  "timestamp": "2025-11-30T12:00:00Z",
  "connected": true,
  "current_action": "walking",
  "last_command": "walk_forward",
  "errors": []
}
```

---

### 6. Error Notification

**Direction:** Server → Client

**Frequency:** On error

**Format:**
```json
{
  "type": "error",
  "timestamp": "2025-11-30T12:00:00Z",
  "severity": "warning" | "error" | "critical",
  "code": "MOTOR_LIMIT_EXCEEDED",
  "message": "Joint HeadYaw exceeded position limit",
  "details": {
    "joint": "HeadYaw",
    "position": 2.5,
    "limit": 2.086
  }
}
```

---

### 7. Command (Client → Server)

**Direction:** Client → Server

**Description:** Send commands to robot via WebSocket

**Format:**
```json
{
  "type": "command",
  "command_id": "uuid-1234",
  "action": "gesture" | "walk" | "head_move" | "joint_control",
  "params": {
    // Action-specific parameters
  }
}
```

**Example - Gesture:**
```json
{
  "type": "command",
  "command_id": "abc-123",
  "action": "gesture",
  "params": {
    "gesture": "wave"
  }
}
```

**Example - Walk:**
```json
{
  "type": "command",
  "command_id": "def-456",
  "action": "walk",
  "params": {
    "direction": "forward",
    "duration": 2.0,
    "speed": 1.0
  }
}
```

---

### 8. Command Acknowledgment

**Direction:** Server → Client

**Frequency:** After command received

**Format:**
```json
{
  "type": "command_ack",
  "timestamp": "2025-11-30T12:00:00Z",
  "command_id": "abc-123",
  "status": "accepted" | "rejected",
  "message": "Command queued for execution"
}
```

---

### 9. Command Completion

**Direction:** Server → Client

**Frequency:** After command completes

**Format:**
```json
{
  "type": "command_complete",
  "timestamp": "2025-11-30T12:00:02Z",
  "command_id": "abc-123",
  "status": "success" | "failed",
  "message": "Gesture 'wave' completed successfully",
  "execution_time": 2.5
}
```

---

### 10. Heartbeat

**Direction:** Bidirectional

**Frequency:** Every 30 seconds

**Format:**
```json
{
  "type": "heartbeat",
  "timestamp": "2025-11-30T12:00:00Z"
}
```

**Response:**
```json
{
  "type": "heartbeat_ack",
  "timestamp": "2025-11-30T12:00:00Z"
}
```

---

## Message Flow Examples

### Basic Telemetry Streaming
```
Client                          Server
  |                               |
  |-------- Connect -------------->|
  |<--- connection (connected) ---|
  |                               |
  |<------ telemetry (100ms) -----|
  |<------ telemetry (100ms) -----|
  |<------ telemetry (100ms) -----|
  |                               |
```

### Command Execution
```
Client                          Server
  |                               |
  |---- command (wave) ---------->|
  |<--- command_ack (accepted) ---|
  |                               |
  |<--- telemetry (executing) ----|
  |<--- telemetry (executing) ----|
  |<--- command_complete (success)|
  |                               |
```

### Error Handling
```
Client                          Server
  |                               |
  |---- command (invalid) ------->|
  |<--- command_ack (rejected) ---|
  |<--- error (INVALID_PARAM) ----|
  |                               |
```

---

## Connection Lifecycle

### 1. Connection
```javascript
const ws = new WebSocket('ws://localhost:8000/api/robot/ws');
```

### 2. Authentication (Future)
```javascript
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'jwt-token-here'
  }));
};
```

### 3. Normal Operation
- Receive telemetry updates
- Send commands
- Handle errors

### 4. Reconnection
```javascript
ws.onclose = () => {
  setTimeout(() => {
    reconnect();
  }, 1000);
};
```

### 5. Clean Disconnect
```javascript
ws.close(1000, 'Normal closure');
```

---

## Client Implementation

### React Hook Example
```typescript
import { useEffect, useState } from 'react';

export const useRobotWebSocket = (url: string) => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [telemetry, setTelemetry] = useState<any>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = new WebSocket(url);

    socket.onopen = () => {
      setConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'telemetry':
          setTelemetry(data.data);
          break;
        case 'error':
          console.error('Robot error:', data);
          break;
        // Handle other message types
      }
    };

    socket.onclose = () => {
      setConnected(false);
      // Implement reconnection logic
    };

    setWs(socket);

    return () => {
      socket.close();
    };
  }, [url]);

  const sendCommand = (action: string, params: any) => {
    if (ws && connected) {
      ws.send(JSON.stringify({
        type: 'command',
        command_id: generateUUID(),
        action,
        params
      }));
    }
  };

  return { connected, telemetry, sendCommand };
};
```

---

## Performance Characteristics

### Latency
- **Connection establishment:** < 100ms
- **Message delivery:** < 50ms
- **Round-trip time:** < 100ms

### Throughput
- **Telemetry rate:** 10 Hz (100ms intervals)
- **Max messages/sec:** 100
- **Concurrent connections:** 50+

### Reliability
- **Automatic reconnection:** Yes
- **Message ordering:** Guaranteed
- **Delivery guarantee:** At-least-once

---

## Error Handling

### Connection Errors
```javascript
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  // Implement retry logic
};
```

### Message Errors
```javascript
ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    if (data.type === 'error') {
      handleError(data);
    }
  } catch (e) {
    console.error('Failed to parse message:', e);
  }
};
```

### Timeout Handling
```javascript
let heartbeatTimeout;

const resetHeartbeat = () => {
  clearTimeout(heartbeatTimeout);
  heartbeatTimeout = setTimeout(() => {
    console.warn('No heartbeat received, reconnecting...');
    ws.close();
    reconnect();
  }, 35000); // 35 seconds (30s + 5s grace)
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'heartbeat') {
    resetHeartbeat();
  }
};
```

---

## Security

### Future Enhancements
1. **JWT Authentication**
   ```json
   {
     "type": "auth",
     "token": "eyJhbGciOiJIUzI1NiIs..."
   }
   ```

2. **Message Encryption**
   - Use WSS (WebSocket Secure) in production
   - TLS 1.3 encryption

3. **Rate Limiting**
   - Max 30 commands per minute per client
   - Automatic throttling

4. **Input Validation**
   - Schema validation for all messages
   - Sanitization of command parameters

---

## Testing

### Unit Tests
```python
# test_websocket.py
import pytest
from fastapi.testclient import TestClient

def test_websocket_connection():
    with client.websocket_connect("/api/robot/ws") as ws:
        data = ws.receive_json()
        assert data["type"] == "connection"
        assert data["status"] == "connected"
```

### Integration Tests
```python
def test_telemetry_streaming():
    with client.websocket_connect("/api/robot/ws") as ws:
        # Receive initial connection message
        ws.receive_json()

        # Wait for telemetry
        telemetry = ws.receive_json()
        assert telemetry["type"] == "telemetry"
        assert "joints" in telemetry["data"]
```

---

## Troubleshooting

### Connection Refused
- Check backend is running
- Verify WebSocket endpoint URL
- Check firewall rules

### Messages Not Received
- Verify connection is open
- Check message format
- Review server logs

### High Latency
- Check network conditions
- Reduce telemetry frequency
- Optimize message size

---

**Version:** 1.0.0
**Protocol:** WebSocket (RFC 6455)
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
