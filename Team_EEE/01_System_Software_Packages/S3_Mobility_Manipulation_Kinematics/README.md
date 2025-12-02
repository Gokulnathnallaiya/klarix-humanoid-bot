# S3: Mobility, Manipulation, Kinematics & Failsafes

## Overview
Comprehensive motion control system for NAO humanoid robot featuring 24-motor control, gesture animations, walking, head movement, and safety failsafes.

## Components

### 1. Robot Controller
- **Motion Control** - High-level command interface
- **24 Motor Management** - Individual joint position control
- **State Machine** - Robot behavior state management
- **Command Queue** - Async command execution

### 2. Kinematics System
- **Joint Control** - Precise motor positioning
- **Position Sensors** - Real-time joint feedback
- **Motor Groups** - Head, arms, legs coordination
- **Inverse Kinematics** - Target-based positioning

### 3. Gesture Library
- **Pre-defined Animations** - Wave, point, stand, sit
- **Walking Patterns** - Forward, backward, turn left/right
- **Head Movement** - 5-direction pan/tilt control
- **Custom Gestures** - Extensible animation system

### 4. Safety Failsafes
- **Position Limits** - Joint angle constraints
- **Collision Detection** - Self-collision avoidance
- **Emergency Stop** - Immediate motion halt
- **Error Recovery** - Safe state transitions

## Source Code Location
```
backend/
├── app/
│   ├── services/
│   │   ├── robot_controller.py    # Main motion controller
│   │   └── webots_bridge.py       # Webots communication
│   ├── api/
│   │   └── robot.py               # Motion control endpoints
│   └── models/
│       └── robot.py               # Robot data models

webots/
├── controllers/
│   └── nao_office_assistant/
│       ├── nao_office_assistant.py  # Main controller
│       └── backend_client.py        # Backend communication
```

## Joint Control System

### Motor Groups
```
Head Motors (2):
- HeadYaw    (left/right rotation)
- HeadPitch  (up/down tilt)

Arm Motors (12):
Left Arm:                    Right Arm:
- LShoulderPitch            - RShoulderPitch
- LShoulderRoll             - RShoulderRoll
- LElbowYaw                 - RElbowYaw
- LElbowRoll                - RElbowRoll
- LWristYaw                 - RWristYaw
- LHand                     - RHand

Leg Motors (10):
Left Leg:                    Right Leg:
- LHipYawPitch (shared)     - RHipYawPitch (shared)
- LHipRoll                  - RHipRoll
- LHipPitch                 - RHipPitch
- LKneePitch                - RKneePitch
- LAnklePitch               - RAnklePitch
- LAnkleRoll                - RAnkleRoll
```

## Motion Control API

### Gesture Commands
```
POST /api/robot/gesture
{
  "gesture": "wave" | "point" | "stand" | "sit"
}
```

### Walking Commands
```
POST /api/robot/walk
{
  "direction": "forward" | "backward" | "left" | "right",
  "duration": 2.0,      // seconds
  "speed": 1.0          // multiplier (0.5-2.0)
}
```

### Head Movement
```
POST /api/robot/head/move
{
  "direction": "up" | "down" | "left" | "right" | "center"
}
```

### Manual Joint Control
```
POST /api/robot/joint
{
  "joint_name": "LShoulderPitch",
  "position": 1.57,     // radians
  "speed": 0.5          // 0.0-1.0
}
```

## Gesture Library

### Wave Animation
```python
Sequence:
1. Raise right arm (shoulder pitch)
2. Rotate hand (wrist yaw) 3 times
3. Lower arm to rest position
Duration: ~3 seconds
```

### Point Animation
```python
Sequence:
1. Extend right arm forward
2. Point index finger
3. Hold for 2 seconds
4. Return to rest
Duration: ~4 seconds
```

### Stand Animation
```python
Sequence:
1. Move legs to standing position
2. Balance weight distribution
3. Straighten torso
4. Arms at sides
Duration: ~2 seconds
```

### Sit Animation
```python
Sequence:
1. Bend knees to 90 degrees
2. Lower hips
3. Fold arms
4. Stabilize position
Duration: ~2 seconds
```

## Walking System

### Walking Parameters
- **Forward Speed:** 0.1 - 0.3 m/s
- **Turning Speed:** 0.2 - 0.5 rad/s
- **Step Height:** 0.02 m
- **Step Length:** 0.04 m
- **Gait Cycle:** ~0.8 seconds

### Walking States
```
IDLE → PREPARE → WALKING → STOPPING → IDLE
```

### Balance Control
- **ZMP (Zero Moment Point)** calculation
- **Dynamic stability** maintenance
- **Foot pressure** sensing
- **Posture correction**

## Kinematics

### Forward Kinematics
```python
# Joint angles → End effector position
position = FK(joint_angles)
# Returns: (x, y, z, roll, pitch, yaw)
```

### Inverse Kinematics
```python
# Target position → Joint angles
joint_angles = IK(target_position)
# Returns: [θ1, θ2, ..., θn]
```

