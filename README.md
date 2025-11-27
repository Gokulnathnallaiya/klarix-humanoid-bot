# NAO Office Assistant - Command-Based Control

A Webots R2023b simulation project featuring the NAO humanoid robot with keyboard-controlled commands. Control NAO with discrete actions like walking, turning, waving, and pointing in a realistic office environment.

## Features

### 🎮 Command-Based Control

Control NAO with keyboard commands - no automatic looping! Each command executes once and waits for the next:

**Movement Commands:**
- **W** - Walk forward (5 steps)
- **S** - Walk backward (3 steps)
- **A** - Turn left (60°)
- **D** - Turn right (60°)
- **Q** - Sidestep left
- **E** - Sidestep right

**Gesture Commands:**
- **V** - Wave hand
- **P** - Point forward

**Head Control:**
- **Arrow Keys** (←→↑↓) - Look left/right/up/down
- **C** - Look center (reset head)

**Other:**
- **SPACE** - Return to standing pose

### 🏢 Office Environment

- **Compact Design**: 8x8m room (perfect for demos and presentations)
- **Work Area**: Desk with computer monitor, keyboard, and chair
- **Coffee Station**: Table with coffee machine and cups
- **Reception Area**: Visitor greeting zone with pedestrian
- **Decorations**: Potted plants and proper office aesthetics
- **Visual Navigation Markers**: Color-coded floor markers for key locations
- **Professional Lighting**: Ambient and task lighting for realism

## Quick Start

### Prerequisites
- Webots R2023b or compatible version
- Python environment with Webots controller library

### Running the Controller

```bash
1. Open Webots
2. File > Open World > worlds/nao_office_demo.wbt
3. Click Play (or press Ctrl+.)
4. Click on the 3D view window to focus it
5. Press keyboard commands to control NAO!
```

**Important**: Make sure the 3D view window is focused (clicked) to receive keyboard input.

### Camera Controls

The camera automatically follows NAO using **"Pan and Tilt Shot"** mode for smooth tracking:

**Automatic Tracking:**
- Camera smoothly pans and tilts to keep NAO centered
- Positioned at optimal angle to see gestures and movements
- Follows robot through entire demo sequence

**Manual Control (if needed):**
- **Click and Drag** - Rotate view around the scene
- **Scroll Wheel** - Zoom in/out
- **Right-click + Drag** - Pan camera position
- **Shift + Click** - Select and follow NAO manually
- **Ctrl + 1** - Return to default follow viewpoint

**Tips for Best View:**
- The camera automatically tracks NAO - just press Play!
- If you lose tracking, press **Ctrl + 1** to reset the viewpoint
- You can pause (Spacebar) to manually adjust the view angle
- The camera stays at NAO's height level for best gesture visibility

## How Commands Work

### Command Execution

- **One command at a time**: NAO completes each command before accepting the next
- **Timed actions**: Each command has a specific duration (e.g., walk forward = 10 seconds)
- **Auto-return to standing**: After each gesture, NAO returns to neutral standing pose
- **Visual feedback**: Console shows which command is executing

### Example Command Sequence

```
Press W → NAO walks forward 5 steps → Returns to standing → Waits
Press A → NAO turns left 60° → Returns to standing → Waits
Press V → NAO waves hand → Returns to standing → Waits
Press P → NAO points forward → Returns to standing → Waits
```

### Navigation Reference Points

The office has visual floor markers to help navigate:

- **Blue marker**: Greeting area (center south)
- **Brown marker**: Coffee station (left side)
- **Orange marker**: Work desk (right side)

## Project Structure

```
humanoid_robot_project/
├── worlds/
│   └── nao_office_demo.wbt        # Office environment
├── controllers/
│   └── nao_office_assistant/
│       └── nao_office_assistant.py # Demo controller
├── CLAUDE.md                       # Developer documentation
└── README.md                       # This file
```

## Console Output

When you run the controller, you'll see:

```
======================================================================
          NAO OFFICE ASSISTANT - COMMAND MODE
======================================================================
Control NAO with keyboard commands!
======================================================================

[1/2] Initializing motors...
✓ 24 motors initialized

[2/2] Initializing keyboard...
✓ Keyboard initialized

======================================================================
COMMAND MODE READY
======================================================================

======================================================================
KEYBOARD COMMANDS
======================================================================

MOVEMENT:
  W - Walk forward (5 steps)
  S - Walk backward (3 steps)
  A - Turn left (60°)
  D - Turn right (60°)
  Q - Sidestep left
  E - Sidestep right

GESTURES:
  V - Wave hand
  P - Point forward

HEAD CONTROL:
  ← → ↑ ↓ - Look left/right/up/down
  C - Look center (reset head)

OTHER:
  SPACE - Return to standing pose

NOTE: Commands execute one at a time
======================================================================

Waiting for commands...

▶ Executing: WALK_FORWARD (param: 5)
  ✓ Command completed

▶ Executing: WAVE (param: 1)
  ✓ Command completed
```

## Sensors & Hardware

The demo uses only NAO's **built-in sensors** (no custom hardware required):

- **CameraTop** - Top-mounted camera (320x240 @ 30fps)
- **CameraBottom** - Bottom camera (320x240 @ 30fps)
- **Accelerometer** - 3-axis acceleration measurement
- **Gyroscope** - 3-axis rotation measurement

