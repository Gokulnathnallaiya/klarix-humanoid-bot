'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import { useState, useEffect, useCallback } from 'react'
import { 
  Settings, Upload, Package, CheckCircle2, XCircle, Clock,
  Battery, Thermometer, Activity, Wifi, Server, RefreshCw, RotateCcw
} from 'lucide-react'

import { API_CONFIG } from '@/lib/config'

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

  // Fetch OTA history
  const fetchOTAHistory = useCallback(async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/robot/ota/history`)
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
      
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/robot/ota/update`, {
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/robot/ota/rollback`, {
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Server className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          System Status
        </h2>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className={`w-4 h-4 ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Backend</span>
            </div>
            <p className={`text-sm font-semibold ${isConnected ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Activity className={`w-4 h-4 ${status.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Webots</span>
            </div>
            <p className={`text-sm font-semibold ${status.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
              {status.connected ? 'Running' : 'Waiting'}
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Battery className={`w-4 h-4 ${
                status.battery > 40 ? 'text-emerald-600 dark:text-emerald-400' : status.battery > 20 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'
              }`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Battery</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{status.battery.toFixed(0)}%</p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className={`w-4 h-4 ${
                status.temperature > 55 ? 'text-red-600 dark:text-red-400' : status.temperature > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
              }`} />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Temperature</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{status.temperature.toFixed(0)}°C</p>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Total Cycles</p>
              <p className="text-lg font-semibold text-slate-900 dark:text-white">{status.cycle_count}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Current Version</p>
              <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">{status.ota_version}</p>
            </div>
          </div>
        </div>
      </div>

      {/* OTA Update */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          Remote Update (OTA)
        </h2>

        <div className="space-y-4">
          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Config Editor */}
          <div>
            <label className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2 block">Configuration JSON</label>
            <textarea
              value={configText}
              onChange={(e) => setConfigText(e.target.value)}
              className="w-full h-40 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm text-slate-900 dark:text-white font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter configuration JSON..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleOTAUpload}
              disabled={uploading || !isConnected}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm
                transition flex items-center justify-center gap-2
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
              className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg border border-slate-200 dark:border-slate-700
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
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          Update History
        </h2>

        <div className="space-y-2">
          {otaVersions.map((version, i) => (
            <div
              key={i}
              className={`flex items-center justify-between py-3 px-4 rounded-lg ${
                i === 0 ? 'bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {version.status === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                ) : version.status === 'failed' ? (
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                ) : (
                  <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{version.version}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{version.timestamp}</p>
                </div>
              </div>
              {i === 0 && (
                <span className="text-xs bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 px-2 py-1 rounded-full">
                  Current
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Settings */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          Quick Settings
        </h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">Auto-reconnect</span>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">Low battery alerts</span>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-slate-700 dark:text-slate-300">Temperature monitoring</span>
            <div className="w-10 h-6 bg-blue-600 rounded-full relative cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-center">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          Klarix Robot Control System v1.0.0<br />
          Bosch Hackathon S4 • Humanoid Teleoperation
        </p>
      </div>
    </div>
  )
}
