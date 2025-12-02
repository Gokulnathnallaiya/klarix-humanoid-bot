'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { API_CONFIG, getWsUrl } from '@/lib/config'

export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error'

export interface RobotStatus {
  connected: boolean
  is_moving: boolean
  current_gesture?: string
  battery: number
  temperature: number
  cycle_count: number
  head_position?: { yaw: number; pitch: number }
  motor_positions?: Record<string, number>
  joints?: Record<string, number>  // Joint angles in degrees from kinematics
  imu?: {
    accelerometer: { x: number; y: number; z: number }
    gyroscope: { x: number; y: number; z: number }
  }
  lidar?: {
    ranges: number[]
    min_range: number
    max_range: number
    num_points: number
  }
  odometry?: {
    x: number
    y: number
    theta: number
    linear_velocity: number
    angular_velocity: number
  }
  path_history: Array<{ x: number; y: number; theta: number; timestamp: number }>
  alerts: Array<{ type: string; message: string; timestamp: number }>
  ota_version: string
  last_ota_update?: string
}

interface RobotContextType {
  // Connection state
  connectionState: ConnectionState
  connectionError: string | null
  
  // Actions
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  
  // Robot data (only valid when connected)
  status: RobotStatus
  loading: boolean
  sendCommand: (endpoint: string, data: Record<string, unknown>, label: string) => Promise<boolean>
  commandLog: Array<{ label: string; timestamp: string; success: boolean }>
  clearAlerts: () => void
}

const defaultStatus: RobotStatus = {
  connected: false,
  is_moving: false,
  battery: 100,
  temperature: 35,
  cycle_count: 0,
  head_position: { yaw: 0, pitch: 0 },
  motor_positions: {},
  path_history: [],
  alerts: [],
  ota_version: 'v1.0.0',
}

const RobotContext = createContext<RobotContextType | null>(null)

export function useRobot() {
  const context = useContext(RobotContext)
  if (!context) {
    throw new Error('useRobot must be used within RobotProvider')
  }
  return context
}

interface RobotProviderProps {
  children: ReactNode
}

