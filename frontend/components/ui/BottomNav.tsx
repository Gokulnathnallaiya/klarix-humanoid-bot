'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Gamepad2, BarChart3, Settings, Cpu } from 'lucide-react'

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/teleop', label: 'Teleop', icon: Gamepad2 },
  { href: '/analytics', label: 'Sensors', icon: BarChart3 },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-all ${
                isActive
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
              <span className={`text-xs mt-1 font-medium`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 w-12 h-1 bg-blue-600 dark:bg-blue-400 rounded-t-full" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
