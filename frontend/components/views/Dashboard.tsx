'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import CameraFeed from '@/components/ui/CameraFeed'
import VisionPanel from '@/components/ui/VisionPanel'
import KinematicsPanel from '@/components/ui/KinematicsPanel'
import VoiceAssistant from '@/components/ui/VoiceAssistant'
import {
  Hand, Pointer, User,
  AlertTriangle, X, Battery, Thermometer, Activity, MapPin,
  Eye, Zap, Clock, StopCircle
} from 'lucide-react'
import Link from 'next/link'

const API_BASE = 'http://localhost:8000'

export default function Dashboard() {
  const { status, connectionState, loading, sendCommand, commandLog, clearAlerts } = useRobot()

  const isConnected = connectionState === 'connected'

  const quickActions = [
    { label: 'Wave', value: 'wave', icon: Hand, color: 'from-purple-500 to-pink-500' },
    { label: 'Point', value: 'point', icon: Pointer, color: 'from-cyan-500 to-blue-500' },
    { label: 'Stand', value: 'stand', icon: User, color: 'from-emerald-500 to-teal-500' },
  ]

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Desktop Header */}
      <div className="hidden lg:flex items-center justify-between flex-shrink-0 mb-6 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Monitor and control your Klarix Robot</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
            status.connected
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400'
              : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className="text-sm font-medium">
              {status.connected ? 'Connected' : 'Waiting'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {status.alerts.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex-shrink-0 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-amber-300">System Alerts</h3>
                <div className="mt-1 space-y-1">
                  {status.alerts.slice(0, 3).map((alert, i) => (
                    <p key={i} className="text-xs text-amber-200/80">{alert.message}</p>
                  ))}
                </div>
              </div>
            </div>
            <button onClick={clearAlerts} className="p-1 hover:bg-white/10 rounded">
              <X className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop: 3-column layout */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-4 flex-1 overflow-auto">
        {/* Left Column - Camera & Vision */}
        <div className="lg:col-span-2 space-y-4">
          {/* Camera Feed */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-slate-400" />
                Live Camera Feed
              </h2>
              <Link href="/teleop" className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                Full Control →
              </Link>
            </div>
            <CameraFeed 
              isConnected={isConnected} 
              className="aspect-video lg:aspect-[16/9] rounded-xl"
              showControls={true}
            />
          </div>

          {/* Vision AI Panel - Desktop Only */}
          <div className="hidden lg:block">
            <VisionPanel isConnected={isConnected} />
          </div>

          {/* Path Map */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-slate-400" />
                Robot Path Trace
              </h2>
              <Link href="/analytics" className="text-xs lg:text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
                View Sensors →
              </Link>
            </div>
            <div className="aspect-square lg:aspect-[2/1] bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden relative">
              <svg viewBox="-2 -2 4 4" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <pattern id="grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
                    <path d="M 0.5 0 L 0 0 0 0.5" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="0.02"/>
                  </pattern>
                </defs>
                <rect x="-2" y="-2" width="4" height="4" fill="url(#grid)" />
                <circle cx="0" cy="0" r="0.05" fill="rgba(100,116,139,0.5)" />
                {status.path_history.length > 1 && (
                  <polyline
                    points={status.path_history.map(p => `${p.x},${-p.y}`).join(' ')}
                    fill="none"
                    stroke="rgb(59,130,246)"
                    strokeWidth="0.05"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.8"
                  />
                )}
                <g transform={`translate(${status.odometry?.x || 0},${-(status.odometry?.y || 0)}) rotate(${-(status.odometry?.theta || 0) * 180 / Math.PI})`}>
                  <circle r="0.12" fill="rgb(37,99,235)" />
                  <path d="M 0 -0.2 L 0.1 0.1 L -0.1 0.1 Z" fill="rgb(37,99,235)" />
                </g>
              </svg>
              <div className="absolute bottom-2 left-2 text-xs text-slate-400">
                {status.path_history.length} points
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Controls & Status */}
        <div className="space-y-4">
          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Battery className="w-4 h-4" />
                <span className="text-xs font-medium">Battery</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{status.battery.toFixed(0)}%</p>
              <div className="mt-2 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    status.battery > 40 ? 'bg-emerald-500' : status.battery > 20 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${status.battery}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs font-medium">Temperature</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{status.temperature.toFixed(0)}°C</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {status.temperature > 55 ? 'High' : status.temperature > 40 ? 'Normal' : 'Cool'}
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium">Cycles</span>
              </div>
              <p className="text-2xl font-semibold text-slate-900 dark:text-white">{status.cycle_count}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Commands run</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium">Position</span>
              </div>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">
                {(status.odometry?.x || 0).toFixed(2)}, {(status.odometry?.y || 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                θ: {((status.odometry?.theta || 0) * 180 / Math.PI).toFixed(0)}°
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-slate-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => sendCommand('/api/robot/gesture', { gesture: action.value }, action.label)}
                  disabled={loading || !isConnected}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-slate-200 dark:border-slate-700
                    bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors
                    disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 dark:text-white"
                >
                  <action.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Kinematics Panel - Desktop Only */}
          <div className="hidden lg:block">
            <KinematicsPanel joints={status.joints} />
          </div>

          {/* Recent Commands */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
            <h2 className="text-sm lg:text-base font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-slate-600 dark:text-slate-400" />
              Recent Commands
            </h2>
            {commandLog.length > 0 ? (
              <div className="space-y-2">
                {commandLog.slice(0, 5).map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cmd.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-slate-900 dark:text-white font-medium">{cmd.label}</span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{cmd.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">No commands yet</p>
            )}
          </div>

          {/* Emergency Stop Button - Desktop */}
          <div className="hidden lg:block">
            <button
              onClick={async () => {
                try {
                  await fetch(`${API_BASE}/api/robot/stop`, { method: 'POST' })
                } catch (e) {
                  console.error('Stop failed:', e)
                }
              }}
              className="w-full py-4 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold
                transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <StopCircle className="w-5 h-5" />
              EMERGENCY STOP
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Only Panels */}
      <div className="lg:hidden space-y-4">
        <VisionPanel isConnected={isConnected} />
        <KinematicsPanel joints={status.joints} />
      </div>

      {/* Voice Assistant - Floating Panel */}
      <VoiceAssistant />
    </div>
  )
}
