'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gamepad2, BarChart3, Settings, Cpu } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/teleop', label: 'Teleop', icon: Gamepad2 },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-white/10 safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-xs mt-1 font-medium ${isActive ? 'text-cyan-400' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-0.5 bg-cyan-400 rounded-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
