'use client'

import { useRobot } from '@/components/providers/RobotProvider'
import StatusHeader from '@/components/ui/StatusHeader'
import BottomNav from '@/components/ui/BottomNav'
import Sidebar from '@/components/ui/Sidebar'
import ConnectionScreen from '@/components/views/ConnectionScreen'
import { ReactNode } from 'react'

interface AppLayoutProps {
  children: ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { connectionState, status } = useRobot()

  // Show connection screen if not connected
  if (connectionState !== 'connected') {
    return <ConnectionScreen />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Desktop Sidebar - hidden on mobile */}
      <Sidebar 
        robotConnected={status.connected}
        battery={status.battery}
        temperature={status.temperature}
        isMoving={status.is_moving}
      />

      {/* Mobile Header - hidden on desktop */}
      <div className="lg:hidden">
        <StatusHeader 
          robotConnected={status.connected}
          battery={status.battery}
          temperature={status.temperature}
          isMoving={status.is_moving}
        />
      </div>

      {/* Main Content */}
      <main className="relative lg:ml-64 pt-16 lg:pt-4 pb-20 lg:pb-4 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* Voice Assistant is now included in Dashboard component */}
    </div>
  )
}
