import { useEffect, useRef, useState } from 'react'
import { ChevronRight, Minus, Play, Plus, Square, Timer, Wind } from 'lucide-react'

import { Button } from '#components/ui/button'
import { Card, CardContent } from '#components/ui/card'
import { ProgressRing } from '#components/progress-ring'
import { cn } from '#lib/utils'
import {
  initAudio,
  playGoHold,
  playInhalePrompt,
  playCountdownStart,
  playExhale,
  playRoundComplete,
} from '#lib/sounds'

const BREATH_DEFAULT = 30
const BREATH_MIN = 10
const BREATH_MAX = 100
const RECOVERY_SECONDS = 20
const RECOVERY_INHALE_MS = 2000
const RECOVERY_EXHALE_MS = 7000

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
    { title: 'Napas Awal', desc: `${count}× napas dalam berirama` },
    { title: 'Tahan Napas', desc: 'Tahan hingga batas nyaman' },
    { title: 'Tarik & Tahan', desc: `Tarik penuh, tahan ${RECOVERY_SECONDS} dtk + buang` },
  ]

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Alur satu putaran
        </div>
        <div className="hidden text-[11px] text-muted-foreground/60 sm:block">Mengalir otomatis</div>
      </div>
      <p className="mb-2.5 text-xs leading-relaxed text-muted-foreground">
        Tiga fase yang mengalir tanpa jeda. Bernapaslah rileks dan dengarkan tubuhmu.
      </p>
      <div className="flex flex-row gap-1.5 sm:gap-2">
        {steps.map((step, i) => (
          <div key={step.title} className="flex flex-1 items-center gap-1 sm:gap-2">
            <div className="flex flex-1 flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-1.5 py-2.5 text-center sm:flex-row sm:items-start sm:gap-3 sm:p-3 sm:text-left">
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-[10px] font-bold text-cyan-300 sm:size-6 sm:text-[11px]">
                {i + 1}
              </div>
              <div className="min-w-0">
                <div className="text-[11px] font-semibold leading-tight text-foreground sm:text-sm">{step.title}</div>
                <div className="hidden text-[10px] leading-snug text-muted-foreground sm:block sm:text-xs">{step.desc}</div>
                <div className="text-[10px] leading-none text-muted-foreground sm:hidden">{step.desc.split(' ')[0]}</div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <ChevronRight className="hidden size-3 shrink-0 text-white/20 sm:block sm:size-4 sm:text-muted-foreground/30" />
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
      <CardContent className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-5">
        <FlowSteps count={breathCount} />

        <div className="flex flex-col divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.03]">
          <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex gap-2.5">
              <div className="hidden size-8 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-300 sm:flex">
                <Wind className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Jumlah napas per putaran</div>
                <div className="mt-0.5 max-w-[28ch] text-xs leading-snug text-muted-foreground">
                  Rekomendasi pemula 30. Rentang 10–100 — dengarkan kenyamananmu.
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 self-start rounded-xl border border-white/10 bg-[#0b1020] p-1 sm:self-auto">
              <StepperBtn label="kurangi" onClick={() => adjust(-5)} disabled={breathCount <= BREATH_MIN} />
              <div className="w-12 text-center font-mono text-lg font-semibold tabular-nums text-foreground">
                {breathCount}
              </div>
              <StepperBtn label="tambah" onClick={() => adjust(5)} disabled={breathCount >= BREATH_MAX} />
            </div>
          </div>
          <div className="flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4">
            <div className="flex gap-2.5">
              <div className="hidden size-8 items-center justify-center rounded-lg bg-sky-400/10 text-sky-300 sm:flex">
                <Timer className="size-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Tempo irama napas</div>
                <div className="mt-0.5 max-w-[28ch] text-xs leading-snug text-muted-foreground">
                  Cepat berenergi, Lambat menenangkan. Normal cocok untuk kebanyakan sesi.
                </div>
              </div>
            </div>
            <div className="flex shrink-0 gap-1 self-start rounded-full border border-white/10 bg-[#0b1020] p-1 sm:self-auto">
              {TEMPOS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTempoId(t.id)}
                  className={cn(
                    'h-8 rounded-full px-3.5 text-sm font-medium transition-colors',
                    tempoId === t.id
                      ? 'bg-white text-[#0b1020] shadow'
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
          <p className="max-w-sm text-center text-[11px] leading-relaxed text-muted-foreground/80 sm:text-xs">
            Praktikkan di tempat aman dan nyaman — hindari di dalam air atau saat berkendara. Jika
            pusing atau tidak nyaman, hentikan dan kembali ke napas alami.
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
    <div className="relative flex flex-col items-center gap-5">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="size-56 rounded-full border border-cyan-400/15 animate-pulse-soft sm:size-60" />
      </div>
      <ProgressRing
        id="wim-breathe"
        progress={current / count}
        size={240}
        stroke={11}
        startColor="#22d3ee"
        endColor="#6366f1"
      >
        <div className="relative flex size-[190px] items-center justify-center sm:size-[210px]">
          <div
            ref={orbRef}
            className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-400 to-sky-500 opacity-95 shadow-[0_0_60px_14px_rgba(34,211,238,0.35)] will-change-transform"
            style={{ transform: 'scale(0.55)' }}
          />
          <div className="relative text-center text-slate-950">
            <div className="font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
              {Math.min(current + 1, count)}
            </div>
            <div className="text-[11px] font-semibold tracking-widest opacity-80 uppercase">
              dari {count} napas
            </div>
          </div>
        </div>
      </ProgressRing>
      <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Ikuti irama lingkaran — tarik saat membesar, buang saat mengecil
      </p>
    </div>
  )
}

function HoldingStage({ elapsed, onHoldDone }) {
  return (
    <div className="relative flex flex-col items-center gap-5">
      <div className="relative flex size-48 items-center justify-center rounded-full border border-amber-400/25 bg-amber-400/[0.05] sm:size-52">
        <div className="absolute -inset-5 rounded-full border border-amber-400/10 animate-breathe sm:-inset-6" />
        <div
          className="absolute -inset-8 rounded-full border border-amber-400/[0.06] animate-breathe sm:-inset-12"
          style={{ animationDelay: '-4.5s' }}
        />
        <div className="relative text-center">
          <div className="font-mono text-5xl font-semibold tracking-tight tabular-nums text-foreground sm:text-6xl">
            {formatTime(elapsed)}
          </div>
          <div className="mt-1 text-[11px] font-medium tracking-widest text-amber-300/70 uppercase">
            tahan napas
          </div>
        </div>
      </div>
      <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Buang napas terakhir perlahan, lalu tahan senyaman mungkin.
      </p>
      <Button
        size="lg"
        className="h-11 w-full min-w-0 rounded-xl bg-gradient-to-b from-amber-400 to-orange-500 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/25 hover:from-amber-300 hover:to-orange-400 sm:h-12 sm:w-64"
        onClick={onHoldDone}
      >
        <Wind className="size-4" />
        Napas Habis, Lanjut
      </Button>
    </div>
  )
}

function RecoveryStage({ stage, remaining, rounds }) {
  if (stage === 'inhale') {
    return (
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex size-56 items-center justify-center sm:size-60">
          <div
            key={`inhale-${rounds}`}
            className="absolute size-48 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_0_60px_14px_rgba(56,189,248,0.35)] animate-recover-inhale sm:size-52"
          />
          <div className="relative flex flex-col items-center gap-1 text-slate-950">
            <Wind className="size-8 sm:size-9" />
            <div className="text-lg font-bold tracking-tight sm:text-xl">Tarik Napas Penuh</div>
            <div className="text-[10px] font-medium tracking-widest opacity-70 uppercase">satu tarikan dalam</div>
          </div>
        </div>
        <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Isi paru-paru sepenuhnya, rasakan dada mengembang perlahan.
        </p>
      </div>
    )
  }

  if (stage === 'exhale') {
    return (
      <div className="relative flex flex-col items-center gap-5">
        <div className="relative flex size-56 items-center justify-center sm:size-60">
          <div
            key={`exhale-${rounds}`}
            className="absolute size-52 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 shadow-[0_0_60px_14px_rgba(56,189,248,0.35)] animate-recover-exhale sm:size-52"
          />
          <div className="relative flex flex-col items-center gap-1 text-slate-950">
            <Wind className="size-8 sm:size-9 opacity-80" />
            <div className="text-lg font-bold tracking-tight sm:text-xl">Buang Napas</div>
            <div className="text-[10px] font-medium tracking-widest opacity-70 uppercase">perlahan & rileks</div>
          </div>
        </div>
        <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
          Hembuskan perlahan lewat mulut. Biarkan bahu turun sebelum putaran berikutnya.
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center gap-5">
      <ProgressRing
        id="wim-recover"
        progress={remaining / RECOVERY_SECONDS}
        size={240}
        stroke={11}
        startColor="#38bdf8"
        endColor="#818cf8"
      >
        <div className="flex size-52 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-blue-600 animate-breathe sm:size-56">
          <div className="text-center text-slate-950">
            <div className="font-mono text-5xl font-semibold tracking-tight tabular-nums sm:text-6xl">
              {remaining}
            </div>
            <div className="text-[11px] font-semibold tracking-widest opacity-80 uppercase">
              tahan
            </div>
          </div>
        </div>
      </ProgressRing>
      <p className="max-w-xs text-center text-xs leading-relaxed text-muted-foreground sm:text-sm">
        Pertahankan dengan tenang. Lepaskan perlahan saat hitungan selesai.
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
    <div className="flex flex-col gap-4 sm:gap-5">
      <div className="flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-3.5 py-1 text-xs font-medium text-muted-foreground sm:px-4 sm:py-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-cyan-400" />
          Putaran {rounds + 1} · {phase === 'breathing' ? 'Bernapas' : phase === 'holding' ? 'Menahan' : 'Pemulihan'}
        </div>
      </div>

      <PhaseTrack phase={phase} />

      <div className="relative flex flex-col items-center justify-center gap-6 overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-b from-white/[0.05] to-transparent px-4 py-7 sm:gap-8 sm:px-6 sm:py-8">
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
  const breathStartRef = useRef(0)
  const breathIndexRef = useRef(0)
  const holdStartRef = useRef(0)
  const recoveryStartRef = useRef(0)
  const recoveryStageRef = useRef('inhale')
  const recoveryDoneRef = useRef(false)

  useEffect(() => {
    if (phase !== 'breathing') return
    const tempo = TEMPOS.find((t) => t.id === tempoId) ?? TEMPOS[1]
    const inMs = tempo.in * 1000
    const outMs = tempo.out * 1000
    const breathMs = inMs + outMs

    let raf

    const applyScale = () => {
      if (!orbRef.current) return
      const elapsed = Date.now() - breathStartRef.current
      const pos = ((elapsed % breathMs) + breathMs) % breathMs
      const inhaling = pos < inMs
      const t = inhaling ? pos / inMs : (pos - inMs) / outMs
      const eased = easeInOut(t)
      const scale = inhaling ? 0.55 + 0.55 * eased : 1.1 - 0.55 * eased
      orbRef.current.style.transform = `scale(${scale.toFixed(4)})`
    }

    const loop = () => {
      applyScale()
      raf = requestAnimationFrame(loop)
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [phase, tempoId])

  useEffect(() => {
    if (phase !== 'breathing') return
    const tempo = TEMPOS.find((t) => t.id === tempoId) ?? TEMPOS[1]
    const breathMs = (tempo.in + tempo.out) * 1000

    const check = () => {
      const elapsed = Date.now() - breathStartRef.current
      const done = Math.floor(elapsed / breathMs)
      if (done >= breathCount) {
        playGoHold()
        breathIndexRef.current = breathCount
        setBreathIndex(breathCount)
        holdStartRef.current = Date.now()
        setHoldElapsed(0)
        setPhase('holding')
      } else if (done !== breathIndexRef.current) {
        breathIndexRef.current = done
        setBreathIndex(done)
      }
    }

    check()
    const id = setInterval(check, 250)
    return () => clearInterval(id)
  }, [phase, tempoId, breathCount])

  useEffect(() => {
    if (phase !== 'holding') return
    const update = () => {
      setHoldElapsed(Math.max(0, Math.floor((Date.now() - holdStartRef.current) / 1000)))
    }
    update()
    const id = setInterval(update, 250)
    return () => clearInterval(id)
  }, [phase])

  useEffect(() => {
    if (phase !== 'recovery') return
    recoveryDoneRef.current = false
    const IN_MS = RECOVERY_INHALE_MS
    const HOLD_MS = RECOVERY_SECONDS * 1000
    const EXHALE_MS = RECOVERY_EXHALE_MS
    const TOTAL_MS = IN_MS + HOLD_MS + EXHALE_MS

    const tick = () => {
      const elapsed = Date.now() - recoveryStartRef.current
      if (elapsed < IN_MS) {
        if (recoveryStageRef.current !== 'inhale') {
          recoveryStageRef.current = 'inhale'
          setRecoveryStage('inhale')
        }
        return
      }
      if (elapsed < IN_MS + HOLD_MS) {
        if (recoveryStageRef.current !== 'hold') {
          recoveryStageRef.current = 'hold'
          setRecoveryStage('hold')
          playCountdownStart()
        }
        const remaining = Math.max(0, Math.ceil((IN_MS + HOLD_MS - elapsed) / 1000))
        setRecoveryRemaining(remaining)
        return
      }
      if (elapsed < TOTAL_MS) {
        if (recoveryStageRef.current !== 'exhale') {
          recoveryStageRef.current = 'exhale'
          setRecoveryStage('exhale')
          playExhale()
        }
        return
      }
      if (!recoveryDoneRef.current) {
        recoveryDoneRef.current = true
        playRoundComplete()
        breathIndexRef.current = 0
        setBreathIndex(0)
        recoveryStageRef.current = 'inhale'
        setRecoveryStage('inhale')
        setRecoveryRemaining(RECOVERY_SECONDS)
        setRounds((r) => r + 1)
        breathStartRef.current = Date.now()
        setPhase('breathing')
      }
    }

    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [phase])

  const start = () => {
    initAudio()
    setRounds(0)
    breathIndexRef.current = 0
    setBreathIndex(0)
    breathStartRef.current = Date.now()
    setHoldElapsed(0)
    recoveryStageRef.current = 'inhale'
    setRecoveryStage('inhale')
    setRecoveryRemaining(RECOVERY_SECONDS)
    setPhase('breathing')
  }

  const stop = () => {
    setPhase('idle')
    breathIndexRef.current = 0
    setBreathIndex(0)
    setHoldElapsed(0)
    recoveryStageRef.current = 'inhale'
    setRecoveryStage('inhale')
    setRecoveryRemaining(RECOVERY_SECONDS)
  }

  const onHoldDone = () => {
    playInhalePrompt()
    recoveryStartRef.current = Date.now()
    recoveryStageRef.current = 'inhale'
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