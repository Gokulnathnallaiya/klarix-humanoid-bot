'use client'

import { useRobot, ConnectionState } from '@/components/providers/RobotProvider'
import { Bot, Wifi, WifiOff, Loader2, AlertCircle, RefreshCw, Power } from 'lucide-react'
import { useState } from 'react'

export default function ConnectionScreen() {
  const { connectionState, connectionError, connect } = useRobot()
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      await connect()
    } catch (error) {
      console.error('Connection failed:', error)
    } finally {
      setIsConnecting(false)
    }
  }

  const getStatusConfig = (state: ConnectionState) => {
    switch (state) {
      case 'disconnected':
        return {
          icon: WifiOff,
          iconColor: 'text-slate-400',
          bgColor: 'bg-slate-800/50',
          borderColor: 'border-slate-700',
          title: 'Not Connected',
          subtitle: 'Connect to your robot to begin',
        }
      case 'connecting':
        return {
          icon: Loader2,
          iconColor: 'text-cyan-400 animate-spin',
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/30',
          title: 'Connecting...',
          subtitle: 'Establishing connection to robot',
        }
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          title: 'Connection Failed',
          subtitle: connectionError || 'Unable to connect to robot',
        }
      default:
        return {
          icon: Wifi,
          iconColor: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          title: 'Connected',
          subtitle: 'Robot is ready',
        }
    }
  }

  const statusConfig = getStatusConfig(connectionState)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-cyan-400" />
          <h1 className="text-2xl font-bold text-white">Klarix Robot</h1>
        </div>
        <p className="text-slate-400 text-sm">Cloud Remote Management System</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Status Card */}
        <div className={`w-full max-w-sm ${statusConfig.bgColor} backdrop-blur border ${statusConfig.borderColor} rounded-3xl p-8 text-center`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor} flex items-center justify-center`}>
            <StatusIcon className={`w-10 h-10 ${statusConfig.iconColor}`} />
          </div>
          
          <h2 className="text-xl font-semibold text-white mb-2">
            {statusConfig.title}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {statusConfig.subtitle}
          </p>

          {/* Connect Button */}
          {(connectionState === 'disconnected' || connectionState === 'error') && (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-4 px-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 
                text-white font-semibold rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                flex items-center justify-center gap-3 shadow-lg shadow-cyan-500/25"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Connecting...
                </>
              ) : connectionState === 'error' ? (
                <>
                  <RefreshCw className="w-5 h-5" />
                  Retry Connection
                </>
              ) : (
                <>
                  <Power className="w-5 h-5" />
                  Connect to Robot
                </>
              )}
            </button>
          )}

          {/* Connecting state */}
          {connectionState === 'connecting' && (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-cyan-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Please wait...</span>
              </div>
              <div className="space-y-2 text-left text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                  <span>Checking backend server...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Connecting to robot...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-600" />
                  <span>Establishing WebSocket...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prerequisites */}
        <div className="mt-8 w-full max-w-sm">
          <h3 className="text-sm font-medium text-slate-400 mb-4 text-center">Prerequisites</h3>
          <div className="space-y-3">
            <PrerequisiteItem 
              number={1}
              title="Backend Server"
              description="Running on localhost:8000"
            />
            <PrerequisiteItem 
              number={2}
              title="Webots Simulator"
              description="Open and press Play button"
            />
            <PrerequisiteItem 
              number={3}
              title="NAO Controller"
              description="Active in Webots"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center">
        <p className="text-xs text-slate-600">
          Bosch S4 Stream Hackathon • v1.0.0
        </p>
      </div>
    </div>
  )
}

function PrerequisiteItem({ 
  number, 
  title, 
  description 
}: { 
  number: number
  title: string
  description: string 
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/30 border border-slate-700/50">
      <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-slate-300">{number}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-300">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
    </div>
  )
}
