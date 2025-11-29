'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import CameraFeed from '@/components/ui/CameraFeed'
import VisionPanel from '@/components/ui/VisionPanel'
import KinematicsPanel from '@/components/ui/KinematicsPanel'
import { useState, useRef } from 'react'
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Hand, Pointer, User, Eye, Maximize2, Minimize2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Layers
} from 'lucide-react'

export default function TeleopView() {
  const { status, connectionState, loading, sendCommand } = useRobot()
  const [fullscreen, setFullscreen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [showPanels, setShowPanels] = useState(true)
  const joystickRef = useRef<HTMLDivElement>(null)
  const [joystickActive, setJoystickActive] = useState(false)
  const [joystickPos, setJoystickPos] = useState({ x: 0, y: 0 })

  const isConnected = connectionState === 'connected'
  const controlsDisabled = loading || !isConnected

  // Joystick touch/mouse handling
  const handleJoystickStart = (e: React.TouchEvent | React.MouseEvent) => {
    setJoystickActive(true)
    handleJoystickMove(e)
  }

  const handleJoystickMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!joystickRef.current) return
    
    const rect = joystickRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const maxRadius = rect.width / 2 - 30
    let dx = clientX - centerX
    let dy = clientY - centerY
    
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance > maxRadius) {
      dx = (dx / distance) * maxRadius
      dy = (dy / distance) * maxRadius
    }
    
    setJoystickPos({ x: dx, y: dy })
  }

  const handleJoystickEnd = async () => {
    setJoystickActive(false)
    
    // Determine direction from joystick position
    const threshold = 30
    if (Math.abs(joystickPos.x) > threshold || Math.abs(joystickPos.y) > threshold) {
      if (Math.abs(joystickPos.y) > Math.abs(joystickPos.x)) {
        // Vertical movement
        if (joystickPos.y < -threshold) {
          await sendCommand('/api/robot/walk', { movement: 'forward', duration: 1 }, 'Forward')
        } else if (joystickPos.y > threshold) {
          await sendCommand('/api/robot/walk', { movement: 'backward', duration: 1 }, 'Backward')
        }
      } else {
        // Horizontal movement (turning)
        if (joystickPos.x < -threshold) {
          await sendCommand('/api/robot/walk', { movement: 'turn_left', duration: 1 }, 'Turn Left')
        } else if (joystickPos.x > threshold) {
          await sendCommand('/api/robot/walk', { movement: 'turn_right', duration: 1 }, 'Turn Right')
        }
      }
    }
    
    setJoystickPos({ x: 0, y: 0 })
  }

  const gestures = [
    { label: 'Wave', value: 'wave', icon: Hand },
    { label: 'Point', value: 'point', icon: Pointer },
    { label: 'Stand', value: 'stand', icon: User },
  ]

  const headDirections = [
    { label: 'Up', value: 'up', icon: ChevronUp, gridArea: '1 / 2' },
    { label: 'Left', value: 'left', icon: ChevronLeft, gridArea: '2 / 1' },
    { label: 'Center', value: 'center', icon: Eye, gridArea: '2 / 2' },
    { label: 'Right', value: 'right', icon: ChevronRight, gridArea: '2 / 3' },
    { label: 'Down', value: 'down', icon: ChevronDown, gridArea: '3 / 2' },
  ]

  return (
    <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
      {/* Camera Feed */}
      <div className={`relative ${fullscreen ? 'h-full' : 'aspect-video'} bg-black rounded-2xl overflow-hidden`}>
        <CameraFeed 
          isConnected={isConnected} 
          className="w-full h-full"
          showControls={false}
        />
        
        {/* Overlay Controls */}
        {showOverlay && (
          <>
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                  <span className="text-sm text-white font-medium">
                    {status.connected ? 'Live' : 'Offline'}
                  </span>
                </div>
                <button
                  onClick={() => setFullscreen(!fullscreen)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
                >
                  {fullscreen ? (
                    <Minimize2 className="w-5 h-5 text-white" />
                  ) : (
                    <Maximize2 className="w-5 h-5 text-white" />
                  )}
                </button>
                <button
                  onClick={() => setShowPanels(!showPanels)}
                  className={`p-2 rounded-lg transition ${showPanels ? 'bg-cyan-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                >
                  <Layers className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
              <div className="flex items-end justify-between gap-4">
                {/* Virtual Joystick */}
                <div
                  ref={joystickRef}
                  className="relative w-32 h-32 rounded-full bg-white/10 border-2 border-white/30 touch-none"
                  onTouchStart={handleJoystickStart}
                  onTouchMove={joystickActive ? handleJoystickMove : undefined}
                  onTouchEnd={handleJoystickEnd}
                  onMouseDown={handleJoystickStart}
                  onMouseMove={joystickActive ? handleJoystickMove : undefined}
                  onMouseUp={handleJoystickEnd}
                  onMouseLeave={joystickActive ? handleJoystickEnd : undefined}
                >
                  {/* Direction indicators */}
                  <ArrowUp className="absolute top-2 left-1/2 -translate-x-1/2 w-4 h-4 text-white/30" />
                  <ArrowDown className="absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 text-white/30" />
                  <ArrowLeft className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <ArrowRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  
                  {/* Joystick knob */}
                  <div
                    className={`absolute w-12 h-12 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50 transition-all ${
                      joystickActive ? 'scale-110' : ''
                    }`}
                    style={{
                      left: `calc(50% + ${joystickPos.x}px - 24px)`,
                      top: `calc(50% + ${joystickPos.y}px - 24px)`,
                    }}
                  />
                </div>

                {/* Gesture Buttons */}
                <div className="flex gap-2">
                  {gestures.map((gesture) => (
                    <button
                      key={gesture.value}
                      onClick={() => sendCommand('/api/robot/gesture', { gesture: gesture.value }, gesture.label)}
                      disabled={controlsDisabled}
                      className="p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 
                        transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <gesture.icon className="w-6 h-6 text-white" />
                    </button>
                  ))}
                </div>

                {/* Head Control D-Pad */}
                <div className="grid grid-cols-3 gap-1 w-24">
                  {headDirections.map((dir) => (
                    <button
                      key={dir.value}
                      onClick={() => sendCommand('/api/robot/head/move', { direction: dir.value }, `Head ${dir.label}`)}
                      disabled={controlsDisabled}
                      className="p-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 
                        transition disabled:opacity-50"
                      style={{ gridArea: dir.gridArea }}
                    >
                      <dir.icon className="w-4 h-4 text-white mx-auto" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Non-fullscreen: Additional Info */}
      {!fullscreen && (
        <div className="mt-4 space-y-4">
          {/* Telemetry Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Battery</p>
              <p className="text-lg font-bold text-emerald-400">{status.battery.toFixed(0)}%</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Temperature</p>
              <p className="text-lg font-bold text-orange-400">{status.temperature.toFixed(0)}°C</p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400">Status</p>
              <p className={`text-lg font-bold ${status.is_moving ? 'text-cyan-400' : 'text-slate-400'}`}>
                {status.is_moving ? 'Moving' : 'Idle'}
              </p>
            </div>
          </div>

          {/* AI Vision & Kinematics Panels */}
          {showPanels && (
            <div className="grid lg:grid-cols-2 gap-4">
              <VisionPanel isConnected={isConnected} />
              <KinematicsPanel joints={status.joints} />
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-800/30 rounded-xl p-4 text-center">
            <p className="text-sm text-slate-400">
              Use the <span className="text-cyan-400">joystick</span> to move • 
              <span className="text-purple-400"> D-pad</span> for head • 
              <span className="text-pink-400"> Buttons</span> for gestures
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
