'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  History,
  Radio,
  Cpu,
  RotateCcw,
  RotateCw,
  Hand,
  Pointer,
  Armchair,
  Gauge,
  Compass
} from 'lucide-react'

const CAMERA_FEED_URL = (process.env.NEXT_PUBLIC_CAMERA_FEED_URL || '').trim()

interface RobotStatus {
  connected: boolean
  current_gesture?: string
  is_moving: boolean
  head_position?: { yaw: number; pitch: number }
  motor_positions?: Record<string, number>
  imu?: {
    accelerometer: { x: number; y: number; z: number }
    gyroscope: { x: number; y: number; z: number }
  }
}

interface CommandLogEntry {
  label: string
  timestamp: string
}

const formatAngle = (value?: number) =>
  typeof value === 'number' ? value.toFixed(2) : '0.00'

const formatImuValue = (value?: number) =>
  typeof value === 'number' ? value.toFixed(3) : '0.000'

export default function RobotControl() {
  const [status, setStatus] = useState<RobotStatus>({
    connected: false,
    is_moving: false,
    head_position: { yaw: 0, pitch: 0 },
    motor_positions: {}
  })
  const [loading, setLoading] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)
  const [commandLog, setCommandLog] = useState<CommandLogEntry[]>([])
  const [walkDuration, setWalkDuration] = useState(2)
  const [cameraError, setCameraError] = useState(false)

  const API_BASE = 'http://localhost:8000'
  const cameraReady = Boolean(CAMERA_FEED_URL) && !cameraError
  const controlsDisabled = loading || !wsConnected

  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8000/api/robot/ws')

      ws.onopen = () => setWsConnected(true)
      ws.onmessage = (event) => setStatus(JSON.parse(event.data))
      ws.onerror = () => setWsConnected(false)
      ws.onclose = () => {
        setWsConnected(false)
        setTimeout(connectWebSocket, 3000)
      }

      return ws
    }

    const ws = connectWebSocket()
    return () => ws.close()
  }, [])

  useEffect(() => {
    const connectRobot = async () => {
      try {
        await fetch(`${API_BASE}/api/robot/connect`, { method: 'POST' })
      } catch (error) {
        console.error('Failed to connect to robot:', error)
      }
    }
    connectRobot()
  }, [])

  const logCommand = (label: string) => {
    const entry = {
      label,
      timestamp: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    setCommandLog((prev) => [entry, ...prev].slice(0, 8))
  }

  const sendCommand = async (
    endpoint: string,
    data: Record<string, unknown>,
    label: string
  ) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (!response.ok) {
        throw new Error('Command rejected by backend')
      }

      logCommand(label)
    } catch (error) {
      console.error('Command failed:', error)
      alert('Command failed. Ensure the backend is running on http://localhost:8000')
    } finally {
      setLoading(false)
    }
  }

  const gestures = [
    { label: 'Wave', value: 'wave', icon: Hand },
    { label: 'Point', value: 'point', icon: Pointer },
    { label: 'Stand', value: 'stand', icon: Armchair }
  ]

  const headDirections = [
    { label: 'Up', value: 'up', icon: ArrowUp },
    { label: 'Left', value: 'left', icon: ArrowLeft },
    { label: 'Center', value: 'center', icon: CircleIcon },
    { label: 'Right', value: 'right', icon: ArrowRight },
    { label: 'Down', value: 'down', icon: ArrowDown }
  ]

  const movements = [
    { label: 'Forward', value: 'forward', icon: ArrowUp },
    { label: 'Back', value: 'backward', icon: ArrowDown },
    { label: 'Turn Left', value: 'turn_left', icon: RotateCcw },
    { label: 'Turn Right', value: 'turn_right', icon: RotateCw }
  ]

  const statusBlocks = [
    {
      label: 'Backend',
      value: wsConnected ? 'Connected' : 'Offline',
      ok: wsConnected,
      icon: Radio
    },
    {
      label: 'Robot',
      value: status.connected ? 'Ready' : 'Standby',
      ok: status.connected,
      icon: Cpu
    },
    {
      label: 'Motion',
      value: status.is_moving ? 'Moving' : 'Idle',
      ok: status.is_moving,
      icon: Activity
    }
  ]

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">System status</p>
            <span className="text-xs text-slate-300">
              Head yaw {formatAngle(status.head_position?.yaw)} / pitch {formatAngle(status.head_position?.pitch)}
            </span>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {statusBlocks.map((block) => (
              <div
                key={block.label}
                className={`flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-3 ${
                  block.ok ? 'bg-emerald-500/20 text-emerald-100' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <block.icon className="h-5 w-5" />
                <div>
                  <p className="text-xs uppercase tracking-wide">{block.label}</p>
                  <p className="text-sm font-semibold">{block.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <p className="text-sm font-semibold mb-4">IMU Sensors</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="h-5 w-5 text-blue-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-blue-300">Accelerometer</p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">X-axis:</span>
                  <span className="font-mono text-slate-200">{formatImuValue(status.imu?.accelerometer.x)} m/s²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Y-axis:</span>
                  <span className="font-mono text-slate-200">{formatImuValue(status.imu?.accelerometer.y)} m/s²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Z-axis:</span>
                  <span className="font-mono text-slate-200">{formatImuValue(status.imu?.accelerometer.z)} m/s²</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-800/80 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Compass className="h-5 w-5 text-purple-400" />
                <p className="text-xs font-semibold uppercase tracking-wide text-purple-300">Gyroscope</p>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">X-axis:</span>
                  <span className="font-mono text-slate-200">{formatImuValue(status.imu?.gyroscope.x)} rad/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Y-axis:</span>
                  <span className="font-mono text-slate-200">{formatImuValue(status.imu?.gyroscope.y)} rad/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Z-axis:</span>
                  <span className="font-mono text-slate-200">{formatImuValue(status.imu?.gyroscope.z)} rad/s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">NAO's Camera View</p>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <Camera className="h-4 w-4" />
              {cameraReady ? 'Live' : 'Waiting for frames'}
            </div>
          </div>
          {cameraReady ? (
            <div className="mt-4 overflow-hidden rounded-2xl border border-white/10 bg-black">
              <img
                key={CAMERA_FEED_URL}
                src={CAMERA_FEED_URL}
                alt="NAO Robot Camera Feed"
                className="h-full w-full object-contain"
                onError={() => setCameraError(true)}
                onLoad={() => setCameraError(false)}
              />
              <div className="px-3 py-2 text-xs text-slate-400 bg-slate-900/80">
                What NAO sees • 320x240 @ ~5 FPS
              </div>
            </div>
          ) : (
            <div className="mt-4 rounded-2xl border border-dashed border-white/20 bg-slate-900/60 p-6 text-sm text-slate-300">
              {cameraError ? (
                <div className="space-y-2">
                  <p className="text-amber-400">⚠ Camera stream unavailable</p>
                  <p>Check Webots console for:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>✓ PIL/Pillow available</li>
                    <li>✓ Camera enabled (320x240)</li>
                    <li>✓ Connected to backend</li>
                  </ul>
                  <p className="text-xs pt-2">
                    Install PIL: <code className="rounded bg-slate-800 px-1 py-0.5">pip install pillow</code>
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p>Waiting for camera frames...</p>
                  <p className="text-xs text-slate-400">
                    Make sure Webots simulation is running
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4 text-sm text-cyan-100">
            <p className="font-semibold text-cyan-300 mb-2">💡 Environment View</p>
            <p className="text-xs text-slate-300">
              To see the robot moving in the office environment, check the <strong>Webots simulation window</strong>.
              The camera follows NAO automatically as it moves around!
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Command log</p>
            <History className="h-4 w-4 text-slate-300" />
          </div>
          <div className="mt-4 space-y-2 text-sm text-slate-200">
            {commandLog.length ? (
              commandLog.map((entry) => (
                <div
                  key={`${entry.label}-${entry.timestamp}`}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-2"
                >
                  <span>{entry.label}</span>
                  <span className="text-xs text-slate-400">{entry.timestamp}</span>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-white/20 bg-slate-900/60 px-4 py-6 text-center text-xs uppercase tracking-wide text-slate-400">
                No commands sent yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Gestures</p>
            <span className="text-xs text-slate-300">{status.current_gesture || 'No active gesture'}</span>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {gestures.map((gesture) => (
              <button
                key={gesture.value}
                onClick={() => sendCommand('/api/robot/gesture', { gesture: gesture.value }, gesture.label)}
                disabled={controlsDisabled}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-center text-sm font-semibold uppercase tracking-wide transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <gesture.icon className="mb-2 h-6 w-6" />
                {gesture.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Head control</p>
            <span className="text-xs text-slate-300">
              Yaw {formatAngle(status.head_position?.yaw)} · Pitch {formatAngle(status.head_position?.pitch)}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {headDirections.map((direction) => (
              <button
                key={direction.label}
                onClick={() =>
                  sendCommand('/api/robot/head/move', { direction: direction.value }, `Head ${direction.label}`)
                }
                disabled={controlsDisabled}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-slate-800/80 p-4 text-center text-xs font-semibold uppercase tracking-wide transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <direction.icon className="mb-2 h-5 w-5" />
                {direction.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 text-white">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Locomotion</p>
            <label className="text-xs text-slate-300">
              Duration
              <input
                type="number"
                min={0.5}
                max={5}
                step={0.5}
                value={walkDuration}
                onChange={(e) => setWalkDuration(Number(e.target.value))}
                className="ml-2 w-16 rounded border border-white/20 bg-slate-800/80 p-1 text-right text-white"
              />
              s
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {movements.map((movement) => (
              <button
                key={movement.value}
                onClick={() =>
                  sendCommand(
                    '/api/robot/walk',
                    { movement: movement.value, duration: walkDuration },
                    `${movement.label} ${walkDuration}s`
                  )
                }
                disabled={controlsDisabled}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-800/80 px-4 py-3 text-left text-sm font-semibold uppercase tracking-wide transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>{movement.label}</span>
                <movement.icon className="h-5 w-5" />
              </button>
            ))}
          </div>
        </div>

        {!wsConnected && (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            Backend offline. Start it with
            <code className="ml-2 rounded bg-amber-400/20 px-2 py-0.5">cd backend && python -m app.main</code>
          </div>
        )}
      </div>
    </div>
  )
}

function CircleIcon() {
  return <span className="inline-block h-5 w-5 rounded-full border border-current" />
}
