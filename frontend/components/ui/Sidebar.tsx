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
  { href: '/analytics', label: 'Analytics', icon: BarChart3, description: 'Path & sensor data' },
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
    if (battery <= 20) return 'text-red-400'
    if (battery <= 40) return 'text-amber-400'
    return 'text-emerald-400'
  }

  const BatteryIcon = getBatteryIcon()

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-900/95 backdrop-blur-xl border-r border-white/10 flex-col z-50">
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center shadow-lg shadow-cyan-500/25">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Klarix Robot</h1>
            <p className="text-xs text-slate-400">Humanoid Control</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-3 mb-3">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 text-white border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : ''}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-white' : ''}`}>
                  {item.label}
                </p>
                <p className="text-xs text-slate-500 truncate">{item.description}</p>
              </div>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Status Panel */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Robot Status
        </p>
        
        <div className="space-y-3">
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wifi className={`w-4 h-4 ${robotConnected ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span className="text-sm text-slate-300">Connection</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              robotConnected 
                ? 'bg-emerald-500/20 text-emerald-400' 
                : 'bg-slate-700 text-slate-400'
            }`}>
              {robotConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          {/* Motion Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className={`w-4 h-4 ${isMoving ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span className="text-sm text-slate-300">Motion</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isMoving 
                ? 'bg-cyan-500/20 text-cyan-400 animate-pulse' 
                : 'bg-slate-700 text-slate-400'
            }`}>
              {isMoving ? 'Moving' : 'Idle'}
            </span>
          </div>

          {/* Battery */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BatteryIcon className={`w-4 h-4 ${getBatteryColor()}`} />
              <span className="text-sm text-slate-300">Battery</span>
            </div>
            <span className={`text-xs font-medium ${getBatteryColor()}`}>
              {Math.round(battery)}%
            </span>
          </div>

          {/* Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Thermometer className={`w-4 h-4 ${
                temperature > 55 ? 'text-red-400' : temperature > 40 ? 'text-amber-400' : 'text-slate-400'
              }`} />
              <span className="text-sm text-slate-300">Temp</span>
            </div>
            <span className={`text-xs font-medium ${
              temperature > 55 ? 'text-red-400' : temperature > 40 ? 'text-amber-400' : 'text-slate-400'
            }`}>
              {Math.round(temperature)}°C
            </span>
          </div>
        </div>

        {/* Quick Action */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <button
            onClick={() => disconnect()}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl 
              bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 
              transition-all text-sm font-medium"
          >
            <Power className="w-4 h-4" />
            Disconnect
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Zap className="w-3 h-3" />
          <span>Bosch S4 Hackathon</span>
        </div>
      </div>
    </aside>
  )
}
