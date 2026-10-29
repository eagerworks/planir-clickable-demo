import { useState } from "react"
import { toast } from "sonner"
import { ArrowRight, CalendarClock, Check, CheckCircle2, Clock, Container, FileText, LifeBuoy, MessageSquare, PauseCircle, Upload, XCircle } from "lucide-react"
import {
  Callout,
  DocList,
  EstadoBadge,
  Field,
  HelpLine,
  PageHeader,
  ProformaTable,
  SectionCard,
  Timeline,
  ValidationSummary,
  ValidationTable,
} from "@/components/app/common"
import { ClientLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { daysBetween } from "@/data/seed"
import type { Ingreso } from "@/data/types"
import { fecha, fechaCorta, fechaHora, kg, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go, openSalida } from "@/screens/nav"
import { suplemento, useCliente, useDemo, useHoy, useIngreso } from "@/store/demo"

export type ClienteDialog = "ayuda" | "cancelar" | "fecha"

const PASOS_TRACKER = [
  { label: "Presentada", estados: [] as string[] },
  { label: "Validada", estados: ["pendiente_aprobacion", "pendiente_externo", "aprobada", "ingresada", "cerrada"] },
  { label: "Aprobada", estados: ["aprobada", "ingresada", "cerrada"] },
  { label: "En playa", estados: ["ingresada", "cerrada"] },
  { label: "Retirada", estados: ["cerrada"] },
]

export function Tracker({ ingreso }: { ingreso: Ingreso }) {
  const problema = ["observada", "revision", "pendiente_externo", "rechazada", "cancelada"].includes(ingreso.estado)
  const reached = PASOS_TRACKER.map((p, i) => i === 0 || p.estados.includes(ingreso.estado))
  const current = reached.lastIndexOf(true)
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-5 py-4">
      {PASOS_TRACKER.map((p, i) => {
        const isProblem = problema && i === current + 1 && !["rechazada", "cancelada"].includes(ingreso.estado)
        return (
          <div key={p.label} className="flex flex-1 items-center gap-2 last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs",
                  reached[i] ? "bg-planir text-white" : isProblem ? "bg-amber-100 text-amber-700 ring-2 ring-amber-400" : "bg-muted text-muted-foreground",
                )}
              >
                {reached[i] ? <Check className="size-3.5" /> : isProblem ? "!" : i + 1}
              </span>
              <span className={cn("text-sm whitespace-nowrap", reached[i] ? "font-medium text-planir" : "text-muted-foreground")}>{p.label}</span>
            </div>
            {i < PASOS_TRACKER.length - 1 && <span className={cn("h-0.5 flex-1 rounded", reached[i + 1] ? "bg-planir" : "bg-border")} />}
          </div>
        )
      })}
    </div>
  )
}

