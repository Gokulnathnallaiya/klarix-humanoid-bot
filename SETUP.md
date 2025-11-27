# NAO Robot Control - Full Stack Application Setup

## Project Structure

```
klarix-humanoid-bot/
├── webots/                  # Webots simulation files
│   ├── worlds/
│   │   └── nao_office_demo.wbt
│   └── controllers/
│       └── nao_office_assistant/
├── backend/                 # Python FastAPI backend
│   ├── app/
│   │   ├── main.py
│   │   ├── api/robot.py
│   │   ├── models/robot.py
│   │   └── services/robot_controller.py
│   ├── requirements.txt
│   └── README.md
├── frontend/                # Next.js React frontend
│   ├── app/
│   ├── components/
│   ├── lib/
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## Setup Instructions

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend server
python -m app.main
```

Backend will be available at: **http://localhost:8000**
- API Docs: http://localhost:8000/docs
- WebSocket: ws://localhost:8000/api/robot/ws

### Step 2: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev
```

Frontend will be available at: **http://localhost:3000**

### Step 3: Run Webots Simulation

```bash
# Open Webots and load the world file
webots webots/worlds/nao_office_demo.wbt
```

## Next Steps to Complete

### 1. Create Frontend UI Components

Create the following files in `frontend/`:

#### `app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
}
```

#### `app/layout.tsx`
```typescript
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NAO Robot Control',
  description: 'Control NAO humanoid robot through web interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

#### `app/page.tsx`
```typescript
import RobotControl from '@/components/RobotControl'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          NAO Robot Control Center
        </h1>
        <RobotControl />
      </div>
    </main>
  )
}
```

#### `components/RobotControl.tsx`
```typescript
'use client'

import { useState, useEffect } from 'react'
import {
  Play, Square, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Hand, Users, Armchair, ChevronUp, ChevronDown,
  RotateCcw, RotateCw
} from 'lucide-react'

interface RobotStatus {
  connected: boolean
  current_gesture?: string
  is_moving: boolean
}

export default function RobotControl() {
  const [status, setStatus] = useState<RobotStatus>({ connected: false, is_moving: false })
  const [loading, setLoading] = useState(false)

  const API_BASE = 'http://localhost:8000'

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8000/api/robot/ws')

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setStatus(data)
    }

    ws.onerror = () => console.error('WebSocket error')
    ws.onclose = () => console.log('WebSocket disconnected')

    return () => ws.close()
  }, [])

  const sendCommand = async (endpoint: string, data: any) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      console.log(result)
    } catch (error) {
      console.error('Command failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const gestures = [
    { name: 'Wave', value: 'wave', icon: Hand },
    { name: 'Point', value: 'point', icon: Users },
    { name: 'Stand', value: 'stand', icon: Armchair },
  ]

  const movements = [
    { name: 'Forward', value: 'forward', icon: ArrowUp },
    { name: 'Backward', value: 'backward', icon: ArrowDown },
    { name: 'Turn Left', value: 'turn_left', icon: RotateCcw },
    { name: 'Turn Right', value: 'turn_right', icon: RotateCw },
  ]

  const headDirections = [
    { name: 'Up', value: 'up', icon: ChevronUp },
    { name: 'Down', value: 'down', icon: ChevronDown },
    { name: 'Left', value: 'left', icon: ArrowLeft },
    { name: 'Right', value: 'right', icon: ArrowRight },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Panel */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Robot Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Connection:</span>
            <span className={`font-bold ${status.connected ? 'text-green-600' : 'text-red-600'}`}>
              {status.connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Status:</span>
            <span className={`font-bold ${status.is_moving ? 'text-blue-600' : 'text-gray-600'}`}>
              {status.is_moving ? 'Moving' : 'Idle'}
            </span>
          </div>
          {status.current_gesture && (
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Gesture:</span>
              <span className="font-bold text-purple-600">{status.current_gesture}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gesture Control */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Gestures</h2>
        <div className="grid grid-cols-2 gap-3">
          {gestures.map((gesture) => (
            <button
              key={gesture.value}
              onClick={() => sendCommand('/api/robot/gesture', { gesture: gesture.value })}
              disabled={loading}
              className="flex flex-col items-center justify-center p-4 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <gesture.icon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{gesture.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Head Control */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Head Control</h2>
        <div className="grid grid-cols-2 gap-3">
          {headDirections.map((direction) => (
            <button
              key={direction.value}
              onClick={() => sendCommand('/api/robot/head/move', { direction: direction.value })}
              disabled={loading}
              className="flex flex-col items-center justify-center p-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <direction.icon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{direction.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Movement Control */}
      <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-3">
        <h2 className="text-2xl font-bold mb-4">Movement Control</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {movements.map((movement) => (
            <button
              key={movement.value}
              onClick={() => sendCommand('/api/robot/walk', { movement: movement.value, duration: 2.0 })}
              disabled={loading}
              className="flex flex-col items-center justify-center p-4 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              <movement.icon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{movement.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 3. Run the Complete System

Open 3 terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python -m app.main
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

**Terminal 3 - Webots:**
```bash
webots webots/worlds/nao_office_demo.wbt
```

### 4. Access the Application

Open your browser and visit:
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:8000/docs

## Features Implemented

✅ FastAPI backend with WebSocket support
✅ REST API for robot control
✅ Next.js frontend with TypeScript
✅ Real-time status updates via WebSocket
✅ Gesture control (wave, point, stand)
✅ Head movement control
✅ Walking commands
✅ Modern, responsive UI with Tailwind CSS

## Next Features to Add

- [ ] Connect backend to actual Webots controller
- [ ] Add camera feed display
- [ ] Add sensor data visualization
- [ ] Add custom gesture programming
- [ ] Add motion recording/playback
- [ ] Add multiple robot support