All navigation is **pre-scripted** based on precise timing, making it reliable and repeatable for demonstrations.

## Gestures Implemented

The controller includes these interactive gesture functions:

| Function | Description |
|----------|-------------|
| `wave_hello()` | Raises right arm and waves at visitor |
| `wave_gesture()` | Performs actual waving motion with wrist |
| `point_forward()` | Points in a direction with extended arm |
| `nod_head()` | Nods head affirmatively |
| `look_around(direction)` | Looks left, right, or center |
| `standing_pose()` | Returns to neutral standing stance |
| `reset_arms()` | Lowers arms to resting position at sides |

## NAO Robot Specifications

- **Height**: 57cm (23 inches)
- **Weight**: ~5.4kg in simulation
- **Motors**: 24 controlled joints
  - Head: 2 (yaw, pitch)
  - Arms: 12 (6 per arm)
  - Legs: 10 (5 per leg)
- **Built-in Motions**: Forward walk, turn left/right, side step
- **Sensors**: Cameras, accelerometer, gyroscope

## Use Cases

Perfect for:

- 🎓 **Educational Labs** - Students learn robot control and programming
- 🎮 **Interactive Demos** - Live control demonstrations at exhibitions
- 🧪 **Algorithm Testing** - Test navigation and behavior algorithms
- 🔬 **HRI Research** - Study command-based human-robot interaction
- 📚 **Teaching** - Demonstrate discrete robot commands and state machines
- 🤖 **Development** - Prototype and test robot behaviors interactively

## Customization Guide

Easily customize the controller:

### Add New Commands
Edit the `handle_key()` method in `nao_office_assistant.py`:
```python
elif key == ord('X'):  # Add your key
    self.execute_command('my_command', 1)
```

Then add the command logic in `execute_command()`:
```python
elif command == 'my_command':
    self.command_duration = 2.0
    # Your custom motor positions here
    motors['RShoulderPitch'].setPosition(1.0)
```

### Modify Step Counts
Change the default step counts in `handle_key()`:
```python
elif key == ord('W'):
    self.execute_command('walk_forward', 10)  # Change from 5 to 10 steps
```

### Add New Gestures
Create new gesture functions:
```python
def salute_gesture(motors):
    """Military salute"""
    motors['RShoulderPitch'].setPosition(0.0)
    motors['RShoulderRoll'].setPosition(-0.5)
    motors['RElbowRoll'].setPosition(1.8)
```

### Change Environment
Edit `nao_office_demo.wbt` to:
- Add/remove furniture and obstacles
- Change room size and layout
- Modify lighting and appearance
- Add obstacles for navigation challenges

## Troubleshooting

**Q: Keyboard commands don't work?**
A: Make sure you've clicked on the 3D view window to focus it. The window must be active to receive keyboard input.

**Q: Robot falls over during walking?**
A: Ensure the robot starts in proper standing position (press SPACE to reset).

**Q: Commands don't execute?**
A: Wait for the current command to complete. Only one command runs at a time. Check console for "✓ Command completed".

**Q: Walking motions don't load?**
A: Check Webots installation path for motion files. Robot will maintain standing position if motions unavailable.

**Q: How to change step count?**
A: Modify the parameter in `execute_command()` calls (e.g., change `walk_forward, 5` to desired steps).

**Q: Want to add voice feedback?**
A: Integrate Python text-to-speech library (pyttsx3) in the command execution functions.

## Development

For detailed technical documentation, see [CLAUDE.md](CLAUDE.md):
- Controller architecture patterns
- Complete motor and sensor device names
- World file structure and VRML syntax
- Gesture programming techniques
- Motion file usage and paths
- Code examples and best practices

## Technologies

- **Webots R2023b** - Professional robot simulation platform
- **Python 3** - Controller programming language
- **NAO Robot** - SoftBank Robotics humanoid platform
- **VRML** - 3D world definition format

## Future Enhancement Ideas

- 🎮 **Gamepad support** - Use joystick/gamepad instead of keyboard
- 🔊 **Voice commands** - Control NAO with speech recognition
- 📱 **Web interface** - Control from browser or mobile app
- 🧠 **AI integration** - Autonomous decision-making with LLMs
- 🎯 **Mission mode** - Chain commands into saved sequences
- 📊 **Telemetry logging** - Record and replay command sequences
- 🤖 **Sensor feedback** - Use cameras for obstacle detection
- 🎪 **Choreography mode** - Create and playback dance routines
- 🔄 **Macro commands** - Define complex multi-step behaviors
- 📡 **Remote control** - Control over network/ROS integration

## License & Credits

This project uses:
- Webots simulation environment by Cyberbotics
- NAO robot model by SoftBank Robotics
- Standard Webots PROTO libraries for objects and environments

---

**Ready to control NAO?**

1. Open Webots and load `worlds/nao_office_demo.wbt`
2. Click Play
3. Click on the 3D view to focus
4. Press **W** to walk, **A/D** to turn, **V** to wave!

For technical documentation and customization, see [CLAUDE.md](CLAUDE.md)
# klarix-humanoid-bot
