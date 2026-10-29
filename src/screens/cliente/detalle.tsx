import { useState } from "react"
import { toast } from "sonner"
import { ArrowRight, CalendarClock, Check, CheckCircle2, Clock, Container, FileText, FlaskConical, LifeBuoy, MessageSquare, PackageOpen, PauseCircle, ShieldAlert, Upload, XCircle } from "lucide-react"
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
import { CHECK_IMO, DEPOSITO_IMO, daysBetween } from "@/data/seed"
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
  const consultaImo = ingreso.validacion.some((c) => c.dato === CHECK_IMO && c.resultado !== "ok")
  const ultimoComentario = ingreso.comentarios.at(-1)
  const destino = ingreso.imo ? DEPOSITO_IMO : "la playa"
  switch (ingreso.estado) {
    case "observada":
      return (
        <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-5">
          <div className="flex items-start gap-3">
            <XCircle className="mt-0.5 size-5 text-red-600" />
            <div className="flex-1">
              <div className="font-semibold text-red-800">
                {consultaImo
                  ? "Planir necesita confirmar si la carga es IMO"
                  : errores.length === 0
                    ? "Planir necesita que revise su solicitud"
                    : `${errores.length === 1 ? "Un dato no coincide" : `${errores.length} datos no coinciden`} con sus documentos`}
              </div>
              <div className="text-sm text-red-700/90">
                {consultaImo
                  ? "El BL tiene una descripción que puede corresponder a mercadería peligrosa. Hasta que responda, la solicitud queda detenida."
                  : "Revise el documento o corrija el dato y vuelva a enviar la solicitud. Hasta entonces, la solicitud queda detenida."}
              </div>
            </div>
            <Button variant="brand" onClick={() => go(consultaImo ? "C31" : "C17", ingreso.id)}>
              {consultaImo ? "Responder" : "Corregir y reenviar"} <ArrowRight />
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
        <Callout tone="warn" icon={<Clock className="size-5" />} title="Una persona de Planir está revisando su solicitud">
          {ingreso.validacion
            .filter((c) => c.resultado === "warning")
            .map((c) => `${c.dato}: ${c.leido}${c.nota ? ` (${c.nota.toLowerCase()})` : ""}`)
            .join(" · ")}
          . No necesita hacer nada por ahora; si hace falta algo, le avisaremos.
        </Callout>
      )
    case "pendiente_aprobacion":
      return (
        <Callout tone="info" icon={<Clock className="size-5" />} title="En revisión de Planir">
          Validamos sus documentos y todo coincide. Planir está haciendo sus gestiones internas para aprobar el movimiento.
          {ingreso.imo && !ingreso.evaluacionD24 && ` Por ser carga IMO, Planir enviará las cartillas a ${DEPOSITO_IMO} para que evalúe el traslado y el almacenamiento.`}
        </Callout>
      )
    case "pendiente_externo":
      return (
        <Callout tone="warn" icon={<PauseCircle className="size-5" />} title={`Pendiente por causa externa · ${ingreso.motivoPendiente}`}>
          {ultimoComentario ? `“${ultimoComentario.texto}” — ${ultimoComentario.autor}` : "Planir le avisará cuando se pueda retomar."}
          <div className="mt-1 text-xs">No es un problema de su solicitud: en cuanto se resuelva, sigue su curso.</div>
        </Callout>
      )
    case "aprobada":
      return (
        <Callout tone="ok" icon={<CheckCircle2 className="size-5" />} title={`Aprobada · traemos sus contenedores el ${fecha(ingreso.fechaMovimiento)}`}>
          Le avisaremos cuando ingresen a {destino}.{" "}
          {cliente.costoCancelacion && `Desde ahora, cancelar tiene un costo administrativo de ${usd(cliente.montoCancelacion)}.`}
        </Callout>
      )
    case "ingresada":
      return (
        <Callout tone="brand" icon={<Container className="size-5" />} title={`Sus contenedores están en ${destino} desde el ${fecha(ingreso.contenedores[0].ingresoReal)}`}>
          La estadía se calcula desde el ingreso real. Puede cambiar la fecha estimada de salida o solicitar el retiro en cualquier momento.
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
      return <Callout tone="neutral" title="Solicitud cancelada" />
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
          <DialogDescription>El mensaje queda registrado en la solicitud {ingreso.id} y le llega a la persona encargada de la playa.</DialogDescription>
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
            <Textarea rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} placeholder="Describa lo que necesita…" />
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
              toast.success("Pedido enviado a Planir", { description: "Le responderán en la solicitud o por teléfono." })
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
            Planir ya aprobó el movimiento y emitió la orden de trabajo. El costo se suma a su próxima factura.
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
              toast(`${ingreso.id} cancelada`, { description: conCosto ? `Se registró el costo administrativo de ${usd(cliente.montoCancelacion)}.` : "Sin costo." })
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
                <Field label="Carga IMO" value={ingreso.imo ? `Sí · se deriva a ${DEPOSITO_IMO}` : "No"} />
                {ingreso.mercaderia && (
                  <div className="col-span-3">
                    <Field label="Mercadería (según BL)" value={ingreso.mercaderia} />
                  </div>
                )}
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
              <p className="text-sm text-muted-foreground">Todavía no hay comentarios. Si Planir necesita informarle algo, aparecerá aquí.</p>
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
                <div className="text-sm font-semibold">¿Necesita ayuda?</div>
                <p className="text-xs text-muted-foreground">Escriba a la persona encargada de la playa sin salir del portal.</p>
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
// C17 · Corregir y reenviar — C31 · Responder consulta IMO
// ---------------------------------------------------------------------------

export function C17Corregir({ id }: { id: string }) {
  const ingreso = useIngreso(id)!
  if (ingreso.estado !== "observada")
    return (
      <ClientLayout active="solicitudes">
        <PageHeader title={`Corregir ${id}`} onBack={() => go("C20", id)} backLabel={id} />
        <Callout tone="ok" icon={<CheckCircle2 className="size-5" />} title="Esta solicitud ya no tiene datos pendientes">
          La respuesta ya se envió y la solicitud volvió a revisión de Planir.
        </Callout>
      </ClientLayout>
    )
  if (ingreso.validacion.some((c) => c.dato === CHECK_IMO && c.resultado !== "ok")) return <ConfirmarImo ingreso={ingreso} />
  if (ingreso.validacion.some((c) => c.dato === "Fecha estimada de llegada" || c.dato.startsWith("Precinto")) && ingreso.validacion.some((c) => c.resultado === "error"))
    return <CorregirDatos ingreso={ingreso} />
  return <ReemplazarDocumento ingreso={ingreso} />
}

function ComoFunciona() {
  return (
    <div className="space-y-3">
      <SectionCard title="Así funciona">
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li>1. Se corrige el dato o se sube el documento nuevo.</li>
          <li>2. El portal vuelve a comparar todo automáticamente.</li>
          <li>3. Si coincide, la solicitud pasa a revisión de Planir.</li>
        </ol>
      </SectionCard>
      <HelpLine className="px-1" />
    </div>
  )
}

function CorregirDatos({ ingreso }: { ingreso: Ingreso }) {
  const id = ingreso.id
  const corregir = useDemo((s) => s.corregir)
  const checkFecha = ingreso.validacion.find((c) => c.dato === "Fecha estimada de llegada")!
  const checkPrecinto = ingreso.validacion.find((c) => c.dato.startsWith("Precinto"))!
  const [fechaLlegada, setFechaLlegada] = useState(ingreso.fechaLlegada)
  const [precinto, setPrecinto] = useState(ingreso.contenedores[0].precinto)
  const [reemplazado, setReemplazado] = useState(false)
  const toIso = (dmy: string) => dmy.split("/").reverse().join("-")

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
        subtitle="Corrija el dato o, si el error está en el documento, suba una versión nueva. Después se vuelve a validar."
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
                  <Label>Dato cargado</Label>
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
                <div className="text-xs text-muted-foreground">{reemplazado ? "Versión nueva cargada" : "Si el dato cargado es el correcto, suba el BL corregido por la naviera."}</div>
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
                  toast.success("Todo coincide", { description: `${id} volvió a revisión de Planir.` })
                  go("C20", id)
                } else {
                  toast.error("Todavía hay datos que no coinciden", { description: "Revise los campos marcados en rojo." })
                }
              }}
            >
              Reenviar solicitud
            </Button>
          </div>
        </div>
        <ComoFunciona />
      </div>
    </ClientLayout>
  )
}

