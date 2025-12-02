'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRobot } from '@/components/providers/RobotProvider'
import {
  Home, Gamepad2, BarChart3, Settings, Cpu,
  Battery, BatteryLow, BatteryWarning, Thermometer,
  Activity, Wifi, Power, Bot, Zap
} from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home, description: 'Overview & quick actions' },
  { href: '/teleop', label: 'Teleoperation', icon: Gamepad2, description: 'Manual robot control' },
  { href: '/analytics', label: 'Sensors', icon: BarChart3, description: 'IMU, LIDAR & telemetry' },
  { href: '/settings', label: 'Settings', icon: Settings, description: 'Configuration & OTA' },
]

interface SidebarProps {
  robotConnected: boolean
  battery: number
  temperature: number
  isMoving: boolean
}

export default function Sidebar({
  robotConnected,
  battery,
  temperature,
  isMoving
}: SidebarProps) {
  const pathname = usePathname()
  const { disconnect } = useRobot()

  const getBatteryIcon = () => {
    if (battery <= 20) return BatteryLow
    if (battery <= 40) return BatteryWarning
    return Battery
  }

  const getBatteryColor = () => {
    if (battery <= 20) return 'text-red-500'
    if (battery <= 40) return 'text-amber-500'
    return 'text-emerald-500'
  }

  const BatteryIcon = getBatteryIcon()

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Klarix Robot</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Humanoid Control</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{item.description}</p>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status Panel */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
          Robot Status
        </p>

        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 ${robotConnected ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Connection</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              robotConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              {robotConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Motion Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isMoving ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Motion</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isMoving
                ? 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              {isMoving ? 'Moving' : 'Idle'}
            </span>
          </div>

          {/* Battery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BatteryIcon className={`w-4 h-4 ${getBatteryColor()}`} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Battery</span>
            </div>
            <span className={`text-xs font-medium ${getBatteryColor()}`}>
              {Math.round(battery)}%
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className={`w-4 h-4 ${
                temperature > 55 ? 'text-red-500' : temperature > 40 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
              }`} />
              <span className="text-sm text-slate-700 dark:text-slate-300">Temp</span>
            </div>
            <span className={`text-xs font-medium ${
              temperature > 55 ? 'text-red-500' : temperature > 40 ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
            }`}>
              {Math.round(temperature)}°C
            </span>
          </div>
        </div>

        {/* Quick Action */}
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={() => disconnect()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg
              bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30
              text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400
              border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-800
              transition-colors text-sm font-medium"
          >
            <Power className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Zap className="w-3 h-3" />
          <span>Bosch S4 Hackathon</span>
        </div>
      </div>
    </aside>
  )
}
