import RobotControl from '@/components/RobotControl'
import { Sparkles } from 'lucide-react'

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
        <div className="absolute left-1/2 top-0 h-96 w-96 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 py-12">
        <header className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-200">
            <Sparkles className="h-4 w-4 text-emerald-300" />
            Klarix Robotics Lab
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight sm:text-5xl">
            NAO Command Portal
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            A cinematic cockpit for choreographing gestures, head articulation, and locomotion inside the Webots simulation.
          </p>
        </header>
        <RobotControl />
      </div>
    </main>
  )
}
