# S4: Cloud Dashboard + Tele-operation + OTA Updates

## Overview
Modern, mobile-responsive web dashboard for remote robot management featuring real-time tele-operation, live telemetry visualization, and remote configuration updates.

## Components

### 1. Web Dashboard
- **Next.js 15** - React-based web framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern responsive styling
- **Lucide Icons** - Professional icon library

### 2. Tele-operation Interface
- **Real-time Control** - Low-latency command execution
- **Gesture Controls** - Pre-programmed animations
- **Walking Controls** - Directional movement with duration
- **Head Controls** - 5-direction pan/tilt interface
- **Manual Joint Control** - Individual motor positioning

### 3. Live Monitoring
- **WebSocket Streaming** - Real-time telemetry updates
- **Camera Feed** - MJPEG video stream
- **Sensor Dashboard** - IMU, LIDAR, odometry visualization
- **Joint Positions** - 24-motor status display
- **Connection Status** - System health indicators

### 4. Remote Configuration
- **OTA Updates** - Remote configuration deployment
- **Settings Management** - Runtime parameter adjustment
- **Version Control** - Configuration versioning
- **Update History** - Deployment audit trail

## Source Code Location
```
frontend/
├── app/
│   ├── page.tsx                    # Main dashboard
│   ├── layout.tsx                  # App layout
│   ├── teleop/page.tsx             # Tele-op view
│   └── analytics/page.tsx          # Analytics view
├── components/
│   ├── RobotControl.tsx            # Main control interface
│   ├── VisionPanel.tsx             # Vision analysis UI
│   ├── layout/
│   │   └── AppLayout.tsx           # Layout wrapper
│   ├── views/
│   │   ├── Dashboard.tsx           # Dashboard view
│   │   ├── TeleopView.tsx          # Tele-op interface
│   │   ├── AnalyticsView.tsx       # Analytics page
│   │   └── ConnectionScreen.tsx    # Connection status
│   └── ui/
│       ├── StatusHeader.tsx        # Status bar
│       ├── CameraFeed.tsx          # Video stream
│       ├── KinematicsPanel.tsx     # Joint display
│       ├── VisionPanel.tsx         # Vision UI
│       └── Sidebar.tsx             # Navigation
├── lib/
│   └── config.ts                   # API configuration
└── package.json
```

## Key Features

### Dashboard Views
1. **Main Dashboard** - Overview with camera, status, and quick controls
2. **Tele-operation** - Full control interface for remote operation
3. **Analytics** - Historical data and performance metrics
4. **Settings** - Configuration and preferences

### Control Capabilities
- Execute pre-defined gestures (wave, point, stand, sit)
- Walking with direction and duration control
- Head movement in 5 directions
- Individual joint position control
- Emergency stop functionality

### Real-time Visualization
- Live camera feed (MJPEG stream)
- WebSocket telemetry streaming (10 Hz)
- Joint position visualization
- Sensor data graphs
- Connection status indicators

### Mobile Responsiveness
- Touch-friendly controls
- Responsive layout (desktop/tablet/mobile)
- Progressive web app (PWA) capable
- Offline mode support
- Optimized for various screen sizes

## User Interface

### Main Dashboard Layout
```
┌─────────────────────────────────────────────┐
│  [Logo]  NAO Robot Control  [Status: ●]    │ Header
├─────────────────────────────────────────────┤
│ [Nav]│                                      │
│      │  ┌──────────────┐  ┌─────────────┐  │
│      │  │              │  │   Camera    │  │
│ Side │  │   Camera     │  │   Stream    │  │ Main
│ bar  │  │   Feed       │  │   320x240   │  │ Content
│      │  │              │  │             │  │
│      │  └──────────────┘  └─────────────┘  │
│      │                                      │
│      │  ┌──────────────────────────────┐   │
│      │  │  Control Panel               │   │
│      │  │  [Wave] [Point] [Stand] ...  │   │
│      │  └──────────────────────────────┘   │
├─────────────────────────────────────────────┤
│  [Dashboard] [Teleop] [Analytics] [More]   │ Bottom Nav
└─────────────────────────────────────────────┘
```

