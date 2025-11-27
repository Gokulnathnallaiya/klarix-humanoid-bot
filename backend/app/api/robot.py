"""Robot control API endpoints"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from typing import Dict
import json

from app.models.robot import (
    GestureCommand,
    HeadMoveCommand,
    WalkCommand,
    MotorCommand,
    BatchMotorCommand,
    RobotStatus
)
from app.services.robot_controller import robot_controller

router = APIRouter(prefix="/api/robot", tags=["robot"])


@router.post("/gesture")
async def execute_gesture(command: GestureCommand) -> Dict:
    """Execute a predefined gesture"""
    result = await robot_controller.send_gesture(command.gesture.value)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/head/move")
async def move_head(command: HeadMoveCommand) -> Dict:
    """Move robot head in specified direction"""
    result = await robot_controller.move_head(command.direction.value)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/walk")
async def walk(command: WalkCommand) -> Dict:
    """Execute walking movement"""
    result = await robot_controller.walk(
        command.movement.value,
        command.duration
    )
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/motor")
async def set_motor(command: MotorCommand) -> Dict:
    """Set individual motor position"""
    result = await robot_controller.set_motor_position(
        command.motor_name,
        command.position
    )
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.post("/motors")
async def set_motors(command: BatchMotorCommand) -> Dict:
    """Set multiple motor positions"""
    result = await robot_controller.set_multiple_motors(command.motors)
    if not result["success"]:
        raise HTTPException(status_code=500, detail=result.get("error"))
    return result


@router.get("/status", response_model=RobotStatus)
async def get_status() -> RobotStatus:
    """Get current robot status"""
    status = await robot_controller.get_status()
    return RobotStatus(**status)


@router.post("/connect")
async def connect() -> Dict:
    """Connect to robot"""
    await robot_controller.connect()
    return {"success": True, "message": "Connected to robot"}


@router.post("/disconnect")
async def disconnect() -> Dict:
    """Disconnect from robot"""
    await robot_controller.disconnect()
    return {"success": True, "message": "Disconnected from robot"}


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time robot status updates"""
    await websocket.accept()
    queue = await robot_controller.subscribe()

    try:
        while True:
            # Wait for status update
            status = await queue.get()
            # Send to client
            await websocket.send_json(status)
    except WebSocketDisconnect:
        await robot_controller.unsubscribe(queue)
        print("WebSocket client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await robot_controller.unsubscribe(queue)
