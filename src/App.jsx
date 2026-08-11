import { useEffect, useState } from 'react'
import { Flower2, Maximize, Minimize, Wind } from 'lucide-react'

import { Button } from '#components/ui/button'
import { WimHof } from '#components/wim-hof'
import { Meditation } from '#components/meditation'
import { cn } from '#lib/utils'

function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggle = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.().catch(() => {})
    } else {
      document.documentElement.requestFullscreen?.().catch(() => {})
    }
  }

  return { isFullscreen, toggle }
}

const MODES = [
  {
    id: 'wimhof',
    label: 'Wim Hof',
    Icon: Wind,
    activeClassName:
      'bg-gradient-to-b from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/30',
  },
  {
    id: 'meditasi',
    label: 'Meditasi',
    Icon: Flower2,
    activeClassName:
      'bg-gradient-to-b from-emerald-400 to-teal-500 text-emerald-950 shadow-lg shadow-emerald-500/30',
  },
]

function ModeSwitch({ value, onChange }) {
  return (
    <div className="grid w-full grid-cols-2 gap-1.5 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-1.5 backdrop-blur">
      {MODES.map(({ id, label, Icon, activeClassName }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all',
              active
                ? activeClassName
                : 'text-muted-foreground hover:bg-white/[0.05] hover:text-foreground',
            )}
          >
            <Icon className="size-4" />
            {label}
          </button>
        )
      })}
    </div>
  )
}

function App() {
  const { isFullscreen, toggle } = useFullscreen()
  const [tab, setTab] = useState('wimhof')

  return (
    <div className="dark relative isolate min-h-dvh w-full overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0b1020]" />
        <div className="absolute -top-48 right-0 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-indigo-500/[0.14] blur-[140px]" />
        <div className="absolute top-1/3 -left-56 h-96 w-96 rounded-full bg-cyan-400/[0.08] blur-[120px]" />
        <div className="absolute -right-40 bottom-0 h-96 w-96 rounded-full bg-emerald-400/[0.07] blur-[120px]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0b1020]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-lg shadow-cyan-500/20">
              <Wind className="size-4.5 text-white" />
            </div>
            <div>
              <div className="text-sm leading-tight font-semibold tracking-tight">
                Napas &amp; Meditasi
              </div>
              <div className="text-[11px] leading-tight text-muted-foreground">
                Fokus. Nafas. Tenang.
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toggle}
            aria-label={isFullscreen ? 'Keluar mode fokus' : 'Mode fokus layar penuh'}
            className="border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-16">
        <section className="pt-10 pb-7 text-center sm:pt-14 sm:pb-9">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Latihan Pernapasan</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Dua latihan terfokus: pernapasan Wim Hof untuk membangkitkan energi, dan meditasi
            untuk menenangkan pikiran.
          </p>
        </section>

        <ModeSwitch value={tab} onChange={setTab} />

        <div className="mt-7">
          <div className={cn(tab !== 'wimhof' && 'hidden')}>
            <WimHof />
          </div>
          <div className={cn(tab !== 'meditasi' && 'hidden')}>
            <Meditation />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App