### Tele-operation Interface
```
Control Sections:
┌─────────────────────┐
│  Gesture Controls   │ - Wave, Point, Stand, Sit
├─────────────────────┤
│  Walking Controls   │ - Forward, Back, Left, Right
├─────────────────────┤  - Duration slider (0.5-5s)
│  Head Movement      │ - 5-direction control pad
├─────────────────────┤  - Up, Down, Left, Right, Center
│  Joint Controls     │ - 24-motor manual control
└─────────────────────┘  - Slider-based positioning
```

## API Integration

### REST API Endpoints
```typescript
// Robot Control
POST /api/robot/gesture        // Execute gesture
POST /api/robot/walk           // Walking command
POST /api/robot/head/move      // Head movement
POST /api/robot/joint          // Manual joint control
GET  /api/robot/status         // Connection status

// Vision Service
GET  /api/vision/status        // Service status
POST /api/vision/analyze       // Trigger analysis
POST /api/vision/query         // Ask question

// Sensors
GET  /api/sensors/imu          // IMU data
GET  /api/sensors/lidar        // LIDAR scan
GET  /api/sensors/joints       // Joint positions
```

### WebSocket Connection
```typescript
// Connect to real-time stream
const ws = new WebSocket('ws://localhost:8000/api/robot/ws');

// Receive telemetry updates
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle: joints, sensors, status updates
};

// Send commands (if using WS control)
ws.send(JSON.stringify({
  type: 'command',
  action: 'wave'
}));
```

## Configuration

### API Configuration
```typescript
// lib/config.ts
export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000',
  timeout: 5000,
  retryAttempts: 3
};
```

### Environment Variables
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Feature Flags
NEXT_PUBLIC_ENABLE_VISION=true
NEXT_PUBLIC_ENABLE_VOICE=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

## State Management

### Robot Context Provider
```typescript
// Context: RobotProvider.tsx
const RobotContext = {
  // Connection state
  isConnected: boolean,
  connectionStatus: 'connected' | 'disconnected' | 'connecting',

  // Robot state
  jointPositions: Record<string, number>,
  sensorData: SensorData,
  cameraFrame: string,

  // Control functions
  executeGesture: (gesture: string) => Promise<void>,
  walkRobot: (direction: string, duration: number) => Promise<void>,
  moveHead: (direction: string) => Promise<void>
};
```

### State Updates
```typescript
// WebSocket updates → Context state → UI re-render
useEffect(() => {
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    updateRobotState(update);  // Context update
  };
}, [ws]);
```

## Component Architecture

### Main Components
```
AppLayout                      # Root layout
├── StatusHeader              # Top bar with status
├── Sidebar                   # Navigation menu
├── Dashboard                 # Main view
│   ├── CameraFeed           # Video stream
│   ├── RobotControl         # Control interface
│   ├── VisionPanel          # AI vision
│   └── KinematicsPanel      # Joint display
└── BottomNav                # Mobile navigation
```

### Component Hierarchy
```
page.tsx
  └── AppLayout
      └── RobotProvider (Context)
          ├── ConnectionScreen (if disconnected)
          └── Dashboard / TeleopView / AnalyticsView
              ├── StatusHeader
              ├── CameraFeed
              ├── Control Panels
              └── Data Visualizations
```

## Responsive Design

### Breakpoints
```css
/* Mobile */
@media (max-width: 640px) {
  /* Stack layout, large touch targets */
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  /* Side-by-side panels */
}

/* Desktop */
@media (min-width: 1025px) {
  /* Full dashboard with sidebar */
}
```

### Mobile Optimizations
- Touch-friendly button sizes (min 44x44px)
- Gesture-based navigation
- Reduced data updates for bandwidth
- Optimized image compression
- Lazy loading for heavy components

## Performance

### Optimization Strategies
- **Code Splitting** - Dynamic imports for routes
- **Image Optimization** - Next.js Image component
- **Lazy Loading** - Defer non-critical components
- **Memoization** - React.memo for expensive renders
- **Virtual Scrolling** - For long lists (sensor logs)

