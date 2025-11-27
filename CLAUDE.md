# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Webots R2023b simulation project for the NAO humanoid robot demonstrating office assistant capabilities. The project features a compact, realistic office environment where NAO performs greeting, navigation, and interaction scenarios suitable for demonstrations and presentations.

## Architecture

### Project Structure

```
humanoid_robot_project/
├── worlds/
│   └── nao_office_demo.wbt        # Office environment world file
├── controllers/
│   └── nao_office_assistant/
│       └── nao_office_assistant.py # Office demo controller
├── CLAUDE.md                       # This file
└── README.md                       # User-facing documentation
```

### Controller Architecture

Controllers in Webots are Python scripts that run the robot's behavior loop. Each controller:

1. Instantiates a `Robot` object from the `controller` module
2. Gets the simulation timestep using `robot.getBasicTimeStep()`
3. Initializes devices (motors, sensors) using `robot.getDevice(name)`
4. Runs a control loop using `robot.step(timestep)` which returns -1 when simulation stops

**Office Assistant Controller** (controllers/nao_office_assistant/nao_office_assistant.py):
- Scripted demonstration system with timed state machine
- Implements greeting, pointing, and navigation gestures
- Demonstrates office assistant behaviors (greeting visitors, showing facilities)
- Uses only NAO's built-in sensors (no custom hardware)
- Continuous looping demo (~56 seconds per cycle)
- 13-state sequence: greeting → wave → point to coffee → walk → point to desk → wave goodbye → repeat

### World File Structure

The `.wbt` file (worlds/nao_office_demo.wbt) uses VRML format to define:
- 8x8m compact office environment with parquet flooring
- Office furniture: desk, chair, computer monitor, keyboard
- Coffee station: table with coffee machine and cups
- Visitor/pedestrian model positioned for greeting
- Visual navigation markers (colored floor cylinders)
- Room walls with professional appearance
- Multi-point lighting setup for realism
- NAO robot with built-in sensors enabled
- Dynamic camera viewpoint that follows the robot

### Camera Viewpoint Configuration

The viewpoint is configured for optimal robot tracking:

```vrml
Viewpoint {
  orientation -0.4 0.3 0.85 1.6
  position 1.5 -2.5 1.2
  follow "NAO"
  followSmoothness 0.8
  followType "Pan and Tilt Shot"
}
```

**Parameters:**
- `follow "NAO"` - Automatically tracks the NAO robot
- `followSmoothness 0.8` - High smoothness for fluid camera motion (0.0-1.0)
- `followType "Pan and Tilt Shot"` - Camera pans/tilts to keep robot centered
- `position` - Initial camera position (x, y, z) relative to robot
- `orientation` - Initial camera angle as axis-angle rotation

**Alternative Follow Types:**
- `"None"` - No following (static camera)
- `"Pan and Tilt Shot"` - Camera rotates to follow (recommended)
- `"Mounted Shot"` - Camera moves with robot (first-person style)
- `"Tracking Shot"` - Camera orbits around robot

The NAO robot proto is loaded from: `https://raw.githubusercontent.com/cyberbotics/webots/R2023b/projects/robots/softbank/nao/protos/Nao.proto`

### Demo State Machine

The office assistant uses a state-based control system:

**State Sequence:**
1. GREETING - Initial standing pose
2. WAVE - Wave hello with right arm
3. INTRODUCE - Nod and acknowledge
4. LOOK_COFFEE - Turn head left toward coffee station
5. POINT_COFFEE - Point at coffee station
6. WALK_TO_COFFEE - Turn left and walk
7. LOOK_DESK - Turn head right toward desk
8. POINT_DESK - Point at desk
9. WALK_TO_DESK - Turn right and walk
10. LOOK_AROUND - Survey environment (left/right)
11. FINAL_WAVE - Wave goodbye
12. RETURN_START - Return to starting position
13. IDLE - Brief pause before loop restart

