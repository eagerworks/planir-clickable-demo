import type { ReactNode } from "react"
import { AlertTriangle, ArrowLeft, Check, CircleAlert, FileText, Mail, Phone, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { MAIL_PLAYA, TEL_PLAYA } from "@/data/seed"
import type { Check as CheckT, Documento, EstadoIngreso, EstadoSalida, Evento, ItemProforma } from "@/data/types"
import { ESTADO_INGRESO, ESTADO_SALIDA, TONE_CLASSES, TONE_DOT, fechaHora, total, usd, type Tone } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ToneBadge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <Badge variant="outline" className={cn("gap-1.5 font-medium", TONE_CLASSES[tone], className)}>
      <span className={cn("size-1.5 rounded-full", TONE_DOT[tone])} />
      {children}
    </Badge>
  )
}

export function EstadoBadge({ estado }: { estado: EstadoIngreso }) {
  const e = ESTADO_INGRESO[estado]
  return <ToneBadge tone={e.tone}>{e.label}</ToneBadge>
}

export function EstadoSalidaBadge({ estado }: { estado: EstadoSalida }) {
  const e = ESTADO_SALIDA[estado]
  return <ToneBadge tone={e.tone}>{e.label}</ToneBadge>
}

export function PageHeader({
  title,
  subtitle,
  actions,
  onBack,
  backLabel = "Volver",
  badge,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  onBack?: () => void
  backLabel?: string
  badge?: ReactNode
}) {
  return (
    <div className="mb-6">
      {onBack && (
        <button onClick={onBack} className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> {backLabel}
        </button>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-planir">{title}</h1>
            {badge}
          </div>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  )
}

export function SectionCard({ title, action, children, className }: { title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      {title && (
        <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-3.5 [.border-b]:pb-3.5">
          <CardTitle className="text-sm font-semibold text-planir">{title}</CardTitle>
          {action}
        </CardHeader>
      )}
      <CardContent className="px-5 py-4">{children}</CardContent>
    </Card>
  )
}

const RESULT_ICON = {
  ok: <Check className="size-4 text-emerald-600" />,
  error: <X className="size-4 text-red-600" />,
  warning: <AlertTriangle className="size-4 text-amber-600" />,
}

/** Resultado de la validación automática: lo declarado vs. lo leído en el documento. */
export function ValidationTable({ checks, onlyIssues = false }: { checks: CheckT[]; onlyIssues?: boolean }) {
  const rows = onlyIssues ? checks.filter((c) => c.resultado !== "ok") : checks
  return (
    <Table className="[&_td]:whitespace-normal [&_th]:whitespace-normal">
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead className="w-8" />
          <TableHead>Dato</TableHead>
          <TableHead>Lo declarado</TableHead>
          <TableHead>Lo que dice el documento</TableHead>
          <TableHead>Documento</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((c) => (
          <TableRow key={c.dato} className={cn(c.resultado === "error" && "bg-red-50/60", c.resultado === "warning" && "bg-amber-50/60")}>
            <TableCell>{RESULT_ICON[c.resultado]}</TableCell>
            <TableCell className="font-medium">{c.dato}</TableCell>
            <TableCell className={cn(c.resultado === "error" && "text-red-700")}>{c.declarado}</TableCell>
            <TableCell>
              <span className={cn(c.resultado !== "ok" && "font-semibold")}>{c.leido}</span>
              {c.nota && <div className={cn("text-xs", c.resultado === "warning" ? "text-amber-700" : "text-muted-foreground")}>{c.nota}</div>}
            </TableCell>
            <TableCell className="text-muted-foreground">{c.documento}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function ValidationSummary({ checks }: { checks: CheckT[] }) {
  const errors = checks.filter((c) => c.resultado === "error").length
  const warnings = checks.filter((c) => c.resultado === "warning").length
  const ok = checks.length - errors - warnings
  return (
    <div className="flex gap-2 text-xs">
      <ToneBadge tone="ok">{ok} coinciden</ToneBadge>
      {errors > 0 && <ToneBadge tone="error">{errors} no coinciden</ToneBadge>}
      {warnings > 0 && <ToneBadge tone="warn">{warnings} a revisar</ToneBadge>}
    </div>
  )
}

const ACTOR: Record<Evento["actor"], { label: string; dot: string }> = {
  cliente: { label: "Cliente", dot: "bg-brand" },
  sistema: { label: "Portal", dot: "bg-sky-500" },
  planir: { label: "Planir", dot: "bg-planir" },
}

export function Timeline({ eventos }: { eventos: Evento[] }) {
  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {[...eventos].reverse().map((e, i) => (
        <li key={i} className="relative">
          <span className={cn("absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-white", ACTOR[e.actor].dot)} />
          <div className="text-sm">{e.texto}</div>
          <div className="text-xs text-muted-foreground">
            {fechaHora(e.fecha)} · {ACTOR[e.actor].label}
          </div>
        </li>
      ))}
    </ol>
  )
}

const DOC_LABEL: Record<Documento["tipo"], string> = {
  BL: "Bill of Lading (BL)",
  DO: "Delivery Order",
  PAGO: "Confirmación de pago a TCP",
  IMO: "Cartilla de seguridad IMO",
  COMPROBANTE: "Comprobante de transferencia",
  SALIDA: "Constancia de salida",
}

const DOC_ESTADO: Record<Documento["estado"], { label: string; tone: Tone }> = {
  validado: { label: "Validado", tone: "ok" },
  observado: { label: "Observado", tone: "error" },
  ilegible: { label: "Ilegible", tone: "warn" },
  en_revision: { label: "En revisión", tone: "warn" },
}

export function DocList({ docs }: { docs: Documento[] }) {
  return (
    <ul className="divide-y">
      {docs.map((d) => (
        <li key={d.nombre} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            <FileText className="size-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium">
              {DOC_LABEL[d.tipo]}
              {d.contenedor && <span className="font-normal text-muted-foreground"> · {d.contenedor}</span>}
            </div>
            <div className="truncate text-xs text-muted-foreground">{d.nombre}</div>
          </div>
          <ToneBadge tone={DOC_ESTADO[d.estado].tone}>{DOC_ESTADO[d.estado].label}</ToneBadge>
        </li>
      ))}
    </ul>
  )
}

export function ProformaTable({ items, totalLabel = "Total estimado" }: { items: ItemProforma[]; totalLabel?: string }) {
  return (
    <div className="text-sm">
      {items.map((it) => (
        <div key={it.concepto} className="flex justify-between gap-4 py-1.5">
          <span className="text-muted-foreground">{it.concepto}</span>
          <span className="tabular-nums">{usd(it.monto)}</span>
        </div>
      ))}
      <div className="mt-2 flex justify-between border-t pt-2.5 font-semibold">
        <span>{totalLabel}</span>
        <span className="tabular-nums">{usd(total(items))}</span>
      </div>
    </div>
  )
}

export function KpiCard({ label, value, hint, tone = "neutral", onClick, active }: { label: string; value: ReactNode; hint?: string; tone?: Tone; onClick?: () => void; active?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-start rounded-xl border bg-white p-4 text-left transition hover:border-planir/40",
        active && "border-planir ring-2 ring-planir/15",
        !onClick && "cursor-default hover:border-border",
      )}
    >
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className={cn("size-2 rounded-full", TONE_DOT[tone])} />
        {label}
      </div>
      <div className="mt-1 font-heading text-2xl font-bold text-planir">{value}</div>
      {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
    </button>
  )
}

/** Línea de contacto con la playa, presente en todo aviso al cliente. */
export function HelpLine({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground", className)}>
      <span>¿Necesita hablar con una persona?</span>
      <span className="inline-flex items-center gap-1 text-planir">
        <Mail className="size-3.5" /> {MAIL_PLAYA}
      </span>
      <span className="inline-flex items-center gap-1 text-planir">
        <Phone className="size-3.5" /> {TEL_PLAYA}
      </span>
    </div>
  )
}

export function Callout({ tone, title, children, icon, action }: { tone: Tone; title: ReactNode; children?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className={cn("flex gap-3 rounded-xl border p-4", TONE_CLASSES[tone])}>
      <div className="mt-0.5 shrink-0">{icon ?? <CircleAlert className="size-5" />}</div>
      <div className="min-w-0 flex-1">
        <div className="font-semibold">{title}</div>
        {children && <div className="mt-1 text-sm opacity-90">{children}</div>}
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  )
}

export function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-medium">{value}</div>
    </div>
  )
}

export function LinkButton(props: React.ComponentProps<typeof Button>) {
  return <Button variant="link" className="h-auto p-0 text-planir" {...props} />
}
