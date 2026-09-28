import { useLayoutEffect, useRef, useState } from 'react'

const EPSILON = 0.002
const SAFETY = 8
const MIN_FRAMES = 4
const POLL_MS = 400
const MIN_AVAILABLE = 80

/**
 * Keeps a block of content inside its frame: measures the natural height of the
 * content at full width and scales it down (never up) so nothing is clipped and
 * nothing has to scroll. The content is widened by the inverse scale so it keeps
 * filling the frame width.
 */
export function useFitScale() {
  const frameRef = useRef(null)
  const contentRef = useRef(null)
  const [scale, setScale] = useState(1)

  useLayoutEffect(() => {
    const frame = frameRef.current
    const content = contentRef.current
    if (!frame || !content) return

    let raf = 0
    let frames = 0
    let dirty = false

    const measure = () => {
      const available = frame.clientHeight - SAFETY
      if (available < MIN_AVAILABLE) return

      // Always measure at full width so the result never depends on the scale
      // that is currently applied (which would make the fit oscillate).
      const applied = content.style.width
      if (applied) content.style.width = '100%'
      const natural = content.offsetHeight
      if (applied) content.style.width = applied
      if (natural < 1) return

      const next = Math.min(1, available / natural)
      setScale((prev) => (Math.abs(prev - next) < EPSILON ? prev : next))
    }

    // Re-check for a few frames after a change: the scale, late web fonts and
    // toggled container queries all move the content around.
    const followUp = () => {
      if (raf) return
      frames = 0
      raf = requestAnimationFrame(function step() {
        measure()
        frames += 1
        if (frames < MIN_FRAMES || dirty) {
          dirty = false
          frames = 0
          raf = requestAnimationFrame(step)
        } else {
          raf = 0
        }
      })
    }

    const onChange = () => {
      measure()
      followUp()
    }

    const observer = new ResizeObserver(() => {
      dirty = true
      followUp()
    })
    observer.observe(content)
    observer.observe(frame)

    // Safety net for shifts that fire no event of their own, and for the frames
    // that never arrive while the tab is in the background.
    document.fonts?.addEventListener('loadingdone', onChange)
    window.addEventListener('load', onChange)
    window.addEventListener('orientationchange', onChange)
    const poll = setInterval(() => {
      if (!document.hidden) onChange()
    }, POLL_MS)

    onChange()

    return () => {
      observer.disconnect()
      document.fonts?.removeEventListener('loadingdone', onChange)
      window.removeEventListener('load', onChange)
      window.removeEventListener('orientationchange', onChange)
      clearInterval(poll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return { frameRef, contentRef, scale }
}