Each state has a defined duration and specific motor commands.

## Running the Simulation

### Prerequisites
- Webots R2023b or compatible version installed
- Python environment with Webots controller library available

### Launch Simulation
1. Open Webots
2. File > Open World > Select `worlds/nao_office_demo.wbt`
3. Click the Play button or press Ctrl+.

The controller automatically executes when the simulation runs.

### Controller Execution
The world file's `Nao` node specifies `controller "nao_office_assistant"` which tells Webots to execute `controllers/nao_office_assistant/nao_office_assistant.py`.

## NAO Motor Names

When working with NAO motor control, use these exact device names (case-sensitive):

**Head**: HeadYaw, HeadPitch

**Left Arm**: LShoulderPitch, LShoulderRoll, LElbowYaw, LElbowRoll, LWristYaw

**Right Arm**: RShoulderPitch, RShoulderRoll, RElbowYaw, RElbowRoll, RWristYaw

**Left Leg**: LHipYawPitch, LHipRoll, LHipPitch, LKneePitch, LAnklePitch, LAnkleRoll

**Right Leg**: RHipYawPitch, RHipRoll, RHipPitch, RKneePitch, RAnklePitch, RAnkleRoll

Note: LHand and RHand are available on real NAO but may not be present in all Webots models.

## NAO Built-in Sensors

The office demo uses only NAO's built-in sensors:

**Cameras:**
- `CameraTop` - Top-mounted camera (320x240 resolution)
- `CameraBottom` - Bottom camera (320x240 resolution)

**Inertial Sensors:**
- `accelerometer` - 3-axis acceleration measurement
- `gyro` - 3-axis rotation measurement

**Accessing Sensors:**
```python
# Camera
camera = robot.getDevice('CameraTop')
camera.enable(timestep)
image = camera.getImage()

# Accelerometer
accel = robot.getDevice('accelerometer')
accel.enable(timestep)
values = accel.getValues()  # Returns [x, y, z]

# Gyroscope
gyro = robot.getDevice('gyro')
gyro.enable(timestep)
values = gyro.getValues()  # Returns [x, y, z] rotation rates
```

## Motion Files

NAO has built-in motion files located at `/usr/local/webots/projects/robots/softbank/nao/motions/`:

**Available Motions:**
- `Forwards.motion` - Forward walking
- `Backwards.motion` - Backward walking
- `SideStepLeft.motion` - Sideways left stepping
- `SideStepRight.motion` - Sideways right stepping
- `TurnLeft60.motion` - 60° turn left
- `TurnRight60.motion` - 60° turn right

**Usage:**
```python
from controller import Motion

# Load motion
forward_motion = Motion('/usr/local/webots/projects/robots/softbank/nao/motions/Forwards.motion')

# Play motion
forward_motion.play()

# Check if motion finished
if forward_motion.isOver():
    # Restart or do something else
    forward_motion.play()
```

## Gesture Programming

The controller includes reusable gesture functions:

### Wave Hello
```python
def wave_hello(motors):
    motors['RShoulderPitch'].setPosition(0.0)  # Arm up
    motors['RShoulderRoll'].setPosition(-0.3)
    motors['RElbowRoll'].setPosition(1.5)      # Bend elbow
    motors['RElbowYaw'].setPosition(1.2)
    return 3.0  # Duration
```

### Point Forward
```python
def point_forward(motors):
    motors['RShoulderPitch'].setPosition(0.5)
    motors['RShoulderRoll'].setPosition(-0.2)
    motors['RElbowRoll'].setPosition(0.0)      # Straighten arm
    motors['RElbowYaw'].setPosition(1.2)
    return 2.0
```

### Look Around
```python
def look_around(motors, direction='center'):
    if direction == 'left':
        motors['HeadYaw'].setPosition(0.8)
    elif direction == 'right':
        motors['HeadYaw'].setPosition(-0.8)
    else:
        motors['HeadYaw'].setPosition(0.0)
    motors['HeadPitch'].setPosition(0.1)
    return 1.0
```

