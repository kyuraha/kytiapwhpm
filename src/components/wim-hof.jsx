import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Minus, Play, Plus, Square, Wind } from 'lucide-react'

import { Button } from '#components/ui/button'
import { Card, CardContent } from '#components/ui/card'
import { ProgressRing } from '#components/progress-ring'
import { cn } from '#lib/utils'
import {
  initAudio,
  playGoHold,
  playInhalePrompt,
  playCountdownStart,
  playRoundComplete,
} from '#lib/sounds'

const BREATH_DEFAULT = 30
const BREATH_MIN = 10
const BREATH_MAX = 100
const RECOVERY_SECONDS = 20
const RECOVERY_INHALE_MS = 2000

const TEMPOS = [
  { id: 'cepat', label: 'Cepat', in: 1.2, out: 1.2 },
  { id: 'normal', label: 'Normal', in: 1.6, out: 1.6 },
  { id: 'lambat', label: 'Lambat', in: 2.5, out: 2.5 },
]

const STEP_IDS = ['breathing', 'holding', 'recovery']

function easeInOut(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function FlowSteps({ count }) {
  const steps = [
    { title: 'Nafas Awal', desc: `${count} napas otomatis` },
    { title: 'Tahan Nafas', desc: 'klik saat habis' },
    { title: 'Tarik & Tahan', desc: `${RECOVERY_SECONDS} detik` },
  ]

  return (
    <div>
      <div className="mb-3 text-xs font-medium tracking-widest text-muted-foreground uppercase">
        Alur putaran
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-[11px] font-bold text-cyan-300">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground">{step.title}</div>
                <div className="text-xs text-muted-foreground">{step.desc}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="mx-auto size-4 shrink-0 text-muted-foreground/40 sm:mx-0 sm:-ml-0.5 sm:-mr-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function StepperBtn({ label, onClick, disabled }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-lg text-foreground transition-colors hover:bg-white/[0.07] disabled:pointer-events-none disabled:opacity-35"
    >
      {label === 'kurangi' ? <Minus className="size-4" /> : <Plus className="size-4" />}
    </button>
  )
}

function IdleView({ breathCount, setBreathCount, tempoId, setTempoId, onStart }) {
  const adjust = (delta) => {
    setBreathCount((v) => Math.min(BREATH_MAX, Math.max(BREATH_MIN, v + delta)))
  }

  return (
    <Card className="border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent shadow-2xl shadow-black/40">
      <CardContent className="flex flex-col gap-7 p-5 sm:p-6">
        <FlowSteps count={breathCount} />

        <div className="flex flex-col divide-y divide-white/[0.06] rounded-xl border border-white/[0.06] bg-white/[0.03]">
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Jumlah nafas awal</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Banyaknya napas ritmis per putaran.
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 rounded-xl border border-white/10 bg-[#0b1020] p-1">
              <StepperBtn label="kurangi" onClick={() => adjust(-5)} disabled={breathCount <= BREATH_MIN} />
              <div className="w-12 text-center font-mono text-lg font-semibold tabular-nums text-foreground">
                {breathCount}
              </div>
              <StepperBtn label="tambah" onClick={() => adjust(5)} disabled={breathCount >= BREATH_MAX} />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">Tempo nafas</div>
              <div className="mt-0.5 text-xs text-muted-foreground">
                Seberapa cepat siklus tarik–buang.
              </div>
            </div>
            <div className="flex shrink-0 gap-1 rounded-xl border border-white/10 bg-[#0b1020] p-1">
              {TEMPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTempoId(t.id)}
                  className={cn(
                    'h-8 rounded-lg px-3.5 text-sm font-medium transition-colors',
                    tempoId === t.id
                      ? 'bg-cyan-400/15 text-cyan-200'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <Button
            size="lg"
            className="h-12 w-full rounded-xl bg-gradient-to-b from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:to-sky-400 sm:w-72"
            onClick={onStart}
          >
            <Play className="size-4" />
            Mulai Sesi
          </Button>
          <p className="max-w-sm text-center text-xs text-muted-foreground">
            Lakukan di tempat yang aman, bukan di dalam air. Jika pusing, berhenti dan kembali ke
            nafas normal.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function PhaseTrack({ phase }) {
  const idx = STEP_IDS.indexOf(phase)
  const labels = ['Nafas Awal', 'Tahan Nafas', 'Tarik + Tahan']

  return (
    <div className="flex items-center gap-3">
      {labels.map((label, i) => {
        const state = i < idx ? 'done' : i === idx ? 'active' : 'idle'
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div
              className={cn(
                'h-1 w-full rounded-full transition-colors',
                state === 'done' && 'bg-white/30',
                state === 'active' && 'bg-gradient-to-r from-cyan-400 to-sky-400',
                state === 'idle' && 'bg-white/10',
              )}
            />
            <span
              className={cn(
                'text-[10px] tracking-wider uppercase',
                state === 'active' ? 'font-medium text-cyan-300' : 'text-muted-foreground/70',
              )}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function BreathingStage({ count, current, orbRef }) {
  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-60 rounded-full border border-cyan-400/15 animate-pulse-soft" />
      </div>
      <ProgressRing
        id="wim-breathe"
        progress={current / count}
        size={264}
        stroke={12}
        startColor="#22d3ee"
        endColor="#6366f1"
      >
        <div className="relative flex size-[220px] items-center justify-center">
          <div
            ref={orbRef}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 opacity-95 shadow-[0_0_70px_18px_rgba(34,211,238,0.35)] will-change-transform"
            style={{ transform: 'scale(0.55)' }}
          />
          <div className="relative text-center text-slate-950">
            <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums">
              {Math.min(current + 1, count)}
            </div>
            <div className="text-[11px] font-semibold tracking-widest opacity-80 uppercase">
              dari {count}
            </div>
          </div>
        </div>
      </ProgressRing>
    </div>
  )
}

function HoldingStage({ elapsed, onHoldDone }) {
  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="relative flex size-56 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/[0.05]">
        <div className="absolute -inset-6 rounded-full border border-amber-400/10 animate-breathe" />
        <div
          className="absolute -inset-12 rounded-full border border-amber-400/[0.06] animate-breathe"
          style={{ animationDelay: '-4.5s' }}
        />
        <div className="relative text-center">
          <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums text-foreground">
            {formatTime(elapsed)}
          </div>
          <div className="mt-1 text-[11px] font-medium tracking-widest text-amber-300/70 uppercase">
            tahan nafas
          </div>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Setelah nafas terakhir, tahan hingga terasa ingin bernafas lagi.
      </p>
      <Button
        size="lg"
        className="h-12 w-full min-w-0 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-orange-400 sm:w-64"
        onClick={onHoldDone}
      >
        <Wind className="size-4" />
        Nafas Habis, Lanjut
      </Button>
    </div>
  )
}

function RecoveryStage({ stage, remaining, rounds }) {
  if (stage === 'inhale') {
    return (
      <div className="relative flex flex-col items-center gap-6">
        <div className="relative flex size-64 items-center justify-center">
          <div
            key={rounds}
            className="absolute size-52 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_0_70px_18px_rgba(56,189,248,0.35)] animate-recover-inhale"
          />
          <div className="relative flex flex-col items-center gap-1.5 text-slate-950">
            <Wind className="size-9" />
            <div className="text-xl font-bold">Tarik Nafas Penuh</div>
          </div>
        </div>
        <p className="max-w-xs text-center text-sm text-muted-foreground">
          Isi paru-parumu sampai penuh, lalu otomatis menahan nafas 20 detik.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-6">
      <ProgressRing
        id="wim-recover"
        progress={remaining / RECOVERY_SECONDS}
        size={264}
        stroke={12}
        startColor="#38bdf8"
        endColor="#818cf8"
      >
        <div className="flex size-56 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 animate-breathe">
          <div className="text-center text-slate-950">
            <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums">
              {remaining}
            </div>
            <div className="text-[11px] font-semibold tracking-widest opacity-80 uppercase">
              tahan
            </div>
          </div>
        </div>
      </ProgressRing>
      <p className="max-w-xs text-center text-sm text-muted-foreground">
        Tahan nafas. Tarik lewat hidung saat angka mencapai nol.
      </p>
    </div>
  )
}

function SessionConsole({
  phase,
  breathCount,
  breathIndex,
  holdElapsed,
  recoveryStage,
  recoveryRemaining,
  rounds,
  orbRef,
  onHoldDone,
  onStop,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />
          Putaran {rounds + 1}
        </div>
      </div>

      <PhaseTrack phase={phase} />

      <div className="relative flex min-h-[430px] flex-col items-center justify-center gap-8 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent px-4 py-10 sm:min-h-[470px] sm:px-6">
        <div
          className={cn(
            'pointer-events-none absolute -top-28 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full blur-3xl',
            phase === 'breathing' && 'bg-cyan-400/10',
            phase === 'holding' && 'bg-amber-400/10',
            phase === 'recovery' && 'bg-sky-400/10',
          )}
        />
        {phase === 'breathing' && (
          <BreathingStage count={breathCount} current={breathIndex} orbRef={orbRef} />
        )}
        {phase === 'holding' && <HoldingStage elapsed={holdElapsed} onHoldDone={onHoldDone} />}
        {phase === 'recovery' && (
          <RecoveryStage stage={recoveryStage} remaining={recoveryRemaining} rounds={rounds} />
        )}
      </div>

      <Button
        size="lg"
        variant="outline"
        onClick={onStop}
        className="h-11 w-full rounded-xl border-white/10 bg-white/[0.03] text-muted-foreground hover:bg-white/[0.08] hover:text-foreground"
      >
        <Square className="size-4" />
        Hentikan Sesi
      </Button>
    </div>
  )
}

export function WimHof() {
  const [breathCount, setBreathCount] = useState(BREATH_DEFAULT)
  const [tempoId, setTempoId] = useState('normal')
  const [phase, setPhase] = useState('idle')
  const [breathIndex, setBreathIndex] = useState(0)
  const [holdElapsed, setHoldElapsed] = useState(0)
  const [recoveryStage, setRecoveryStage] = useState('inhale')
  const [recoveryRemaining, setRecoveryRemaining] = useState(RECOVERY_SECONDS)
  const [rounds, setRounds] = useState(0)

  const orbRef = useRef(null)
  const phaseRef = useRef('inhale')

  useEffect(() => {
    if (phase !== 'breathing') return
    const tempo = TEMPOS.find((t) => t.id === tempoId) ?? TEMPOS[1]
    let raf
    let phaseStart = performance.now()

    const update = (now) => {
      const elapsed = now - phaseStart
      const duration = (phaseRef.current === 'inhale' ? tempo.in : tempo.out) * 1000
      const t = Math.min(1, elapsed / duration)
      const eased = easeInOut(t)
      const scale =
        phaseRef.current === 'inhale' ? 0.55 + 0.55 * eased : 1.1 - 0.55 * eased
      if (orbRef.current) {
        orbRef.current.style.transform = `scale(${scale.toFixed(4)})`
      }
      if (elapsed >= duration) {
        phaseStart = now
        if (phaseRef.current === 'inhale') {
          phaseRef.current = 'exhale'
        } else {
          phaseRef.current = 'inhale'
          setBreathIndex((i) => i + 1)
        }
      }
      raf = requestAnimationFrame(update)
    }

    raf = requestAnimationFrame(update)
    return () => cancelAnimationFrame(raf)
  }, [phase, tempoId])

  useEffect(() => {
    if (phase === 'breathing' && breathIndex >= breathCount) {
      playGoHold()
      setPhase('holding')
      setHoldElapsed(0)
    }
  }, [phase, breathIndex, breathCount])

  useEffect(() => {
    if (phase === 'holding') {
      const id = setInterval(() => setHoldElapsed((t) => t + 1), 1000)
      return () => clearInterval(id)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'recovery') return
    if (recoveryStage === 'inhale') {
      const id = setTimeout(() => {
        playCountdownStart()
        setRecoveryStage('hold')
      }, RECOVERY_INHALE_MS)
      return () => clearTimeout(id)
    }
    const id = setInterval(() => setRecoveryRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [phase, recoveryStage])

  useEffect(() => {
    if (phase === 'recovery' && recoveryStage === 'hold' && recoveryRemaining === 0) {
      playRoundComplete()
      setRounds((r) => r + 1)
      setBreathIndex(0)
      setRecoveryStage('inhale')
      setRecoveryRemaining(RECOVERY_SECONDS)
      setPhase('breathing')
    }
  }, [phase, recoveryStage, recoveryRemaining])

  const start = () => {
    initAudio()
    phaseRef.current = 'inhale'
    setRounds(0)
    setBreathIndex(0)
    setHoldElapsed(0)
    setRecoveryStage('inhale')
    setRecoveryRemaining(RECOVERY_SECONDS)
    setPhase('breathing')
  }

  const stop = () => {
    phaseRef.current = 'inhale'
    setPhase('idle')
    setBreathIndex(0)
    setHoldElapsed(0)
    setRecoveryStage('inhale')
    setRecoveryRemaining(RECOVERY_SECONDS)
  }

  const onHoldDone = () => {
    playInhalePrompt()
    setRecoveryStage('inhale')
    setRecoveryRemaining(RECOVERY_SECONDS)
    setPhase('recovery')
  }

  return phase === 'idle' ? (
    <IdleView
      breathCount={breathCount}
      setBreathCount={setBreathCount}
      tempoId={tempoId}
      setTempoId={setTempoId}
      onStart={start}
    />
  ) : (
    <SessionConsole
      phase={phase}
      breathCount={breathCount}
      breathIndex={breathIndex}
      holdElapsed={holdElapsed}
      recoveryStage={recoveryStage}
      recoveryRemaining={recoveryRemaining}
      rounds={rounds}
      orbRef={orbRef}
      onHoldDone={onHoldDone}
      onStop={stop}
    />
  )
}