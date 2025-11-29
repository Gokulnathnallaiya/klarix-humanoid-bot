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
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden">
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
      <div className="lg:hidden flex-shrink-0">
        <StatusHeader
          robotConnected={status.connected}
          battery={status.battery}
          temperature={status.temperature}
          isMoving={status.is_moving}
        />
      </div>

      {/* Main Content */}
      <main className="relative flex-1 lg:ml-64 overflow-auto px-4 lg:px-8 pt-4 pb-4 lg:pt-6 lg:pb-6">
        <div className="max-w-7xl mx-auto h-full">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation - hidden on desktop */}
      <div className="lg:hidden flex-shrink-0">
        <BottomNav />
      </div>

      {/* Voice Assistant is now included in Dashboard component */}
    </div>
  )
}