function EstadoCallout({ ingreso }: { ingreso: Ingreso }) {
  const cliente = useCliente(ingreso.clienteId)
  const errores = ingreso.validacion.filter((c) => c.resultado === "error")
  const ultimoComentario = ingreso.comentarios.at(-1)
  switch (ingreso.estado) {
    case "observada":
      return (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 text-red-600" />
            <div className="flex-1">
              <div className="font-semibold text-red-800">
                {errores.length === 1 ? "Un dato no coincide" : `${errores.length} datos no coinciden`} con tus documentos
              </div>
              <div className="text-sm text-red-700/90">Revisá el documento o corregí el dato y volvé a enviar. Hasta que lo corrijas, la solicitud queda frenada.</div>
            </div>
            <Button variant="brand" onClick={() => go("C17", ingreso.id)}>
              Corregir y reenviar <ArrowRight />
            </Button>
          </div>
          {ultimoComentario && (
            <div className="rounded-lg bg-white p-3 text-sm">
              <span className="font-medium">{ultimoComentario.autor}:</span> {ultimoComentario.texto}
            </div>
          )}
          <div className="overflow-hidden rounded-lg border border-red-100 bg-white">
            <ValidationTable checks={ingreso.validacion} onlyIssues />
          </div>
          <HelpLine />
        </div>
      )
    case "revision":
      return (
        <Callout tone="warn" icon={<Clock className="size-5" />} title="Una persona de Planir está revisando tu solicitud">
          {ingreso.validacion
            .filter((c) => c.resultado === "warning")
            .map((c) => `${c.dato}: ${c.leido}${c.nota ? ` (${c.nota.toLowerCase()})` : ""}`)
            .join(" · ")}
          . No tenés que hacer nada por ahora; si necesitamos algo te avisamos.
        </Callout>
      )
    case "pendiente_aprobacion":
      return (
        <Callout tone="info" icon={<Clock className="size-5" />} title="En revisión de Planir">
          Validamos tus documentos y todo coincide. Planir está haciendo sus gestiones internas para aprobar el movimiento.
        </Callout>
      )
    case "pendiente_externo":
      return (
        <Callout tone="warn" icon={<PauseCircle className="size-5" />} title={`Pendiente por causa externa · ${ingreso.motivoPendiente}`}>
          {ultimoComentario ? `“${ultimoComentario.texto}” — ${ultimoComentario.autor}` : "Planir te va a avisar cuando se pueda retomar."}
          <div className="mt-1 text-xs">No es un problema de tu solicitud: en cuanto se normalice, sigue su curso.</div>
        </Callout>
      )
    case "aprobada":
      return (
        <Callout tone="ok" icon={<CheckCircle2 className="size-5" />} title={`Aprobada · traemos tus contenedores el ${fecha(ingreso.fechaMovimiento)}`}>
          Te avisamos cuando ingresen a la playa.{" "}
          {cliente.costoCancelacion && `Desde ahora, cancelar tiene un costo administrativo de ${usd(cliente.montoCancelacion)}.`}
        </Callout>
      )
    case "ingresada":
      return (
        <Callout tone="brand" icon={<Container className="size-5" />} title={`Tus contenedores están en la playa desde el ${fecha(ingreso.contenedores[0].ingresoReal)}`}>
          La estadía se calcula desde el ingreso real. Podés cambiar la fecha estimada de salida o pedir el retiro cuando quieras.
        </Callout>
      )
    case "cerrada":
      return (
        <Callout tone="neutral" icon={<CheckCircle2 className="size-5" />} title="Solicitud cerrada">
          Todos los contenedores salieron de la playa.
        </Callout>
      )
    case "rechazada":
      return (
        <Callout tone="error" icon={<XCircle className="size-5" />} title="Solicitud rechazada">
          {ingreso.motivoRechazo}
        </Callout>
      )
    case "cancelada":
      return <Callout tone="neutral" title="Cancelaste esta solicitud" />
    default:
      return null
  }
}

