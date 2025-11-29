'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import CameraFeed from '@/components/ui/CameraFeed'
import KinematicsPanel from '@/components/ui/KinematicsPanel'
import VoiceAssistant from '@/components/ui/VoiceAssistant'
import { useState } from 'react'
import { 
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, 
  Hand, Pointer, User, Eye, Maximize2, Minimize2,
  ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  Layers, Gamepad2
} from 'lucide-react'

export default function TeleopView() {
  const { status, connectionState, loading, sendCommand } = useRobot()
  const [fullscreen, setFullscreen] = useState(false)
  const [showOverlay, setShowOverlay] = useState(true)
  const [showPanels, setShowPanels] = useState(true)
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
    const joystickElement = e.currentTarget as HTMLDivElement
    if (!joystickElement) return

    const rect = joystickElement.getBoundingClientRect()
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
    <div className="h-full flex flex-col overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between flex-shrink-0 mb-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-slate-600 dark:text-slate-400" />
            Teleoperation
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manual robot control with live camera feed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            status.connected
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-medium">
              {status.connected ? 'Live Feed Active' : 'Waiting for Feed'}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop: 2-column layout */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-4 flex-1 overflow-auto">
        {/* Main Camera & Controls */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`relative ${fullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}>
            {/* Camera Feed */}
            <div className={`relative ${fullscreen ? 'h-full' : 'aspect-video lg:aspect-[16/9]'} bg-black rounded-2xl overflow-hidden`}>
              <CameraFeed
                isConnected={isConnected}
                className="w-full h-full"
                showControls={false}
              />

              {/* Overlay Controls - Desktop Only */}
              {showOverlay && !fullscreen && (
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowPanels(!showPanels)}
                          className={`p-2 rounded-lg transition ${showPanels ? 'bg-blue-500/30' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                          <Layers className="w-5 h-5 text-white" />
                        </button>
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
                      </div>
                    </div>
                  </div>

                  {/* Bottom Controls - Desktop Only */}
                  <div className="hidden lg:block absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
                    <div className="flex items-end justify-between gap-4">
                      {/* Virtual Joystick */}
                      <div
                        className="relative w-32 h-32 lg:w-36 lg:h-36 rounded-full bg-white/10 border-2 border-white/30 touch-none"
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
                          className={`absolute w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-blue-600 shadow-lg shadow-blue-600/50 transition-all ${
                            joystickActive ? 'scale-110' : ''
                          }`}
                          style={{
                            left: `calc(50% + ${joystickPos.x}px - ${joystickActive ? 28 : 24}px)`,
                            top: `calc(50% + ${joystickPos.y}px - ${joystickActive ? 28 : 24}px)`,
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
                            className="p-3 lg:p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 
                              transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <gesture.icon className="w-6 h-6 lg:w-7 lg:h-7 text-white" />
                          </button>
                        ))}
                      </div>

                      {/* Head Control D-Pad */}
                      <div className="grid grid-cols-3 gap-1 w-24 lg:w-28">
                        {headDirections.map((dir) => (
                          <button
                            key={dir.value}
                            onClick={() => sendCommand('/api/robot/head/move', { direction: dir.value }, `Head ${dir.label}`)}
                            disabled={controlsDisabled}
                            className="p-2 lg:p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 
                              transition disabled:opacity-50"
                            style={{ gridArea: dir.gridArea }}
                          >
                            <dir.icon className="w-4 h-4 lg:w-5 lg:h-5 text-white mx-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Mobile Controls - Below Camera */}
          <div className="lg:hidden grid grid-cols-2 gap-3">
            {/* Virtual Joystick for Mobile */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-3 text-center">Movement</p>
              <div className="flex justify-center">
                <div
                  className="relative w-40 h-40 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700"
                  onTouchStart={handleJoystickStart}
                  onTouchMove={joystickActive ? handleJoystickMove : undefined}
                  onTouchEnd={handleJoystickEnd}
                  style={{ touchAction: 'none' }}
                >
                  {/* Direction indicators */}
                  <ArrowUp className="absolute top-3 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <ArrowDown className="absolute bottom-3 left-1/2 -translate-x-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <ArrowLeft className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                  <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />

                  {/* Joystick knob */}
                  <div
                    className={`absolute w-16 h-16 rounded-full bg-blue-600 shadow-lg transition-transform ${
                      joystickActive ? 'scale-110' : ''
                    }`}
                    style={{
                      left: `calc(50% + ${joystickPos.x}px - 32px)`,
                      top: `calc(50% + ${joystickPos.y}px - 32px)`,
                      pointerEvents: 'none'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Gesture & Head Controls */}
            <div className="space-y-3">
              {/* Gestures */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Gestures</p>
                <div className="flex gap-2">
                  {gestures.map((gesture) => (
                    <button
                      key={gesture.value}
                      onClick={() => sendCommand('/api/robot/gesture', { gesture: gesture.value }, gesture.label)}
                      disabled={controlsDisabled}
                      className="flex-1 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700
                        transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <gesture.icon className="w-6 h-6 mx-auto text-slate-700 dark:text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Head Control */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-sm">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Head</p>
                <div className="grid grid-cols-3 gap-1.5">
                  {headDirections.map((dir) => (
                    <button
                      key={dir.value}
                      onClick={() => sendCommand('/api/robot/head/move', { direction: dir.value }, `Head ${dir.label}`)}
                      disabled={controlsDisabled}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700
                        transition disabled:opacity-50"
                      style={{ gridArea: dir.gridArea }}
                    >
                      <dir.icon className="w-5 h-5 mx-auto text-slate-700 dark:text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar - Desktop */}
        <div className="space-y-4">
          {/* Telemetry Quick Stats */}
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 lg:p-4 shadow-sm text-center lg:text-left lg:flex lg:items-center lg:justify-between">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Battery</p>
              <p className={`text-lg lg:text-2xl font-semibold ${
                status.battery > 40 ? 'text-emerald-600 dark:text-emerald-400' : status.battery > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`}>{status.battery.toFixed(0)}%</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 lg:p-4 shadow-sm text-center lg:text-left lg:flex lg:items-center lg:justify-between">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Temperature</p>
              <p className={`text-lg lg:text-2xl font-semibold ${
                status.temperature > 55 ? 'text-red-600 dark:text-red-400' : status.temperature > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-700 dark:text-slate-300'
              }`}>{status.temperature.toFixed(0)}°C</p>
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3 lg:p-4 shadow-sm text-center lg:text-left lg:flex lg:items-center lg:justify-between">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Status</p>
              <p className={`text-lg lg:text-2xl font-semibold ${status.is_moving ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}>
                {status.is_moving ? 'Moving' : 'Idle'}
              </p>
            </div>
          </div>

          {/* Kinematics Panel */}
          {showPanels && <KinematicsPanel joints={status.joints} />}

          {/* Instructions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Controls</h3>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <p>🕹️ <span className="font-medium text-slate-900 dark:text-white">Joystick</span> - Move robot</p>
              <p>🎮 <span className="font-medium text-slate-900 dark:text-white">D-pad</span> - Control head</p>
              <p>👋 <span className="font-medium text-slate-900 dark:text-white">Buttons</span> - Gestures</p>
              <p>🎤 <span className="font-medium text-slate-900 dark:text-white">Voice</span> - Speak commands</p>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Assistant - Floating Panel */}
      <VoiceAssistant />
    </div>
  )
}
