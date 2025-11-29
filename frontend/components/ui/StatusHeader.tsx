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
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo & Title */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white">Klarix Robot</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Humanoid Control</p>
          </div>
        </Link>

        {/* Status Indicators */}
        <div className="flex items-center gap-1.5">
          {/* Motion Status */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
            isMoving
              ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
              : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
          }`}>
            <Activity className="w-3 h-3" />
          </div>

          {/* Battery */}
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border ${
            battery > 40
              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400'
              : battery > 20
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                : 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400'
          }`}>
            <BatteryIcon className="w-3 h-3" />
            <span className="hidden sm:inline">{Math.round(battery)}%</span>
          </div>

          {/* Disconnect Button */}
          <button
            onClick={() => disconnect()}
            className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            title="Disconnect"
          >
            <Power className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  )
}
