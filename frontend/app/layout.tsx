import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NAO Robot Control',
  description: 'Control NAO humanoid robot through web interface',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