### Workspace Limits
```
Head:
- Yaw: ±119.5° (2.086 rad)
- Pitch: -38.5° to 29.5° (-0.672 to 0.515 rad)

Arms:
- Shoulder Pitch: -119.5° to 119.5°
- Shoulder Roll: -18° to 76°
- Elbow Roll: -88.5° to -2°
- Elbow Yaw: -119.5° to 119.5°

Legs:
- Hip Pitch: -88° to 27.7°
- Knee Pitch: -5.3° to 121.0°
- Ankle Pitch: -68.2° to 52.9°
```

## Safety Failsafes

### Position Limits
```python
# Soft limits (warning)
if joint_angle > soft_limit * 0.9:
    warn("Approaching joint limit")

# Hard limits (enforcement)
if joint_angle > hard_limit:
    stop_motor()
    trigger_emergency_stop()
```

### Collision Avoidance
- Self-collision detection
- Workspace boundary checking
- Singularity avoidance
- Safe motion planning

### Emergency Stop
```python
# Triggered by:
- Manual e-stop button
- Position limit violation
- Communication loss
- Sensor error
- Fall detection

# Response:
- Immediate motor power off
- Apply position hold
- Log error state
- Notify dashboard
```

### Error Recovery
```python
States:
1. NORMAL → Error detected
2. ERROR_DETECTED → Assess severity
3. SAFE_MODE → Move to safe position
4. RECOVERY → Resume normal operation
5. MANUAL_OVERRIDE → Require user action
```

## Sensor Integration

### IMU (Inertial Measurement Unit)
```
Accelerometer: 3-axis (m/s²)
- Detects linear acceleration
- Fall detection
- Orientation estimation

Gyroscope: 3-axis (rad/s)
- Angular velocity
- Balance control
- Motion tracking
```

### Position Sensors
```
Motor Encoders:
- Resolution: 0.1° (0.0017 rad)
- Update Rate: 100 Hz
- Accuracy: ±0.5°
```

### Force Sensors (Feet)
```
FSR (Force Sensitive Resistors):
- 4 per foot (toe, heel, left, right)
- Measure ground contact
- Balance and gait control
```

## Performance Characteristics

### Motion Control
- **Command Latency:** < 50ms
- **Position Accuracy:** ±0.5°
- **Update Rate:** 50 Hz
- **Smooth Interpolation:** Yes

### Walking Performance
- **Max Speed:** 0.3 m/s forward
- **Turning Rate:** 0.5 rad/s
- **Stability:** >95% success
- **Energy Efficiency:** Optimized gait

## Testing & Validation

### Unit Tests
```bash
# Test individual motor control
pytest tests/test_motors.py

# Test gesture library
pytest tests/test_gestures.py

# Test kinematics
pytest tests/test_kinematics.py
```

### Integration Tests
```bash
# Full motion sequences
pytest tests/integration/test_motion.py

# Safety failsafes
pytest tests/integration/test_safety.py
```

### Validation Procedures
1. **Joint Range Tests** - Verify each motor reaches limits
2. **Gesture Validation** - Execute all predefined animations
3. **Walking Tests** - Straight line and turning paths
4. **Safety Tests** - Emergency stop, collision detection
5. **Stability Tests** - Balance in various poses

## Integration Points

### S3 ↔ S1 (Communication)
- Receives motion commands via REST/WebSocket
- Sends joint positions and sensor data
- Real-time telemetry streaming

### S3 ↔ S2 (Vision)
- Vision-guided motion planning
- Obstacle avoidance integration
- Object manipulation with visual feedback

### S3 ↔ S4 (Dashboard)
- Real-time joint position display
- Motion command interface
- Kinematics visualization

## Configuration

### Motion Parameters
```python
# In robot_controller.py
MOTION_CONFIG = {
    "max_speed": 0.3,           # m/s
    "max_acceleration": 1.0,    # m/s²
    "position_tolerance": 0.01, # radians
    "emergency_stop_time": 0.1  # seconds
}
```

### Safety Settings
```python
SAFETY_CONFIG = {
    "enable_collision_check": True,
    "enable_position_limits": True,
    "enable_fall_detection": True,
    "emergency_stop_enabled": True
}
```

## Troubleshooting

### Motor Not Responding
- Check Webots connection
- Verify motor name in command
- Check position limits
- Review error logs

### Unstable Walking
- Calibrate IMU sensors
- Check foot force sensors
- Adjust gait parameters
- Verify ground friction

### Position Drift
- Calibrate motor encoders
- Check sensor noise
- Verify motor control loop
- Update PID parameters

## Future Enhancements

### Planned Features
- Adaptive gait patterns
- Terrain-aware walking
- Dynamic obstacle avoidance
- Advanced manipulation skills
- Learning-based motion planning

### Research Areas
- Reinforcement learning for gait
- Model predictive control
- Compliant motion control
- Human-robot interaction

---

**Status:** Production Ready
**DOF (Degrees of Freedom):** 24
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
