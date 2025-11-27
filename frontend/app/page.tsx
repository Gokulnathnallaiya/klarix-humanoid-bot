import RobotControl from '@/components/RobotControl'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold text-white text-center mb-8">
          🤖 NAO Robot Control Center
        </h1>
        <RobotControl />
      </div>
    </main>
  )
}
