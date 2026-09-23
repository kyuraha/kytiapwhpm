import { useEffect, useRef, useState } from 'react'
import { Check, Flower2, Minus, Pause, Play, Plus, RotateCcw } from 'lucide-react'

import { Button } from '#components/ui/button'
import { Card, CardContent } from '#components/ui/card'
import { ProgressRing } from '#components/progress-ring'
import { cn } from '#lib/utils'
import { initAudio, playRoundComplete } from '#lib/sounds'

const PRESETS = [5, 10, 15, 20, 30]
const DEFAULT_MINUTES = 10
const MAX_MINUTES = 180

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function Stepper({ label, value, onInc, onDec, decDisabled = false, incDisabled = false }) {
  const btn =
    'grid size-9 place-items-center rounded-lg border border-white/10 bg-white/[0.03] text-foreground transition-colors hover:bg-white/[0.08] disabled:pointer-events-none disabled:opacity-35'

  return (
    <div className="flex flex-col items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5">
      <span className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </span>
      <div className="font-mono text-3xl font-semibold tabular-nums text-foreground">{value}</div>
      <div className="flex gap-1.5">
        <button type="button" aria-label={`kurangi ${label}`} onClick={onDec} disabled={decDisabled} className={btn}>
          <Minus className="size-4" />
        </button>
        <button type="button" aria-label={`tambah ${label}`} onClick={onInc} disabled={incDisabled} className={btn}>
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  )
}

function ZenAmbience() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div className="absolute size-72 rounded-full border border-jade-400/10 animate-breathe" />
      <div
        className="absolute size-72 rounded-full border border-jade-400/[0.07] animate-breathe"
        style={{ animationDelay: '-3s' }}
      />
      <div
        className="absolute size-72 rounded-full border border-gold-300/[0.06] animate-breathe"
        style={{ animationDelay: '-6s' }}
      />
    </div>
  )
}

function BrushMark({ char }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="font-brush text-[160px] leading-none text-jade-300/[0.045] select-none sm:text-[190px]">
        {char}
      </span>
    </div>
  )
}

function IdleView({ minutes, seconds, adjustMinute, adjustSecond, totalSeconds, onStart }) {
  const presetActive = (m) => m === minutes && seconds === 0

  return (
    <Card className="border-jade-400/15 bg-gradient-to-b from-jade-400/[0.07] to-transparent shadow-2xl shadow-black/40">
      <CardContent className="flex flex-col gap-4 p-4 sm:gap-5 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full border border-jade-300/30 bg-gradient-to-br from-jade-300 to-jade-500 shadow-lg shadow-jade-500/20">
              <Flower2 className="size-5 text-[#0f231a]" />
            </div>
            <div>
              <div className="text-sm font-semibold tracking-tight text-foreground">Ruang Hening · 静坐</div>
              <div className="text-xs leading-snug text-muted-foreground">
                Hadir sepenuhnya — beberapa menit cukup untuk menjernihkan pikiran.
              </div>
            </div>
          </div>

        <div className="grid grid-cols-2 gap-3">
          <Stepper
            label="Menit"
            value={minutes}
            onInc={() => adjustMinute(1)}
            onDec={() => adjustMinute(-1)}
            decDisabled={minutes <= 0}
            incDisabled={minutes >= MAX_MINUTES}
          />
          <Stepper
            label="Detik"
            value={String(seconds).padStart(2, '0')}
            onInc={() => adjustSecond(10)}
            onDec={() => adjustSecond(-10)}
            decDisabled={totalSeconds <= 0}
          />
        </div>

        <div>
          <div className="mb-2 text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            Pilihan cepat
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  adjustMinute(0, m)
                  adjustSecond(0, 0)
                }}
                className={cn(
                  'h-9 rounded-lg px-3.5 text-sm font-medium transition-colors',
                  presetActive(m)
                    ? 'bg-gradient-to-b from-jade-300 to-jade-500 text-[#0f231a] shadow-md shadow-jade-500/25'
                    : 'border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground',
                )}
              >
                {m} menit
              </button>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-xl border border-jade-400/15 bg-ink-950/70 px-4 py-4 text-center">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-jade-400/[0.06] to-transparent" />
          <div className="relative font-mono text-4xl font-semibold tracking-tight tabular-nums text-jade-300">
            {formatTime(totalSeconds)}
          </div>
          <div className="relative mt-1 text-xs tracking-wide text-muted-foreground">durasi sesi</div>
          <p className="relative mx-auto mt-2 max-w-[28ch] text-[11px] leading-relaxed text-muted-foreground/70">
            Tidak perlu lama untuk bermakna. Konsistensi lebih penting dari durasi.
          </p>
        </div>

        <Button
          size="lg"
          className="h-12 w-full rounded-xl bg-gradient-to-b from-jade-300 to-jade-500 text-[#0f231a] shadow-lg shadow-jade-500/25 hover:from-jade-300 hover:to-jade-400"
          onClick={onStart}
        >
          <Play className="size-4" />
          Mulai Meditasi
        </Button>
      </CardContent>
    </Card>
  )
}

