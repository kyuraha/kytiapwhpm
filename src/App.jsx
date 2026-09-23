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
    label: '吐纳 Tunà',
    Icon: Wind,
    activeClassName:
      'bg-gradient-to-b from-gold-200 to-gold-400 text-[#241a08] shadow-lg shadow-gold-500/25',
  },
  {
    id: 'meditasi',
    label: '静坐 Jìngzuò',
    Icon: Flower2,
    activeClassName:
      'bg-gradient-to-b from-jade-300 to-jade-500 text-[#0f231a] shadow-lg shadow-jade-500/25',
  },
]

function ModeSwitch({ value, onChange }) {
  return (
    <div className="grid w-full shrink-0 grid-cols-2 gap-1.5 rounded-full border border-gold-300/10 bg-white/[0.03] p-1.5 backdrop-blur">
      {MODES.map(({ id, label, Icon, activeClassName }) => {
        const active = value === id
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            className={cn(
              'inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm font-semibold tracking-wide transition-all sm:h-11',
              active
                ? activeClassName
                : 'text-muted-foreground hover:bg-white/[0.04] hover:text-foreground',
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
function InkBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-ink-950" />
      <div className="absolute -top-44 left-1/2 h-[480px] w-[780px] -translate-x-1/2 rounded-full bg-jade-500/[0.07] blur-[130px] animate-mist" />
      <div
        className="absolute top-1/3 -left-52 h-96 w-96 rounded-full bg-gold-400/[0.06] blur-[120px] animate-mist"
        style={{ animationDelay: '-5s' }}
      />
      <div
        className="absolute -right-44 bottom-0 h-96 w-96 rounded-full bg-jade-400/[0.05] blur-[120px] animate-mist"
        style={{ animationDelay: '-11s' }}
      />
      <div className="absolute inset-0 m-auto size-[160vmin] rounded-full border border-dashed border-gold-300/[0.05] animate-spin-slow" />
      <div className="absolute inset-0 m-auto size-[112vmin] rounded-full border border-jade-300/[0.05] animate-spin-reverse" />
    </div>
  )
}

function SideScript({ children, className }) {
  return (
    <div
      className={cn(
        'pointer-events-none fixed inset-y-0 z-0 hidden items-center lg:flex',
        className,
      )}
    >
      <span className="font-brush text-2xl tracking-[0.45em] text-gold-300/[0.13] select-none [writing-mode:vertical-rl]">
        {children}
      </span>
    </div>
  )
}

function App() {
  const { isFullscreen, toggle } = useFullscreen()
  const [tab, setTab] = useState('wimhof')

  return (
    <div className="dark relative isolate flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-ink-950">
      <InkBackdrop />
      <SideScript className="left-8">气沉丹田 · 心若止水</SideScript>
      <SideScript className="right-8">吐纳调息 · 静坐观心</SideScript>

      <header className="sticky top-0 z-20 flex h-14 shrink-0 items-center border-b border-gold-300/10 bg-ink-950/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-gold-300/30 bg-gradient-to-br from-[#1d2a20] to-ink-900 shadow-lg shadow-gold-500/10">
              <span className="font-brush text-lg leading-none text-gold-300">息</span>
            </div>
            <div>
              <div className="font-brush text-base leading-tight text-gold-200">静心斋</div>
              <div className="text-[11px] leading-tight text-muted-foreground">
                Napas &amp; Meditasi
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={toggle}
            aria-label={isFullscreen ? 'Keluar mode fokus' : 'Mode fokus layar penuh'}
            className="rounded-full border-gold-300/15 bg-white/[0.02] text-muted-foreground hover:bg-gold-300/10 hover:text-gold-200"
          >
            {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </Button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl min-h-0 flex-1 flex-col overflow-hidden px-4 pt-2 pb-3">
        <section className="shrink-0 pt-2 pb-2.5 text-center sm:pt-3 sm:pb-3">
          <div className="font-brush text-lg text-gold-300/80 sm:text-xl">一呼一吸 · 皆是修行</div>
          <h1 className="mt-0.5 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Latihan Pernapasan Terpandu
          </h1>
          <p className="mx-auto mt-1 max-w-[44ch] text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            Pilih Tunà untuk menghimpun energi qi, atau Jìngzuò untuk menenangkan batin
            sehening air telaga.
          </p>
        </section>

        <ModeSwitch value={tab} onChange={setTab} />

        <div className="mt-2 flex min-h-0 flex-1 flex-col justify-center overflow-hidden sm:mt-3">
          <div className={cn('flex flex-col justify-center overflow-hidden', tab !== 'wimhof' && 'hidden')}>
            <WimHof />
          </div>
          <div className={cn('flex flex-col justify-center overflow-hidden', tab !== 'meditasi' && 'hidden')}>
            <Meditation />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
