import { useState } from "react"
import { toast } from "sonner"
import { AlertTriangle, ArrowRight, Building2, CheckCircle2, Clock, FlaskConical, LifeBuoy, Mail, PauseCircle, Phone, Truck, Upload, XCircle } from "lucide-react"
import {
  Callout,
  DocList,
  EstadoBadge,
  EstadoSalidaBadge,
  Field,
  KpiCard,
  PageHeader,
  ProformaTable,
  SectionCard,
  Timeline,
  ToneBadge,
  ValidationSummary,
  ValidationTable,
} from "@/components/app/common"
import { PlanirLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { daysBetween } from "@/data/seed"
import type { Ingreso } from "@/data/types"
import { fecha, fechaCorta, fechaHora, kg, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go, openIngreso, openSalida } from "@/screens/nav"
import { useCliente, useData, useDemo, useHoy, useIngreso, useSalida } from "@/store/demo"

// ---------------------------------------------------------------------------
// P02 · Bandeja
// ---------------------------------------------------------------------------

const GRUPOS: Record<string, { label: string; estados: string[] }> = {
  revisar: { label: "Para revisar", estados: ["pendiente_aprobacion", "revision"] },
  cliente: { label: "Esperando al cliente", estados: ["observada"] },
  detenidas: { label: "Detenidas", estados: ["pendiente_externo"] },
  aprobadas: { label: "Aprobadas", estados: ["aprobada"] },
  playa: { label: "En playa", estados: ["ingresada"] },
  todas: { label: "Todas", estados: [] },
}

function DocumentacionBadge({ i }: { i: Ingreso }) {
  if (i.validacion.some((c) => c.resultado === "error")) return <ToneBadge tone="error">Observada</ToneBadge>
  if (i.validacion.some((c) => c.resultado === "warning")) return <ToneBadge tone="warn">A revisar</ToneBadge>
  return <ToneBadge tone="ok">Validada</ToneBadge>
}

function Alertas({ i }: { i: Ingreso }) {
  const ayuda = useDemo((s) => s.data.ayuda.some((h) => h.ref === i.id && !h.resuelto))
  return (
    <div className="flex flex-wrap gap-1">
      {i.estado === "observada" && i.diasSinRespuesta !== undefined && (
        <ToneBadge tone={i.diasSinRespuesta > 10 ? "error" : i.diasSinRespuesta > 5 ? "warn" : "neutral"}>{i.diasSinRespuesta} días sin respuesta</ToneBadge>
      )}
      {i.estado === "pendiente_externo" && <ToneBadge tone="warn">Detenida</ToneBadge>}
      {ayuda && (
        <ToneBadge tone="info">
          <LifeBuoy className="size-3" /> Pidió ayuda
        </ToneBadge>
      )}
      {i.imo && (
        <ToneBadge tone="brand">
          <FlaskConical className="size-3" /> IMO
        </ToneBadge>
      )}
    </div>
  )
}

export function P02Bandeja() {
  const data = useData()
  const [grupo, setGrupo] = useState("revisar")
  const [cliente, setCliente] = useState("todos")
  const [soloAlertas, setSoloAlertas] = useState(false)
  const ingresos = data.ingresos.filter((i) => i.estado !== "borrador")
  const count = (g: string) => ingresos.filter((i) => GRUPOS[g].estados.includes(i.estado)).length
  const conAlerta = (i: Ingreso) => (i.estado === "observada" && (i.diasSinRespuesta ?? 0) > 5) || i.estado === "pendiente_externo" || data.ayuda.some((h) => h.ref === i.id && !h.resuelto)
  const filas = ingresos
    .filter((i) => grupo === "todas" || GRUPOS[grupo].estados.includes(i.estado))
    .filter((i) => cliente === "todos" || i.clienteId === cliente)
    .filter((i) => !soloAlertas || conAlerta(i))
    .sort((a, b) => b.actualizado.localeCompare(a.actualizado) || b.id.localeCompare(a.id))
  const clienteDe = (id: string) => data.clientes.find((c) => c.id === id)!
  const pagos = data.salidas.filter((s) => s.estado === "pendiente_pago").length
  const ayudas = data.ayuda.filter((h) => !h.resuelto).length

  return (
    <PlanirLayout role="operador" active="bandeja">
      <PageHeader title="Bandeja de solicitudes" subtitle="Lo que entra por el portal. Si la validación automática da todo OK, no te llega ningún mail: lo ves acá." />
      <div className="grid grid-cols-5 gap-3">
        <KpiCard label="Para revisar" value={count("revisar")} tone="info" active={grupo === "revisar"} onClick={() => setGrupo("revisar")} />
        <KpiCard label="Esperando al cliente" value={count("cliente")} tone="error" active={grupo === "cliente"} onClick={() => setGrupo("cliente")} />
        <KpiCard label="Detenidas" value={count("detenidas")} tone="warn" active={grupo === "detenidas"} onClick={() => setGrupo("detenidas")} />
        <KpiCard label="Pedidos de ayuda" value={ayudas} tone="info" onClick={() => go("P12")} />
        <KpiCard label="Pagos a confirmar" value={pagos} tone="warn" hint="Administración" />
      </div>

      <div className="mt-6 mb-3 flex flex-wrap items-center gap-3">
        <Tabs value={grupo} onValueChange={setGrupo}>
          <TabsList>
            {Object.entries(GRUPOS).map(([k, g]) => (
              <TabsTrigger key={k} value={k}>
                {g.label}
                {k !== "todas" && <span className="ml-1 text-muted-foreground">{count(k)}</span>}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="ml-auto flex items-center gap-4">
          <Select value={cliente} onValueChange={setCliente}>
            <SelectTrigger className="w-56 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los clientes</SelectItem>
              {data.clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.razonSocial}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={soloAlertas} onCheckedChange={setSoloAlertas} /> Solo con alertas
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Solicitud</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Barco · viaje</TableHead>
              <TableHead>Cont.</TableHead>
              <TableHead>Documentación</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Alertas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((i) => {
              const c = clienteDe(i.clienteId)
              return (
                <TableRow key={i.id} className="cursor-pointer" onClick={() => openIngreso("planir", i.id)}>
                  <TableCell className="pl-5">
                    <div className="font-semibold text-planir">{i.id}</div>
                    <div className="text-xs text-muted-foreground">Ingreso · {fechaCorta(i.creado)}</div>
                  </TableCell>
                  <TableCell className="max-w-48">
                    <div className="truncate">{c.razonSocial}</div>
                    <div className="text-xs text-muted-foreground">{c.condicionPago === "cuenta_corriente" ? "Cuenta corriente" : "Pago previo"}</div>
                  </TableCell>
                  <TableCell className="max-w-44 truncate">
                    {i.barco} · {i.viaje}
                  </TableCell>
                  <TableCell>{i.contenedores.length}</TableCell>
                  <TableCell>
                    <DocumentacionBadge i={i} />
                  </TableCell>
                  <TableCell>
                    <EstadoBadge estado={i.estado} />
                  </TableCell>
                  <TableCell>
                    <Alertas i={i} />
                  </TableCell>
                </TableRow>
              )
            })}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay solicitudes con este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// Detalle de ingreso (P03–P08)
// ---------------------------------------------------------------------------

export type PlanirDialog = "pendiente" | "rechazar" | "ingreso" | "correccion"

const MOTIVOS_PENDIENTE: Record<string, string> = {
  "Paro en la terminal": "Hay paro en la terminal. Retomamos el movimiento apenas se normalice la actividad; te avisamos por acá.",
  "Condiciones climáticas": "Por viento fuerte está suspendida la operativa en el puerto. Movemos tu contenedor cuando se habilite.",
  "Horario de la terminal": "La terminal ya no opera hoy después de las 18 h. Lo movemos mañana a primera hora.",
  Otro: "",
}

function PendienteDialog({ ingreso, open, onOpenChange }: { ingreso: Ingreso; open: boolean; onOpenChange: (o: boolean) => void }) {
  const dejarPendiente = useDemo((s) => s.dejarPendiente)
  const [motivo, setMotivo] = useState("Paro en la terminal")
  const [comentario, setComentario] = useState(MOTIVOS_PENDIENTE["Paro en la terminal"].replace("la terminal", ingreso.terminal.split(" · ")[0]))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Dejar {ingreso.id} pendiente</DialogTitle>
          <DialogDescription>Para cuando el motivo es externo. El cliente ve el comentario en el portal y le llega una notificación.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select
              value={motivo}
              onValueChange={(m) => {
                setMotivo(m)
                setComentario(MOTIVOS_PENDIENTE[m])
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(MOTIVOS_PENDIENTE).map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Comentario para el cliente</Label>
            <Textarea rows={3} value={comentario} onChange={(e) => setComentario(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            disabled={!comentario.trim()}
            onClick={() => {
              dejarPendiente(ingreso.id, motivo, comentario)
              onOpenChange(false)
              toast(`${ingreso.id} quedó pendiente`, { description: "Le avisamos al cliente con tu comentario." })
            }}
          >
            Dejar pendiente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RechazarDialog({ ingreso, open, onOpenChange, preset }: { ingreso: Ingreso; open: boolean; onOpenChange: (o: boolean) => void; preset?: string }) {
  const rechazar = useDemo((s) => s.rechazar)
  const [motivo, setMotivo] = useState(preset ?? "")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Rechazar {ingreso.id}</DialogTitle>
          <DialogDescription>El cliente recibe el motivo en el portal. Usalo cuando el pedido no se puede hacer; si falta un dato, mejor pedí una corrección.</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label>Motivo del rechazo (obligatorio)</Label>
          <Textarea rows={4} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={!motivo.trim()}
            onClick={() => {
              rechazar(ingreso.id, motivo)
              onOpenChange(false)
              toast(`Rechazaste ${ingreso.id}`)
            }}
          >
            Rechazar solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CorreccionDialog({ ingreso, open, onOpenChange }: { ingreso: Ingreso; open: boolean; onOpenChange: (o: boolean) => void }) {
  const pedir = useDemo((s) => s.pedirCorreccion)
  const warning = ingreso.validacion.find((c) => c.resultado === "warning")
  const [mensaje, setMensaje] = useState(
    warning?.dato === "Documento BL" ? "El BL que subiste no se lee bien. ¿Nos mandás una copia escaneada con mejor resolución?" : `Revisá el ${warning?.dato.toLowerCase() ?? "dato"}: el valor declarado parece fuera de rango.`,
  )
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Pedir corrección al cliente</DialogTitle>
          <DialogDescription>La solicitud vuelve a “Observada” y el cliente recibe tu mensaje.</DialogDescription>
        </DialogHeader>
        <Textarea rows={4} value={mensaje} onChange={(e) => setMensaje(e.target.value)} />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              pedir(ingreso.id, mensaje)
              onOpenChange(false)
              toast(`Le pediste una corrección a ${ingreso.id}`)
            }}
          >
            Enviar al cliente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function IngresoRealDialog({ ingreso, open, onOpenChange }: { ingreso: Ingreso; open: boolean; onOpenChange: (o: boolean) => void }) {
  const registrar = useDemo((s) => s.registrarIngreso)
  const [valor, setValor] = useState(ingreso.id === "ING-0142" ? "2026-10-31T08:40" : `${ingreso.fechaMovimiento}T09:00`)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar ingreso real · {ingreso.id}</DialogTitle>
          <DialogDescription>Desde esta fecha se cuentan los días de estadía. El cliente recibe el aviso de que su contenedor entró.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {ingreso.contenedores.map((c) => (
            <div key={c.numero} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex-1">
                <div className="font-medium">{c.numero}</div>
                <div className="text-xs text-muted-foreground">
                  {c.tipo} · precinto {c.precinto}
                </div>
              </div>
              <Input type="datetime-local" className="w-56" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> Precintos verificados al ingresar
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              registrar(ingreso.id, valor)
              onOpenChange(false)
              toast.success("Ingreso registrado", { description: "Le avisamos al cliente que su contenedor está en la playa." })
            }}
          >
            Registrar ingreso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ClienteCard({ clienteId }: { clienteId: string }) {
  const c = useCliente(clienteId)
  const u = c.usuarios[0]
  return (
    <SectionCard
      title={
        <span className="flex items-center gap-2">
          <Building2 className="size-4" /> Cliente
        </span>
      }
    >
      <div className="font-semibold">{c.razonSocial}</div>
      <div className="mt-1 text-sm text-muted-foreground">
        {u.nombre} · {u.cargo}
      </div>
      <div className="mt-3 space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <Mail className="size-3.5 text-muted-foreground" /> {u.email}
        </div>
        <div className="flex items-center gap-2">
          <Phone className="size-3.5 text-muted-foreground" /> {c.telefono}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <ToneBadge tone={c.condicionPago === "cuenta_corriente" ? "ok" : "warn"}>{c.condicionPago === "cuenta_corriente" ? "Cuenta corriente" : "Pago previo"}</ToneBadge>
        {c.costoCancelacion && <ToneBadge tone="neutral">Costo de cancelación {usd(c.montoCancelacion)}</ToneBadge>}
      </div>
    </SectionCard>
  )
}

export function PlanirIngresoDetalle({ id, dialog, rechazoPreset }: { id: string; dialog?: PlanirDialog; rechazoPreset?: string }) {
  const ingreso = useIngreso(id)
  const today = useHoy()
  const togglePaso = useDemo((s) => s.togglePaso)
  const aprobar = useDemo((s) => s.aprobar)
  const aceptarRevision = useDemo((s) => s.aceptarRevision)
  const resolverAyuda = useDemo((s) => s.resolverAyuda)
  const ayudas = useDemo((s) => s.data.ayuda).filter((h) => h.ref === id && !h.resuelto)
  const cliente = useCliente(ingreso?.clienteId ?? "c-rambla")
  const [open, setOpen] = useState<PlanirDialog | null>(dialog ?? null)
  const [comentario, setComentario] = useState("")
  if (!ingreso) return <PlanirLayout role="operador" active="bandeja">No encontramos la solicitud {id}.</PlanirLayout>

  const decidible = ["pendiente_aprobacion", "pendiente_externo"].includes(ingreso.estado)
  const pasosOk = ingreso.pasos.every((p) => p.done)
  const dialogProps = (d: PlanirDialog) => ({ open: open === d, onOpenChange: (o: boolean) => setOpen(o ? d : null), ingreso })

  return (
    <PlanirLayout role="operador" active="bandeja">
      <PageHeader
        onBack={() => go("P02")}
        backLabel="Bandeja"
        title={`${ingreso.id} · ${cliente.razonSocial}`}
        badge={<EstadoBadge estado={ingreso.estado} />}
        subtitle={`Ingreso · ${ingreso.barco} ${ingreso.viaje} · BL ${ingreso.bl} · ${ingreso.contenedores.length} contenedores · presentada el ${fecha(ingreso.creado)} por ${ingreso.creadoPor}`}
      />

      <div className="space-y-3">
        {ingreso.estado === "observada" && (
          <Callout
            tone={(ingreso.diasSinRespuesta ?? 0) > 10 ? "error" : "warn"}
            icon={<Clock className="size-5" />}
            title={`Esperando al cliente hace ${ingreso.diasSinRespuesta ?? 0} días`}
            action={
              <Button variant="outline" className="bg-white" onClick={() => toast("Se abrió un mail para el cliente", { description: cliente.usuarios[0].email })}>
                <Mail /> Escribir al cliente
              </Button>
            }
          >
            Al cliente le llegó el aviso con lo que tiene que corregir, pero todavía no reenvió. Si es una carga importante, podés contactarlo directamente: {cliente.usuarios[0].nombre}, {cliente.telefono}.
          </Callout>
        )}
        {ingreso.estado === "revision" && (
          <Callout
            tone="warn"
            icon={<AlertTriangle className="size-5" />}
            title="Requiere revisión humana"
            action={
              <div className="flex gap-2">
                <Button variant="outline" className="bg-white" onClick={() => setOpen("correccion")}>
                  Pedir corrección
                </Button>
                <Button
                  onClick={() => {
                    aceptarRevision(ingreso.id)
                    toast.success("Valor aceptado", { description: `${ingreso.id} pasa a “Pendiente de aprobación”.` })
                  }}
                >
                  Aceptar y seguir
                </Button>
              </div>
            }
          >
            {ingreso.validacion
              .filter((c) => c.resultado === "warning")
              .map((c) => `${c.dato}: ${c.leido} — ${c.nota}`)
              .join(" · ")}
          </Callout>
        )}
        {ingreso.estado === "pendiente_externo" && (
          <Callout tone="warn" icon={<PauseCircle className="size-5" />} title={`Detenida · ${ingreso.motivoPendiente}`}>
            {ingreso.comentarios.at(-1)?.texto}
          </Callout>
        )}
        {ayudas.map((h) => (
          <Callout
            key={h.id}
            tone="info"
            icon={<LifeBuoy className="size-5" />}
            title={`${h.usuario} pidió ayuda · ${h.motivo}`}
            action={
              <Button
                size="sm"
                variant="outline"
                className="bg-white"
                onClick={() => {
                  resolverAyuda(h.id)
                  toast("Pedido de ayuda marcado como resuelto")
                }}
              >
                Marcar resuelto
              </Button>
            }
          >
            “{h.mensaje}” · {fechaHora(h.fecha)}
          </Callout>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-4">
          <SectionCard title="Resultado de la validación automática" action={<ValidationSummary checks={ingreso.validacion} />} className="overflow-hidden">
            <ValidationTable checks={ingreso.validacion} />
          </SectionCard>
          <SectionCard title="Operación">
              <div className="grid grid-cols-3 gap-4">
                <Field label="Terminal" value={ingreso.terminal.split(" · ")[0]} />
                <Field label="Llegada estimada" value={fecha(ingreso.fechaLlegada)} />
                <Field label="Movimiento" value={fecha(ingreso.fechaMovimiento)} />
                <Field label="Salida estimada" value={fecha(ingreso.contenedores[0].salidasEstimadas.at(-1)!.fecha)} />
                <Field label="Carga IMO" value={ingreso.imo ? "Sí" : "No"} />
                <Field label="Peso total" value={kg(Math.round(ingreso.contenedores.reduce((a, c) => a + c.peso, 0) * 10) / 10)} />
              </div>
          </SectionCard>
          <SectionCard title="Documentos">
            <DocList docs={ingreso.documentos} />
          </SectionCard>
          {["ingresada", "cerrada"].includes(ingreso.estado) && (
            <SectionCard title="Contenedores en playa" className="overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Contenedor</TableHead>
                    <TableHead>Ingreso real</TableHead>
                    <TableHead>Salida</TableHead>
                    <TableHead className="text-right">Días</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingreso.contenedores.map((c) => (
                    <TableRow key={c.numero}>
                      <TableCell className="font-medium">{c.numero}</TableCell>
                      <TableCell>{fechaHora(c.ingresoReal)}</TableCell>
                      <TableCell>
                        {c.salidaReal ? fechaHora(c.salidaReal) : `Estimada ${fechaCorta(c.salidasEstimadas.at(-1)!.fecha)}`}
                        {c.salidaId && (
                          <button className="ml-2 text-xs font-medium text-brand hover:underline" onClick={() => openSalida("planir", c.salidaId!)}>
                            {c.salidaId}
                          </button>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{daysBetween(c.ingresoReal!, c.salidaReal ?? today)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </SectionCard>
          )}
          <SectionCard title="Historial">
            <Timeline eventos={ingreso.historial} />
          </SectionCard>
        </div>

        <div className="space-y-4">
          {ingreso.pasos.length > 0 && (
            <SectionCard title="Pasos internos" action={<span className="text-xs text-muted-foreground">{ingreso.pasos.filter((p) => p.done).length}/{ingreso.pasos.length}</span>}>
              <ul className="space-y-2.5">
                {ingreso.pasos.map((p, idx) => (
                  <li key={p.label}>
                    <label className={cn("flex items-center gap-3 text-sm", decidible ? "cursor-pointer" : "opacity-70")}>
                      <Checkbox checked={p.done} disabled={!decidible} onCheckedChange={() => togglePaso(ingreso.id, idx)} />
                      <span className={cn(p.done && "text-muted-foreground line-through decoration-stone-300")}>{p.label}</span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[11px] text-amber-700">A validar: la lista exacta de pasos la define Planir.</p>
            </SectionCard>
          )}

          {decidible && (
            <SectionCard title="Decisión">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Comentario para el cliente (opcional)</Label>
                <Textarea rows={2} value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Ej. Lo movemos el viernes a primera hora." />
              </div>
              <Button
                className="mt-3 w-full"
                disabled={!pasosOk}
                onClick={() => {
                  aprobar(ingreso.id, comentario || undefined)
                  toast.success(`Aprobaste ${ingreso.id}`, { description: "El cliente recibió el aviso con la proforma." })
                }}
              >
                <CheckCircle2 /> Aprobar
              </Button>
              {!pasosOk && <p className="mt-1.5 text-center text-xs text-muted-foreground">Completá los pasos internos para aprobar</p>}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setOpen("pendiente")} disabled={ingreso.estado === "pendiente_externo"}>
                  <PauseCircle /> Dejar pendiente
                </Button>
                <Button variant="outline" className="text-red-700" onClick={() => setOpen("rechazar")}>
                  <XCircle /> Rechazar
                </Button>
              </div>
            </SectionCard>
          )}

          {ingreso.estado === "aprobada" && (
            <SectionCard title="Siguiente paso">
              <p className="text-sm text-muted-foreground">Cuando el contenedor llegue a la playa, registrá el ingreso real para empezar a contar la estadía.</p>
              <Button className="mt-3 w-full" onClick={() => setOpen("ingreso")}>
                <Truck /> Registrar ingreso real
              </Button>
            </SectionCard>
          )}

          {["aprobada", "ingresada", "cerrada"].includes(ingreso.estado) && (
            <SectionCard title="Proforma">
              <ProformaTable items={ingreso.proforma} />
            </SectionCard>
          )}

          <ClienteCard clienteId={ingreso.clienteId} />
        </div>
      </div>

      <PendienteDialog {...dialogProps("pendiente")} />
      <RechazarDialog {...dialogProps("rechazar")} preset={rechazoPreset} />
      <CorreccionDialog {...dialogProps("correccion")} />
      <IngresoRealDialog {...dialogProps("ingreso")} />
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// P09 · Contenedores en playa
// ---------------------------------------------------------------------------

export function P09Inventario() {
  const data = useData()
  const today = useHoy()
  const filas = data.ingresos
    .filter((i) => i.estado === "ingresada")
    .flatMap((i) => i.contenedores.filter((c) => c.ingresoReal && !c.salidaReal).map((c) => ({ c, i, cliente: data.clientes.find((x) => x.id === i.clienteId)! })))
    .sort((a, b) => a.c.salidasEstimadas.at(-1)!.fecha.localeCompare(b.c.salidasEstimadas.at(-1)!.fecha))
  const dias = filas.map((f) => daysBetween(f.c.ingresoReal!, today))
  const promedio = dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : 0
  const proximas = filas.filter((f) => daysBetween(today, f.c.salidasEstimadas.at(-1)!.fecha) <= 7).length
  return (
    <PlanirLayout role="operador" active="contenedores">
      <PageHeader title="Contenedores en playa" subtitle={`Inventario al ${fecha(today)}. La estadía se cuenta desde el ingreso real.`} />
      <div className="mb-6 grid grid-cols-4 gap-3">
        <KpiCard label="En playa" value={filas.length} tone="brand" />
        <KpiCard label="Carga IMO" value={filas.filter((f) => f.i.imo).length} tone="warn" />
        <KpiCard label="Salen en los próximos 7 días" value={proximas} tone="info" />
        <KpiCard label="Estadía promedio" value={`${promedio} días`} tone="neutral" />
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Contenedor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Ingreso real</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Salida estimada</TableHead>
              <TableHead>Retiro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map(({ c, i, cliente }, idx) => {
              const sal = c.salidaId ? data.salidas.find((s) => s.id === c.salidaId) : undefined
              return (
                <TableRow key={c.numero}>
                  <TableCell className="pl-5">
                    <div className="flex items-center gap-2 font-semibold">
                      {c.numero}
                      {i.imo && (
                        <ToneBadge tone="brand">
                          <FlaskConical className="size-3" /> IMO
                        </ToneBadge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">{c.tipo}</div>
                  </TableCell>
                  <TableCell className="max-w-44 truncate">{cliente.razonSocial}</TableCell>
                  <TableCell>
                    <button className="font-medium text-planir hover:underline" onClick={() => openIngreso("planir", i.id)}>
                      {i.id}
                    </button>
                  </TableCell>
                  <TableCell>{fechaHora(c.ingresoReal)}</TableCell>
                  <TableCell className="font-semibold tabular-nums">{dias[idx]}</TableCell>
                  <TableCell>
                    {fechaCorta(c.salidasEstimadas.at(-1)!.fecha)}
                    {c.salidasEstimadas.length > 1 && <div className="text-xs text-brand">cambiada · suplemento</div>}
                  </TableCell>
                  <TableCell>
                    {sal ? (
                      <button onClick={() => openSalida("planir", sal.id)} className="flex items-center gap-2">
                        <span className="text-sm font-medium text-planir hover:underline">{sal.id}</span>
                        <EstadoSalidaBadge estado={sal.estado} />
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin solicitar</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// P10–P11 · Salida
// ---------------------------------------------------------------------------

function RegistrarSalidaDialog({ salidaId, open, onOpenChange }: { salidaId: string; open: boolean; onOpenChange: (o: boolean) => void }) {
  const salida = useSalida(salidaId)!
  const ingreso = useIngreso(salida.ingresoId)!
  const registrar = useDemo((s) => s.registrarSalida)
  const [valor, setValor] = useState(`${salida.fechaRetiro}T14:20`)
  const [adjunto, setAdjunto] = useState(false)
  const ctrs = ingreso.contenedores.filter((c) => salida.contenedores.includes(c.numero))
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar salida real · {salida.id}</DialogTitle>
          <DialogDescription>Con la fecha real se calculan los días de estadía para Administración. El cliente recibe la confirmación con la constancia.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {ctrs.map((c) => (
            <div key={c.numero} className="flex items-center gap-4 rounded-lg border p-3">
              <div className="flex-1">
                <div className="font-medium">{c.numero}</div>
                <div className="text-xs text-muted-foreground">Ingresó {fechaHora(c.ingresoReal)}</div>
              </div>
              <Input type="datetime-local" className="w-56" value={valor} onChange={(e) => setValor(e.target.value)} />
              <div className="w-16 text-right text-sm">
                <b className="tabular-nums">{daysBetween(c.ingresoReal!, valor)}</b> días
              </div>
            </div>
          ))}
          <div className={cn("flex items-center gap-3 rounded-lg border p-3", adjunto ? "border-emerald-200 bg-emerald-50/50" : "border-dashed")}>
            <Upload className="size-4 text-muted-foreground" />
            <div className="flex-1 text-sm">{adjunto ? `Constancia_salida_${salida.id}.pdf` : "Documentos de salida (EIR / constancia)"}</div>
            {!adjunto && (
              <Button size="sm" variant="outline" onClick={() => setAdjunto(true)}>
                Adjuntar
              </Button>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              registrar(salida.id)
              onOpenChange(false)
              toast.success(`Salida registrada · ${salida.id}`, { description: "El cliente recibió la confirmación con la constancia." })
            }}
          >
            Registrar salida
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function PlanirSalidaDetalle({ id, dialog }: { id: string; dialog?: "salida" }) {
  const salida = useSalida(id)
  const ingreso = useIngreso(salida?.ingresoId ?? "")
  const cliente = useCliente(salida?.clienteId ?? "c-rambla")
  const [open, setOpen] = useState(dialog === "salida")
  if (!salida || !ingreso) return <PlanirLayout role="operador" active="contenedores">No encontramos el retiro {id}.</PlanirLayout>
  const ctrs = ingreso.contenedores.filter((c) => salida.contenedores.includes(c.numero))
  const pagoPrevio = cliente.condicionPago === "pago_previo"
  const requisitos = [
    { label: "Contenedores en playa", ok: ctrs.every((c) => c.ingresoReal), detalle: `${ctrs.length} de ${ctrs.length}` },
    { label: "Documentación del ingreso validada", ok: true, detalle: ingreso.id },
    {
      label: "Pago",
      ok: !pagoPrevio || salida.estado !== "pendiente_pago",
      detalle: !pagoPrevio ? "Cuenta corriente · no requiere pago previo" : salida.estado === "pendiente_pago" ? "Pendiente: lo confirma Administración" : `Confirmado el ${fecha(salida.pagoConfirmado)}`,
    },
  ]
  return (
    <PlanirLayout role="operador" active="contenedores">
      <PageHeader
        onBack={() => go("P09")}
        backLabel="Contenedores en playa"
        title={`${salida.id} · ${cliente.razonSocial}`}
        badge={<EstadoSalidaBadge estado={salida.estado} />}
        subtitle={
          <>
            Salida de{" "}
            <button className="font-medium text-planir hover:underline" onClick={() => openIngreso("planir", ingreso.id)}>
              {ingreso.id}
            </button>{" "}
            · {ctrs.length} contenedores · retiro solicitado para el {fecha(salida.fechaRetiro)}
          </>
        }
        actions={
          salida.estado === "habilitada" && (
            <Button onClick={() => setOpen(true)}>
              <Truck /> Registrar salida real
            </Button>
          )
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-4">
          <SectionCard title="Requisitos para habilitar el retiro">
            <ul className="space-y-3">
              {requisitos.map((r) => (
                <li key={r.label} className="flex items-center gap-3">
                  {r.ok ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Clock className="size-5 text-amber-600" />}
                  <div className="flex-1">
                    <div className="text-sm font-medium">{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.detalle}</div>
                  </div>
                  {!r.ok && (
                    <Button size="sm" variant="outline" onClick={() => go("A04")}>
                      Ver en Pagos <ArrowRight />
                    </Button>
                  )}
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg bg-muted/60 p-3 text-sm">
              {salida.estado === "pendiente_pago" && "El retiro se habilita solo cuando Administración marque el pago como recibido."}
              {salida.estado === "habilitada" && "Retiro habilitado. Cuando el camión salga, registrá la salida real."}
              {salida.estado === "retirada" && "Salida registrada. Los días de estadía ya están disponibles para Administración."}
            </div>
          </SectionCard>
          <SectionCard title="Contenedores" className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Contenedor</TableHead>
                  <TableHead>Ingreso real</TableHead>
                  <TableHead>Salida</TableHead>
                  <TableHead className="text-right">Días de estadía</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ctrs.map((c) => (
                  <TableRow key={c.numero}>
                    <TableCell className="font-medium">{c.numero}</TableCell>
                    <TableCell>{fechaHora(c.ingresoReal)}</TableCell>
                    <TableCell>{c.salidaReal ? fechaHora(c.salidaReal) : `Prevista ${fechaCorta(salida.fechaRetiro)}`}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{daysBetween(c.ingresoReal!, c.salidaReal ?? salida.fechaRetiro)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
          {salida.documentos.length > 0 && (
            <SectionCard title="Documentos de salida">
              <DocList docs={salida.documentos} />
            </SectionCard>
          )}
        </div>
        <div className="space-y-4">
          <SectionCard title="Proforma">
            <ProformaTable items={salida.proforma} />
          </SectionCard>
          <ClienteCard clienteId={salida.clienteId} />
        </div>
      </div>
      <RegistrarSalidaDialog salidaId={salida.id} open={open} onOpenChange={setOpen} />
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// P12 · Pedidos de ayuda
// ---------------------------------------------------------------------------

export function P12Ayuda() {
  const data = useData()
  const resolver = useDemo((s) => s.resolverAyuda)
  const [tab, setTab] = useState("abiertos")
  const lista = data.ayuda.filter((h) => (tab === "abiertos" ? !h.resuelto : h.resuelto))
  return (
    <PlanirLayout role="operador" active="ayuda">
      <PageHeader title="Pedidos de ayuda" subtitle="Cuando un cliente necesita hablar con una persona. Se responden por teléfono o mail y se marcan como resueltos." />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="abiertos">Abiertos ({data.ayuda.filter((h) => !h.resuelto).length})</TabsTrigger>
          <TabsTrigger value="resueltos">Resueltos ({data.ayuda.filter((h) => h.resuelto).length})</TabsTrigger>
        </TabsList>
      </Tabs>
      <div className="space-y-3">
        {lista.map((h) => {
          const c = data.clientes.find((x) => x.id === h.clienteId)!
          return (
            <SectionCard key={h.id}>
              <div className="flex items-start gap-4">
                <div className="flex size-10 items-center justify-center rounded-full bg-sky-50 text-sky-700">
                  <LifeBuoy className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{c.razonSocial}</span>
                    <span className="text-sm text-muted-foreground">· {h.usuario}</span>
                    <ToneBadge tone="info">{h.motivo}</ToneBadge>
                  </div>
                  <p className="mt-1.5 text-sm">“{h.mensaje}”</p>
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>{fechaHora(h.fecha)}</span>
                    <button className="font-medium text-planir hover:underline" onClick={() => openIngreso("planir", h.ref)}>
                      {h.ref}
                    </button>
                    <span className="inline-flex items-center gap-1">
                      <Phone className="size-3" /> {c.telefono}
                    </span>
                  </div>
                </div>
                {!h.resuelto && (
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openIngreso("planir", h.ref)}>
                      Ver solicitud
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        resolver(h.id)
                        toast("Marcado como resuelto")
                      }}
                    >
                      Marcar resuelto
                    </Button>
                  </div>
                )}
              </div>
            </SectionCard>
          )
        })}
        {lista.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No hay pedidos en esta lista.</p>}
      </div>
    </PlanirLayout>
  )
}
