"""NAO Office Assistant - Demo Controller
Demonstrates greeting, navigation, and service behaviors in a compact office environment
"""

from controller import Robot, Motion, Camera, Accelerometer, Gyro
import sys
import math

# Create the Robot instance
robot = Robot()
timestep = int(robot.getBasicTimeStep())

print("=" * 70)
print("              NAO OFFICE ASSISTANT - DEMO MODE")
print("=" * 70)
print("Scenario: Office helper robot demonstrating greeting and coffee service")
print("=" * 70)

# Initialize motors
def init_motors():
    """Initialize all NAO motors and return as dictionary"""
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

# Initialize sensors
def init_sensors():
    """Initialize NAO's built-in sensors"""
    sensors = {}

    # Cameras (built-in)
    try:
        top_cam = robot.getDevice('CameraTop')
        if top_cam:
            top_cam.enable(4 * timestep)
            sensors['camera_top'] = top_cam
            print("✓ Top camera enabled")
    except:
        pass

    try:
        bottom_cam = robot.getDevice('CameraBottom')
        if bottom_cam:
            bottom_cam.enable(4 * timestep)
            sensors['camera_bottom'] = bottom_cam
            print("✓ Bottom camera enabled")
    except:
        pass

    # Accelerometer (built-in)
    try:
        accel = robot.getDevice('accelerometer')
        if accel:
            accel.enable(timestep)
            sensors['accelerometer'] = accel
            print("✓ Accelerometer enabled")
    except:
        pass

    # Gyroscope (built-in)
    try:
        gyro = robot.getDevice('gyro')
        if gyro:
            gyro.enable(timestep)
            sensors['gyro'] = gyro
            print("✓ Gyroscope enabled")
    except:
        pass

    return sensors

# Gesture functions
def wave_hello(motors):
    """Wave right hand to greet"""
    print("\n👋 Waving hello...")

    # Raise right arm and wave
    motors['RShoulderPitch'].setPosition(0.0)  # Arm up
    motors['RShoulderRoll'].setPosition(-0.3)
    motors['RElbowRoll'].setPosition(1.5)  # Bend elbow
    motors['RElbowYaw'].setPosition(1.2)

    # Look at person
    motors['HeadPitch'].setPosition(0.0)
    motors['HeadYaw'].setPosition(0.0)

    return 3.0  # Duration in seconds

def wave_gesture(motors):
    """Actual waving motion (repeated)"""
    motors['RWristYaw'].setPosition(1.0)
    return 0.5

def reset_arms(motors):
    """Return arms to neutral standing position"""
    print("↓ Lowering arms...")

    motors['LShoulderPitch'].setPosition(1.57)
    motors['RShoulderPitch'].setPosition(1.57)
    motors['LShoulderRoll'].setPosition(0.2)
    motors['RShoulderRoll'].setPosition(-0.2)
    motors['LElbowRoll'].setPosition(-0.5)
    motors['RElbowRoll'].setPosition(0.5)
    motors['LWristYaw'].setPosition(0.0)
    motors['RWristYaw'].setPosition(0.0)

    return 2.0

def point_forward(motors):
    """Point forward with right arm"""
    print("\n👉 Pointing forward...")

    motors['RShoulderPitch'].setPosition(0.5)
    motors['RShoulderRoll'].setPosition(-0.2)
    motors['RElbowRoll'].setPosition(0.0)  # Straighten arm
    motors['RElbowYaw'].setPosition(1.2)

    return 2.0

def nod_head(motors):
    """Nod head yes"""
    print("Nodding head...")
    motors['HeadPitch'].setPosition(0.3)
    return 0.5

def look_around(motors, direction='center'):
    """Look in different directions"""
    if direction == 'left':
        print("👀 Looking left...")
        motors['HeadYaw'].setPosition(0.8)
    elif direction == 'right':
        print("👀 Looking right...")
        motors['HeadYaw'].setPosition(-0.8)
    else:
        motors['HeadYaw'].setPosition(0.0)

    motors['HeadPitch'].setPosition(0.1)
    return 1.0

