"""NAO Robot Web Control - Receives commands from backend API"""
from controller import Robot, Motion
import sys
import time
from backend_client import BackendClient

# Initialize robot
robot = Robot()
timestep = int(robot.getBasicTimeStep())

print("=" * 70)
print("       NAO WEB-CONTROLLED ROBOT")
print("=" * 70)

# Initialize motors
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

print(f"✓ Initialized {len(motors)} motors")

# Initialize camera and display
camera = robot.getDevice('CameraTop')
display = robot.getDevice('camera_display')

if camera:
    camera.enable(timestep)
    print("✓ Camera enabled")
else:
    print("✗ Camera not found")

if display:
    print("✓ Display found")
else:
    print("✗ Display not found")

# Current state
current_state = {
    "connected": True,
    "is_moving": False,
    "current_gesture": None
}

# Gesture functions
def standing_pose():
    """Set stable standing position"""
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
    if 'HeadYaw' in motors:
        motors['HeadYaw'].setPosition(0.0)
    if 'HeadPitch' in motors:
        motors['HeadPitch'].setPosition(0.0)

def wave_gesture():
    """Wave right hand (fast)"""
    # Set higher velocity for faster movement
    if 'RShoulderPitch' in motors:
        motors['RShoulderPitch'].setVelocity(3.0)
        motors['RShoulderPitch'].setPosition(0.0)
    if 'RShoulderRoll' in motors:
        motors['RShoulderRoll'].setVelocity(3.0)
        motors['RShoulderRoll'].setPosition(-0.3)
    if 'RElbowRoll' in motors:
        motors['RElbowRoll'].setVelocity(3.0)
        motors['RElbowRoll'].setPosition(1.5)
    if 'RElbowYaw' in motors:
        motors['RElbowYaw'].setVelocity(3.0)
        motors['RElbowYaw'].setPosition(1.2)

def point_gesture():
    """Point forward with right arm (fast)"""
    # Set higher velocity for faster movement
    if 'RShoulderPitch' in motors:
        motors['RShoulderPitch'].setVelocity(3.0)
        motors['RShoulderPitch'].setPosition(0.5)
    if 'RShoulderRoll' in motors:
        motors['RShoulderRoll'].setVelocity(3.0)
        motors['RShoulderRoll'].setPosition(-0.2)
    if 'RElbowRoll' in motors:
        motors['RElbowRoll'].setVelocity(3.0)
        motors['RElbowRoll'].setPosition(0.0)
    if 'RElbowYaw' in motors:
        motors['RElbowYaw'].setVelocity(3.0)
        motors['RElbowYaw'].setPosition(1.2)

def move_head(direction):
    """Move head in specified direction (fast)"""
    if 'HeadYaw' in motors:
        motors['HeadYaw'].setVelocity(2.0)  # Increase speed
    if 'HeadPitch' in motors:
        motors['HeadPitch'].setVelocity(2.0)

    if direction == 'left' and 'HeadYaw' in motors:
        motors['HeadYaw'].setPosition(0.8)
    elif direction == 'right' and 'HeadYaw' in motors:
        motors['HeadYaw'].setPosition(-0.8)
    elif direction == 'up' and 'HeadPitch' in motors:
        motors['HeadPitch'].setPosition(-0.3)
    elif direction == 'down' and 'HeadPitch' in motors:
        motors['HeadPitch'].setPosition(0.3)
    elif direction == 'center':
        if 'HeadYaw' in motors:
            motors['HeadYaw'].setPosition(0.0)
        if 'HeadPitch' in motors:
            motors['HeadPitch'].setPosition(0.0)

# Load motion files
print("Loading motion files...")
motion_path = "/usr/local/webots/projects/robots/softbank/nao/motions/"

try:
    forward_motion = Motion(motion_path + "Forwards.motion")
    backward_motion = Motion(motion_path + "Backwards.motion")
    turn_left_motion = Motion(motion_path + "TurnLeft60.motion")
    turn_right_motion = Motion(motion_path + "TurnRight60.motion")
    print("✓ Motion files loaded")
except Exception as e:
    print(f"✗ Failed to load motion files: {e}")
    forward_motion = None
    backward_motion = None
    turn_left_motion = None
    turn_right_motion = None

# Command handler
def handle_command(command):
    """Handle command from backend"""
    print(f"📥 Command received: {command}")

    cmd_type = command.get("type")

    if cmd_type == "gesture":
        gesture = command.get("gesture")
        if gesture == "wave":
            wave_gesture()
            current_state["current_gesture"] = "wave"
        elif gesture == "point":
            point_gesture()
            current_state["current_gesture"] = "point"
        elif gesture == "stand":
            standing_pose()
            current_state["current_gesture"] = "stand"

    elif cmd_type == "head_move":
        direction = command.get("direction")
        move_head(direction)

    elif cmd_type == "walk":
        movement = command.get("movement")
        print(f"🚶 Walking: {movement}")
        current_state["is_moving"] = True

        # Execute walking motion
        if movement == "forward" and forward_motion:
            forward_motion.play()
            while not forward_motion.isOver():
                robot.step(timestep)
        elif movement == "backward" and backward_motion:
            backward_motion.play()
            while not backward_motion.isOver():
                robot.step(timestep)
        elif movement == "turn_left" and turn_left_motion:
            turn_left_motion.play()
            while not turn_left_motion.isOver():
                robot.step(timestep)
        elif movement == "turn_right" and turn_right_motion:
            turn_right_motion.play()
            while not turn_right_motion.isOver():
                robot.step(timestep)
        else:
            # Fallback if motion not available
            robot.step(timestep * 20)

        current_state["is_moving"] = False
        print(f"✓ Finished: {movement}")

# Initialize backend client
backend = BackendClient()
print("\n🔌 Connecting to backend...")

if backend.connect():
    backend.start_listening(handle_command)
    print("✓ Ready to receive commands from web interface!\n")

    # Set initial standing pose
    standing_pose()

    # Status update counter
    status_counter = 0

    # Main control loop
    while robot.step(timestep) != -1:
        # Update camera display
        if camera and display:
            camera_image = camera.getImage()
            if camera_image:
                display.imagepaste(camera_image, 0, 0)

        # Send status updates every 100 steps (~2 seconds)
        status_counter += 1
        if status_counter >= 100:
            backend.send_status(current_state)
            status_counter = 0

        # Small delay to prevent busy loop
        time.sleep(0.001)

else:
    print("\n⚠ Running in standalone mode (no backend connection)")
    print("  To enable web control, start the backend:")
    print("  cd backend && python -m app.main\n")

    # Fallback: run standing pose indefinitely
    standing_pose()
    while robot.step(timestep) != -1:
        # Update camera display in standalone mode too
        if camera and display:
            camera_image = camera.getImage()
            if camera_image:
                display.imagepaste(camera_image, 0, 0)
