import type { Metadata, Viewport } from 'next'
import './globals.css'
import { RobotProvider } from '@/components/providers/RobotProvider'
import AppLayout from '@/components/layout/AppLayout'

export const metadata: Metadata = {
  title: 'NAO Control | Klarix Robotics',
  description: 'Cloud Remote Robot Management System for NAO Humanoid Robot',
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0f172a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <RobotProvider>
          <AppLayout>
            {children}
          </AppLayout>
        </RobotProvider>
      </body>
    </html>
  )
}
