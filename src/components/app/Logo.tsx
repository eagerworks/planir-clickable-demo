import { cn } from "@/lib/utils"

const P_PATHS = [
  "M36.19,21.71c0-2.77-2.25-5.02-5.02-5.02h-2.64c-2.16,0-4.08,1.38-4.76,3.43l-2.2,6.61h9.61c2.77,0,5.02-2.25,5.02-5.02Z",
  "M40.67,2.77H12.17C6.98,2.77,2.77,6.98,2.77,12.17v14.54H12.19l3.14-9.41c1.89-5.68,7.19-9.5,13.18-9.5h2.64c7.66,0,13.9,6.23,13.9,13.9s-6.23,13.9-13.9,13.9H6.5v.02H2.79v5.08c0,2.51,.99,4.8,2.6,6.48l2.56-7.68c2.49-1.58,5.98-2.74,10.25-2.76l-4.45,13.34h26.91c5.19,0,9.39-4.21,9.39-9.39V12.17c0-5.19-4.21-9.39-9.39-9.39Z",
]

const WORD_PATHS = [
  "M91.45,22.64c0,5.74-4.52,8.54-11.3,8.54h-8.33v6.58h-8.23V14.14h16.57c6.78,0,11.3,2.8,11.3,8.5Zm-8.33,.2c0-2.09-1.52-2.8-3.64-2.8h-7.66v5.63h7.66c2.12,0,3.64-.74,3.64-2.83Z",
  "M121.03,31.44v6.31h-23.38V14.14h8.23V31.44h15.15Z",
  "M147.14,33.67h-11.81l-1.92,4.08h-8.57l11.98-23.62h8.94l11.98,23.62h-8.67l-1.92-4.08Zm-2.5-5.33l-3.41-7.29-3.41,7.29h6.82Z",
  "M191.97,14.14v23.62h-7.22l-13.7-14.14v14.14h-7.93V14.14h8.7l12.18,12.82V14.14h7.96Z",
  "M200.7,37.75V14.14h8.23v23.62h-8.23Z",
  "M237.1,37.75l-5.74-6.95h-5.53v6.95h-8.16V14.14h16.77c6.31,0,11.3,2.7,11.3,8.33,0,3.88-2.36,6.38-5.9,7.56l6.65,7.73h-9.38Zm-3.34-12.45c2.12,0,3.64-.61,3.64-2.63s-1.52-2.63-3.64-2.63h-7.93v5.26h7.93Z",
]

/** Planir logo. `onDark` for green backgrounds, default for white ones. */
export function Logo({ onDark = false, iconOnly = false, className }: { onDark?: boolean; iconOnly?: boolean; className?: string }) {
  const square = onDark ? "#ffffff" : "#f15a29"
  const p = onDark ? "#f15a29" : "#ffffff"
  const word = onDark ? "#ffffff" : "#00472c"
  return (
    <svg viewBox={iconOnly ? "0 0 52.88 52.88" : "0 0 246.48 52.88"} className={cn("h-7 w-auto", className)} role="img" aria-label="Planir">
      <rect width="52.88" height="52.88" rx="10.5" fill={square} />
      {P_PATHS.map((d) => <path key={d} d={d} fill={p} />)}
      {!iconOnly && WORD_PATHS.map((d) => <path key={d} d={d} fill={word} />)}
    </svg>
  )
}