### Standing Pose
```python
def standing_pose(motors):
    # Arms at sides
    motors['LShoulderPitch'].setPosition(1.57)
    motors['RShoulderPitch'].setPosition(1.57)
    motors['LShoulderRoll'].setPosition(0.2)
    motors['RShoulderRoll'].setPosition(-0.2)
    motors['LElbowRoll'].setPosition(-0.5)
    motors['RElbowRoll'].setPosition(0.5)

    # Stable leg position
    motors['LHipPitch'].setPosition(-0.05)
    motors['RHipPitch'].setPosition(-0.05)
    motors['LKneePitch'].setPosition(0.1)
    motors['RKneePitch'].setPosition(0.1)
    motors['LAnklePitch'].setPosition(-0.05)
    motors['RAnklePitch'].setPosition(-0.05)
```

## Office Environment Details

**Room Dimensions:**
- Floor: 8m x 8m
- Wall height: 2.5m
- Enclosed room with four walls

**Object Locations (x, y):**
- Work desk: (2.5, 2.0)
- Desk chair: (2.5, 2.8)
- Coffee table: (-2.5, 2.0)
- Coffee machine: (-2.5, 2.0) on table
- Visitor/pedestrian: (0, -2.5)
- Office plant: (-2.5, -2.5)

**Navigation Markers:**
- Greeting spot (blue): (0, -2.0)
- Desk marker (orange): (2.5, 0.5)
- Coffee marker (brown): (-2.5, 0.5)

**Lighting:**
- Central ceiling light: (0, 0, 3)
- Accent light 1: (2, 2, 2.5)
- Accent light 2: (-2, -2, 2.5)

## Development Tips

### Adding New States
To add a new state to the demo sequence, edit the `demo_sequence` array in the controller:

```python
self.demo_sequence = [
    ("STATE_NAME", duration_seconds, "Description"),
    ("GREETING", 8.0, "Greeting the visitor"),
    ("MY_NEW_STATE", 3.0, "Description of new state"),
    # ...
]
```

Then add corresponding logic in the `update()` method:

```python
elif state_name == "MY_NEW_STATE":
    if self.state_timer < 0.1:
        # Execute actions when entering state
        my_custom_gesture(self.motors)
```

### Modifying Timing
Adjust the duration values in the sequence to speed up or slow down the demo. Total cycle time is the sum of all state durations.

### Changing Environment
Edit `nao_office_demo.wbt` to modify:
- Furniture positions (update `translation` fields)
- Room size (modify `Floor` and `Wall` dimensions)
- Lighting (adjust `PointLight` intensity and location)
- Add objects (insert new EXTERNPROTO and object nodes)

### Error Handling
If motors or sensors fail to initialize:
- Check device names (case-sensitive)
- Verify NAO proto version compatibility
- Review Webots console for specific error messages

## Common Modifications

**Speed up the demo:**
Reduce all duration values in `demo_sequence` by 50%

**Add more gestures:**
Create new motor position functions following the existing patterns

**Change starting position:**
Modify the NAO robot's `translation` field in the world file

**Add speech:**
Integrate Python text-to-speech library (pyttsx3) in the controller

**Make it interactive:**
Add keyboard input handling or sensor-based triggers to respond to events

## Troubleshooting

**Robot falls over:**
- Reduce gesture speed (increase transition times)
- Check that leg positions maintain balance
- Avoid rapid arm movements

**Motions don't load:**
- Verify Webots installation path contains motion files
- Check for correct motion file names
- Demo works without motions using manual poses

**Demo doesn't loop:**
- Controller automatically restarts sequence
- Check console for Python errors
- Verify timestep loop continues running

**Position values seem wrong:**
- Motor positions use radians, not degrees
- Positive/negative directions vary by joint
- Test positions incrementally
