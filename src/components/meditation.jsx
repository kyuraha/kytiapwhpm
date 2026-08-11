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
      <div className="absolute size-72 rounded-full border border-emerald-400/10 animate-breathe" />
      <div
        className="absolute size-72 rounded-full border border-emerald-400/[0.07] animate-breathe"
        style={{ animationDelay: '-3s' }}
      />
      <div
        className="absolute size-72 rounded-full border border-teal-300/[0.05] animate-breathe"
        style={{ animationDelay: '-6s' }}
      />
    </div>
  )
}

function IdleView({ minutes, seconds, adjustMinute, adjustSecond, totalSeconds, onStart }) {
  const presetActive = (m) => m === minutes && seconds === 0

  return (
    <Card className="border-emerald-400/15 bg-gradient-to-b from-emerald-400/[0.07] to-transparent shadow-2xl shadow-black/40">
      <CardContent className="flex flex-col gap-7 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/20">
            <Flower2 className="size-5 text-emerald-950" />
          </div>
          <div>
            <div className="text-sm font-semibold text-foreground">Sesi Meditasi</div>
            <div className="text-xs text-muted-foreground">Pilih durasi, lalu mulai.</div>
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
          <div className="mb-2.5 text-xs font-medium tracking-widest text-muted-foreground uppercase">
            Durasi cepat
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
                    ? 'bg-gradient-to-b from-emerald-400 to-teal-500 text-emerald-950 shadow-md shadow-emerald-500/25'
                    : 'border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground',
                )}
              >
                {m} menit
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-emerald-400/15 bg-[#0b1020]/60 px-4 py-4 text-center">
          <div className="font-mono text-4xl font-semibold tracking-tight tabular-nums text-emerald-100">
            {formatTime(totalSeconds)}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">total durasi</div>
        </div>

        <Button
          size="lg"
          className="h-12 w-full rounded-xl bg-gradient-to-b from-emerald-400 to-teal-500 text-emerald-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:to-teal-400"
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
    <div className="relative flex min-h-[460px] flex-col items-center justify-center gap-12 overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-b from-emerald-400/[0.06] to-transparent px-4 py-10 sm:min-h-[500px]">
      <ZenAmbience />

      <div className="relative flex items-center justify-center">
        <ProgressRing
          id="med-ring"
          progress={progress}
          size={286}
          stroke={12}
          startColor="#34d399"
          endColor="#14b8a6"
        >
          <div className="text-center">
            <div className="font-mono text-5xl font-semibold tracking-tight tabular-nums text-emerald-50">
              {formatTime(remaining)}
            </div>
            <div className="mt-1 text-[11px] font-medium tracking-widest text-emerald-300/60 uppercase">
              {status === 'paused' ? 'dijeda' : 'meditasi'}
            </div>
          </div>
        </ProgressRing>
      </div>

      <div className="relative flex items-center justify-center gap-3">
        {status === 'running' ? (
          <Button
            size="lg"
            className="h-12 min-w-40 rounded-xl bg-gradient-to-b from-emerald-400 to-teal-500 text-emerald-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:to-teal-400"
            onClick={onPause}
          >
            <Pause className="size-4" />
            Jeda
          </Button>
        ) : (
          <Button
            size="lg"
            className="h-12 min-w-40 rounded-xl bg-gradient-to-b from-emerald-400 to-teal-500 text-emerald-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:to-teal-400"
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
          className="h-12 min-w-32 rounded-xl border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
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
    <div className="relative flex min-h-[460px] flex-col items-center justify-center gap-10 overflow-hidden rounded-2xl border border-emerald-400/15 bg-gradient-to-b from-emerald-400/[0.06] to-transparent px-4 py-10 text-center sm:min-h-[500px]">
      <ZenAmbience />

      <div className="relative">
        <ProgressRing
          id="med-done"
          progress={1}
          size={168}
          stroke={10}
          startColor="#34d399"
          endColor="#14b8a6"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30">
            <Check className="size-6 text-emerald-950" />
          </div>
        </ProgressRing>
      </div>

      <div className="relative flex flex-col items-center gap-2">
        <div className="text-2xl font-semibold tracking-tight text-emerald-50">Sesi Selesai</div>
        <p className="max-w-sm text-sm text-muted-foreground">
          Meditasi {minutes} menit telah usai. Semoga pikiranmu lebih tenang dan hadir.
        </p>
      </div>

      <Button
        size="lg"
        className="relative h-12 min-w-52 rounded-xl bg-gradient-to-b from-emerald-400 to-teal-500 text-emerald-950 shadow-lg shadow-emerald-500/25 hover:from-emerald-300 hover:to-teal-400"
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
    if (status === 'running') {
      const id = setInterval(() => {
        const r = Math.max(0, Math.round((endRef.current - Date.now()) / 1000))
        setRemaining(r)
        if (r <= 0) {
          setStatus('finished')
          playRoundComplete()
        }
      }, 250)
      return () => clearInterval(id)
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