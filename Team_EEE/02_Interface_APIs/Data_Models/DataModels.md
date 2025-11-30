# Data Models and Schemas

## Overview
Comprehensive data model definitions for the NAO robot control system.

---

## Robot State Models

### RobotStatus
```typescript
interface RobotStatus {
  connected: boolean;
  robot_id: string;
  uptime: number;              // seconds
  last_command: string;
  last_command_time: string;   // ISO 8601
  battery_level?: number;      // 0-100
  temperature?: number;        // Celsius
  errors: string[];
}
```

### ConnectionState
```typescript
type ConnectionState = 'connected' | 'disconnected' | 'connecting' | 'error';

interface Connection {
  state: ConnectionState;
  timestamp: string;
  error_message?: string;
}
```

---

## Motion Control Models

### GestureCommand
```typescript
type GestureName = 'wave' | 'point' | 'stand' | 'sit';

interface GestureCommand {
  gesture: GestureName;
}

interface GestureResponse {
  status: 'success' | 'failed';
  message: string;
  timestamp: string;
}
```

### WalkCommand
```typescript
type WalkDirection = 'forward' | 'backward' | 'left' | 'right';

interface WalkCommand {
  direction: WalkDirection;
  duration: number;    // 0.5-10.0 seconds
  speed?: number;      // 0.5-2.0, default 1.0
}

interface WalkResponse {
  status: 'success' | 'failed';
  message: string;
  estimated_completion: string;  // ISO 8601
}
```

### HeadMovement
```typescript
type HeadDirection = 'up' | 'down' | 'left' | 'right' | 'center';

interface HeadMoveCommand {
  direction: HeadDirection;
}

interface HeadMoveResponse {
  status: 'success' | 'failed';
  message: string;
}
```

### JointControl
```typescript
type JointName =
  // Head
  | 'HeadYaw' | 'HeadPitch'
  // Left Arm
  | 'LShoulderPitch' | 'LShoulderRoll' | 'LElbowYaw'
  | 'LElbowRoll' | 'LWristYaw' | 'LHand'
  // Right Arm
  | 'RShoulderPitch' | 'RShoulderRoll' | 'RElbowYaw'
  | 'RElbowRoll' | 'RWristYaw' | 'RHand'
  // Left Leg
  | 'LHipYawPitch' | 'LHipRoll' | 'LHipPitch'
  | 'LKneePitch' | 'LAnklePitch' | 'LAnkleRoll'
  // Right Leg
  | 'RHipYawPitch' | 'RHipRoll' | 'RHipPitch'
  | 'RKneePitch' | 'RAnklePitch' | 'RAnkleRoll';

interface JointCommand {
  joint_name: JointName;
  position: number;     // radians
  speed?: number;       // 0.0-1.0
}

interface JointPosition {
  joint_name: JointName;
  position: number;     // radians
  velocity: number;     // rad/s
  torque: number;       // Nm
}

interface JointPositions {
  joints: Record<JointName, number>;
  timestamp: string;
}
```

---

## Sensor Data Models

### IMU (Inertial Measurement Unit)
```typescript
interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface IMUData {
  accelerometer: Vector3;  // m/s²
  gyroscope: Vector3;      // rad/s
  timestamp: string;
}
```

### LIDAR
```typescript
interface LIDARScan {
  ranges: number[];           // meters, 360 points
  angle_min: number;          // radians
  angle_max: number;          // radians
  angle_increment: number;    // radians
  range_min: number;          // meters
  range_max: number;          // meters
  timestamp: string;
}
```

### Odometry
```typescript
interface Position {
  x: number;  // meters
  y: number;  // meters
  z: number;  // meters
}

interface Orientation {
  roll: number;   // radians
  pitch: number;  // radians
  yaw: number;    // radians
}

interface Velocity {
  linear: number;   // m/s
  angular: number;  // rad/s
}

interface Odometry {
  position: Position;
  orientation: Orientation;
  velocity: Velocity;
  timestamp: string;
}
```

### Camera
```typescript
interface CameraInfo {
  width: number;
  height: number;
  fps: number;
  format: 'MJPEG' | 'RGB24';
}

interface CameraFrame {
  data: string;        // Base64 encoded image
  width: number;
  height: number;
  format: string;
  timestamp: string;
}
```

---

## Vision Service Models

