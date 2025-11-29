"""Robot controller service - communicates with Webots simulation"""
import asyncio
import json
from typing import Optional, Dict, List
from enum import Enum


class RobotController:
    """Handles robot control commands and state management"""

    def __init__(self):
        self.webots_bridge = None
        self.current_state = {
            "gesture": None,
            "head_position": {"yaw": 0.0, "pitch": 0.0},
            "motor_positions": {},
            "is_moving": False,
            "battery": 100.0,  # Will be updated from Webots
            "temperature": 32.0,  # Will be updated from Webots
            "command_count": 0
        }
        self.subscribers: List[asyncio.Queue] = []

    @property
    def connected(self) -> bool:
        """Connection state reflects actual Webots bridge connection"""
        if self.webots_bridge:
            return self.webots_bridge.connected
        return False

    def set_bridge(self, bridge):
        """Set the Webots bridge instance"""
        self.webots_bridge = bridge
        bridge.register_status_callback(self._handle_webots_status)

    async def connect(self):
        """Check connection to robot/simulation (Webots connects automatically)"""
        if self.connected:
            print("✓ Robot controller ready")
            return {"success": True, "message": "Connected to Webots"}
        else:
            print("⚠ Webots not connected - start Webots simulation and press Play")
            return {"success": False, "message": "Webots not connected. Start Webots and press Play."}

    async def _handle_webots_status(self, status: Dict):
        """Handle status updates from Webots"""
        # Update current state from Webots
        self.current_state.update(status)
        # Notify subscribers
        await self._notify_subscribers()

    async def disconnect(self):
        """Disconnect from robot (note: Webots manages its own connection)"""
        print("Robot controller: disconnect requested")
        return {"success": True, "message": "Disconnect requested"}

    async def stop(self) -> Dict:
        """Emergency stop - halt all robot movement"""
        if not self.connected or not self.webots_bridge:
            return {"success": False, "error": "Not connected"}

        command = {
            "type": "stop",
            "immediate": True
        }

        success = await self.webots_bridge.send_command(command)
        if success:
            self.current_state["is_moving"] = False
            self.current_state["gesture"] = None
            await self._notify_subscribers()
            print("🛑 Emergency STOP sent to robot")
            return {"success": True, "message": "Robot stopped"}
        else:
            return {"success": False, "error": "Failed to send stop command"}

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
        """Get current robot status - uses real values from Webots simulation"""
        # Import here to avoid circular dependency
        from .vision_service import vision_service

        # Battery and temperature come directly from Webots simulation
        battery = self.current_state.get("battery", 100.0)
        temperature = self.current_state.get("temperature", 32.0)
        command_count = self.current_state.get("command_count", 0)

        status = {
            "connected": self.connected,
            "battery": round(battery, 1),
            "temperature": round(temperature, 1),
            "cycle_count": command_count,
            "current_gesture": self.current_state.get("gesture") or self.current_state.get("current_gesture"),
            "head_position": self.current_state.get("head_position"),
            "is_moving": self.current_state.get("is_moving"),
            "motor_positions": self.current_state.get("motor_positions"),
            "joints": self.current_state.get("joints", {}),  # Joint angles from Webots
            "imu": self.current_state.get("imu", {
                "accelerometer": {"x": 0, "y": 0, "z": 0},
                "gyroscope": {"x": 0, "y": 0, "z": 0}
            }),
            "lidar": self.current_state.get("lidar", {
                "ranges": [],
                "min_range": 0.1,
                "max_range": 5.0,
                "num_points": 0
            }),
            "depth_camera": self.current_state.get("depth_camera", {
                "width": 640,
                "height": 480,
                "min_range": 0.15,
                "max_range": 10.0,
                "depth_data": []
            }),
            "odometry": self.current_state.get("odometry", {
                "x": 0.0,
                "y": 0.0,
                "theta": 0.0,
                "linear_velocity": 0.0,
                "angular_velocity": 0.0
            })
        }

        # Add vision analysis if available
        if vision_service.is_enabled():
            latest_analysis = await vision_service.get_latest_analysis()
            if latest_analysis:
                status["vision"] = latest_analysis

        return status

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
