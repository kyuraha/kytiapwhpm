import { cn } from '#lib/utils'

/** Ring box that follows the viewport height so the stage always fits. */
export const RING_BOX = 'min(240px, 30dvh)'

export function ProgressRing({
  id,
  progress = 0,
  size = 240,
  box = `${size}px`,
  stroke = 10,
  startColor = '#22d3ee',
  endColor = '#6366f1',
  trackClassName = 'stroke-[#d8cba4]/10',
  className,
  children,
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(1, Math.max(0, progress))
  const offset = circumference * (1 - clamped)

  return (
    <div
      className={cn('@container relative aspect-square max-w-full', className)}
      style={{ width: box }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="size-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={trackClassName}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          stroke={`url(#${id})`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  )
}
