'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, Upload, Package, CheckCircle2, XCircle, Clock,
  Battery, Thermometer, Activity, Wifi, Server, RefreshCw, RotateCcw
} from 'lucide-react'

interface OTAVersion {
  version: string
  uploaded_at?: string
  applied_at?: string
  timestamp?: string
  status: 'success' | 'failed' | 'pending'
  description?: string
  is_rollback?: boolean
}

export default function SettingsView() {
  const { status, connectionState } = useRobot()
  const [otaVersions, setOtaVersions] = useState<OTAVersion[]>([])
  const [currentVersion, setCurrentVersion] = useState('v1.0.0')
  const [uploading, setUploading] = useState(false)
  const [rollingBack, setRollingBack] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [configText, setConfigText] = useState(JSON.stringify({
    max_speed: 0.2,
    battery_threshold: 20,
    temp_threshold: 55,
    motion_smoothing: true
  }, null, 2))

  const isConnected = connectionState === 'connected'
  const API_BASE = 'http://localhost:8000'

  // Fetch OTA history
  const fetchOTAHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/api/robot/ota/history`)
      if (response.ok) {
        const data = await response.json()
        setCurrentVersion(data.current_version)
        setOtaVersions(data.updates.reverse())
      }
    } catch (err) {
      console.error('Failed to fetch OTA history:', err)
    }
  }, [])

  useEffect(() => {
    fetchOTAHistory()
  }, [fetchOTAHistory])

  const handleOTAUpload = async () => {
    setUploading(true)
    setError(null)
    
    try {
      const config = JSON.parse(configText)
      
      // Generate new version
      const versionMatch = currentVersion.match(/v(\d+)\.(\d+)\.(\d+)/)
      let newVersion = 'v1.0.1'
      if (versionMatch) {
        const [, major, minor, patch] = versionMatch
        newVersion = `v${major}.${minor}.${parseInt(patch) + 1}`
      }
      
      const response = await fetch(`${API_BASE}/api/robot/ota/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          version: newVersion,
          config,
          description: `Configuration update with ${Object.keys(config).length} parameters`
        })
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Update failed')
      }
      
      await fetchOTAHistory()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setUploading(false)
    }
  }

  const handleRollback = async () => {
    setRollingBack(true)
    setError(null)
    
    try {
      const response = await fetch(`${API_BASE}/api/robot/ota/rollback`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Rollback failed')
      }
      
      await fetchOTAHistory()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed')
    } finally {
      setRollingBack(false)
    }
  }

  return (
    <div className="h-full flex flex-col space-y-4 overflow-auto">
      {/* System Status */}
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          System Status
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className={`w-4 h-4 ${isConnected ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className="text-xs text-slate-400">Backend</span>
            </div>
            <p className={`text-sm font-semibold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-4 h-4 ${status.connected ? 'text-emerald-400' : 'text-amber-400'}`} />
              <span className="text-xs text-slate-400">Webots</span>
            </div>
            <p className={`text-sm font-semibold ${status.connected ? 'text-emerald-400' : 'text-amber-400'}`}>
              {status.connected ? 'Running' : 'Waiting'}
            </p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Battery className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Battery</span>
            </div>
            <p className="text-sm font-semibold text-white">{status.battery.toFixed(0)}%</p>
          </div>
          
          <div className="bg-slate-900/50 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span className="text-xs text-slate-400">Temperature</span>
            </div>
            <p className="text-sm font-semibold text-white">{status.temperature.toFixed(0)}°C</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Total Cycles</p>
              <p className="text-lg font-bold text-white">{status.cycle_count}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Current Version</p>
              <p className="text-lg font-bold text-cyan-400">{status.ota_version}</p>
            </div>
          </div>
        </div>
      </div>

      {/* OTA Update */}
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-purple-400" />
          Remote Update (OTA)
        </h2>
        
        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          
          {/* Config Editor */}
          <div>
            <label className="text-xs text-slate-400 mb-2 block">Configuration JSON</label>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              className="w-full h-40 bg-slate-900/50 border border-white/10 rounded-xl p-3 text-sm text-white font-mono resize-none focus:outline-none focus:border-cyan-500"
              placeholder="Enter configuration JSON..."
            />
          </div>
          
          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleOTAUpload}
              disabled={uploading || !isConnected}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 
                text-white font-semibold rounded-xl transition flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Deploy Update
                </>
              )}
            </button>
            
            <button
              onClick={handleRollback}
              disabled={rollingBack || !isConnected || otaVersions.length === 0}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl 
                transition flex items-center justify-center gap-2
                disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rollback to previous version"
            >
              {rollingBack ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <RotateCcw className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Version History */}
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-amber-400" />
          Update History
        </h2>
        
        <div className="space-y-2">
          {otaVersions.map((version, i) => (
            <div 
              key={i} 
              className={`flex items-center justify-between py-3 px-4 rounded-xl ${
                i === 0 ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-slate-900/50'
              }`}
            >
              <div className="flex items-center gap-3">
                {version.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : version.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{version.version}</p>
                  <p className="text-xs text-slate-400">{version.timestamp}</p>
                </div>
              </div>
              {i === 0 && (
                <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Settings */}
      <div className="bg-slate-800/50 backdrop-blur border border-white/10 rounded-2xl p-4">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-400" />
          Quick Settings
        </h2>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-300">Auto-reconnect</span>
            <div className="w-10 h-6 bg-cyan-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-300">Low battery alerts</span>
            <div className="w-10 h-6 bg-cyan-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-300">Temperature monitoring</span>
            <div className="w-10 h-6 bg-cyan-500 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-800/30 rounded-2xl p-4 text-center">
        <p className="text-xs text-slate-500">
          Klarix Robot Control System v1.0.0<br />
          Bosch Hackathon S4 • Humanoid Teleoperation
        </p>
      </div>
    </div>
  )
}
