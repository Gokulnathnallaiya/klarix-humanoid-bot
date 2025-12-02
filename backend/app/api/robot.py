"""Robot control API endpoints"""
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from typing import Dict, List, Optional
from pydantic import BaseModel
from datetime import datetime
import json
import os
import asyncio

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
from app.services.vision_service import vision_service

# Import OpenAI for AI Assistant
try:
    from openai import AzureOpenAI
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

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


@router.post("/stop")
async def emergency_stop() -> Dict:
    """Emergency stop - halt all robot movement immediately"""
    result = await robot_controller.stop()
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


# === AI Assistant Endpoint ===

class AIAssistantRequest(BaseModel):
    """Request model for AI assistant"""
    message: str
    robot_status: Optional[Dict] = None


class AIAssistantResponse(BaseModel):
    """Response model for AI assistant"""
    response: str
    command: Optional[Dict] = None
    executed: bool = False
    success: bool = False


# Initialize Azure OpenAI client for AI assistant
ai_client = None
if OPENAI_AVAILABLE:
    api_key = os.getenv("AZURE_OPENAI_API_KEY", "")
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT", "")
    if api_key and endpoint:
        try:
            ai_client = AzureOpenAI(
                api_key=api_key,
                api_version="2024-02-15-preview",
                azure_endpoint=endpoint
            )
            print("✓ AI Assistant initialized with Azure OpenAI")
        except Exception as e:
            print(f"⚠ Failed to initialize AI Assistant: {e}")


# System prompt for the AI assistant - supports sequential commands
AI_SYSTEM_PROMPT = """You are Klarix AI, an intelligent assistant for controlling a humanoid robot. Your job is to understand natural language commands and convert them into robot actions.

## Available Robot Commands:
1. **Gestures**: wave, point, stand
2. **Walking**: forward, backward, turn_left, turn_right
3. **Head Movement**: up, down, left, right, center

## Response Format:
You MUST respond with valid JSON in this exact format. Use "commands" (array) for SEQUENTIAL actions:
{
    "response": "Your friendly response to the user",
    "commands": [
        {"type": "gesture|walk|head|status|none", "action": "the specific action", "params": {}}
    ]
}

## Command Mappings:
- "wave", "hello", "greet", "say hi" → {"type": "gesture", "action": "wave"}
- "point", "show", "indicate" → {"type": "gesture", "action": "point"}
- "stand", "stand up", "get up" → {"type": "gesture", "action": "stand"}
- "walk forward", "go ahead", "move forward" → {"type": "walk", "action": "forward", "params": {"duration": 2}}
- "walk back", "go back", "reverse" → {"type": "walk", "action": "backward", "params": {"duration": 2}}
- "turn left", "rotate left" → {"type": "walk", "action": "turn_left", "params": {"duration": 2}}
- "turn right", "rotate right" → {"type": "walk", "action": "turn_right", "params": {"duration": 2}}
- "look up", "head up" → {"type": "head", "action": "up"}
- "look down", "head down" → {"type": "head", "action": "down"}
- "look left", "head left" → {"type": "head", "action": "left"}
- "look right", "head right" → {"type": "head", "action": "right"}
- "look center", "look straight" → {"type": "head", "action": "center"}
- status queries → {"type": "status", "action": "query"}
- general chat/unknown → {"type": "none", "action": "none"}

## IMPORTANT: Sequential Commands
When the user asks for MULTIPLE actions (e.g., "wave then walk", "do X and then Y", "first A, then B"), return ALL commands in the "commands" array in ORDER. They will be executed sequentially.

## Examples:

User: "Hey robot, can you wave at me?"
Response: {"response": "Sure! I'll wave at you now! 👋", "commands": [{"type": "gesture", "action": "wave"}]}

User: "Walk forward 3 steps"
Response: {"response": "Moving forward now! 🚶", "commands": [{"type": "walk", "action": "forward", "params": {"duration": 3}}]}

User: "Wave at me and then walk forward"
Response: {"response": "Sure! I'll wave at you first and then walk forward! 👋🚶", "commands": [{"type": "gesture", "action": "wave"}, {"type": "walk", "action": "forward", "params": {"duration": 2}}]}

User: "Turn around, wave, then look up"
Response: {"response": "Got it! I'll turn around, wave at you, and then look up! 🔄👋⬆️", "commands": [{"type": "walk", "action": "turn_left", "params": {"duration": 4}}, {"type": "gesture", "action": "wave"}, {"type": "head", "action": "up"}]}

User: "Do a little dance"
Response: {"response": "Let me show you my dance moves! 💃�", "commands": [{"type": "gesture", "action": "wave"}, {"type": "walk", "action": "turn_left", "params": {"duration": 1}}, {"type": "walk", "action": "turn_right", "params": {"duration": 2}}, {"type": "walk", "action": "turn_left", "params": {"duration": 1}}, {"type": "gesture", "action": "wave"}]}

User: "What's your battery level?"
Response: {"response": "Let me check my status for you! 🔋", "commands": [{"type": "status", "action": "query"}]}

User: "How are you today?"
Response: {"response": "I'm doing great, thanks for asking! I'm ready to help you with any robot commands. What would you like me to do?", "commands": [{"type": "none", "action": "none"}]}

Be friendly, helpful, and use emojis occasionally. Always return valid JSON with "commands" as an array."""

