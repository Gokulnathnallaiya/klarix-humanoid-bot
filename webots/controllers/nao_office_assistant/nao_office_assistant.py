"""NAO Robot Web Control - Receives commands from backend API"""
from controller import Robot, Motion
import sys
import time
import base64
import math
import io
from backend_client import BackendClient

# Check PIL availability
PIL_AVAILABLE = False
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    pass


class NAOController:
    """Clean NAO robot controller with camera, IMU, and motion control"""

    def __init__(self):
        self.robot = Robot()
        self.timestep = int(self.robot.getBasicTimeStep())

        # Device references
        self.motors = {}
        self.camera = None
        self.display = None
        self.inertial_unit = None
        self.accelerometer = None
        self.gyro = None
        self.lidar = None
        self.depth_camera = None

        # Motion references
        self.forward_motion = None
        self.backward_motion = None
        self.turn_left_motion = None
        self.turn_right_motion = None

        # State
        self.current_state = {
            "connected": True,
            "is_moving": False,
            "current_gesture": None,
            "imu": {
                "accelerometer": {"x": 0.0, "y": 0.0, "z": 0.0},
                "gyroscope": {"x": 0.0, "y": 0.0, "z": 0.0}
            },
            "lidar": {
                "ranges": [],
                "min_range": 0.1,
                "max_range": 5.0,
                "num_points": 360
            },
            "depth_camera": {
                "width": 640,
                "height": 480,
                "min_range": 0.15,
                "max_range": 10.0,
                "depth_data": []
            },
            "odometry": {
                "x": 0.0,
                "y": 0.0,
                "theta": 0.0,
                "linear_velocity": 0.0,
                "angular_velocity": 0.0
            }
        }

        # Backend
        self.backend = None

        # Counters
        self.status_counter = 0
        self.camera_counter = 0
        
        # Joint position sensors
        self.position_sensors = {}
        
        # Motor limits for kinematics display
        self.motor_limits = {}

    def initialize(self):
        """Initialize all robot devices"""
        print("=" * 70)
        print("       NAO WEB-CONTROLLED ROBOT")
        print("=" * 70)

        self._init_motors()
        self._init_camera()
        self._init_imu()
        self._init_lidar()
        self._init_depth_camera()
        self._init_motions()

    def _init_motors(self):
        """Initialize all motors and position sensors"""
        motor_names = [
            'HeadYaw', 'HeadPitch',
            'LShoulderPitch', 'LShoulderRoll', 'LElbowYaw', 'LElbowRoll', 'LWristYaw',
            'RShoulderPitch', 'RShoulderRoll', 'RElbowYaw', 'RElbowRoll', 'RWristYaw',
            'LHipYawPitch', 'LHipRoll', 'LHipPitch', 'LKneePitch', 'LAnklePitch', 'LAnkleRoll',
            'RHipYawPitch', 'RHipRoll', 'RHipPitch', 'RKneePitch', 'RAnklePitch', 'RAnkleRoll'
        ]

        for name in motor_names:
            motor = self.robot.getDevice(name)
            if motor:
                self.motors[name] = motor
                # Store motor limits
                self.motor_limits[name] = {
                    'min': motor.getMinPosition(),
                    'max': motor.getMaxPosition()
                }
                # Enable position sensor for this motor
                sensor_name = name + 'S'
                sensor = self.robot.getDevice(sensor_name)
                if sensor:
                    sensor.enable(self.timestep)
                    self.position_sensors[name] = sensor

        print(f"✓ Initialized {len(self.motors)} motors")
        print(f"✓ Initialized {len(self.position_sensors)} position sensors")

    def _init_camera(self):
        """Initialize camera and display"""
        self.camera = self.robot.getDevice('CameraTop')
        self.display = self.robot.getDevice('camera_display')

        if PIL_AVAILABLE:
            print("✓ PIL/Pillow available for camera streaming")
        else:
            print("⚠ PIL/Pillow not available - camera streaming disabled")
            print("  Install with: pip install pillow")

        if self.camera:
            self.camera.enable(self.timestep)
            print(f"✓ Camera enabled ({self.camera.getWidth()}x{self.camera.getHeight()})")
        else:
            print("✗ Camera not found")

        if self.display:
            print("✓ Display found")
        else:
            print("✗ Display not found")

    def _init_imu(self):
        """Initialize IMU sensors (InertialUnit or separate accel/gyro)"""
        # Try InertialUnit first (standard for NAO)
        self.inertial_unit = self.robot.getDevice('inertial unit')

        if self.inertial_unit:
            self.inertial_unit.enable(self.timestep)
            print("✓ InertialUnit enabled")
        else:
            # Fallback to separate sensors
            print("⚠ InertialUnit not found, trying separate sensors...")

            self.accelerometer = self.robot.getDevice('accelerometer')
            if self.accelerometer:
                self.accelerometer.enable(self.timestep)
                print("✓ Accelerometer enabled")
            else:
                print("✗ Accelerometer not found")

            self.gyro = self.robot.getDevice('gyro')
            if self.gyro:
                self.gyro.enable(self.timestep)
                print("✓ Gyroscope enabled")
            else:
                print("✗ Gyroscope not found")

    def _init_lidar(self):
        """Initialize LIDAR sensor"""
        self.lidar = self.robot.getDevice('lidar')

        if self.lidar:
            self.lidar.enable(self.timestep)
            self.lidar.enablePointCloud()
            print(f"✓ LIDAR enabled (360° @ {self.lidar.getHorizontalResolution()} points)")
        else:
            print("✗ LIDAR not found")

    def _init_depth_camera(self):
        """Initialize RealSense depth camera (RangeFinder)"""
        self.depth_camera = self.robot.getDevice('realsense_depth')

        if self.depth_camera:
            self.depth_camera.enable(self.timestep)
            width = self.depth_camera.getWidth()
            height = self.depth_camera.getHeight()
            fov = self.depth_camera.getFov()
            print(f"✓ RealSense depth camera enabled ({width}x{height}, FOV: {fov:.2f} rad)")
        else:
            print("✗ RealSense depth camera not found")

    def _init_motions(self):
        """Load motion files"""
        print("Loading motion files...")
        
        # Try multiple possible motion file paths (macOS, Linux, Windows)
        motion_paths = [
            "/Applications/Webots.app/Contents/projects/robots/softbank/nao/motions/",  # macOS
            "/usr/local/webots/projects/robots/softbank/nao/motions/",  # Linux
            "C:/Program Files/Webots/projects/robots/softbank/nao/motions/",  # Windows
        ]
        
        motion_path = None
        for path in motion_paths:
            try:
                import os
                if os.path.exists(path + "Forwards.motion"):
                    motion_path = path
                    print(f"✓ Found motion files at: {path}")
                    break
            except:
                continue
        
        if not motion_path:
            print("⚠ Motion files not found - walking will use fallback mode")
            return

        try:
            self.forward_motion = Motion(motion_path + "Forwards.motion")
            self.backward_motion = Motion(motion_path + "Backwards.motion")
            self.turn_left_motion = Motion(motion_path + "TurnLeft60.motion")
            self.turn_right_motion = Motion(motion_path + "TurnRight60.motion")
            print("✓ Motion files loaded")
        except Exception as e:
            print(f"✗ Failed to load motion files: {e}")

    # === Gesture Functions ===

    def standing_pose(self):
        """Set stable standing position"""
        positions = {
            'LShoulderPitch': 1.57, 'RShoulderPitch': 1.57,
            'LShoulderRoll': 0.2, 'RShoulderRoll': -0.2,
            'LElbowRoll': -0.5, 'RElbowRoll': 0.5,
            'HeadYaw': 0.0, 'HeadPitch': 0.0
        }
        for motor_name, position in positions.items():
            if motor_name in self.motors:
                self.motors[motor_name].setPosition(position)

    def wave_gesture(self):
        """Wave right hand"""
        movements = {
            'RShoulderPitch': (3.0, 0.0),
            'RShoulderRoll': (3.0, -0.3),
            'RElbowRoll': (3.0, 1.5),
            'RElbowYaw': (3.0, 1.2)
        }
        for motor_name, (velocity, position) in movements.items():
            if motor_name in self.motors:
                self.motors[motor_name].setVelocity(velocity)
                self.motors[motor_name].setPosition(position)

    def point_gesture(self):
        """Point forward with right arm"""
        movements = {
            'RShoulderPitch': (3.0, 0.5),
            'RShoulderRoll': (3.0, -0.2),
            'RElbowRoll': (3.0, 0.0),
            'RElbowYaw': (3.0, 1.2)
        }
        for motor_name, (velocity, position) in movements.items():
            if motor_name in self.motors:
                self.motors[motor_name].setVelocity(velocity)
                self.motors[motor_name].setPosition(position)

    def move_head(self, direction):
        """Move head in specified direction"""
        # Set velocity for head motors
        for motor_name in ['HeadYaw', 'HeadPitch']:
            if motor_name in self.motors:
                self.motors[motor_name].setVelocity(2.0)

        # Set positions based on direction
        positions = {
            'left': {'HeadYaw': 0.8},
            'right': {'HeadYaw': -0.8},
            'up': {'HeadPitch': -0.3},
            'down': {'HeadPitch': 0.3},
            'center': {'HeadYaw': 0.0, 'HeadPitch': 0.0}
        }

        if direction in positions:
            for motor_name, position in positions[direction].items():
                if motor_name in self.motors:
                    self.motors[motor_name].setPosition(position)

    # === Sensor Reading Functions ===

    def read_imu_data(self):
        """Read IMU sensor data and update state"""
        try:
            if self.inertial_unit:
                # Use InertialUnit (provides orientation)
                roll_pitch_yaw = self.inertial_unit.getRollPitchYaw()
                if roll_pitch_yaw and len(roll_pitch_yaw) >= 3:
                    # Store orientation as gyroscope data
                    self.current_state["imu"]["gyroscope"] = {
                        "x": round(float(roll_pitch_yaw[0]), 3),
                        "y": round(float(roll_pitch_yaw[1]), 3),
                        "z": round(float(roll_pitch_yaw[2]), 3)
                    }
                    # Calculate gravity components from orientation
                    g = 9.81
                    self.current_state["imu"]["accelerometer"] = {
                        "x": round(-g * math.sin(roll_pitch_yaw[1]), 3),
                        "y": round(g * math.sin(roll_pitch_yaw[0]), 3),
                        "z": round(g * math.cos(roll_pitch_yaw[0]) * math.cos(roll_pitch_yaw[1]), 3)
                    }
            else:
                # Use separate sensors
                if self.accelerometer:
                    accel_values = self.accelerometer.getValues()
                    if accel_values and len(accel_values) >= 3:
                        self.current_state["imu"]["accelerometer"] = {
                            "x": round(float(accel_values[0]), 3),
                            "y": round(float(accel_values[1]), 3),
                            "z": round(float(accel_values[2]), 3)
                        }

                if self.gyro:
                    gyro_values = self.gyro.getValues()
                    if gyro_values and len(gyro_values) >= 3:
                        self.current_state["imu"]["gyroscope"] = {
                            "x": round(float(gyro_values[0]), 3),
                            "y": round(float(gyro_values[1]), 3),
                            "z": round(float(gyro_values[2]), 3)
                        }
        except Exception as e:
            print(f"⚠ Error reading IMU: {e}")

    def read_joint_angles(self):
        """Read all joint position sensors and return angles in degrees"""
        joint_angles = {}
        for name, sensor in self.position_sensors.items():
            try:
                value = sensor.getValue()
                if value != float('inf') and value != float('-inf'):
                    # Convert to degrees for display
                    joint_angles[name] = round(math.degrees(value), 1)
            except:
                pass
        return joint_angles

    def read_lidar_data(self):
        """Read LIDAR sensor data and update state"""
        if not self.lidar:
            return

        try:
            range_image = self.lidar.getRangeImage()
            if range_image and len(range_image) > 0:
                # Store LIDAR ranges (convert to list for JSON serialization)
                self.current_state["lidar"]["ranges"] = [
                    round(float(r), 3) if r != float('inf') else self.current_state["lidar"]["max_range"]
                    for r in range_image
                ]
                self.current_state["lidar"]["num_points"] = len(range_image)
        except Exception as e:
            print(f"⚠ Error reading LIDAR: {e}")

    def read_depth_data(self):
        """Read depth camera data and update state"""
        if not self.depth_camera:
            return

        try:
            range_image = self.depth_camera.getRangeImage()
            if range_image and len(range_image) > 0:
                # Downsample depth data for transmission (every 8th pixel for 80x60 resolution)
                step = 8
                width = self.depth_camera.getWidth()
                height = self.depth_camera.getHeight()
                downsampled = []

                for y in range(0, height, step):
                    for x in range(0, width, step):
                        idx = y * width + x
                        if idx < len(range_image):
                            depth = range_image[idx]
                            # Convert inf to max_range
                            if depth == float('inf'):
                                depth = self.current_state["depth_camera"]["max_range"]
                            downsampled.append(round(float(depth), 3))

                self.current_state["depth_camera"]["depth_data"] = downsampled
        except Exception as e:
            print(f"⚠ Error reading depth camera: {e}")

    def capture_and_send_camera_frame(self):
        """Capture camera frame and send to backend"""
        if not self.camera:
            return False
            
        if not PIL_AVAILABLE:
            return False
            
        if not self.backend or not self.backend.is_connected():
            return False

        try:
            camera_image = self.camera.getImage()
            if not camera_image:
                return False

            # Display in Webots
            if self.display:
                self.display.imagePaste(camera_image, 0, 0)

            # Encode and send to backend
            width = self.camera.getWidth()
            height = self.camera.getHeight()

            # Convert BGRA to RGB and encode as JPEG
            img = Image.frombytes('RGBA', (width, height), camera_image, 'raw', 'BGRA')
            img_rgb = img.convert('RGB')
            
            # Resize to reduce bandwidth (optional - 320x240)
            img_rgb = img_rgb.resize((320, 240), Image.Resampling.LANCZOS)
            
            buffer = io.BytesIO()
            img_rgb.save(buffer, format='JPEG', quality=70)  # Lower quality for faster streaming
            jpeg_data = buffer.getvalue()
            buffer.close()

            # Send to backend (non-blocking)
            frame_b64 = base64.b64encode(jpeg_data).decode('utf-8')
            return self.backend.send_status({
                "type": "camera_frame",
                "frame": frame_b64
            })
        except Exception as e:
            print(f"⚠ Error processing camera frame: {e}")
            return False

    # === Command Handler ===

    def handle_command(self, command):
        """Handle command from backend"""
        print(f"📥 Command received: {command}")

        cmd_type = command.get("type")

        if cmd_type == "gesture":
            gesture = command.get("gesture")
            if gesture == "wave":
                self.wave_gesture()
                self.current_state["current_gesture"] = "wave"
            elif gesture == "point":
                self.point_gesture()
                self.current_state["current_gesture"] = "point"
            elif gesture == "stand":
                self.standing_pose()
                self.current_state["current_gesture"] = "stand"

        elif cmd_type == "head_move":
            direction = command.get("direction")
            self.move_head(direction)

        elif cmd_type == "walk":
            self.execute_walking_motion(command.get("movement"))

    def update_odometry(self, movement):
        """Update odometry based on movement"""
        import math

        # Approximate movement distances (calibrated for NAO)
        forward_distance = 0.04  # ~4cm per forward step
        turn_angle = 1.047  # ~60 degrees in radians (TurnLeft60/TurnRight60)

        theta = self.current_state["odometry"]["theta"]
        x = self.current_state["odometry"]["x"]
        y = self.current_state["odometry"]["y"]

        if movement == "forward":
            # Move forward in current heading
            x += forward_distance * math.cos(theta)
            y += forward_distance * math.sin(theta)
            self.current_state["odometry"]["linear_velocity"] = forward_distance

        elif movement == "backward":
            # Move backward in current heading
            x -= forward_distance * math.cos(theta)
            y -= forward_distance * math.sin(theta)
            self.current_state["odometry"]["linear_velocity"] = -forward_distance

        elif movement == "turn_left":
            # Rotate left (counterclockwise)
            theta += turn_angle
            # Normalize angle to [-pi, pi]
            theta = math.atan2(math.sin(theta), math.cos(theta))
            self.current_state["odometry"]["angular_velocity"] = turn_angle

        elif movement == "turn_right":
            # Rotate right (clockwise)
            theta -= turn_angle
            # Normalize angle to [-pi, pi]
            theta = math.atan2(math.sin(theta), math.cos(theta))
            self.current_state["odometry"]["angular_velocity"] = -turn_angle

        # Update state
        self.current_state["odometry"]["x"] = round(x, 3)
        self.current_state["odometry"]["y"] = round(y, 3)
        self.current_state["odometry"]["theta"] = round(theta, 3)

    def execute_walking_motion(self, movement):
        """Execute walking motion"""
        print(f"🚶 Walking: {movement}")
        self.current_state["is_moving"] = True

        motion_map = {
            "forward": self.forward_motion,
            "backward": self.backward_motion,
            "turn_left": self.turn_left_motion,
            "turn_right": self.turn_right_motion
        }

        motion = motion_map.get(movement)
        if motion:
            motion.play()
            while not motion.isOver():
                self.robot.step(self.timestep)
        else:
            # Fallback
            self.robot.step(self.timestep * 20)

        # Update odometry after motion completes
        self.update_odometry(movement)

        self.current_state["is_moving"] = False
        print(f"✓ Finished: {movement}")

    # === Main Loop ===

    def run(self):
        """Main control loop"""
        self.backend = BackendClient()
        print("\n🔌 Connecting to backend...")

        if not self.backend.connect():
            print("\n⚠ Running in standalone mode (no backend connection)")
            print("  To enable web control, start the backend:")
            print("  cd backend && python -m app.main\n")
            self._run_standalone()
            return

        self.backend.start_listening(self.handle_command)
        print("✓ Ready to receive commands from web interface!\n")

        # Set initial pose
        self.standing_pose()

        # Track reconnection attempts
        reconnect_cooldown = 0

        # Main loop
        try:
            while self.robot.step(self.timestep) != -1:
                # Check if backend is still connected
                if not self.backend.is_connected():
                    # Try to reconnect with cooldown
                    if reconnect_cooldown <= 0:
                        print("🔄 Attempting to reconnect to backend...")
                        self.backend.disconnect()  # Clean up old connection
                        self.backend = BackendClient()
                        if self.backend.connect(max_retries=2, retry_delay=1):
                            self.backend.start_listening(self.handle_command)
                            print("✓ Reconnected to backend!\n")
                            reconnect_cooldown = 0
                        else:
                            print("⚠ Backend not available, will retry in 5 seconds...")
                            reconnect_cooldown = 5 * 1000 // self.timestep  # 5 seconds worth of steps
                    else:
                        reconnect_cooldown -= 1
                    
                    # Continue running even without backend (camera display, etc)
                    if self.camera and self.display:
                        camera_image = self.camera.getImage()
                        if camera_image:
                            self.display.imagePaste(camera_image, 0, 0)
                    continue
                
                # Reset reconnect cooldown when connected
                reconnect_cooldown = 0
                
                # Process camera every 5 steps (~10 FPS for smoother video)
                if self.camera and PIL_AVAILABLE:
                    self.camera_counter += 1
                    if self.camera_counter >= 5:
                        self.capture_and_send_camera_frame()
                        self.camera_counter = 0

                # Send status updates every 25 steps (~0.5 second for more responsive UI)
                self.status_counter += 1
                if self.status_counter >= 25:
                    self.read_imu_data()
                    # Add joint angles to state
                    self.current_state["joints"] = self.read_joint_angles()
                    self.backend.send_status(self.current_state)
                    self.status_counter = 0

        except Exception as e:
            print(f"✗ Error in main loop: {e}")
        finally:
            if self.backend:
                self.backend.disconnect()

    def _run_standalone(self):
        """Run in standalone mode without backend"""
        self.standing_pose()
        while self.robot.step(self.timestep) != -1:
            if self.camera and self.display:
                camera_image = self.camera.getImage()
                if camera_image:
                    self.display.imagePaste(camera_image, 0, 0)


# === Main Entry Point ===

if __name__ == "__main__":
    controller = NAOController()
    controller.initialize()
    controller.run()
