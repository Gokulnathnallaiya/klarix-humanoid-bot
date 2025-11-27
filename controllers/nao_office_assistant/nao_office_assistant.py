"""NAO Intelligent Office Assistant
Features:
- Distance sensor-based obstacle avoidance
- Camera view display
- Smart navigation with automatic obstacle detection
"""

from controller import Robot, Motion, Keyboard, Display
import sys

# Create the Robot instance
robot = Robot()
timestep = int(robot.getBasicTimeStep())

print("=" * 70)
print("       NAO INTELLIGENT OFFICE ASSISTANT")
print("=" * 70)
print("Features: Obstacle Avoidance | Camera View | Smart Navigation")
print("=" * 70)

# Initialize motors
def init_motors():
    """Initialize all NAO motors"""
    motor_names = [
        'HeadYaw', 'HeadPitch',
        'LShoulderPitch', 'LShoulderRoll', 'LElbowYaw', 'LElbowRoll', 'LWristYaw',
        'RShoulderPitch', 'RShoulderRoll', 'RElbowYaw', 'RElbowRoll', 'RWristYaw',
        'LHipYawPitch', 'LHipRoll', 'LHipPitch', 'LKneePitch', 'LAnklePitch', 'LAnkleRoll',
        'RHipYawPitch', 'RHipRoll', 'RHipPitch', 'RKneePitch', 'RAnklePitch', 'RAnkleRoll'
    ]

    motors = {}
    for name in motor_names:
        motor = robot.getDevice(name)
        if motor:
            motors[name] = motor

    return motors

# Initialize sensors and devices
def init_devices():
    """Initialize sensors, keyboard, camera, and display"""
    devices = {}

    # Keyboard
    keyboard = robot.getKeyboard()
    keyboard.enable(timestep)
    devices['keyboard'] = keyboard

    # Distance Sensors
    sensor_names = ['distance_front', 'distance_front_left', 'distance_front_right',
                    'distance_left', 'distance_right']
    devices['distance_sensors'] = {}
    for name in sensor_names:
        try:
            sensor = robot.getDevice(name)
            if sensor:
                sensor.enable(timestep)
                devices['distance_sensors'][name] = sensor
                print(f"✓ {name} initialized")
        except:
            print(f"✗ {name} not found")

    # Cameras
    try:
        top_cam = robot.getDevice('CameraTop')
        if top_cam:
            top_cam.enable(4 * timestep)
            devices['camera_top'] = top_cam
            print("✓ Top camera initialized")
    except:
        print("✗ Top camera not found")

    try:
        bottom_cam = robot.getDevice('CameraBottom')
        if bottom_cam:
            bottom_cam.enable(4 * timestep)
            devices['camera_bottom'] = bottom_cam
            print("✓ Bottom camera initialized")
    except:
        print("✗ Bottom camera not found")

    # Display for camera view
    try:
        display = robot.getDevice('camera_display')
        if display:
            devices['display'] = display
            print("✓ Camera display initialized")
    except:
        print("✗ Display not found")

    return devices

# Gesture functions
def standing_pose(motors):
    """Set stable standing position"""
    if not motors:
        return
    if 'LShoulderPitch' in motors:
        motors['LShoulderPitch'].setPosition(1.57)
    if 'RShoulderPitch' in motors:
        motors['RShoulderPitch'].setPosition(1.57)
    if 'LShoulderRoll' in motors:
        motors['LShoulderRoll'].setPosition(0.2)
    if 'RShoulderRoll' in motors:
        motors['RShoulderRoll'].setPosition(-0.2)
    if 'LElbowRoll' in motors:
        motors['LElbowRoll'].setPosition(-0.5)
    if 'RElbowRoll' in motors:
        motors['RElbowRoll'].setPosition(0.5)

    if 'LHipPitch' in motors:
        motors['LHipPitch'].setPosition(-0.05)
    if 'RHipPitch' in motors:
        motors['RHipPitch'].setPosition(-0.05)
    if 'LKneePitch' in motors:
        motors['LKneePitch'].setPosition(0.1)
    if 'RKneePitch' in motors:
        motors['RKneePitch'].setPosition(0.1)
    if 'LAnklePitch' in motors:
        motors['LAnklePitch'].setPosition(-0.05)
    if 'RAnklePitch' in motors:
        motors['RAnklePitch'].setPosition(-0.05)

    if 'HeadYaw' in motors:
        motors['HeadYaw'].setPosition(0.0)
    if 'HeadPitch' in motors:
        motors['HeadPitch'].setPosition(0.0)