export function RobotProvider({ children }: RobotProviderProps) {
  // Connection state
  const [connectionState, setConnectionState] = useState<ConnectionState>('disconnected')
  const [connectionError, setConnectionError] = useState<string | null>(null)
  
  // Robot state
  const [status, setStatus] = useState<RobotStatus>(defaultStatus)
  const [loading, setLoading] = useState(false)
  const [commandLog, setCommandLog] = useState<Array<{ label: string; timestamp: string; success: boolean }>>([])
  
  // Simulated values
  const [simulatedBattery, setSimulatedBattery] = useState(100)
  const [simulatedTemp, setSimulatedTemp] = useState(35)
  
  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Cleanup WebSocket
  const cleanupWebSocket = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
  }, [])

  // Connect to robot - this is the main entry point
  const connect = useCallback(async () => {
    setConnectionState('connecting')
    setConnectionError(null)
    
    try {
      // Step 1: Check if backend is reachable
      const healthCheck = await fetch(`${API_CONFIG.BASE_URL}/api/robot/status`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      }).catch(() => null)
      
      if (!healthCheck || !healthCheck.ok) {
        throw new Error('Backend server not reachable. Make sure the backend is running on port 8000.')
      }

      // Step 2: Connect to robot via API (checks if Webots is connected)
      const connectResponse = await fetch(`${API_CONFIG.BASE_URL}/api/robot/connect`, {
        method: 'POST',
        signal: AbortSignal.timeout(5000)
      })
      
      if (!connectResponse.ok) {
        const errorData = await connectResponse.json().catch(() => ({}))
        const detail = errorData.detail || 'Failed to connect to robot'
        throw new Error(detail)
      }

      // Step 3: Establish WebSocket connection
      return new Promise<void>((resolve, reject) => {
        cleanupWebSocket()
        
        const ws = new WebSocket(getWsUrl('/api/robot/ws'))
        wsRef.current = ws
        
        const connectionTimeout = setTimeout(() => {
          ws.close()
          reject(new Error('WebSocket connection timeout'))
        }, 10000)

        ws.onopen = () => {
          clearTimeout(connectionTimeout)
          setConnectionState('connected')
          setConnectionError(null)
          console.log('✓ WebSocket connected')
          resolve()
        }

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            setStatus(prev => {
              // Track path history
              const newPathHistory = [...prev.path_history]
              if (data.odometry) {
                const lastPoint = newPathHistory[newPathHistory.length - 1]
                const newPoint = {
                  x: data.odometry.x,
                  y: data.odometry.y,
                  theta: data.odometry.theta,
                  timestamp: Date.now()
                }
                if (!lastPoint || 
                    Math.abs(lastPoint.x - newPoint.x) > 0.01 || 
                    Math.abs(lastPoint.y - newPoint.y) > 0.01) {
                  newPathHistory.push(newPoint)
                  if (newPathHistory.length > 500) {
                    newPathHistory.shift()
                  }
                }
              }

              // Generate alerts
              const newAlerts = [...prev.alerts]
              if (simulatedBattery <= 20 && !newAlerts.find(a => a.type === 'battery_low')) {
                newAlerts.push({
                  type: 'battery_low',
                  message: 'Battery critically low! Consider recharging.',
                  timestamp: Date.now()
                })
              }
              if (simulatedTemp > 55 && !newAlerts.find(a => a.type === 'temp_high')) {
                newAlerts.push({
                  type: 'temp_high',
                  message: 'Temperature elevated. Reducing activity recommended.',
                  timestamp: Date.now()
                })
              }

              return {
                ...prev,
                ...data,
                connected: true,
                battery: simulatedBattery,
                temperature: simulatedTemp,
                path_history: newPathHistory,
                alerts: newAlerts.slice(-10),
              }
            })
          } catch (e) {
            console.error('Failed to parse WebSocket message:', e)
          }
        }

        ws.onerror = (error) => {
          clearTimeout(connectionTimeout)
          console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
          clearTimeout(connectionTimeout)
          // If we were connected, move to disconnected
          setConnectionState(prev => prev === 'connected' ? 'disconnected' : prev)
          setStatus(prev => ({ ...prev, connected: false }))
        }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed'
      setConnectionState('error')
      setConnectionError(errorMessage)
      throw error
    }
  }, [cleanupWebSocket, simulatedBattery, simulatedTemp])

  // Disconnect from robot
  const disconnect = useCallback(async () => {
    cleanupWebSocket()
    
    try {
      await fetch(`${API_CONFIG.BASE_URL}/api/robot/disconnect`, { method: 'POST' }).catch(() => {})
    } catch {
      // Ignore disconnect errors
    }
    
    setConnectionState('disconnected')
    setConnectionError(null)
    setStatus(prev => ({ ...prev, connected: false }))
    setCommandLog([])
  }, [cleanupWebSocket])

  // Battery drain simulation (only when connected)
  useEffect(() => {
    if (connectionState !== 'connected') return

    const interval = setInterval(() => {
      setSimulatedBattery(prev => {
        const drain = status.is_moving ? 0.5 : 0.1
        return Math.max(0, prev - drain)
      })
      
      setSimulatedTemp(prev => {
        const delta = status.is_moving ? 0.3 : -0.2
        return Math.max(25, Math.min(70, prev + delta))
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [connectionState, status.is_moving])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupWebSocket()
  }, [cleanupWebSocket])

  // Send command to robot
  const sendCommand = useCallback(async (
    endpoint: string,
    data: Record<string, unknown>,
    label: string
  ): Promise<boolean> => {
    if (connectionState !== 'connected') {
      console.warn('Cannot send command: not connected')
      return false
    }

    setLoading(true)
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const success = response.ok
      
      setCommandLog(prev => [{
        label,
        timestamp: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        success
      }, ...prev].slice(0, 20))

      if (success) {
        setStatus(prev => ({
          ...prev,
          cycle_count: prev.cycle_count + 1
        }))
      }

      return success
    } catch (error) {
      console.error('Command failed:', error)
      setCommandLog(prev => [{
        label,
        timestamp: new Date().toLocaleTimeString(),
        success: false
      }, ...prev].slice(0, 20))
      return false
    } finally {
      setLoading(false)
    }
  }, [connectionState])

  const clearAlerts = useCallback(() => {
    setStatus(prev => ({ ...prev, alerts: [] }))
  }, [])

  return (
    <RobotContext.Provider value={{
      connectionState,
      connectionError,
      connect,
      disconnect,
      status,
      loading,
      sendCommand,
      commandLog,
      clearAlerts
    }}>
      {children}
    </RobotContext.Provider>
  )
}
