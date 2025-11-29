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
      <div className="hidden lg:flex items-center justify-between flex-shrink-0 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400">Monitor and control your Klarix Robot</p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
            status.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
          }`}>
            <div className={`w-2 h-2 rounded-full ${status.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-sm font-medium">
              {status.connected ? 'Webots Connected' : 'Waiting for Webots'}
            </span>
          </div>
        </div>
      </div>

      {/* Alerts Banner */}
      {status.alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-2xl p-4 flex-shrink-0 mb-4">
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
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm lg:text-base font-semibold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 lg:w-5 lg:h-5 text-purple-400" />
                Live Camera Feed
              </h2>
              <Link href="/teleop" className="text-xs lg:text-sm text-purple-400 hover:underline">
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
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm lg:text-base font-semibold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 lg:w-5 lg:h-5 text-cyan-400" />
                Robot Path Trace
              </h2>
              <Link href="/analytics" className="text-xs lg:text-sm text-cyan-400 hover:underline">
                Full Analytics →
              </Link>
            </div>
            <div className="aspect-square lg:aspect-[2/1] bg-slate-900/50 rounded-xl overflow-hidden relative">
              <svg viewBox="-2 -2 4 4" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                <defs>
                  <pattern id="grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
                    <path d="M 0.5 0 L 0 0 0 0.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.02"/>
                  </pattern>
                  <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,1)" />
                  </linearGradient>
                </defs>
                <rect x="-2" y="-2" width="4" height="4" fill="url(#grid)" />
                <circle cx="0" cy="0" r="0.05" fill="rgba(255,255,255,0.3)" />
                {status.path_history.length > 1 && (
                  <polyline
                    points={status.path_history.map(p => `${p.x},${-p.y}`).join(' ')}
                    fill="none"
                    stroke="url(#pathGradient)"
                    strokeWidth="0.05"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                )}
                <g transform={`translate(${status.odometry?.x || 0},${-(status.odometry?.y || 0)}) rotate(${-(status.odometry?.theta || 0) * 180 / Math.PI})`}>
                  <circle r="0.12" fill="#22d3ee" />
                  <path d="M 0 -0.2 L 0.1 0.1 L -0.1 0.1 Z" fill="#22d3ee" />
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
            <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-emerald-400 mb-2">
                <Battery className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Battery</span>
              </div>
              <p className="text-2xl font-bold text-white">{status.battery.toFixed(0)}%</p>
              <div className="mt-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    status.battery > 40 ? 'bg-emerald-500' : status.battery > 20 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${status.battery}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-orange-400 mb-2">
                <Thermometer className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Temp</span>
              </div>
              <p className="text-2xl font-bold text-white">{status.temperature.toFixed(0)}°C</p>
              <p className="text-xs text-slate-400 mt-1">
                {status.temperature > 55 ? 'High' : status.temperature > 40 ? 'Normal' : 'Cool'}
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-cyan-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Cycles</span>
              </div>
              <p className="text-2xl font-bold text-white">{status.cycle_count}</p>
              <p className="text-xs text-slate-400 mt-1">Commands run</p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-2 text-purple-400 mb-2">
                <MapPin className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">Position</span>
              </div>
              <p className="text-lg font-bold text-white">
                {(status.odometry?.x || 0).toFixed(2)}, {(status.odometry?.y || 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                θ: {((status.odometry?.theta || 0) * 180 / Math.PI).toFixed(0)}°
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm lg:text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.value}
                  onClick={() => sendCommand('/api/robot/gesture', { gesture: action.value }, action.label)}
                  disabled={loading || !isConnected}
                  className={`relative overflow-hidden rounded-xl p-3 text-white font-semibold transition-all
                    bg-gradient-to-br ${action.color} hover:scale-[1.02] active:scale-[0.98]
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  <action.icon className="w-6 h-6 mx-auto mb-2" />
                  <span className="text-sm">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Kinematics Panel - Desktop Only */}
          <div className="hidden lg:block">
            <KinematicsPanel joints={status.joints} />
          </div>

          {/* Recent Commands */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm lg:text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-slate-400" />
              Recent Commands
            </h2>
            {commandLog.length > 0 ? (
              <div className="space-y-2">
                {commandLog.slice(0, 5).map((cmd, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/50">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${cmd.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      <span className="text-sm text-white">{cmd.label}</span>
                    </div>
                    <span className="text-xs text-slate-500">{cmd.timestamp}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-sm text-slate-500 py-4">No commands yet</p>
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
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold
                hover:from-red-600 hover:to-red-700 transition-all flex items-center justify-center gap-2"
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
