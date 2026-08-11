let audioCtx = null

export function initAudio() {
  try {
    if (!audioCtx) {
      const Ctx = window.AudioContext || window.webkitAudioContext
      if (!Ctx) return
      audioCtx = new Ctx()
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume()
    }
  } catch {
    // audio tidak tersedia
  }
}

function tone({ freq, delay = 0, duration = 0.4, volume = 0.12, type = 'sine' }) {
  if (!audioCtx) return
  try {
    const t = audioCtx.currentTime + delay
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(volume, t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
    osc.connect(gain)
    gain.connect(audioCtx.destination)
    osc.start(t)
    osc.stop(t + duration + 0.05)
  } catch {
    // abaikan
  }
}

export function playGoHold() {
  tone({ freq: 659.25, delay: 0, duration: 0.35, volume: 0.14 })
  tone({ freq: 987.77, delay: 0.18, duration: 0.4, volume: 0.14 })
}

export function playInhalePrompt() {
  tone({ freq: 587.33, delay: 0, duration: 0.35, volume: 0.14 })
  tone({ freq: 880.0, delay: 0.16, duration: 0.5, volume: 0.14 })
}

export function playCountdownStart() {
  tone({ freq: 783.99, delay: 0, duration: 0.3, volume: 0.12 })
}

export function playRoundComplete() {
  const notes = [523.25, 659.25, 783.99]
  notes.forEach((freq, i) => {
    tone({ freq, delay: i * 0.22, duration: 1.2, volume: 0.12 })
  })
}