### VisionServiceStatus
```typescript
interface VisionServiceStatus {
  enabled: boolean;
  provider: 'azure' | 'mock';
  model: string;
  cache_ttl: number;          // seconds
  last_analysis_time?: string;
}
```

### VisionAnalysis
```typescript
interface VisionAnalysisRequest {
  query?: string;  // Optional custom question
}

interface VisionAnalysisResponse {
  success: boolean;
  analysis: string;
  timestamp: string;
  cached: boolean;
  confidence?: number;  // 0.0-1.0
}
```

### VisionQuery
```typescript
interface VisionQueryRequest {
  question: string;
}

interface VisionQueryResponse {
  success: boolean;
  answer: string;
  timestamp: string;
  cached: boolean;
}
```

---

## WebSocket Message Models

### Connection Message
```typescript
interface ConnectionMessage {
  type: 'connection';
  status: 'connected' | 'disconnected';
  robot_id: string;
  timestamp: string;
}
```

### Telemetry Message
```typescript
interface TelemetryMessage {
  type: 'telemetry';
  timestamp: string;
  data: {
    joints: Record<JointName, number>;
    sensors: {
      imu: IMUData;
      odometry: Odometry;
    };
    status: {
      battery: number;
      temperature: number;
      errors: string[];
    };
  };
}
```

### Command Message
```typescript
interface CommandMessage {
  type: 'command';
  command_id: string;
  action: 'gesture' | 'walk' | 'head_move' | 'joint_control';
  params: GestureCommand | WalkCommand | HeadMoveCommand | JointCommand;
}
```

### Command Acknowledgment
```typescript
interface CommandAckMessage {
  type: 'command_ack';
  timestamp: string;
  command_id: string;
  status: 'accepted' | 'rejected';
  message: string;
}
```

### Command Completion
```typescript
interface CommandCompleteMessage {
  type: 'command_complete';
  timestamp: string;
  command_id: string;
  status: 'success' | 'failed';
  message: string;
  execution_time: number;  // seconds
}
```

### Error Message
```typescript
type ErrorSeverity = 'warning' | 'error' | 'critical';

interface ErrorMessage {
  type: 'error';
  timestamp: string;
  severity: ErrorSeverity;
  code: string;
  message: string;
  details?: Record<string, any>;
}
```

---

## Configuration Models

### API Configuration
```typescript
interface APIConfig {
  baseUrl: string;
  wsUrl: string;
  timeout: number;       // milliseconds
  retryAttempts: number;
}
```

### Robot Configuration
```typescript
interface RobotConfig {
  robot_id: string;
  model: string;
  version: string;
  motors: number;
  capabilities: string[];
}
```

### Motion Configuration
```typescript
interface MotionConfig {
  max_speed: number;            // m/s
  max_acceleration: number;     // m/s²
  position_tolerance: number;   // radians
  emergency_stop_time: number;  // seconds
}
```

### Safety Configuration
```typescript
interface SafetyConfig {
  enable_collision_check: boolean;
  enable_position_limits: boolean;
  enable_fall_detection: boolean;
  emergency_stop_enabled: boolean;
}
```

---

## Error Models

### Standard Error
```typescript
interface APIError {
  error: {
    code: string;
    message: string;
    details?: string;
    timestamp: string;
  };
}
```

### Error Codes
```typescript
enum ErrorCode {
  ROBOT_NOT_CONNECTED = 'ROBOT_NOT_CONNECTED',
  INVALID_PARAMETER = 'INVALID_PARAMETER',
  COMMAND_FAILED = 'COMMAND_FAILED',
  VISION_SERVICE_UNAVAILABLE = 'VISION_SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  MOTOR_LIMIT_EXCEEDED = 'MOTOR_LIMIT_EXCEEDED',
  TIMEOUT = 'TIMEOUT'
}
```

---

## Validation Schemas

### Joint Position Limits
```typescript
interface JointLimits {
  min: number;  // radians
  max: number;  // radians
}

const JOINT_LIMITS: Record<JointName, JointLimits> = {
  HeadYaw: { min: -2.086, max: 2.086 },
  HeadPitch: { min: -0.672, max: 0.515 },
  LShoulderPitch: { min: -2.086, max: 2.086 },
  LShoulderRoll: { min: -0.314, max: 1.326 },
  LElbowYaw: { min: -2.086, max: 2.086 },
  LElbowRoll: { min: -1.544, max: -0.035 },
  // ... more joints
};
```

