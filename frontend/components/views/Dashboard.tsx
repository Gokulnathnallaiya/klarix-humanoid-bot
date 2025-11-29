'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import CameraFeed from '@/components/ui/CameraFeed'
import { 
  Hand, Pointer, User, ArrowUp, ArrowDown, RotateCcw, RotateCw,
  AlertTriangle, X, Battery, Thermometer, Activity, MapPin,
  Eye, Zap, Clock
} from 'lucide-react'
import Link from 'next/link'

export default function Dashboard() {
  const { status, connectionState, loading, sendCommand, commandLog, clearAlerts } = useRobot()

  const isConnected = connectionState === 'connected'

  const quickActions = [
    { label: 'Wave', value: 'wave', icon: Hand, color: 'from-purple-500 to-pink-500' },
    { label: 'Point', value: 'point', icon: Pointer, color: 'from-cyan-500 to-blue-500' },
    { label: 'Stand', value: 'stand', icon: User, color: 'from-emerald-500 to-teal-500' },
  ]

  const movements = [
    { label: 'Forward', value: 'forward', icon: ArrowUp },
    { label: 'Back', value: 'backward', icon: ArrowDown },
    { label: 'Left', value: 'turn_left', icon: RotateCcw },
    { label: 'Right', value: 'turn_right', icon: RotateCw },
  ]

  return (
    <div className="space-y-4 pb-4">
      {/* Alerts Banner */}
      {status.alerts.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/20 to-red-500/20 border border-amber-500/30 rounded-2xl p-4">
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

      {/* Status Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.value}
              onClick={() => sendCommand('/api/robot/gesture', { gesture: action.value }, action.label)}
              disabled={loading || !isConnected}
              className={`relative overflow-hidden rounded-xl p-4 text-white font-semibold transition-all 
                bg-gradient-to-br ${action.color} hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
            >
              <action.icon className="w-6 h-6 mx-auto mb-2" />
              <span className="text-sm">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mini Path Map + Camera Preview */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Path Map */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Path Trace
            </h2>
            <Link href="/analytics" className="text-xs text-cyan-400 hover:underline">
              View Full →
            </Link>
          </div>
          
          <div className="aspect-square bg-slate-900/50 rounded-xl overflow-hidden relative">
            <svg viewBox="-2 -2 4 4" className="w-full h-full">
              {/* Grid */}
              <defs>
                <pattern id="grid" width="0.5" height="0.5" patternUnits="userSpaceOnUse">
                  <path d="M 0.5 0 L 0 0 0 0.5" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.02"/>
                </pattern>
              </defs>
              <rect x="-2" y="-2" width="4" height="4" fill="url(#grid)" />
              
              {/* Origin */}
              <circle cx="0" cy="0" r="0.05" fill="rgba(255,255,255,0.3)" />
              
              {/* Path Trail */}
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
              
              {/* Gradient for path */}
              <defs>
                <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.2)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,1)" />
                </linearGradient>
              </defs>
              
              {/* Current Position */}
              <g transform={`translate(${status.odometry?.x || 0},${-(status.odometry?.y || 0)}) rotate(${-(status.odometry?.theta || 0) * 180 / Math.PI})`}>
                <circle r="0.12" fill="#22d3ee" />
                <path d="M 0 -0.2 L 0.1 0.1 L -0.1 0.1 Z" fill="#22d3ee" />
              </g>
            </svg>
            
            {/* Legend */}
            <div className="absolute bottom-2 left-2 text-xs text-slate-400">
              {status.path_history.length} points
            </div>
          </div>
        </div>

        {/* Camera Preview */}
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-purple-400" />
              Camera Feed
            </h2>
            <Link href="/teleop" className="text-xs text-purple-400 hover:underline">
              Full View →
            </Link>
          </div>
          
          <CameraFeed 
            isConnected={isConnected} 
            className="aspect-video rounded-xl"
            showControls={true}
          />
        </div>
      </div>

      {/* Movement Controls */}
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Movement
        </h2>
        <div className="grid grid-cols-4 gap-2">
          {movements.map((move) => (
            <button
              key={move.value}
              onClick={() => sendCommand('/api/robot/walk', { movement: move.value, duration: 2 }, move.label)}
              disabled={loading || !isConnected}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-700/50 border border-white/10
                hover:bg-slate-700 hover:border-white/20 transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <move.icon className="w-5 h-5 text-white mb-1" />
              <span className="text-xs text-slate-300">{move.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Commands */}
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
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
    </div>
  )
}
