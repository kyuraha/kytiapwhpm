import { useEffect, useState } from 'react'
import { Check, ChevronRight, Minus, Play, Plus, Square, Wind } from 'lucide-react'

import { Button } from '#components/ui/button'
import { Card, CardContent } from '#components/ui/card'
import { ProgressRing } from '#components/progress-ring'
import { cn } from '#lib/utils'

const BREATH_DEFAULT = 30
const BREATH_MIN = 10
const BREATH_MAX = 100
const RECOVERY_SECONDS = 20

const STEP_IDS = ['breathing', 'holding', 'recovery']

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function FlowSteps({ count }) {
  const steps = [
    { title: 'Nafas Awal', desc: `${count} napas ritmis` },
    { title: 'Tahan Nafas', desc: 'sesuai kemampuan' },
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
      {label === 'kurangi' ? (
        <Minus className="size-4" />
      ) : (
        <Plus className="size-4" />
      )}
    </button>
  )
}

function IdleView({ breathCount, setBreathCount, onStart }) {
  const adjust = (delta) => {
    setBreathCount((v) => Math.min(BREATH_MAX, Math.max(BREATH_MIN, v + delta)))
  }

  return (
    <Card className="border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent shadow-2xl shadow-black/40">
      <CardContent className="flex flex-col gap-7 p-5 sm:p-6">
        <FlowSteps count={breathCount} />

        <div className="flex flex-col gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-foreground">Jumlah nafas awal</div>
            <div className="mt-0.5 text-xs text-muted-foreground">
              Atur banyaknya nafas ritmis per putaran.
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

function BreathingStage({ count, current, onBreath }) {
  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-60 rounded-full border border-cyan-400/25 animate-pulse-soft" />
        <div
          className="size-60 rounded-full border border-cyan-400/20 animate-pulse-soft"
          style={{ animationDelay: '-1.8s' }}
        />
      </div>
      <ProgressRing
        id="wim-breathe"
        progress={current / count}
        size={246}
        stroke={12}
        startColor="#22d3ee"
        endColor="#6366f1"
      >
        <div className="text-center">
          <div className="font-mono text-6xl font-semibold tracking-tight tabular-nums text-foreground">
            {Math.min(current, count)}
          </div>
          <div className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            dari {count} napas
          </div>
        </div>
      </ProgressRing>
      <p className="text-sm text-muted-foreground">Tarik lewat hidung, buang lewat mulut.</p>
      <Button
        size="lg"
        className="h-12 w-full min-w-0 rounded-xl bg-gradient-to-b from-cyan-400 to-sky-500 text-slate-950 shadow-lg shadow-cyan-500/25 hover:from-cyan-300 hover:to-sky-400 sm:w-64"
        onClick={onBreath}
      >
        <Wind className="size-4" />
        Satu Nafas
      </Button>
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
        <Check className="size-4" />
        Nafas Habis, Lanjut
      </Button>
    </div>
  )
}

function RecoveryStage({ remaining, active, onStartRecovery }) {
  if (!active) {
    return (
      <div className="flex flex-col items-center gap-6">
        <div className="flex size-24 items-center justify-center rounded-full bg-gradient-to-b from-sky-400/20 to-sky-400/5 ring-1 ring-sky-400/30">
          <Wind className="size-11 text-sky-300" />
        </div>
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">Tarik Satu Nafas Penuh</div>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Isi paru-parumu sampai penuh, lalu bersiap menahan.
          </p>
        </div>
        <Button
          size="lg"
          className="h-12 w-full min-w-0 rounded-xl bg-gradient-to-b from-sky-400 to-blue-500 text-slate-950 shadow-lg shadow-sky-500/25 hover:from-sky-300 hover:to-blue-400 sm:w-64"
          onClick={onStartRecovery}
        >
          <Wind className="size-4" />
          Tarik &amp; Tahan
        </Button>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-6">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-60 rounded-full border border-sky-400/25 animate-pulse-soft" />
        <div
          className="size-60 rounded-full border border-sky-400/20 animate-pulse-soft"
          style={{ animationDelay: '-1.8s' }}
        />
      </div>
      <ProgressRing
        id="wim-recover"
        progress={remaining / RECOVERY_SECONDS}
        size={246}
        stroke={12}
        startColor="#38bdf8"
        endColor="#818cf8"
      >
        <div className="text-center">
          <div className="font-mono text-7xl font-semibold tracking-tight tabular-nums text-foreground">
            {remaining}
          </div>
          <div className="text-[11px] font-medium tracking-widest text-muted-foreground uppercase">
            detik terakhir
          </div>
        </div>
      </ProgressRing>
      <p className="text-sm text-muted-foreground">
        Tahan nafasmu. Tarik lewat hidung saat angka mencapai nol.
      </p>
    </div>
  )
}

function SessionConsole({
  phase,
  breathCount,
  breathIndex,
  holdElapsed,
  recoveryRemaining,
  recoveryActive,
  rounds,
  onBreath,
  onHoldDone,
  onStartRecovery,
  onStop,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onStop}
          className="text-muted-foreground hover:text-foreground"
        >
          <Square className="size-3.5" />
          Hentikan
        </Button>
        <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-muted-foreground">
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
          <BreathingStage count={breathCount} current={breathIndex} onBreath={onBreath} />
        )}
        {phase === 'holding' && <HoldingStage elapsed={holdElapsed} onHoldDone={onHoldDone} />}
        {phase === 'recovery' && (
          <RecoveryStage
            remaining={recoveryRemaining}
            active={recoveryActive}
            onStartRecovery={onStartRecovery}
          />
        )}
      </div>
    </div>
  )
}