### Performance Targets
- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3.5s
- **Lighthouse Score:** > 90 (desktop), > 85 (mobile)
- **WebSocket Latency:** < 100ms
- **Command Response:** < 300ms

## Testing

### Unit Tests
```bash
# Component tests
npm run test

# Specific component
npm test CameraFeed.test.tsx
```

### Integration Tests
```bash
# E2E tests with Playwright
npm run test:e2e

# Specific flow
npm run test:e2e -- teleop.spec.ts
```

### Manual Testing Checklist
- [ ] Dashboard loads and displays status
- [ ] WebSocket connects and streams data
- [ ] Camera feed displays correctly
- [ ] Gesture controls execute commands
- [ ] Walking controls function properly
- [ ] Head movement responds correctly
- [ ] Vision analysis triggers and displays
- [ ] Mobile responsive layout works
- [ ] Error states display correctly
- [ ] Reconnection logic works

## Deployment

### Local Development
```bash
cd frontend
npm install
npm run dev
# Access: http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
# Or deploy to Vercel/Netlify
```

### Docker Deployment
```bash
docker build -t nao-dashboard .
docker run -p 3000:3000 nao-dashboard
```

### Cloud Deployment
- **Vercel** - Automatic Next.js deployment
- **Netlify** - JAMstack hosting
- **AWS Amplify** - Full-stack deployment
- **Azure Static Web Apps** - Enterprise hosting

## Security

### Authentication (Future)
```typescript
// JWT-based authentication
const token = await login(username, password);
localStorage.setItem('auth_token', token);

// API requests with auth
fetch('/api/robot/status', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

### Security Best Practices
- Environment variables for sensitive config
- HTTPS in production
- CORS properly configured
- Input validation on all commands
- Rate limiting on API calls
- XSS protection
- CSRF tokens for mutations

## Integration Points

### S4 ↔ S1 (Backend)
- REST API for commands
- WebSocket for real-time data
- MJPEG stream for camera
- Error handling and reconnection

### S4 ↔ S2 (Vision)
- Display vision analysis results
- Interactive query interface
- Camera frame visualization
- Analysis history

### S4 ↔ S3 (Motion)
- Motion command interface
- Real-time joint position display
- Kinematics visualization
- Safety status indicators

## User Guide

### Getting Started
1. Open dashboard at `http://localhost:3000`
2. Wait for "Connected" status (green indicator)
3. View live camera feed in main panel
4. Use gesture buttons for quick actions
5. Navigate to Teleop for advanced controls

### Common Tasks

**Execute a gesture:**
1. Click gesture button (Wave, Point, etc.)
2. Watch robot perform animation
3. Check status for completion

**Walk the robot:**
1. Go to Teleop view
2. Select direction (Forward/Back/Left/Right)
3. Set duration with slider
4. Click "Execute Walk"

**Ask vision question:**
1. Scroll to Vision Panel
2. Click "Analyze Now" or enter custom query
3. View analysis results
4. Check timestamp for freshness

## Troubleshooting

### Dashboard not loading
- Check frontend server is running
- Verify port 3000 is available
- Check browser console for errors
- Clear browser cache

### WebSocket disconnects
- Check backend WebSocket endpoint
- Verify firewall rules
- Check network connectivity
- Review backend logs

### Camera feed not displaying
- Ensure Webots is running
- Check backend MJPEG stream
- Verify camera permissions
- Try refreshing browser

### Commands not executing
- Check connection status
- Verify backend is running
- Check API endpoint configuration
- Review browser network tab

## Future Enhancements

### Planned Features
- User authentication and authorization
- Multi-robot fleet management
- Historical data playback
- Advanced analytics dashboard
- Customizable dashboard layouts
- Dark mode theme
- Voice command integration
- Mobile app (React Native)

### Advanced Capabilities
- Real-time video processing
- Collaborative control (multiple users)
- AR/VR interface
- Predictive maintenance alerts
- Automated mission planning
- Integration with other systems

---

**Status:** Production Ready
**Framework:** Next.js 15 + React 18
**Last Updated:** 2025-11-30
**Maintainer:** Team EEE
