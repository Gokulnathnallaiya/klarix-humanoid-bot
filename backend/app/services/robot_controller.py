"""Robot controller service - communicates with Webots simulation"""
import asyncio
import json
from typing import Optional, Dict, List
from enum import Enum


class RobotController:
    """Handles robot control commands and state management"""

    def __init__(self):
        self.connected = False
        self.webots_bridge = None
        self.current_state = {
            "gesture": None,
            "head_position": {"yaw": 0.0, "pitch": 0.0},
            "motor_positions": {},
            "is_moving": False
        }
        self.subscribers: List[asyncio.Queue] = []

    def set_bridge(self, bridge):
        """Set the Webots bridge instance"""
        self.webots_bridge = bridge
        bridge.register_status_callback(self._handle_webots_status)

    async def connect(self):
        """Connect to robot/simulation"""
        self.connected = True
        print("✓ Robot controller ready")

    async def _handle_webots_status(self, status: Dict):
        """Handle status updates from Webots"""
        # Update current state from Webots
        self.current_state.update(status)
        # Notify subscribers
        await self._notify_subscribers()

    async def disconnect(self):
        """Disconnect from robot"""
        self.connected = False
        print("Robot controller disconnected")

    async def send_gesture(self, gesture: str) -> Dict:
        """Send gesture command to robot"""
        if not self.connected or not self.webots_bridge:
            return {"success": False, "error": "Not connected"}

        command = {
            "type": "gesture",
            "gesture": gesture
        }

        success = await self.webots_bridge.send_command(command)
        if success:
            self.current_state["gesture"] = gesture
            await self._notify_subscribers()
            return {"success": True, "command": command}
        else:
            return {"success": False, "error": "Failed to send command to Webots"}

    async def move_head(self, direction: str) -> Dict:
        """Move robot head"""
        if not self.connected or not self.webots_bridge:
            return {"success": False, "error": "Not connected"}

        direction_map = {
            "left": {"yaw": 0.8, "pitch": 0.0},
            "right": {"yaw": -0.8, "pitch": 0.0},
            "up": {"yaw": 0.0, "pitch": -0.3},
            "down": {"yaw": 0.0, "pitch": 0.3},
            "center": {"yaw": 0.0, "pitch": 0.0}
        }

        position = direction_map.get(direction, {"yaw": 0.0, "pitch": 0.0})
        command = {
            "type": "head_move",
            "direction": direction,
            "position": position
        }

        success = await self.webots_bridge.send_command(command)
        if success:
            self.current_state["head_position"] = position
            await self._notify_subscribers()
            return {"success": True, "command": command}
        else:
            return {"success": False, "error": "Failed to send command to Webots"}

    async def walk(self, movement: str, duration: float = 2.0) -> Dict:
        """Execute walking movement"""
        if not self.connected or not self.webots_bridge:
            return {"success": False, "error": "Not connected"}

        command = {
            "type": "walk",
            "movement": movement,
            "duration": duration
        }

        success = await self.webots_bridge.send_command(command)
        if success:
            self.current_state["is_moving"] = True
            await self._notify_subscribers()
            return {"success": True, "command": command}
        else:
            return {"success": False, "error": "Failed to send command to Webots"}

    async def set_motor_position(self, motor_name: str, position: float) -> Dict:
        """Set individual motor position"""
        if not self.connected:
            return {"success": False, "error": "Not connected"}

        command = {
            "type": "motor_control",
            "motor": motor_name,
            "position": position
        }

        await self.command_queue.put(command)
        self.current_state["motor_positions"][motor_name] = position
        await self._notify_subscribers()

        return {"success": True, "command": command}

    async def set_multiple_motors(self, motors: Dict[str, float]) -> Dict:
        """Set multiple motor positions"""
        if not self.connected:
            return {"success": False, "error": "Not connected"}

        command = {
            "type": "batch_motor_control",
            "motors": motors
        }

        await self.command_queue.put(command)
        self.current_state["motor_positions"].update(motors)
        await self._notify_subscribers()

        return {"success": True, "command": command}

    async def get_status(self) -> Dict:
        """Get current robot status"""
        return {
            "connected": self.connected,
            "current_gesture": self.current_state.get("gesture"),
            "head_position": self.current_state.get("head_position"),
            "is_moving": self.current_state.get("is_moving"),
            "motor_positions": self.current_state.get("motor_positions")
        }

    async def subscribe(self) -> asyncio.Queue:
        """Subscribe to robot state updates"""
        queue = asyncio.Queue()
        self.subscribers.append(queue)
        return queue

    async def unsubscribe(self, queue: asyncio.Queue):
        """Unsubscribe from robot state updates"""
        if queue in self.subscribers:
            self.subscribers.remove(queue)

    async def _notify_subscribers(self):
        """Notify all subscribers of state change"""
        status = await self.get_status()
        for queue in self.subscribers:
            await queue.put(status)


# Global robot controller instance
robot_controller = RobotController()