function RunningView({ status, remaining, progress, onPause, onResume, onStop }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-jade-400/15 bg-gradient-to-b from-jade-400/[0.06] to-transparent px-4 py-6 sm:gap-8 sm:py-8">
      <ZenAmbience />
      <BrushMark char="禅" />

      <div className="relative flex items-center justify-center">
        <ProgressRing
          id="med-ring"
          progress={progress}
          size={240}
          stroke={11}
          startColor="#a8dcc0"
          endColor="#478a68"
        >
          <div className="text-center">
            <div className="font-mono text-4xl font-semibold tracking-tight tabular-nums text-foreground sm:text-5xl">
              {formatTime(remaining)}
            </div>
            <div className="mt-1 text-[11px] font-medium tracking-widest text-jade-400/70 uppercase">
              {status === 'paused' ? 'dijeda' : 'meditasi'}
            </div>
          </div>
        </ProgressRing>
      </div>

      <div className="relative flex items-center justify-center gap-3">
        {status === 'running' ? (
          <Button
            size="lg"
            className="h-12 min-w-40 rounded-xl bg-gradient-to-b from-jade-300 to-jade-500 text-[#0f231a] shadow-lg shadow-jade-500/25 hover:from-jade-300 hover:to-jade-400"
            onClick={onPause}
          >
            <Pause className="size-4" />
            Jeda
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-12 min-w-40 rounded-xl bg-gradient-to-b from-jade-300 to-jade-500 text-[#0f231a] shadow-lg shadow-jade-500/25 hover:from-jade-300 hover:to-jade-400"
            onClick={onResume}
          >
            <Play className="size-4" />
            Lanjutkan
          </Button>
        )}
        <Button
          size="lg"
          variant="outline"
          onClick={onStop}
          className="h-12 min-w-32 rounded-xl border-jade-300/15 bg-white/[0.03] text-muted-foreground hover:bg-jade-400/10 hover:text-jade-300"
        >
          <RotateCcw className="size-4" />
          Selesai
        </Button>
      </div>
    </div>
  )
}

function FinishedView({ minutes, onAgain }) {
  return (
    <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-jade-400/15 bg-gradient-to-b from-jade-400/[0.06] to-transparent px-4 py-6 text-center sm:gap-8 sm:py-8">
      <ZenAmbience />
      <BrushMark char="悟" />

      <div className="relative">
        <ProgressRing
          id="med-done"
          progress={1}
          size={168}
          stroke={10}
          startColor="#a8dcc0"
          endColor="#478a68"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-jade-300 to-jade-500 shadow-lg shadow-jade-500/30">
            <Check className="size-6 text-[#0f231a]" />
          </div>
        </ProgressRing>
      </div>

      <div className="relative flex flex-col items-center gap-2">
        <div className="font-brush text-lg text-jade-300/80">功德圆满</div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">Sesi Selesai</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Meditasi {minutes} menit telah usai. Semoga pikiranmu lebih tenang dan hadir.
        </p>
      </div>

      <Button
        size="lg"
        className="relative h-12 min-w-52 rounded-xl bg-gradient-to-b from-jade-300 to-jade-500 text-[#0f231a] shadow-lg shadow-jade-500/25 hover:from-jade-300 hover:to-jade-400"
        onClick={onAgain}
      >
        <RotateCcw className="size-4" />
        Ulangi Sesi
      </Button>
    </div>
  )
}

export function Meditation() {
  const [minutes, setMinutes] = useState(DEFAULT_MINUTES)
  const [seconds, setSeconds] = useState(0)
  const [status, setStatus] = useState('idle')
  const [remaining, setRemaining] = useState(DEFAULT_MINUTES * 60)
  const [total, setTotal] = useState(DEFAULT_MINUTES * 60)
  const endRef = useRef(0)

  const totalSeconds = minutes * 60 + seconds

  const adjustMinute = (delta, absolute) => {
    setMinutes((m) => {
      const next = absolute === undefined ? m + delta : absolute
      return Math.min(MAX_MINUTES, Math.max(0, next))
    })
  }

  const adjustSecond = (delta, absolute) => {
    if (absolute !== undefined) {
      setSeconds(Math.min(59, Math.max(0, absolute)))
      return
    }
    const next = seconds + delta
    if (next >= 60) {
      setSeconds(next - 60)
      setMinutes((m) => Math.min(MAX_MINUTES, m + 1))
    } else if (next < 0) {
      if (minutes > 0) {
        setSeconds(60 + next)
        setMinutes((m) => Math.max(0, m - 1))
      } else {
        setSeconds(0)
      }
    } else {
      setSeconds(next)
    }
  }

  useEffect(() => {
    if (status !== 'running') return

    const tick = () => {
      const r = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
      setRemaining(r)
      if (r <= 0) {
        setStatus('finished')
        playRoundComplete()
      }
    }

    const id = setInterval(tick, 250)
    const onVisibility = () => {
      if (!document.hidden) tick()
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [status])

  const start = () => {
    initAudio()
    setRemaining(totalSeconds)
    setTotal(totalSeconds)
    endRef.current = Date.now() + totalSeconds * 1000
    setStatus('running')
  }

  const resume = () => {
    initAudio()
    endRef.current = Date.now() + remaining * 1000
    setStatus('running')
  }

  const pause = () => setStatus('paused')

  const stop = () => {
    setStatus('idle')
    setRemaining(totalSeconds)
  }

  const progress = total > 0 ? Math.min(1, Math.max(0, (total - remaining) / total)) : 0

  if (status === 'idle') {
    return (
      <IdleView
        minutes={minutes}
        seconds={seconds}
        adjustMinute={adjustMinute}
        adjustSecond={adjustSecond}
        totalSeconds={totalSeconds}
        onStart={start}
      />
    )
  }

  if (status === 'finished') {
    return <FinishedView minutes={minutes} onAgain={start} />
  }

  return (
    <RunningView
      status={status}
      remaining={remaining}
      progress={progress}
      onPause={pause}
      onResume={resume}
      onStop={stop}
    />
  )
}