def wave_gesture(motors):
    """Wave right hand"""
    if not motors:
        return
    if 'RShoulderPitch' in motors:
        motors['RShoulderPitch'].setPosition(0.0)
    if 'RShoulderRoll' in motors:
        motors['RShoulderRoll'].setPosition(-0.3)
    if 'RElbowRoll' in motors:
        motors['RElbowRoll'].setPosition(1.5)
    if 'RElbowYaw' in motors:
        motors['RElbowYaw'].setPosition(1.2)

def point_gesture(motors):
    """Point forward with right arm"""
    if not motors:
        return
    if 'RShoulderPitch' in motors:
        motors['RShoulderPitch'].setPosition(0.5)
    if 'RShoulderRoll' in motors:
        motors['RShoulderRoll'].setPosition(-0.2)
    if 'RElbowRoll' in motors:
        motors['RElbowRoll'].setPosition(0.0)
    if 'RElbowYaw' in motors:
        motors['RElbowYaw'].setPosition(1.2)

def look_direction(motors, direction):
    """Look in a specific direction"""
    if not motors:
        return
    if direction == 'left':
        if 'HeadYaw' in motors:
            motors['HeadYaw'].setPosition(0.8)
    elif direction == 'right':
        if 'HeadYaw' in motors:
            motors['HeadYaw'].setPosition(-0.8)
    elif direction == 'up':
        if 'HeadYaw' in motors:
            motors['HeadYaw'].setPosition(0.0)
        if 'HeadPitch' in motors:
            motors['HeadPitch'].setPosition(-0.3)
    elif direction == 'down':
        if 'HeadYaw' in motors:
            motors['HeadYaw'].setPosition(0.0)
        if 'HeadPitch' in motors:
            motors['HeadPitch'].setPosition(0.3)
    else:
        if 'HeadYaw' in motors:
            motors['HeadYaw'].setPosition(0.0)
        if 'HeadPitch' in motors:
            motors['HeadPitch'].setPosition(0.0)

