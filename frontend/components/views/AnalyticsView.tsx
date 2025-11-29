'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import { useState } from 'react'
import { 
  MapPin, Activity, Compass, BarChart3, Clock, Play, Pause, RotateCcw,
  TrendingUp, Navigation, Target
} from 'lucide-react'

export default function AnalyticsView() {
  const { status, commandLog } = useRobot()
  const [activeTab, setActiveTab] = useState<'path' | 'sensors' | 'logs'>('path')
  const [playbackIndex, setPlaybackIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const tabs = [
    { id: 'path', label: 'Path', icon: MapPin },
    { id: 'sensors', label: 'Sensors', icon: Activity },
    { id: 'logs', label: 'Logs', icon: Clock },
  ]

  // Playback simulation
  const startPlayback = () => {
    setIsPlaying(true)
    const interval = setInterval(() => {
      setPlaybackIndex(prev => {
        if (prev >= status.path_history.length - 1) {
          setIsPlaying(false)
          clearInterval(interval)
          return prev
        }
        return prev + 1
      })
    }, 100)
  }

  const resetPlayback = () => {
    setIsPlaying(false)
    setPlaybackIndex(0)
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Tabs */}
      <div className="flex bg-slate-800/50 rounded-xl p-1 flex-shrink-0 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-cyan-500 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Path Visualization Tab */}
      {activeTab === 'path' && (
        <div className="space-y-4 flex-1 overflow-auto">
          {/* Full Path Map */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400" />
                Robot Path History
              </h2>
              <span className="text-xs text-slate-400">
                {status.path_history.length} waypoints
              </span>
            </div>
            
            <div className="aspect-square bg-slate-900/80 rounded-xl overflow-hidden relative">
              <svg viewBox="-3 -3 6 6" className="w-full h-full">
                {/* Grid */}
                <defs>
                  <pattern id="gridLarge" width="1" height="1" patternUnits="userSpaceOnUse">
                    <path d="M 1 0 L 0 0 0 1" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.02"/>
                  </pattern>
                  <pattern id="gridSmall" width="0.25" height="0.25" patternUnits="userSpaceOnUse">
                    <path d="M 0.25 0 L 0 0 0 0.25" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.01"/>
                  </pattern>
                </defs>
                <rect x="-3" y="-3" width="6" height="6" fill="url(#gridSmall)" />
                <rect x="-3" y="-3" width="6" height="6" fill="url(#gridLarge)" />
                
                {/* Axes */}
                <line x1="-3" y1="0" x2="3" y2="0" stroke="rgba(255,255,255,0.2)" strokeWidth="0.02" />
                <line x1="0" y1="-3" x2="0" y2="3" stroke="rgba(255,255,255,0.2)" strokeWidth="0.02" />
                
                {/* Origin marker */}
                <circle cx="0" cy="0" r="0.1" fill="rgba(255,255,255,0.3)" />
                <text x="0.15" y="0.15" fill="rgba(255,255,255,0.4)" fontSize="0.2">0,0</text>
                
                {/* Path Trail */}
                {status.path_history.length > 1 && (
                  <>
                    {/* Full path (faded) */}
                    <polyline
                      points={status.path_history.map(p => `${p.x},${-p.y}`).join(' ')}
                      fill="none"
                      stroke="rgba(34,211,238,0.3)"
                      strokeWidth="0.05"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Playback path (bright) */}
                    <polyline
                      points={status.path_history.slice(0, playbackIndex + 1).map(p => `${p.x},${-p.y}`).join(' ')}
                      fill="none"
                      stroke="#22d3ee"
                      strokeWidth="0.08"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    
                    {/* Start point */}
                    <circle 
                      cx={status.path_history[0]?.x || 0} 
                      cy={-(status.path_history[0]?.y || 0)} 
                      r="0.12" 
                      fill="#10b981" 
                    />
                    
                    {/* Waypoints */}
                    {status.path_history.slice(0, playbackIndex + 1).map((point, i) => (
                      <circle
                        key={i}
                        cx={point.x}
                        cy={-point.y}
                        r="0.05"
                        fill="rgba(34,211,238,0.5)"
                      />
                    ))}
                  </>
                )}
                
                {/* Current/Playback Position */}
                {status.path_history.length > 0 && (
                  <g transform={`translate(${status.path_history[playbackIndex]?.x || status.odometry?.x || 0},${-(status.path_history[playbackIndex]?.y || status.odometry?.y || 0)}) rotate(${-(status.path_history[playbackIndex]?.theta || status.odometry?.theta || 0) * 180 / Math.PI})`}>
                    <circle r="0.15" fill="#f43f5e" />
                    <path d="M 0 -0.25 L 0.12 0.1 L -0.12 0.1 Z" fill="#f43f5e" />
                  </g>
                )}
              </svg>
              
              {/* Scale indicator */}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 text-xs text-slate-500">
                <div className="w-8 h-0.5 bg-slate-500" />
                <span>1m</span>
              </div>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Path Playback</h3>
              <span className="text-xs text-slate-400">
                {playbackIndex + 1} / {status.path_history.length}
              </span>
            </div>
            
            <div className="space-y-3">
              {/* Slider */}
              <input
                type="range"
                min={0}
                max={Math.max(0, status.path_history.length - 1)}
                value={playbackIndex}
                onChange={(e) => setPlaybackIndex(Number(e.target.value))}
                className="w-full accent-cyan-500"
              />
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={resetPlayback}
                  className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
                >
                  <RotateCcw className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={isPlaying ? () => setIsPlaying(false) : startPlayback}
                  disabled={status.path_history.length === 0}
                  className="p-3 rounded-full bg-cyan-500 hover:bg-cyan-400 transition disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white ml-0.5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Position Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">X Position</p>
              <p className="text-xl font-bold text-emerald-400">
                {(status.odometry?.x || 0).toFixed(2)}m
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Y Position</p>
              <p className="text-xl font-bold text-cyan-400">
                {(status.odometry?.y || 0).toFixed(2)}m
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-3 text-center">
              <p className="text-xs text-slate-400 mb-1">Heading</p>
              <p className="text-xl font-bold text-purple-400">
                {((status.odometry?.theta || 0) * 180 / Math.PI).toFixed(0)}°
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sensors Tab */}
      {activeTab === 'sensors' && (
        <div className="space-y-4 flex-1 overflow-auto">
          {/* IMU Data */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Compass className="w-4 h-4 text-blue-400" />
              IMU Sensors
            </h2>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Accelerometer */}
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-blue-400 font-medium mb-2">Accelerometer (m/s²)</p>
                <div className="space-y-2">
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={axis} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4 uppercase">{axis}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{
                            width: `${Math.min(100, Math.abs((status.imu?.accelerometer[axis as keyof typeof status.imu.accelerometer] || 0) / 15) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-300 w-16 text-right font-mono">
                        {(status.imu?.accelerometer[axis as keyof typeof status.imu.accelerometer] || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gyroscope */}
              <div className="bg-slate-900/50 rounded-xl p-3">
                <p className="text-xs text-purple-400 font-medium mb-2">Gyroscope (rad/s)</p>
                <div className="space-y-2">
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={axis} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 w-4 uppercase">{axis}</span>
                      <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-500 transition-all"
                          style={{
                            width: `${Math.min(100, Math.abs((status.imu?.gyroscope[axis as keyof typeof status.imu.gyroscope] || 0) / 3) * 100)}%`,
                          }}
                        />
                      </div>
                      <span className="text-xs text-slate-300 w-16 text-right font-mono">
                        {(status.imu?.gyroscope[axis as keyof typeof status.imu.gyroscope] || 0).toFixed(3)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* LIDAR Visualization */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                LIDAR (360° Scan)
              </h2>
              <span className="text-xs text-slate-400">
                {status.lidar?.num_points || 0} points
              </span>
            </div>
            
            <div className="aspect-square max-w-xs mx-auto bg-slate-900/50 rounded-xl overflow-hidden">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Circles */}
                {[25, 50, 75].map((r) => (
                  <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                ))}
                
                {/* Robot */}
                <circle cx="100" cy="100" r="4" fill="#a78bfa" />
                
                {/* LIDAR points */}
                {status.lidar?.ranges?.map((range, i) => {
                  const angle = (i / (status.lidar?.num_points || 360)) * 2 * Math.PI
                  const normalizedRange = Math.min(range / (status.lidar?.max_range || 5), 1)
                  const radius = normalizedRange * 75
                  const x = 100 + radius * Math.cos(angle - Math.PI / 2)
                  const y = 100 + radius * Math.sin(angle - Math.PI / 2)
                  const color = range < 1 ? '#ef4444' : range < 2 ? '#f59e0b' : '#10b981'
                  return <circle key={i} cx={x} cy={y} r="1.5" fill={color} opacity="0.8" />
                })}
              </svg>
            </div>
          </div>

          {/* Velocity */}
          <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
            <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              Velocity
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Linear</p>
                <p className="text-2xl font-bold text-amber-400">
                  {(status.odometry?.linear_velocity || 0).toFixed(3)}
                </p>
                <p className="text-xs text-slate-500">m/s</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400 mb-1">Angular</p>
                <p className="text-2xl font-bold text-rose-400">
                  {(status.odometry?.angular_velocity || 0).toFixed(3)}
                </p>
                <p className="text-xs text-slate-500">rad/s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4 flex-1 overflow-auto">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Command History
          </h2>
          
          {commandLog.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {commandLog.map((cmd, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-900/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${cmd.success ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm text-white">{cmd.label}</span>
                  </div>
                  <span className="text-xs text-slate-500">{cmd.timestamp}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No commands logged yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