export function WimHof() {
  const [breathCount, setBreathCount] = useState(BREATH_DEFAULT)
  const [phase, setPhase] = useState('idle')
  const [breathIndex, setBreathIndex] = useState(0)
  const [holdElapsed, setHoldElapsed] = useState(0)
  const [recoveryRemaining, setRecoveryRemaining] = useState(RECOVERY_SECONDS)
  const [recoveryActive, setRecoveryActive] = useState(false)
  const [rounds, setRounds] = useState(0)

  useEffect(() => {
    if (phase === 'breathing' && breathIndex >= breathCount) {
      setPhase('holding')
      setHoldElapsed(0)
    }
  }, [phase, breathIndex, breathCount])

  useEffect(() => {
    if (phase === 'holding') {
      const id = setInterval(() => setHoldElapsed((t) => t + 1), 1000)
      return () => clearInterval(id)
    }
    if (phase === 'recovery' && recoveryActive) {
      const id = setInterval(
        () => setRecoveryRemaining((r) => Math.max(0, r - 1)),
        1000,
      )
      return () => clearInterval(id)
    }
  }, [phase, recoveryActive])

  useEffect(() => {
    if (phase === 'recovery' && recoveryActive && recoveryRemaining === 0) {
      setRounds((r) => r + 1)
      setBreathIndex(0)
      setRecoveryActive(false)
      setRecoveryRemaining(RECOVERY_SECONDS)
      setPhase('breathing')
    }
  }, [phase, recoveryActive, recoveryRemaining])

  const start = () => {
    setRounds(0)
    setBreathIndex(0)
    setHoldElapsed(0)
    setRecoveryActive(false)
    setRecoveryRemaining(RECOVERY_SECONDS)
    setPhase('breathing')
  }

  const stop = () => {
    setPhase('idle')
    setBreathIndex(0)
    setHoldElapsed(0)
    setRecoveryActive(false)
    setRecoveryRemaining(RECOVERY_SECONDS)
  }

  const onBreath = () => setBreathIndex((i) => i + 1)

  const onHoldDone = () => {
    setRecoveryActive(false)
    setRecoveryRemaining(RECOVERY_SECONDS)
    setPhase('recovery')
  }

  const onStartRecovery = () => setRecoveryActive(true)

  return phase === 'idle' ? (
    <IdleView breathCount={breathCount} setBreathCount={setBreathCount} onStart={start} />
  ) : (
    <SessionConsole
      phase={phase}
      breathCount={breathCount}
      breathIndex={breathIndex}
      holdElapsed={holdElapsed}
      recoveryRemaining={recoveryRemaining}
      recoveryActive={recoveryActive}
      rounds={rounds}
      onBreath={onBreath}
      onHoldDone={onHoldDone}
      onStartRecovery={onStartRecovery}
      onStop={stop}
    />
  )
}