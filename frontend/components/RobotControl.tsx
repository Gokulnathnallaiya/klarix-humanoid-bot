'use client'

import { useState, useEffect } from 'react'
import {
  Play, Square, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Hand, Users, Armchair, ChevronUp, ChevronDown,
  RotateCcw, RotateCw, Activity, Circle
} from 'lucide-react'

interface RobotStatus {
  connected: boolean
  current_gesture?: string
  is_moving: boolean
  head_position?: { yaw: number; pitch: number }
  motor_positions?: Record<string, number>
}

export default function RobotControl() {
  const [status, setStatus] = useState<RobotStatus>({
    connected: false,
    is_moving: false
  })
  const [loading, setLoading] = useState(false)
  const [wsConnected, setWsConnected] = useState(false)

  const API_BASE = 'http://localhost:8000'

  // WebSocket connection for real-time updates
  useEffect(() => {
    const connectWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8000/api/robot/ws')

      ws.onopen = () => {
        console.log('WebSocket connected')
        setWsConnected(true)
      }

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        setStatus(data)
      }

      ws.onerror = (error) => {
        console.error('WebSocket error:', error)
        setWsConnected(false)
      }

      ws.onclose = () => {
        console.log('WebSocket disconnected')
        setWsConnected(false)
        // Attempt to reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }

      return ws
    }

    const ws = connectWebSocket()
    return () => ws.close()
  }, [])

  // Connect to robot on mount
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

  const sendCommand = async (endpoint: string, data: any) => {
    setLoading(true)
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await response.json()
      console.log('Command result:', result)
    } catch (error) {
      console.error('Command failed:', error)
      alert('Failed to send command. Make sure backend is running on http://localhost:8000')
    } finally {
      setLoading(false)
    }
  }

  const gestures = [
    { name: 'Wave', value: 'wave', icon: Hand, color: 'bg-purple-500 hover:bg-purple-600' },
    { name: 'Point', value: 'point', icon: Users, color: 'bg-purple-500 hover:bg-purple-600' },
    { name: 'Stand', value: 'stand', icon: Armchair, color: 'bg-purple-500 hover:bg-purple-600' },
  ]

  const movements = [
    { name: 'Forward', value: 'forward', icon: ArrowUp, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Backward', value: 'backward', icon: ArrowDown, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Turn Left', value: 'turn_left', icon: RotateCcw, color: 'bg-green-500 hover:bg-green-600' },
    { name: 'Turn Right', value: 'turn_right', icon: RotateCw, color: 'bg-green-500 hover:bg-green-600' },
  ]

  const headDirections = [
    { name: 'Up', value: 'up', icon: ChevronUp, color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Down', value: 'down', icon: ChevronDown, color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Left', value: 'left', icon: ArrowLeft, color: 'bg-blue-500 hover:bg-blue-600' },
    { name: 'Right', value: 'right', icon: ArrowRight, color: 'bg-blue-500 hover:bg-blue-600' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Status Panel */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-indigo-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Activity className="w-6 h-6 mr-2" />
          Robot Status
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Backend:</span>
            <div className="flex items-center">
              <Circle
                className={`w-3 h-3 mr-2 ${wsConnected ? 'fill-green-500 text-green-500' : 'fill-red-500 text-red-500'}`}
              />
              <span className={`font-bold ${wsConnected ? 'text-green-600' : 'text-red-600'}`}>
                {wsConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Robot:</span>
            <div className="flex items-center">
              <Circle
                className={`w-3 h-3 mr-2 ${status.connected ? 'fill-green-500 text-green-500' : 'fill-yellow-500 text-yellow-500'}`}
              />
              <span className={`font-bold ${status.connected ? 'text-green-600' : 'text-yellow-600'}`}>
                {status.connected ? 'Ready' : 'Standby'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600 font-medium">Status:</span>
            <span className={`font-bold ${status.is_moving ? 'text-blue-600' : 'text-gray-600'}`}>
              {status.is_moving ? '🏃 Moving' : '🧍 Idle'}
            </span>
          </div>

          {status.current_gesture && (
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200">
              <span className="text-gray-600 font-medium">Gesture:</span>
              <span className="font-bold text-purple-600 uppercase">{status.current_gesture}</span>
            </div>
          )}
        </div>
      </div>

      {/* Gesture Control */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-purple-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Hand className="w-6 h-6 mr-2" />
          Gestures
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {gestures.map((gesture) => (
            <button
              key={gesture.value}
              onClick={() => sendCommand('/api/robot/gesture', { gesture: gesture.value })}
              disabled={loading || !wsConnected}
              className={`flex flex-col items-center justify-center p-4 ${gesture.color} text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
            >
              <gesture.icon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{gesture.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Head Control */}
      <div className="bg-white rounded-lg shadow-xl p-6 border-t-4 border-blue-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Circle className="w-6 h-6 mr-2" />
          Head Control
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {headDirections.map((direction) => (
            <button
              key={direction.value}
              onClick={() => sendCommand('/api/robot/head/move', { direction: direction.value })}
              disabled={loading || !wsConnected}
              className={`flex flex-col items-center justify-center p-4 ${direction.color} text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
            >
              <direction.icon className="w-8 h-8 mb-2" />
              <span className="text-sm font-medium">{direction.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Movement Control */}
      <div className="bg-white rounded-lg shadow-xl p-6 lg:col-span-3 border-t-4 border-green-500">
        <h2 className="text-2xl font-bold mb-4 text-gray-800 flex items-center">
          <Play className="w-6 h-6 mr-2" />
          Movement Control
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {movements.map((movement) => (
            <button
              key={movement.value}
              onClick={() => sendCommand('/api/robot/walk', { movement: movement.value, duration: 2.0 })}
              disabled={loading || !wsConnected}
              className={`flex flex-col items-center justify-center p-6 ${movement.color} text-white rounded-lg transition-all transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-md`}
            >
              <movement.icon className="w-10 h-10 mb-2" />
              <span className="text-base font-medium">{movement.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {!wsConnected && (
        <div className="lg:col-span-3 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Backend not connected.</strong> Please start the backend server:
                <code className="block mt-2 bg-yellow-100 p-2 rounded">cd backend && python -m app.main</code>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