def standing_pose(motors):
    """Set stable standing position"""
    # Arms
    motors['LShoulderPitch'].setPosition(1.57)
    motors['RShoulderPitch'].setPosition(1.57)
    motors['LShoulderRoll'].setPosition(0.2)
    motors['RShoulderRoll'].setPosition(-0.2)
    motors['LElbowRoll'].setPosition(-0.5)
    motors['RElbowRoll'].setPosition(0.5)

    # Legs - stable stance
    motors['LHipPitch'].setPosition(-0.05)
    motors['RHipPitch'].setPosition(-0.05)
    motors['LKneePitch'].setPosition(0.1)
    motors['RKneePitch'].setPosition(0.1)
    motors['LAnklePitch'].setPosition(-0.05)
    motors['RAnklePitch'].setPosition(-0.05)

    # Head forward
    motors['HeadYaw'].setPosition(0.0)
    motors['HeadPitch'].setPosition(0.0)

# Demo scenario state machine
class OfficeAssistantDemo:
    def __init__(self, motors, sensors):
        self.motors = motors
        self.sensors = sensors
        self.state = "INIT"
        self.state_timer = 0
        self.step_count = 0

        # Demo sequence
        self.demo_sequence = [
            ("GREETING", 8.0, "Greeting the visitor"),
            ("WAVE", 3.0, "Waving hello"),
            ("INTRODUCE", 5.0, "Introduction gesture"),
            ("LOOK_COFFEE", 3.0, "Looking at coffee station"),
            ("POINT_COFFEE", 3.0, "Pointing to coffee station"),
            ("WALK_TO_COFFEE", 6.0, "Walking to coffee station"),
            ("LOOK_DESK", 3.0, "Looking at desk"),
            ("POINT_DESK", 3.0, "Pointing to desk"),
            ("WALK_TO_DESK", 6.0, "Walking to desk"),
            ("LOOK_AROUND", 4.0, "Looking around office"),
            ("FINAL_WAVE", 4.0, "Final greeting"),
            ("RETURN_START", 6.0, "Returning to start position"),
            ("IDLE", 5.0, "Standing ready"),
        ]

        self.current_sequence_index = 0
        self.motion_loaded = False
        self.forward_motion = None
        self.turn_left_motion = None
        self.turn_right_motion = None

        # Try to load motions
        self.load_motions()

    def load_motions(self):
        """Load NAO's built-in motions"""
        try:
            self.forward_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/Forwards.motion')
            print("✓ Forward walking motion loaded")
            self.motion_loaded = True
        except:
            print("✗ Forward motion not available")

        try:
            self.turn_left_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/TurnLeft60.motion')
            print("✓ Turn left motion loaded")
        except:
            print("✗ Turn left motion not available")

        try:
            self.turn_right_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/TurnRight60.motion')
            print("✓ Turn right motion loaded")
        except:
            print("✗ Turn right motion not available")

    def get_current_demo_state(self):
        """Get current demo sequence state"""
        if self.current_sequence_index < len(self.demo_sequence):
            return self.demo_sequence[self.current_sequence_index]
        return ("COMPLETE", 0, "Demo complete - restarting")

    def advance_sequence(self):
        """Move to next state in demo sequence"""
        self.current_sequence_index += 1
        if self.current_sequence_index >= len(self.demo_sequence):
            # Loop the demo
            self.current_sequence_index = 0
            print("\n" + "=" * 70)
            print("Demo cycle complete - Restarting from beginning...")
            print("=" * 70 + "\n")

        self.state_timer = 0
        state_name, duration, description = self.get_current_demo_state()
        print(f"\n▶ STATE {self.current_sequence_index + 1}: {state_name}")
        print(f"  {description} (duration: {duration}s)")

    def update(self):
        """Update demo state machine"""
        self.step_count += 1
        self.state_timer += timestep / 1000.0  # Convert to seconds

        state_name, duration, description = self.get_current_demo_state()

        # Check if current state duration expired
        if self.state_timer >= duration:
            self.advance_sequence()
            state_name, duration, description = self.get_current_demo_state()

        # Execute state behavior
        if state_name == "GREETING":
            if self.state_timer < 0.1:  # First frame
                standing_pose(self.motors)
                look_around(self.motors, 'center')

        elif state_name == "WAVE":
            if self.state_timer < 0.1:
                wave_hello(self.motors)
            elif 1.0 < self.state_timer < 1.5:
                wave_gesture(self.motors)
            elif 2.0 < self.state_timer < 2.5:
                self.motors['RWristYaw'].setPosition(-1.0)

        elif state_name == "INTRODUCE":
            if self.state_timer < 0.1:
                reset_arms(self.motors)
            elif self.state_timer > 2.0 and self.state_timer < 2.1:
                nod_head(self.motors)

        elif state_name == "LOOK_COFFEE":
            if self.state_timer < 0.1:
                look_around(self.motors, 'left')

        elif state_name == "POINT_COFFEE":
            if self.state_timer < 0.1:
                point_forward(self.motors)

        elif state_name == "WALK_TO_COFFEE":
            if self.state_timer < 0.1:
                reset_arms(self.motors)
                if self.turn_left_motion:
                    self.turn_left_motion.play()
            elif self.state_timer > 1.0 and self.motion_loaded and self.forward_motion:
                if self.forward_motion.isOver():
                    self.forward_motion.play()

        elif state_name == "LOOK_DESK":
            if self.state_timer < 0.1:
                look_around(self.motors, 'right')

        elif state_name == "POINT_DESK":
            if self.state_timer < 0.1:
                point_forward(self.motors)

        elif state_name == "WALK_TO_DESK":
            if self.state_timer < 0.1:
                reset_arms(self.motors)
                if self.turn_right_motion:
                    self.turn_right_motion.play()
            elif self.state_timer > 1.0 and self.motion_loaded and self.forward_motion:
                if self.forward_motion.isOver():
                    self.forward_motion.play()

        elif state_name == "LOOK_AROUND":
            if self.state_timer < 1.5:
                look_around(self.motors, 'left')
            elif self.state_timer < 3.0:
                look_around(self.motors, 'right')
            else:
                look_around(self.motors, 'center')

        elif state_name == "FINAL_WAVE":
            if self.state_timer < 0.1:
                wave_hello(self.motors)
            elif 1.5 < self.state_timer < 2.0:
                wave_gesture(self.motors)

        elif state_name == "RETURN_START":
            if self.state_timer < 0.1:
                reset_arms(self.motors)
            # Simplified return - just stand in place
            standing_pose(self.motors)

        elif state_name == "IDLE":
            if self.state_timer < 0.1:
                reset_arms(self.motors)
            standing_pose(self.motors)

        # Progress indicator
        if self.step_count % 50 == 0:
            progress = (self.state_timer / duration) * 100
            print(f"\r  Progress: [{int(progress)}%] {self.state_timer:.1f}s / {duration:.1f}s", end='')


# Main execution
print("\n[1/2] Initializing motors...")
motors = init_motors()
print(f"✓ {len(motors)} motors initialized")

print("\n[2/2] Initializing sensors...")
sensors = init_sensors()

print("\n" + "=" * 70)
print("DEMO STARTING")
print("=" * 70)
print("\nScenario: NAO demonstrates office assistant capabilities")
print("  • Greeting visitors")
print("  • Pointing to coffee station")
print("  • Pointing to work desk")
print("  • Basic navigation gestures")
print("\nThe demo will loop continuously...")
print("=" * 70 + "\n")

# Initialize demo
standing_pose(motors)
demo = OfficeAssistantDemo(motors, sensors)

# Wait a moment before starting
for i in range(50):
    robot.step(timestep)

print("\n🚀 Starting demo sequence...\n")

# Main control loop
try:
    while robot.step(timestep) != -1:
        demo.update()
except KeyboardInterrupt:
    print("\n\nDemo stopped by user")
    print("=" * 70)
