'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import { Battery, BatteryLow, BatteryWarning, Wifi, Cpu, Activity, Thermometer, Power } from 'lucide-react'
import Link from 'next/link'

interface StatusHeaderProps {
  robotConnected: boolean
  battery: number
  temperature: number
  isMoving: boolean
}

export default function StatusHeader({ 
  robotConnected, 
  battery, 
  temperature,
  isMoving 
}: StatusHeaderProps) {
  const { disconnect } = useRobot()

  const getBatteryIcon = () => {
    if (battery <= 20) return BatteryLow
    if (battery <= 40) return BatteryWarning
    return Battery
  }

  const getBatteryColor = () => {
    if (battery <= 20) return 'text-red-400'
    if (battery <= 40) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const BatteryIcon = getBatteryIcon()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-b border-white/10 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4 max-w-6xl mx-auto">
        {/* Logo & Title */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold text-white">NAO Control</h1>
            <p className="text-xs text-slate-400">Klarix Robotics</p>
          </div>
        </Link>

        {/* Status Indicators */}
        <div className="flex items-center gap-2">
          {/* Motion Status */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            isMoving 
              ? 'bg-cyan-500/20 text-cyan-300 animate-pulse' 
              : 'bg-slate-800 text-slate-400'
          }`}>
            <Activity className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isMoving ? 'Moving' : 'Idle'}</span>
          </div>

          {/* Temperature */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
            temperature > 60 
              ? 'bg-red-500/20 text-red-300' 
              : temperature > 45 
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-slate-800 text-slate-400'
          }`}>
            <Thermometer className="w-3.5 h-3.5" />
            <span>{Math.round(temperature)}°C</span>
          </div>

          {/* Battery */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-slate-800 ${getBatteryColor()}`}>
            <BatteryIcon className="w-4 h-4" />
            <span>{Math.round(battery)}%</span>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Connected</span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={() => disconnect()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
