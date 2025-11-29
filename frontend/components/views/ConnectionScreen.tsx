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
          iconColor: 'text-slate-500',
          bgColor: 'bg-slate-100 dark:bg-slate-800',
          borderColor: 'border-slate-300 dark:border-slate-700',
          title: 'Not Connected',
          subtitle: 'Connect to your robot to begin',
        }
      case 'connecting':
        return {
          icon: Loader2,
          iconColor: 'text-blue-600 dark:text-blue-400 animate-spin',
          bgColor: 'bg-blue-50 dark:bg-blue-950/30',
          borderColor: 'border-blue-200 dark:border-blue-800',
          title: 'Connecting...',
          subtitle: 'Establishing connection to robot',
        }
      case 'error':
        return {
          icon: AlertCircle,
          iconColor: 'text-red-600 dark:text-red-400',
          bgColor: 'bg-red-50 dark:bg-red-950/30',
          borderColor: 'border-red-200 dark:border-red-800',
          title: 'Connection Failed',
          subtitle: connectionError || 'Unable to connect to robot',
        }
      default:
        return {
          icon: Wifi,
          iconColor: 'text-emerald-600 dark:text-emerald-400',
          bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
          borderColor: 'border-emerald-200 dark:border-emerald-800',
          title: 'Connected',
          subtitle: 'Robot is ready',
        }
    }
  }

  const statusConfig = getStatusConfig(connectionState)
  const StatusIcon = statusConfig.icon

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="p-6 text-center border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Bot className="w-8 h-8 text-slate-700 dark:text-slate-300" />
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Klarix Robot</h1>
        </div>
        <p className="text-slate-600 dark:text-slate-400 text-sm">Cloud Remote Management System</p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-20">
        {/* Status Card */}
        <div className={`w-full max-w-sm bg-white dark:bg-slate-900 border ${statusConfig.borderColor} rounded-lg p-8 text-center shadow-sm`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${statusConfig.bgColor} border ${statusConfig.borderColor} flex items-center justify-center`}>
            <StatusIcon className={`w-10 h-10 ${statusConfig.iconColor}`} />
          </div>

          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
            {statusConfig.title}
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-8">
            {statusConfig.subtitle}
          </p>

          {/* Connect Button */}
          {(connectionState === 'disconnected' || connectionState === 'error') && (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="w-full py-3 px-6 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700
                text-white font-medium rounded-lg transition-colors
                disabled:opacity-50 disabled:cursor-not-allowed
                flex items-center justify-center gap-2 shadow-sm"
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
              <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Please wait...</span>
              </div>
              <div className="space-y-2 text-left text-sm text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  <span>Checking backend server...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Connecting to robot...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                  <span>Establishing WebSocket...</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Prerequisites */}
        <div className="mt-8 w-full max-w-sm">
          <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-4 text-center">Prerequisites</h3>
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
              title="Klarix Controller"
              description="Active in Webots"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs text-slate-500 dark:text-slate-600">
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
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
      <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{number}</span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">{title}</p>
        <p className="text-xs text-slate-600 dark:text-slate-400">{description}</p>
      </div>
    </div>
  )
}