# Redefine with voice-first approach, STOP command, and VISION
AI_SYSTEM_PROMPT = """You are Klarix, a friendly humanoid robot with vision capabilities. You respond to voice commands naturally. Speak in first person - you ARE the robot.

## Capabilities:
- Gestures: wave, point, stand
- Walking: forward, backward, turn_left, turn_right
- Head: look up, down, left, right, center
- STOP: Halt all movement immediately (HIGHEST PRIORITY!)
- VISION: See and describe what's in front of you using your camera

## JSON Response Format:
{"response": "SHORT spoken reply (max 15 words)", "commands": [{"type": "...", "action": "...", "params": {}}]}

## Command Types:
- STOP/halt/freeze/wait → {"type": "stop", "action": "stop"} [PRIORITY!]
- what can you see/describe/what do you see/look at/tell me what you see → {"type": "vision", "action": "analyze"}
- wave/hello/hi → {"type": "gesture", "action": "wave"}
- point → {"type": "gesture", "action": "point"}
- stand/reset → {"type": "gesture", "action": "stand"}
- forward/go/walk/come → {"type": "walk", "action": "forward", "params": {"duration": 2}}
- back/backward → {"type": "walk", "action": "backward", "params": {"duration": 2}}
- turn left → {"type": "walk", "action": "turn_left", "params": {"duration": 2}}
- turn right → {"type": "walk", "action": "turn_right", "params": {"duration": 2}}
- look up/down/left/right/center → {"type": "head", "action": "..."}
- status/battery → {"type": "status", "action": "query"}
- chat only → {"type": "none", "action": "none"}

## Rules:
1. STOP = highest priority, respond immediately
2. Keep responses SHORT (voice!) - 10-15 words max
3. Multiple actions go in commands array sequentially
4. When user asks about vision/seeing, use {"type": "vision", "action": "analyze"}
5. Be friendly and natural

Examples:
"Stop!" → {"response": "Stopping!", "commands": [{"type": "stop", "action": "stop"}]}
"What can you see?" → {"response": "Let me look!", "commands": [{"type": "vision", "action": "analyze"}]}
"Wave" → {"response": "Waving at you!", "commands": [{"type": "gesture", "action": "wave"}]}
"Walk forward" → {"response": "Moving forward!", "commands": [{"type": "walk", "action": "forward", "params": {"duration": 2}}]}"""


