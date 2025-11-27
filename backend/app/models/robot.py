"""Robot control models"""
from pydantic import BaseModel
from typing import Optional, Dict, List
from enum import Enum


class GestureType(str, Enum):
    """Available robot gestures"""
    WAVE = "wave"
    POINT = "point"
    STAND = "stand"
    SIT = "sit"
    BOW = "bow"


class Direction(str, Enum):
    """Head movement directions"""
    LEFT = "left"
    RIGHT = "right"
    UP = "up"
    DOWN = "down"
    CENTER = "center"


class MovementType(str, Enum):
    """Robot movement types"""
    FORWARD = "forward"
    BACKWARD = "backward"
    TURN_LEFT = "turn_left"
    TURN_RIGHT = "turn_right"
    SIDESTEP_LEFT = "sidestep_left"
    SIDESTEP_RIGHT = "sidestep_right"


class RobotCommand(BaseModel):
    """Base robot command"""
    command_type: str
    parameters: Optional[Dict] = None


class GestureCommand(BaseModel):
    """Gesture command"""
    gesture: GestureType


class HeadMoveCommand(BaseModel):
    """Head movement command"""
    direction: Direction


class WalkCommand(BaseModel):
    """Walking command"""
    movement: MovementType
    duration: Optional[float] = 2.0


class MotorCommand(BaseModel):
    """Direct motor control command"""
    motor_name: str
    position: float  # in radians


class BatchMotorCommand(BaseModel):
    """Multiple motor control command"""
    motors: Dict[str, float]  # motor_name: position


class IMUData(BaseModel):
    """IMU sensor data"""
    accelerometer: Dict[str, float]  # x, y, z in m/s²
    gyroscope: Dict[str, float]      # x, y, z in rad/s


class RobotStatus(BaseModel):
    """Robot status response"""
    connected: bool
    is_moving: bool = False
    current_gesture: Optional[str] = None
    head_position: Optional[Dict[str, float]] = None
    motor_positions: Optional[Dict[str, float]] = None
    imu: Optional[IMUData] = None