function ReemplazarDocumento({ ingreso }: { ingreso: Ingreso }) {
  const reenviar = useDemo((s) => s.reenviar)
  const [reemplazado, setReemplazado] = useState(false)
  const comentario = ingreso.comentarios.at(-1)
  const doc = ingreso.documentos[0]
  return (
    <ClientLayout active="solicitudes">
      <PageHeader onBack={() => go("C20", ingreso.id)} backLabel={ingreso.id} title={`Corregir ${ingreso.id}`} badge={<EstadoBadge estado={ingreso.estado} />} />
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="space-y-4">
          {comentario && (
            <Callout tone="warn" icon={<MessageSquare className="size-5" />} title={comentario.autor}>
              {comentario.texto}
            </Callout>
          )}
          <SectionCard title="Documento">
            <div className="flex items-center gap-4">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <FileText className="size-5 text-muted-foreground" />
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium">{reemplazado ? doc.nombre.replace(".pdf", "_v2.pdf") : doc.nombre}</div>
                <div className="text-xs text-muted-foreground">{reemplazado ? "Versión nueva cargada" : "Suba una versión corregida o más legible."}</div>
              </div>
              <Button variant="outline" size="sm" onClick={() => setReemplazado(true)} disabled={reemplazado}>
                <Upload /> Reemplazar
              </Button>
            </div>
          </SectionCard>
          <div className="flex justify-end">
            <Button
              variant="brand"
              size="lg"
              disabled={!reemplazado}
              onClick={() => {
                reenviar(ingreso.id)
                toast.success("Solicitud reenviada", { description: "Una persona de Planir la revisará." })
                go("C20", ingreso.id)
              }}
            >
              Reenviar solicitud
            </Button>
          </div>
        </div>
        <ComoFunciona />
      </div>
    </ClientLayout>
  )
}

