import type { EstadoIngreso, EstadoSalida, ItemProforma } from "@/data/types"

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"]

/** "2026-10-30" → "30 oct 2026" */
export function fecha(iso?: string) {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  return `${Number(d)} ${MESES[Number(m) - 1]} ${y}`
}

/** "2026-10-30" → "30/10/2026" */
export function fechaCorta(iso?: string) {
  if (!iso) return "—"
  return iso.slice(0, 10).split("-").reverse().join("/")
}

/** "2026-10-28T10:42" → "28 oct · 10:42" */
export function fechaHora(iso?: string) {
  if (!iso) return "—"
  const [y, m, d] = iso.slice(0, 10).split("-")
  void y
  const hora = iso.length > 10 ? ` · ${iso.slice(11, 16)}` : ""
  return `${Number(d)} ${MESES[Number(m) - 1]}${hora}`
}

export const usd = (n: number) => `USD ${n.toLocaleString("es-UY")}`
export const total = (items: ItemProforma[]) => items.reduce((a, b) => a + b.monto, 0)
export const kg = (n: number) => `${n.toLocaleString("es-UY")} kg`

export type Tone = "ok" | "warn" | "error" | "info" | "neutral" | "brand"

export const ESTADO_INGRESO: Record<EstadoIngreso, { label: string; tone: Tone }> = {
  borrador: { label: "Borrador", tone: "neutral" },
  observada: { label: "Observada", tone: "error" },
  revision: { label: "En revisión de Planir", tone: "warn" },
  pendiente_aprobacion: { label: "Pendiente de aprobación", tone: "info" },
  pendiente_externo: { label: "Pendiente por causa externa", tone: "warn" },
  aprobada: { label: "Aprobada", tone: "ok" },
  ingresada: { label: "En playa", tone: "brand" },
  cerrada: { label: "Cerrada", tone: "neutral" },
  rechazada: { label: "Rechazada", tone: "error" },
  cancelada: { label: "Cancelada", tone: "neutral" },
}

export const ESTADO_SALIDA: Record<EstadoSalida, { label: string; tone: Tone }> = {
  pendiente_pago: { label: "Pendiente de pago", tone: "warn" },
  habilitada: { label: "Retiro habilitado", tone: "ok" },
  retirada: { label: "Retirada", tone: "neutral" },
}

export const TONE_CLASSES: Record<Tone, string> = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warn: "bg-amber-50 text-amber-800 border-amber-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  neutral: "bg-stone-100 text-stone-600 border-stone-200",
  brand: "bg-[#fdeee8] text-[#c2410c] border-[#f9c9b6]",
}

export const TONE_DOT: Record<Tone, string> = {
  ok: "bg-emerald-500",
  warn: "bg-amber-500",
  error: "bg-red-500",
  info: "bg-sky-500",
  neutral: "bg-stone-400",
  brand: "bg-brand",
}