@router.post("/ai/chat")
async def ai_chat(request: AIAssistantRequest) -> Dict:
    """
    AI-powered natural language interface for robot control.
    Uses Azure OpenAI to understand commands and execute them sequentially.
    """
    if not ai_client:
        return {
            "response": "AI Assistant is not configured. Please set AZURE_OPENAI_API_KEY and AZURE_OPENAI_ENDPOINT.",
            "commands": [],
            "executed": [],
            "success": False
        }
    
    try:
        # Add robot status context if provided
        status_context = ""
        if request.robot_status:
            status_context = f"\n\nCurrent robot status: Battery: {request.robot_status.get('battery', 'N/A')}%, Temperature: {request.robot_status.get('temperature', 'N/A')}°C, Moving: {request.robot_status.get('is_moving', False)}"
        
        # Call Azure OpenAI
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME", "gpt-4o")
        
        loop = asyncio.get_event_loop()
        completion = await loop.run_in_executor(
            None,
            lambda: ai_client.chat.completions.create(
                model=deployment,
                messages=[
                    {"role": "system", "content": AI_SYSTEM_PROMPT + status_context},
                    {"role": "user", "content": request.message}
                ],
                max_tokens=500,
                temperature=0.7,
                response_format={"type": "json_object"}
            )
        )
        
        # Parse response
        ai_response_text = completion.choices[0].message.content
        
        try:
            ai_response = json.loads(ai_response_text)
        except json.JSONDecodeError:
            # Fallback if JSON parsing fails
            return {
                "response": ai_response_text,
                "commands": [],
                "executed": [],
                "success": True
            }
        
        response_text = ai_response.get("response", "I understood your request.")
        
        # Handle both old single "command" and new "commands" array format
        commands = ai_response.get("commands", [])
        if not commands and ai_response.get("command"):
            commands = [ai_response.get("command")]
        
        executed_commands = []
        
        # Execute commands sequentially
        for i, command in enumerate(commands):
            if command and command.get("type") not in ["none", "status", None]:
                try:
                    cmd_type = command.get("type")
                    action = command.get("action")
                    params = command.get("params", {})
                    
                    exec_result = {"command": command, "success": False, "index": i}
                    
                    # STOP command - highest priority
                    if cmd_type == "stop":
                        result = await robot_controller.stop()
                        exec_result["success"] = result.get("success", False)
                        print(f"🛑 STOP command executed - Success: {exec_result['success']}")
                    
                    elif cmd_type == "gesture" and action:
                        result = await robot_controller.send_gesture(action)
                        exec_result["success"] = result.get("success", False)
                        print(f"🤖 Executed gesture: {action} - Success: {exec_result['success']}")
                        
                    elif cmd_type == "walk" and action:
                        duration = params.get("duration", 2)
                        result = await robot_controller.walk(action, duration)
                        exec_result["success"] = result.get("success", False)
                        print(f"🚶 Executed walk: {action} for {duration}s - Success: {exec_result['success']}")
                        
                    elif cmd_type == "head" and action:
                        result = await robot_controller.move_head(action)
                        exec_result["success"] = result.get("success", False)
                        print(f"👀 Executed head movement: {action} - Success: {exec_result['success']}")

                    # VISION command - analyze what the robot sees
                    elif cmd_type == "vision" and action == "analyze":
                        if vision_service.is_enabled():
                            # Get current camera frame
                            frame = await camera_streamer.get_frame_base64()
                            if frame:
                                # Analyze the scene
                                vision_result = await vision_service.query_scene(frame, request.message)
                                if vision_result and vision_result.get("success"):
                                    # Update response with vision analysis
                                    response_text = vision_result.get("analysis", "I looked but couldn't process what I saw.")
                                    exec_result["success"] = True
                                    exec_result["vision_data"] = vision_result
                                    print(f"👁️ Vision analysis complete: {response_text[:100]}...")
                                else:
                                    response_text = "I tried to look but had trouble analyzing the scene."
                                    exec_result["success"] = False
                            else:
                                response_text = "I don't have a camera feed available right now."
                                exec_result["success"] = False
                        else:
                            response_text = "My vision system is not available at the moment."
                            exec_result["success"] = False
                        print(f"👁️ Vision command - Success: {exec_result['success']}")

                    executed_commands.append(exec_result)
                    
                    # Add a small delay between sequential commands
                    if i < len(commands) - 1:
                        await asyncio.sleep(0.5)
                        
                except Exception as e:
                    print(f"Error executing command {i}: {e}")
                    executed_commands.append({"command": command, "success": False, "error": str(e), "index": i})
            
            # Handle status query
            elif command and command.get("type") == "status":
                status = await robot_controller.get_status()
                response_text = f"""Here's my current status:
🔋 Battery: {status.get('battery', 0):.0f}%
🌡️ Temperature: {status.get('temperature', 0):.0f}°C
📍 Position: ({status.get('odometry', {}).get('x', 0):.2f}, {status.get('odometry', {}).get('y', 0):.2f})
🎯 Heading: {(status.get('odometry', {}).get('theta', 0) * 180 / 3.14159):.0f}°
⚡ Status: {'Moving' if status.get('is_moving') else 'Idle'}
📊 Commands executed: {status.get('cycle_count', 0)}"""
                executed_commands.append({"command": command, "success": True, "index": i})
        
        # Add execution summary to response
        if executed_commands:
            success_count = sum(1 for e in executed_commands if e.get("success"))
            total_count = len(executed_commands)
            if success_count < total_count:
                response_text += f" (Executed {success_count}/{total_count} commands)"
            print(f"✅ Sequential execution complete: {success_count}/{total_count} commands succeeded")
        
        return {
            "response": response_text,
            "commands": commands,
            "executed": executed_commands,
            "success": True
        }
        
    except Exception as e:
        print(f"AI Chat error: {e}")
        return {
            "response": f"Sorry, I encountered an error: {str(e)}",
            "command": None,
            "executed": False,
            "success": False
        }