function ConfirmarImo({ ingreso }: { ingreso: Ingreso }) {
  const responder = useDemo((s) => s.responderImo)
  const [esImo, setEsImo] = useState<boolean | null>(null)
  const [cartilla, setCartilla] = useState(false)
  const check = ingreso.validacion.find((c) => c.dato === CHECK_IMO)!
  const comentario = ingreso.comentarios.at(-1)
  const opcion = (value: boolean, title: string, desc: string, icon: React.ReactNode) => (
    <button
      onClick={() => setEsImo(value)}
      className={cn(
        "flex items-start gap-4 rounded-xl border-2 bg-white p-5 text-left transition",
        esImo === value ? (value ? "border-amber-500 bg-amber-50/50" : "border-planir bg-accent/40") : "border-border hover:border-stone-300",
      )}
    >
      <span className={cn("mt-0.5 flex size-5 items-center justify-center rounded-full border-2", esImo === value ? (value ? "border-amber-500" : "border-planir") : "border-stone-300")}>
        {esImo === value && <span className={cn("size-2.5 rounded-full", value ? "bg-amber-500" : "bg-planir")} />}
      </span>
      <span className="flex-1">
        <span className="flex items-center gap-2 font-heading font-semibold text-planir">
          {icon} {title}
        </span>
        <span className="mt-1 block text-sm text-muted-foreground">{desc}</span>
      </span>
    </button>
  )
  return (
    <ClientLayout active="solicitudes">
      <PageHeader
        onBack={() => go("C30", ingreso.id)}
        backLabel={ingreso.id}
        title={`Responder a Planir · ${ingreso.id}`}
        badge={<EstadoBadge estado={ingreso.estado} />}
        subtitle="Planir necesita confirmar si la mercadería es carga peligrosa (IMO) antes de continuar."
      />
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="space-y-4">
          {comentario && (
            <Callout tone="warn" icon={<MessageSquare className="size-5" />} title={comentario.autor}>
              {comentario.texto}
            </Callout>
          )}
          <SectionCard title="Lo que dice el BL">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Descripción de la mercadería" value={ingreso.mercaderia ?? check.leido} />
              <Field label="Señal detectada" value={check.nota ?? "—"} />
            </div>
          </SectionCard>
          <SectionCard title="¿Es carga IMO?">
            <div className="grid grid-cols-2 gap-4">
              {opcion(false, "No es carga IMO", "La mercadería no está clasificada como peligrosa.", <PackageOpen className="size-4" />)}
              {opcion(true, "Sí, es carga IMO", "Adjunto la cartilla de seguridad.", <FlaskConical className="size-4" />)}
            </div>
            {esImo && (
              <div className="mt-4 space-y-3">
                <div className={cn("flex items-center gap-4 rounded-xl border p-4", cartilla ? "border-emerald-200 bg-emerald-50/50" : "border-dashed border-stone-300")}>
                  <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    {cartilla ? <FileText className="size-5 text-emerald-700" /> : <Upload className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 text-sm">
                    <div className="font-semibold">Cartilla de seguridad IMO</div>
                    <div className="text-xs text-muted-foreground">{cartilla ? `Cartilla_IMO_${ingreso.contenedores[0].numero}.pdf · cargada` : "Dangerous Goods Declaration, una por contenedor"}</div>
                  </div>
                  {!cartilla && (
                    <Button variant="outline" size="sm" onClick={() => setCartilla(true)}>
                      <Upload /> Subir archivo
                    </Button>
                  )}
                </div>
                <Callout tone="warn" icon={<ShieldAlert className="size-5" />} title={`La carga se deriva a ${DEPOSITO_IMO}`}>
                  La playa 1704 no recibe contenedores IMO. Planir envía las cartillas a {DEPOSITO_IMO}, que evalúa si puede hacer el traslado y el almacenamiento.
                </Callout>
              </div>
            )}
          </SectionCard>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => go("C30", ingreso.id)}>
              Cancelar
            </Button>
            <Button
              variant="brand"
              size="lg"
              disabled={esImo === null || (esImo && !cartilla)}
              onClick={() => {
                responder(ingreso.id, !!esImo)
                toast.success("Respuesta enviada a Planir", { description: esImo ? `Planir derivará las cartillas a ${DEPOSITO_IMO}.` : `${ingreso.id} vuelve a revisión de Planir.` })
                go("C30", ingreso.id)
              }}
            >
              Enviar respuesta
            </Button>
          </div>
        </div>
        <div className="space-y-3">
          <SectionCard title="¿Por qué se consulta?">
            <p className="text-sm text-muted-foreground">
              El portal revisa el BL en busca de N° UN, clase IMO o descripciones como aerosoles, solventes o baterías de litio. Son señales de alerta, no una
              clasificación: por eso Planir consulta antes de continuar.
            </p>
          </SectionCard>
          <HelpLine className="px-1" />
        </div>
      </div>
    </ClientLayout>
  )
}