function AyudaDialog({ open, onOpenChange, ingreso, preset }: { open: boolean; onOpenChange: (o: boolean) => void; ingreso: Ingreso; preset?: { motivo: string; mensaje: string } }) {
  const pedirAyuda = useDemo((s) => s.pedirAyuda)
  const [motivo, setMotivo] = useState(preset?.motivo ?? "Duda sobre un dato")
  const [mensaje, setMensaje] = useState(preset?.mensaje ?? "")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pedir ayuda a Planir</DialogTitle>
          <DialogDescription>Tu mensaje queda en la solicitud {ingreso.id} y le llega a la persona encargada de la playa.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={motivo} onValueChange={setMotivo}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Duda sobre un dato", "Cambio de fecha", "Es urgente", "No puedo subir un documento", "Otro"].map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Mensaje</Label>
            <Textarea rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Contanos qué necesitás…" />
          </div>
          <HelpLine />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!mensaje.trim()}
            onClick={() => {
              pedirAyuda(ingreso.id, motivo, mensaje)
              onOpenChange(false)
              toast.success("Le avisamos a Planir", { description: "Te van a responder en la solicitud o por teléfono." })
            }}
          >
            Enviar pedido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CancelarDialog({ open, onOpenChange, ingreso }: { open: boolean; onOpenChange: (o: boolean) => void; ingreso: Ingreso }) {
  const cliente = useCliente(ingreso.clienteId)
  const cancelar = useDemo((s) => s.cancelar)
  const conCosto = cliente.costoCancelacion && ingreso.estado === "aprobada"
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Cancelar la solicitud {ingreso.id}?</DialogTitle>
          <DialogDescription>
            {ingreso.contenedores.length} contenedores · {ingreso.barco} {ingreso.viaje}
          </DialogDescription>
        </DialogHeader>
        {conCosto ? (
          <Callout tone="warn" title={`Esta cancelación tiene un costo administrativo de ${usd(cliente.montoCancelacion)}`}>
            Planir ya aprobó el movimiento y emitió la orden de trabajo. El costo se suma a tu próxima factura.
          </Callout>
        ) : (
          <Callout tone="ok" title="Cancelar no tiene costo">
            La solicitud todavía no fue aprobada por Planir.
          </Callout>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Volver
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              cancelar(ingreso.id, conCosto)
              onOpenChange(false)
              toast(`Cancelaste ${ingreso.id}`, { description: conCosto ? `Se registró el costo administrativo de ${usd(cliente.montoCancelacion)}.` : "Sin costo." })
            }}
          >
            {conCosto ? `Cancelar y aceptar ${usd(cliente.montoCancelacion)}` : "Sí, cancelar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FechaDialog({ open, onOpenChange, ingreso }: { open: boolean; onOpenChange: (o: boolean) => void; ingreso: Ingreso }) {
  const cambiarFecha = useDemo((s) => s.cambiarFecha)
  const historial = ingreso.contenedores[0].salidasEstimadas
  const vigente = historial.at(-1)!.fecha
  const [nueva, setNueva] = useState(vigente < "2026-11-12" ? "2026-11-12" : vigente)
  const monto = suplemento(vigente, nueva, ingreso.contenedores.length)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Cambiar fecha estimada de salida</DialogTitle>
          <DialogDescription>
            {ingreso.id} · {ingreso.contenedores.length} contenedores. Es normal que la fecha cambie: solo ajustamos la proforma.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-xs font-medium text-muted-foreground">Historial de la fecha de salida</div>
            <ol className="space-y-2 text-sm">
              {historial.map((h, i) => (
                <li key={i} className={cn("flex items-center justify-between rounded-lg border px-3 py-2", i === historial.length - 1 && "border-planir/40 bg-accent/40")}>
                  <span>
                    <b>{fecha(h.fecha)}</b> <span className="text-muted-foreground">· {i === 0 ? "estimada al ingresar" : h.motivo}</span>
                  </span>
                  {h.suplemento ? <span className="text-xs font-medium text-brand">+{usd(h.suplemento)}</span> : <span className="text-xs text-muted-foreground">vigente</span>}
                </li>
              ))}
            </ol>
          </div>
          <div className="grid grid-cols-2 items-end gap-4">
            <div className="space-y-1.5">
              <Label>Nueva fecha estimada</Label>
              <Input type="date" value={nueva} min={vigente} onChange={(e) => setNueva(e.target.value)} />
            </div>
            <div className="rounded-lg bg-muted px-3 py-2 text-sm">
              <div className="text-xs text-muted-foreground">Suplemento por estadía</div>
              <div className="font-semibold text-brand">
                {daysBetween(vigente, nueva)} días · {usd(monto)}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={nueva <= vigente}
            onClick={() => {
              cambiarFecha(ingreso.id, nueva)
              onOpenChange(false)
              toast.success("Actualizamos la fecha de salida", { description: `Nueva fecha: ${fecha(nueva)}. Suplemento ${usd(monto)}.` })
            }}
          >
            Confirmar nueva fecha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function ClienteIngresoDetalle({ id, dialog, ayudaPreset }: { id: string; dialog?: ClienteDialog; ayudaPreset?: { motivo: string; mensaje: string } }) {
  const ingreso = useIngreso(id)
  const today = useHoy()
  const [open, setOpen] = useState<ClienteDialog | null>(dialog ?? null)
  if (!ingreso) return <ClientLayout active="solicitudes">No encontramos la solicitud {id}.</ClientLayout>
  const cancelable = ["observada", "revision", "pendiente_aprobacion", "pendiente_externo", "aprobada"].includes(ingreso.estado)
  const enPlaya = ingreso.estado === "ingresada"
  const salidaId = ingreso.contenedores.find((c) => c.salidaId)?.salidaId
  const tieneProforma = ["aprobada", "ingresada", "cerrada"].includes(ingreso.estado)

  return (
    <ClientLayout active="solicitudes">
      <PageHeader
        onBack={() => go("C06")}
        backLabel="Solicitudes"
        title={`${ingreso.id} · Ingreso`}
        badge={<EstadoBadge estado={ingreso.estado} />}
        subtitle={`${ingreso.barco} · viaje ${ingreso.viaje} · BL ${ingreso.bl} · presentada el ${fecha(ingreso.creado)} por ${ingreso.creadoPor}`}
        actions={
          <>
            {cancelable && (
              <Button variant="ghost" className="text-muted-foreground" onClick={() => setOpen("cancelar")}>
                Cancelar solicitud
              </Button>
            )}
            {enPlaya && !salidaId && (
              <>
                <Button variant="outline" onClick={() => setOpen("fecha")}>
                  <CalendarClock /> Cambiar fecha de salida
                </Button>
                <Button onClick={() => go("C26", ingreso.id)}>Solicitar retiro</Button>
              </>
            )}
            {salidaId && (
              <Button variant="outline" onClick={() => openSalida("cliente", salidaId)}>
                Ver retiro {salidaId} <ArrowRight />
              </Button>
            )}
          </>
        }
      />

      <div className="space-y-4">
        <Tracker ingreso={ingreso} />
        <EstadoCallout ingreso={ingreso} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_320px] gap-6">
        <Tabs defaultValue="resumen">
          <TabsList>
            <TabsTrigger value="resumen">Resumen</TabsTrigger>
            <TabsTrigger value="validacion">Validación</TabsTrigger>
            <TabsTrigger value="documentos">Documentos ({ingreso.documentos.length})</TabsTrigger>
            <TabsTrigger value="historial">Historial</TabsTrigger>
          </TabsList>
          <TabsContent value="resumen" className="space-y-4">
            <SectionCard title="Operación">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Barco · viaje" value={`${ingreso.barco} · ${ingreso.viaje}`} />
                <Field label="N° de BL" value={ingreso.bl} />
                <Field label="Terminal de origen" value={ingreso.terminal} />
                <Field label="Llegada estimada" value={fecha(ingreso.fechaLlegada)} />
                <Field label="Movimiento solicitado" value={fecha(ingreso.fechaMovimiento)} />
                <Field label="Carga IMO" value={ingreso.imo ? "Sí · cartilla de seguridad" : "No"} />
              </div>
            </SectionCard>
            <SectionCard title={`Contenedores (${ingreso.contenedores.length})`} className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Contenedor</TableHead>
                    <TableHead>Precinto</TableHead>
                    <TableHead>Peso bruto</TableHead>
                    <TableHead>Ingreso real</TableHead>
                    <TableHead>Salida estimada</TableHead>
                    {enPlaya && <TableHead className="text-right">Días</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingreso.contenedores.map((c) => (
                    <TableRow key={c.numero}>
                      <TableCell>
                        <div className="font-medium">{c.numero}</div>
                        <div className="text-xs text-muted-foreground">{c.tipo}</div>
                      </TableCell>
                      <TableCell>{c.precinto}</TableCell>
                      <TableCell>{kg(c.peso)}</TableCell>
                      <TableCell>{c.ingresoReal ? fechaHora(c.ingresoReal) : <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell>
                        {c.salidaReal ? (
                          <span>Salió {fechaCorta(c.salidaReal)}</span>
                        ) : (
                          <>
                            {fechaCorta(c.salidasEstimadas.at(-1)!.fecha)}
                            {c.salidasEstimadas.length > 1 && <span className="ml-1 text-xs text-brand">(modificada)</span>}
                          </>
                        )}
                      </TableCell>
                      {enPlaya && <TableCell className="text-right font-semibold tabular-nums">{daysBetween(c.ingresoReal!, today)}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          </TabsContent>
          <TabsContent value="validacion">
            <SectionCard title="Resultado de la validación automática" action={<ValidationSummary checks={ingreso.validacion} />} className="overflow-hidden">
              <ValidationTable checks={ingreso.validacion} />
            </SectionCard>
          </TabsContent>
          <TabsContent value="documentos">
            <SectionCard title="Documentos de la solicitud">
              <DocList docs={ingreso.documentos} />
            </SectionCard>
          </TabsContent>
          <TabsContent value="historial">
            <SectionCard title="Historial">
              <Timeline eventos={ingreso.historial} />
            </SectionCard>
          </TabsContent>
        </Tabs>

        <div className="space-y-4">
          <SectionCard
            title={
              <span className="flex items-center gap-2">
                <MessageSquare className="size-4" /> Comentarios de Planir
              </span>
            }
          >
            {ingreso.comentarios.length === 0 ? (
              <p className="text-sm text-muted-foreground">Todavía no hay comentarios. Si Planir necesita contarte algo, lo vas a ver acá.</p>
            ) : (
              <ul className="space-y-3">
                {ingreso.comentarios.map((c, i) => (
                  <li key={i} className="rounded-lg bg-muted/60 p-3 text-sm">
                    <div>{c.texto}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {c.autor} · {fechaHora(c.fecha)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          {tieneProforma && (
            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  <FileText className="size-4" /> Proforma
                </span>
              }
            >
              <ProformaTable items={ingreso.proforma} />
              <p className="mt-3 text-xs text-muted-foreground">Importe estimado. La factura se emite al terminar el servicio, con los días reales de estadía.</p>
            </SectionCard>
          )}
          <SectionCard>
            <div className="flex items-start gap-3">
              <LifeBuoy className="mt-0.5 size-5 text-brand" />
              <div className="flex-1">
                <div className="text-sm font-semibold">¿Necesitás una mano?</div>
                <p className="text-xs text-muted-foreground">Escribile a la persona encargada de la playa sin salir del portal.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setOpen("ayuda")}>
                  Pedir ayuda a Planir
                </Button>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      <AyudaDialog open={open === "ayuda"} onOpenChange={(o) => setOpen(o ? "ayuda" : null)} ingreso={ingreso} preset={ayudaPreset} />
      <CancelarDialog open={open === "cancelar"} onOpenChange={(o) => setOpen(o ? "cancelar" : null)} ingreso={ingreso} />
      {enPlaya && <FechaDialog open={open === "fecha"} onOpenChange={(o) => setOpen(o ? "fecha" : null)} ingreso={ingreso} />}
    </ClientLayout>
  )
}

// ---------------------------------------------------------------------------
// C17 · Corregir y reenviar
// ---------------------------------------------------------------------------

export function C17Corregir({ id }: { id: string }) {
  const ingreso = useIngreso(id)!
  const corregir = useDemo((s) => s.corregir)
  const checkFecha = ingreso.validacion.find((c) => c.dato === "Fecha estimada de llegada")!
  const checkPrecinto = ingreso.validacion.find((c) => c.dato.startsWith("Precinto"))!
  const [fechaLlegada, setFechaLlegada] = useState(ingreso.fechaLlegada)
  const [precinto, setPrecinto] = useState(ingreso.contenedores[0].precinto)
  const [reemplazado, setReemplazado] = useState(false)
  const toIso = (dmy: string) => dmy.split("/").reverse().join("-")

  if (ingreso.estado !== "observada")
    return (
      <ClientLayout active="solicitudes">
        <PageHeader title={`Corregir ${id}`} onBack={() => go("C20", id)} backLabel={id} />
        <Callout tone="ok" icon={<CheckCircle2 className="size-5" />} title="Esta solicitud ya no tiene datos para corregir">
          Ya la corregiste y volvió a revisión de Planir.
        </Callout>
      </ClientLayout>
    )

  const filas = [
    {
      check: checkFecha,
      ok: fechaLlegada === toIso(checkFecha.leido),
      input: <Input type="date" value={fechaLlegada} onChange={(e) => setFechaLlegada(e.target.value)} />,
      usar: () => setFechaLlegada(toIso(checkFecha.leido)),
    },
    {
      check: checkPrecinto,
      ok: precinto === checkPrecinto.leido,
      input: <Input value={precinto} onChange={(e) => setPrecinto(e.target.value.toUpperCase())} />,
      usar: () => setPrecinto(checkPrecinto.leido),
    },
  ]

  return (
    <ClientLayout active="solicitudes">
      <PageHeader
        onBack={() => go("C16", id)}
        backLabel={id}
        title={`Corregir ${id}`}
        badge={<EstadoBadge estado={ingreso.estado} />}
        subtitle="Corregí el dato o, si el error está en el documento, subí una versión nueva. Después lo volvemos a validar."
      />
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="space-y-4">
          {filas.map((f) => (
            <SectionCard key={f.check.dato}>
              <div className="flex items-center justify-between">
                <div className="font-semibold">{f.check.dato}</div>
                {f.ok ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-emerald-700">
                    <Check className="size-4" /> Ahora coincide
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-red-700">
                    <XCircle className="size-4" /> No coincide
                  </span>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Lo que cargaste</Label>
                  {f.input}
                </div>
                <div className="space-y-1.5">
                  <Label>Lo que dice el {f.check.documento}</Label>
                  <div className="flex h-8 items-center justify-between rounded-lg border bg-muted/50 px-3 text-sm font-semibold">
                    {f.check.leido}
                    {!f.ok && (
                      <button className="text-xs font-medium text-planir hover:underline" onClick={f.usar}>
                        Usar este valor
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
          <SectionCard title="¿El error está en el documento?">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium">{reemplazado ? "BL_MEDUYA175110_v2.pdf" : ingreso.documentos[0].nombre}</div>
                <div className="text-xs text-muted-foreground">{reemplazado ? "Versión nueva cargada" : "Si tu dato es el correcto, subí el BL corregido por la naviera."}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReemplazado(true)} disabled={reemplazado}>
                <Upload /> Reemplazar BL
              </Button>
            </div>
          </SectionCard>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => go("C16", id)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              size="lg"
              onClick={() => {
                const ok = corregir(id, { fechaLlegada, precinto })
                if (ok) {
                  toast.success("¡Todo coincide!", { description: `${id} volvió a revisión de Planir.` })
                  go("C20", id)
                } else {
                  toast.error("Todavía hay datos que no coinciden", { description: "Revisá los campos marcados en rojo." })
                }
              }}
            >
              Reenviar solicitud
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <SectionCard title="Así funciona">
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Corregís el dato o subís el documento nuevo.</li>
              <li>2. El portal vuelve a comparar todo automáticamente.</li>
              <li>3. Si coincide, la solicitud pasa a revisión de Planir.</li>
            </ol>
          </SectionCard>
          <HelpLine className="px-1" />
        </div>
      </div>
    </ClientLayout>
  )
}