### Walking Parameters
```typescript
const WALK_CONSTRAINTS = {
  duration: { min: 0.5, max: 10.0 },  // seconds
  speed: { min: 0.5, max: 2.0 },      // multiplier
  max_linear_speed: 0.3,               // m/s
  max_angular_speed: 0.5               // rad/s
};
```

---

## Python Data Models

### Pydantic Models (Backend)
```python
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime

class GestureCommand(BaseModel):
    gesture: Literal["wave", "point", "stand", "sit"]

class WalkCommand(BaseModel):
    direction: Literal["forward", "backward", "left", "right"]
    duration: float = Field(ge=0.5, le=10.0)
    speed: float = Field(default=1.0, ge=0.5, le=2.0)

class HeadMoveCommand(BaseModel):
    direction: Literal["up", "down", "left", "right", "center"]

class JointCommand(BaseModel):
    joint_name: str
    position: float
    speed: Optional[float] = Field(default=0.5, ge=0.0, le=1.0)

class IMUData(BaseModel):
    accelerometer: dict[str, float]
    gyroscope: dict[str, float]
    timestamp: datetime

class RobotStatus(BaseModel):
    connected: bool
    robot_id: str
    uptime: int
    last_command: Optional[str] = None
    last_command_time: Optional[datetime] = None
    battery_level: Optional[int] = None
    temperature: Optional[float] = None
    errors: list[str] = []
```

---

## Database Models

### Telemetry Log
```typescript
interface TelemetryLog {
  id: string;
  robot_id: string;
  timestamp: string;
  joint_positions: Record<JointName, number>;
  sensor_data: {
    imu: IMUData;
    odometry: Odometry;
  };
  status: {
    battery: number;
    temperature: number;
  };
}
```

### Command Log
```typescript
interface CommandLog {
  id: string;
  robot_id: string;
  command_id: string;
  action: string;
  params: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  timestamp_sent: string;
  timestamp_ack?: string;
  timestamp_complete?: string;
  execution_time?: number;  // seconds
  error_message?: string;
}
```

---

## Constants

### System Constants
```typescript
const SYSTEM_CONSTANTS = {
  WEBOTS_PORT: 10020,
  BACKEND_PORT: 8000,
  FRONTEND_PORT: 3000,

  TELEMETRY_RATE_HZ: 10,
  CAMERA_FPS: 5,
  CAMERA_WIDTH: 320,
  CAMERA_HEIGHT: 240,

  WEBSOCKET_HEARTBEAT_INTERVAL: 30,  // seconds
  VISION_CACHE_TTL: 30,               // seconds
  VISION_RATE_LIMIT: 6,               // per minute

  MAX_CONCURRENT_COMMANDS: 5,
  COMMAND_TIMEOUT: 30                 // seconds
};
```

---

## Type Guards (TypeScript)

```typescript
// Type guard functions for runtime type checking
export function isGestureCommand(cmd: any): cmd is GestureCommand {
  return typeof cmd === 'object'
    && 'gesture' in cmd
    && ['wave', 'point', 'stand', 'sit'].includes(cmd.gesture);
}

export function isWalkCommand(cmd: any): cmd is WalkCommand {
  return typeof cmd === 'object'
    && 'direction' in cmd
    && ['forward', 'backward', 'left', 'right'].includes(cmd.direction)
    && 'duration' in cmd
    && typeof cmd.duration === 'number';
}

export function isTelemetryMessage(msg: any): msg is TelemetryMessage {
  return msg.type === 'telemetry'
    && 'data' in msg
    && 'joints' in msg.data;
}
```

---

## JSON Schema Examples

### Gesture Command Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "gesture": {
      "type": "string",
      "enum": ["wave", "point", "stand", "sit"]
    }
  },
  "required": ["gesture"]
}
```

### Telemetry Message Schema
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "type": {
      "type": "string",
      "const": "telemetry"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "data": {
      "type": "object",
      "properties": {
        "joints": {"type": "object"},
        "sensors": {"type": "object"},
        "status": {"type": "object"}
      },
      "required": ["joints", "sensors", "status"]
    }
  },
  "required": ["type", "timestamp", "data"]
}
```

---

**Version:** 1.0.0
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
