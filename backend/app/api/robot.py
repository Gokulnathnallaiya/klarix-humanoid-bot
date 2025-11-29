"""Robot control API endpoints"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
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
from app.services.camera_streamer import camera_streamer

router = APIRouter(prefix="/api/robot", tags=["robot"])

# OTA Update storage (in-memory for demo, would use DB in production)
ota_updates: List[Dict] = []
current_ota_version = "v1.0.0"


class OTAUpdateRequest(BaseModel):
    """Request model for OTA updates"""
    version: str
    config: Dict
    description: Optional[str] = None


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
    """Connect to robot - checks if Webots is connected"""
    result = await robot_controller.connect()
    if not result.get("success", False):
        raise HTTPException(status_code=503, detail=result.get("message", "Connection failed"))
    return {"success": True, "message": result.get("message", "Connected to robot")}


@router.post("/disconnect")
async def disconnect() -> Dict:
    """Disconnect from robot"""
    result = await robot_controller.disconnect()
    return {"success": True, "message": result.get("message", "Disconnected from robot")}


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


@router.get("/camera/stream")
async def camera_stream():
    """Stream MJPEG video from robot camera"""
    return StreamingResponse(
        camera_streamer.generate_mjpeg_stream(),
        media_type="multipart/x-mixed-replace; boundary=frame",
        headers={
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "Connection": "keep-alive"
        }
    )


@router.get("/camera/snapshot")
async def camera_snapshot():
    """Get a single JPEG frame from the camera"""
    from fastapi.responses import Response
    
    frame = await camera_streamer.get_frame()
    if frame:
        return Response(
            content=frame,
            media_type="image/jpeg",
            headers={
                "Cache-Control": "no-cache, no-store, must-revalidate",
                "Pragma": "no-cache"
            }
        )
    else:
        raise HTTPException(status_code=503, detail="No camera frame available")


@router.get("/camera/status")
async def camera_status():
    """Get camera streaming status (for debugging)"""
    has_frame = await camera_streamer.get_frame() is not None
    return {
        "has_frame": has_frame,
        "has_recent_frame": camera_streamer.has_recent_frame(),
        "frame_count": camera_streamer.frame_count,
        "subscribers": len(camera_streamer.subscribers),
        "message": "Camera streaming active" if has_frame else "No frames received yet"
    }


# === OTA Update Endpoints ===

@router.get("/ota/version")
async def get_ota_version():
    """Get current OTA version"""
    global current_ota_version
    return {
        "version": current_ota_version,
        "timestamp": datetime.now().isoformat()
    }


@router.get("/ota/history")
async def get_ota_history():
    """Get OTA update history"""
    return {
        "current_version": current_ota_version,
        "updates": ota_updates[-10:]  # Last 10 updates
    }


@router.post("/ota/update")
async def apply_ota_update(request: OTAUpdateRequest):
    """Apply an OTA update (simulated)"""
    global current_ota_version, ota_updates
    
    # Validate version format
    if not request.version.startswith("v"):
        raise HTTPException(status_code=400, detail="Version must start with 'v' (e.g., v1.0.1)")
    
    # Create update record
    update_record = {
        "version": request.version,
        "config": request.config,
        "description": request.description or f"Update to {request.version}",
        "uploaded_at": datetime.now().isoformat(),
        "applied_at": None,
        "status": "pending",
        "previous_version": current_ota_version
    }
    
    # Simulate sending to robot (would send to Webots in real implementation)
    try:
        # Send config update command to Webots
        if robot_controller.connected:
            await robot_controller.webots_bridge.send_command({
                "type": "ota_update",
                "version": request.version,
                "config": request.config
            })
        
        # Update status
        update_record["applied_at"] = datetime.now().isoformat()
        update_record["status"] = "success"
        current_ota_version = request.version
        
    except Exception as e:
        update_record["status"] = "failed"
        update_record["error"] = str(e)
        raise HTTPException(status_code=500, detail=f"Failed to apply update: {e}")
    
    # Store update record
    ota_updates.append(update_record)
    
    return {
        "success": True,
        "message": f"Successfully updated to {request.version}",
        "update": update_record
    }


@router.post("/ota/rollback")
async def rollback_ota():
    """Rollback to previous OTA version"""
    global current_ota_version, ota_updates
    
    if not ota_updates:
        raise HTTPException(status_code=400, detail="No previous updates to rollback to")
    
    # Find last successful update with a previous version
    for update in reversed(ota_updates):
        if update.get("status") == "success" and update.get("previous_version"):
            previous_version = update["previous_version"]
            
            # Create rollback record
            rollback_record = {
                "version": previous_version,
                "config": {},
                "description": f"Rollback from {current_ota_version} to {previous_version}",
                "uploaded_at": datetime.now().isoformat(),
                "applied_at": datetime.now().isoformat(),
                "status": "success",
                "previous_version": current_ota_version,
                "is_rollback": True
            }
            
            current_ota_version = previous_version
            ota_updates.append(rollback_record)
            
            return {
                "success": True,
                "message": f"Rolled back to {previous_version}",
                "update": rollback_record
            }
    
    raise HTTPException(status_code=400, detail="No previous version found for rollback")