# Intelligent Command Controller
class IntelligentController:
    def __init__(self, motors, devices):
        self.motors = motors
        self.devices = devices
        self.current_command = None
        self.command_timer = 0
        self.command_duration = 0
        self.obstacle_detected = False
        self.avoiding_obstacle = False

        # Motion objects
        self.forward_motion = None
        self.backward_motion = None
        self.turn_left_motion = None
        self.turn_right_motion = None
        self.sidestep_left_motion = None
        self.sidestep_right_motion = None

        self.load_motions()
        standing_pose(self.motors)

    def load_motions(self):
        """Load NAO's built-in motions"""
        try:
            self.forward_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/Forwards.motion')
            print("✓ Forward motion loaded")
        except:
            print("✗ Forward motion not available")

        try:
            self.backward_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/Backwards.motion')
            print("✓ Backward motion loaded")
        except:
            pass

        try:
            self.turn_left_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/TurnLeft60.motion')
            print("✓ Turn left motion loaded")
        except:
            pass

        try:
            self.turn_right_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/TurnRight60.motion')
            print("✓ Turn right motion loaded")
        except:
            pass

        try:
            self.sidestep_left_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/SideStepLeft.motion')
            print("✓ Sidestep left motion loaded")
        except:
            pass

        try:
            self.sidestep_right_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/SideStepRight.motion')
            print("✓ Sidestep right motion loaded")
        except:
            pass

    def read_distance_sensors(self):
        """Read all distance sensors and check for obstacles"""
        if 'distance_sensors' not in self.devices:
            return {}

        distances = {}
        for name, sensor in self.devices['distance_sensors'].items():
            value = sensor.getValue()
            distances[name] = value

        return distances

    def check_obstacles(self, distances):
        """Check if there are obstacles in the path"""
        OBSTACLE_THRESHOLD = 700  # Distance threshold in mm

        obstacles = {
            'front': False,
            'front_left': False,
            'front_right': False,
            'left': False,
            'right': False
        }

        if 'distance_front' in distances and distances['distance_front'] < OBSTACLE_THRESHOLD:
            obstacles['front'] = True

        if 'distance_front_left' in distances and distances['distance_front_left'] < OBSTACLE_THRESHOLD:
            obstacles['front_left'] = True

        if 'distance_front_right' in distances and distances['distance_front_right'] < OBSTACLE_THRESHOLD:
            obstacles['front_right'] = True

        if 'distance_left' in distances and distances['distance_left'] < 500:
            obstacles['left'] = True

        if 'distance_right' in distances and distances['distance_right'] < 500:
            obstacles['right'] = True

        return obstacles

    def avoid_obstacle(self):
        """Determine best direction to avoid obstacle"""
        distances = self.read_distance_sensors()
        obstacles = self.check_obstacles(distances)

        # Determine avoidance strategy
        if obstacles['front']:
            print("\n⚠ OBSTACLE AHEAD!")
            # Choose direction with more space
            if not obstacles['right']:
                print("  → Turning right to avoid")
                return 'turn_right'
            elif not obstacles['left']:
                print("  → Turning left to avoid")
                return 'turn_left'
            else:
                print("  → Backing up")
                return 'back_up'

        elif obstacles['front_left'] and not obstacles['front_right']:
            print("\n⚠ Obstacle on front-left, adjusting right")
            return 'sidestep_right'

        elif obstacles['front_right'] and not obstacles['front_left']:
            print("\n⚠ Obstacle on front-right, adjusting left")
            return 'sidestep_left'

        return None

    def update_camera_display(self):
        """Update display with camera image"""
        if 'camera_top' not in self.devices or 'display' not in self.devices:
            return

        camera = self.devices['camera_top']
        display = self.devices['display']

        image = camera.getImage()
        if image:
            display.imageNew(image, Display.RGB, camera.getWidth(), camera.getHeight())

    def execute_command(self, command, param=1):
        """Execute a specific command"""
        self.current_command = command
        self.command_timer = 0
        self.step_count = 0

        print(f"\n▶ Executing: {command.upper()} (param: {param})")

        if command == 'walk_forward':
            self.command_duration = param * 2.0
            if self.forward_motion:
                self.forward_motion.play()

        elif command == 'walk_backward':
            self.command_duration = param * 2.0
            if self.backward_motion:
                self.backward_motion.play()

        elif command == 'turn_left':
            self.command_duration = param * 1.5
            if self.turn_left_motion:
                self.turn_left_motion.play()

        elif command == 'turn_right':
            self.command_duration = param * 1.5
            if self.turn_right_motion:
                self.turn_right_motion.play()

        elif command == 'sidestep_left':
            self.command_duration = param * 2.0
            if self.sidestep_left_motion:
                self.sidestep_left_motion.play()

        elif command == 'sidestep_right':
            self.command_duration = param * 2.0
            if self.sidestep_right_motion:
                self.sidestep_right_motion.play()

        elif command == 'wave':
            self.command_duration = 3.0
            wave_gesture(self.motors)

        elif command == 'point':
            self.command_duration = 2.0
            point_gesture(self.motors)

        elif command in ['look_left', 'look_right', 'look_up', 'look_down', 'look_center']:
            self.command_duration = 1.0
            look_direction(self.motors, command.replace('look_', ''))

        elif command == 'stand':
            self.command_duration = 1.0
            standing_pose(self.motors)

        else:
            print(f"  Unknown command: {command}")
            self.current_command = None

    def update(self):
        """Update controller state"""
        # Update camera display
        self.update_camera_display()

        # Read sensors
        distances = self.read_distance_sensors()

        # Display sensor readings periodically
        if self.step_count % 25 == 0 and distances:
            print(f"\r[Sensors] F:{distances.get('distance_front', 0):.0f} " +
                  f"FL:{distances.get('distance_front_left', 0):.0f} " +
                  f"FR:{distances.get('distance_front_right', 0):.0f} " +
                  f"L:{distances.get('distance_left', 0):.0f} " +
                  f"R:{distances.get('distance_right', 0):.0f}", end='    ')

        self.step_count += 1

        # Check for keyboard input
        key = self.devices['keyboard'].getKey()

        if key != -1 and self.current_command is None:
            self.handle_key(key)

        # Update current command
        if self.current_command:
            self.command_timer += timestep / 1000.0

            # Check for obstacles during movement
            if self.current_command == 'walk_forward':
                obstacles = self.check_obstacles(distances)

                if obstacles['front'] or obstacles['front_left'] or obstacles['front_right']:
                    # Obstacle detected! Stop and avoid
                    print("\n🛑 OBSTACLE DETECTED - Initiating avoidance maneuver")
                    avoidance_action = self.avoid_obstacle()

                    if avoidance_action:
                        self.execute_command(avoidance_action, 1)
                        return

                # Continue walking if no obstacle
                if self.forward_motion and self.forward_motion.isOver() and self.command_timer < self.command_duration:
                    self.forward_motion.play()

            elif self.current_command == 'walk_backward' and self.backward_motion:
                if self.backward_motion.isOver() and self.command_timer < self.command_duration:
                    self.backward_motion.play()

            elif self.current_command == 'turn_left' and self.turn_left_motion:
                if self.turn_left_motion.isOver() and self.command_timer < self.command_duration:
                    self.turn_left_motion.play()

            elif self.current_command == 'turn_right' and self.turn_right_motion:
                if self.turn_right_motion.isOver() and self.command_timer < self.command_duration:
                    self.turn_right_motion.play()

            elif self.current_command == 'sidestep_left' and self.sidestep_left_motion:
                if self.sidestep_left_motion.isOver() and self.command_timer < self.command_duration:
                    self.sidestep_left_motion.play()

            elif self.current_command == 'sidestep_right' and self.sidestep_right_motion:
                if self.sidestep_right_motion.isOver() and self.command_timer < self.command_duration:
                    self.sidestep_right_motion.play()

            # Check if command completed
            if self.command_timer >= self.command_duration:
                print(f"\n  ✓ Command completed")
                self.current_command = None
                standing_pose(self.motors)

    def handle_key(self, key):
        """Handle keyboard input"""
        # Movement commands
        if key == ord('W'):
            self.execute_command('walk_forward', 5)
        elif key == ord('S'):
            self.execute_command('walk_backward', 3)
        elif key == ord('A'):
            self.execute_command('turn_left', 1)
        elif key == ord('D'):
            self.execute_command('turn_right', 1)
        elif key == ord('Q'):
            self.execute_command('sidestep_left', 2)
        elif key == ord('E'):
            self.execute_command('sidestep_right', 2)

        # Gesture commands
        elif key == ord('V'):
            self.execute_command('wave', 1)
        elif key == ord('P'):
            self.execute_command('point', 1)

        # Look commands
        elif key == Keyboard.LEFT:
            self.execute_command('look_left', 1)
        elif key == Keyboard.RIGHT:
            self.execute_command('look_right', 1)
        elif key == Keyboard.UP:
            self.execute_command('look_up', 1)
        elif key == Keyboard.DOWN:
            self.execute_command('look_down', 1)
        elif key == ord('C'):
            self.execute_command('look_center', 1)

        # Reset to standing
        elif key == ord(' '):
            self.execute_command('stand', 1)

    def print_help(self):
        """Print available commands"""
        print("\n" + "=" * 70)
        print("KEYBOARD COMMANDS")
        print("=" * 70)
        print("\nMOVEMENT:")
        print("  W - Walk forward (5 steps) - AUTO OBSTACLE AVOIDANCE")
        print("  S - Walk backward (3 steps)")
        print("  A - Turn left (60°)")
        print("  D - Turn right (60°)")
        print("  Q - Sidestep left")
        print("  E - Sidestep right")
        print("\nGESTURES:")
        print("  V - Wave hand")
        print("  P - Point forward")
        print("\nHEAD CONTROL:")
        print("  ← → ↑ ↓ - Look left/right/up/down")
        print("  C - Look center (reset head)")
        print("\nOTHER:")
        print("  SPACE - Return to standing pose")
        print("\n🤖 INTELLIGENT FEATURES:")
        print("  • Automatic obstacle detection with distance sensors")
        print("  • Camera view displayed on screen in environment")
        print("  • Real-time sensor feedback")
        print("=" * 70 + "\n")


# Main execution
print("\n[1/2] Initializing motors...")
motors = init_motors()
print(f"✓ {len(motors)} motors initialized")

print("\n[2/2] Initializing devices...")
devices = init_devices()

print("\n" + "=" * 70)
print("INTELLIGENT NAVIGATION READY")
print("=" * 70)

# Initialize controller
controller = IntelligentController(motors, devices)
controller.print_help()

print("Waiting for commands...\n")

# Main control loop
try:
    step_counter = 0
    while robot.step(timestep) != -1:
        step_counter += 1
        controller.step_count = step_counter
        controller.update()
except KeyboardInterrupt:
    print("\n\nController stopped by user")
    print("=" * 70)
