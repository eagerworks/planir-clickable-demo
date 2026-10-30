import { useState } from "react"
import { toast } from "sonner"
import { ArrowRight, Banknote, CheckCircle2, Download, FileText, Mail, Plus, UserPlus } from "lucide-react"
import { Callout, EstadoBadge, EstadoSalidaBadge, KpiCard, PageHeader, ProformaTable, SectionCard, ToneBadge } from "@/components/app/common"
import { PlanirLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { daysBetween } from "@/data/seed"
import type { Cliente, CondicionPago } from "@/data/types"
import { fecha, fechaCorta, fechaHora, total, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go, openIngreso, openSalida } from "@/screens/nav"
import { useCliente, useData, useDemo, useHoy } from "@/store/demo"

function CondicionSelect({ cliente }: { cliente: Cliente }) {
  const setCondicion = useDemo((s) => s.setCondicion)
  return (
    <Select
      value={cliente.condicionPago}
      onValueChange={(v) => {
        setCondicion(cliente.id, v as CondicionPago)
        toast(`${cliente.razonSocial}: ${v === "cuenta_corriente" ? "cuenta corriente" : "pago previo"}`)
      }}
    >
      <SelectTrigger className="h-8 w-44 bg-white" onClick={(e) => e.stopPropagation()}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="cuenta_corriente">Cuenta corriente</SelectItem>
        <SelectItem value="pago_previo">Pago previo</SelectItem>
      </SelectContent>
    </Select>
  )
}

function CancelacionSwitch({ cliente }: { cliente: Cliente }) {
  const toggle = useDemo((s) => s.toggleCancelacion)
  return (
    <label className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
      <Switch checked={cliente.costoCancelacion} onCheckedChange={() => toggle(cliente.id)} />
      <span className={cn(!cliente.costoCancelacion && "text-muted-foreground")}>{cliente.costoCancelacion ? `Activado · ${usd(cliente.montoCancelacion)}` : "Desactivado"}</span>
    </label>
  )
}

// ---------------------------------------------------------------------------
// A01 · Clientes
// ---------------------------------------------------------------------------

export function A01Clientes() {
  const data = useData()
  return (
    <PlanirLayout role="admin" active="clientes">
      <PageHeader
        title="Clientes"
        subtitle="Condición de pago y costo de cancelación de cada cliente."
        actions={
          <Button onClick={() => go("A02")}>
            <Plus /> Nuevo cliente
          </Button>
        }
      />
      <Callout tone="info" title="Cómo funciona">
        Los clientes con <b>cuenta corriente</b> retiran sin pago previo. Con <b>pago previo</b>, el retiro se habilita cuando Administración confirma la transferencia. El <b>costo de cancelación</b> se cobra
        si el cliente cancela después de la aprobación; se activa solo para quien lo necesite.
      </Callout>
      <div className="mt-5 overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Empresa</TableHead>
              <TableHead>Usuarios</TableHead>
              <TableHead>Condición de pago</TableHead>
              <TableHead>Costo de cancelación</TableHead>
              <TableHead>Cancelaciones</TableHead>
              <TableHead>Activas</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.clientes.map((c) => {
              const activas = data.ingresos.filter((i) => i.clienteId === c.id && !["cerrada", "cancelada", "rechazada"].includes(i.estado)).length
              const invitados = c.usuarios.filter((u) => u.estado === "invitado").length
              return (
                <TableRow key={c.id} className="cursor-pointer" onClick={() => go("A03", c.id)}>
                  <TableCell className="pl-5">
                    <div className="font-semibold text-planir">{c.razonSocial}</div>
                    <div className="text-xs text-muted-foreground">RUT {c.rut}</div>
                  </TableCell>
                  <TableCell>
                    {c.usuarios.length}
                    {invitados > 0 && <span className="ml-1 text-xs text-amber-700">({invitados} invitado)</span>}
                  </TableCell>
                  <TableCell>
                    <CondicionSelect cliente={c} />
                  </TableCell>
                  <TableCell>
                    <CancelacionSwitch cliente={c} />
                  </TableCell>
                  <TableCell className={cn(c.cancelacionesPrevias >= 3 && "font-semibold text-red-700")}>{c.cancelacionesPrevias}</TableCell>
                  <TableCell>{activas}</TableCell>
                  <TableCell className="pr-5">
                    <ArrowRight className="ml-auto size-4 text-muted-foreground" />
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
// A02 · Nuevo cliente
// ---------------------------------------------------------------------------

export function A02NuevoCliente() {
  const crear = useDemo((s) => s.crearCliente)
  const [f, setF] = useState({
    razonSocial: "Granos del Este S.A.",
    rut: "21 663 091 0015",
    telefono: "+598 4452 2210",
    condicionPago: "pago_previo" as CondicionPago,
    costoCancelacion: false,
    nombre: "Federico Olivera",
    email: "folivera@granosdeleste.com.uy",
  })
  const set = (patch: Partial<typeof f>) => setF((x) => ({ ...x, ...patch }))
  const opcion = (value: CondicionPago, title: string, desc: string) => (
    <button
      onClick={() => set({ condicionPago: value })}
      className={cn("rounded-xl border-2 p-4 text-left transition", f.condicionPago === value ? "border-planir bg-accent/40" : "border-border hover:border-stone-300")}
    >
      <div className="font-semibold text-planir">{title}</div>
      <div className="mt-0.5 text-sm text-muted-foreground">{desc}</div>
    </button>
  )
  return (
    <PlanirLayout role="admin" active="clientes">
      <PageHeader title="Nuevo cliente" subtitle="Alta de la empresa e invitación al portal para su primer usuario." onBack={() => go("A01")} backLabel="Clientes" />
      <div className="grid max-w-4xl grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div className="space-y-4">
          <SectionCard title="Empresa">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-1.5">
                <Label>Razón social</Label>
                <Input value={f.razonSocial} onChange={(e) => set({ razonSocial: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>RUT</Label>
                <Input value={f.rut} onChange={(e) => set({ rut: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono</Label>
                <Input value={f.telefono} onChange={(e) => set({ telefono: e.target.value })} />
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Condiciones comerciales">
            <div className="grid grid-cols-2 gap-3">
              {opcion("cuenta_corriente", "Cuenta corriente", "Retira sin pago previo; se factura al final.")}
              {opcion("pago_previo", "Pago previo", "Paga la proforma antes de retirar.")}
            </div>
            <label className="mt-4 flex items-center justify-between rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">Costo de cancelación</span>
                <span className="text-xs text-muted-foreground">USD 150 si cancela después de la aprobación</span>
              </span>
              <Switch checked={f.costoCancelacion} onCheckedChange={(v) => set({ costoCancelacion: v })} />
            </label>
          </SectionCard>
          <SectionCard title="Primer usuario">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Nombre</Label>
                <Input value={f.nombre} onChange={(e) => set({ nombre: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input value={f.email} onChange={(e) => set({ email: e.target.value })} />
              </div>
            </div>
          </SectionCard>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => go("A01")}>
              Cancelar
            </Button>
            <Button
              disabled={!f.razonSocial || !f.email}
              onClick={() => {
                crear(
                  { razonSocial: f.razonSocial, rut: f.rut, telefono: f.telefono, condicionPago: f.condicionPago, costoCancelacion: f.costoCancelacion },
                  { nombre: f.nombre, email: f.email },
                )
                toast.success("Cliente creado", { description: `Invitación enviada a ${f.email}.` })
                go("A01")
              }}
            >
              <Mail /> Crear y enviar invitación
            </Button>
          </div>
        </div>
        <SectionCard title="Lo que recibe el cliente">
          <p className="text-sm text-muted-foreground">Un mail con el link para activar su cuenta y crear su contraseña.</p>
          <Button variant="link" className="mt-2 h-auto p-0 text-planir" onClick={() => go("C01")}>
            Ver pantalla de activación <ArrowRight />
          </Button>
        </SectionCard>
      </div>
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// A03 · Detalle de cliente
// ---------------------------------------------------------------------------

export function A03DetalleCliente({ id }: { id: string }) {
  const c = useCliente(id)
  const data = useData()
  const invitar = useDemo((s) => s.invitarUsuario)
  const [open, setOpen] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: "Pablo Acosta", email: "pacosta@importadorarambla.com.uy", cargo: "Despachante" })
  const ingresos = data.ingresos.filter((i) => i.clienteId === id)
  const salidas = data.salidas.filter((s) => s.clienteId === id)
  const enPlaya = ingresos.flatMap((i) => i.contenedores.filter((x) => x.ingresoReal && !x.salidaReal)).length
  const cerrados = ingresos.flatMap((i) => i.contenedores.filter((x) => x.ingresoReal && x.salidaReal))
  const promedio = cerrados.length ? Math.round(cerrados.reduce((a, x) => a + daysBetween(x.ingresoReal!, x.salidaReal!), 0) / cerrados.length) : 0

  return (
    <PlanirLayout role="admin" active="clientes">
      <PageHeader title={c.razonSocial} subtitle={`RUT ${c.rut} · ${c.telefono} · cliente desde ${fecha(c.clienteDesde)}`} onBack={() => go("A01")} backLabel="Clientes" />
      <div className="mb-6 grid grid-cols-4 gap-3">
        <KpiCard label="Solicitudes" value={ingresos.length + salidas.length} tone="info" />
        <KpiCard label="Contenedores en playa" value={enPlaya} tone="brand" />
        <KpiCard label="Estadía promedio" value={`${promedio} días`} tone="neutral" />
        <KpiCard label="Cancelaciones previas" value={c.cancelacionesPrevias} tone={c.cancelacionesPrevias >= 3 ? "error" : "neutral"} />
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-4">
          <SectionCard
            title="Usuarios"
            action={
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                <UserPlus /> Invitar usuario
              </Button>
            }
            className="overflow-hidden"
          >
            <Table>
              <TableBody>
                {c.usuarios.map((u) => (
                  <TableRow key={u.email}>
                    <TableCell>
                      <div className="font-medium">{u.nombre}</div>
                      <div className="text-xs text-muted-foreground">{u.cargo}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{u.email}</TableCell>
                    <TableCell>{u.estado === "activo" ? <ToneBadge tone="ok">Activo</ToneBadge> : <ToneBadge tone="warn">Invitación enviada</ToneBadge>}</TableCell>
                    <TableCell className="text-right">
                      {u.estado === "invitado" && (
                        <Button size="sm" variant="ghost" onClick={() => toast("Invitación reenviada", { description: u.email })}>
                          Reenviar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
          <SectionCard title="Solicitudes" className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Solicitud</TableHead>
                  <TableHead>Barco</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Actualizada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ingresos.map((i) => (
                  <TableRow key={i.id} className="cursor-pointer" onClick={() => openIngreso("planir", i.id)}>
                    <TableCell className="font-medium text-planir">{i.id}</TableCell>
                    <TableCell>
                      {i.barco} · {i.viaje}
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={i.estado} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fecha(i.actualizado)}</TableCell>
                  </TableRow>
                ))}
                {salidas.map((s) => (
                  <TableRow key={s.id} className="cursor-pointer" onClick={() => openSalida("planir", s.id)}>
                    <TableCell className="font-medium text-brand">{s.id}</TableCell>
                    <TableCell className="text-muted-foreground">Salida de {s.ingresoId}</TableCell>
                    <TableCell>
                      <EstadoSalidaBadge estado={s.estado} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">{fecha(s.pagoConfirmado ?? s.solicitada)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>
        </div>
        <SectionCard title="Condiciones comerciales">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Condición de pago</Label>
              <CondicionSelect cliente={c} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Costo de cancelación</Label>
              <CancelacionSwitch cliente={c} />
            </div>
            {c.cancelacionesPrevias >= 3 && (
              <Callout tone="warn" title={`Canceló ${c.cancelacionesPrevias} veces este año`}>
                Se recomienda mantener activo el costo de cancelación.
              </Callout>
            )}
          </div>
        </SectionCard>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar usuario a {c.razonSocial}</DialogTitle>
            <DialogDescription>Le llega un mail para activar su cuenta. Ve todas las solicitudes de la empresa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {(["nombre", "email", "cargo"] as const).map((k) => (
              <div key={k} className="space-y-1.5">
                <Label className="capitalize">{k}</Label>
                <Input value={nuevo[k]} onChange={(e) => setNuevo({ ...nuevo, [k]: e.target.value })} />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                invitar(c.id, nuevo)
                setOpen(false)
                toast.success("Invitación enviada", { description: nuevo.email })
              }}
            >
              Enviar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// A04 · Pagos a confirmar
// ---------------------------------------------------------------------------

export function A04Pagos() {
  const data = useData()
  const confirmar = useDemo((s) => s.confirmarPago)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [referencia, setReferencia] = useState("TRF-88412093")
  const pendientes = data.salidas.filter((s) => s.estado === "pendiente_pago")
  const confirmados = data.salidas.filter((s) => s.pagoConfirmado).sort((a, b) => b.pagoConfirmado!.localeCompare(a.pagoConfirmado!))
  const clienteDe = (id: string) => data.clientes.find((c) => c.id === id)!
  const actual = pendientes.find((s) => s.id === confirmando)
  return (
    <PlanirLayout role="admin" active="pagos">
      <PageHeader title="Pagos a confirmar" subtitle="Retiros de clientes con pago previo. Cuando llega la transferencia, se marca como recibida y el retiro se habilita." />
      <Callout tone="info" title="Sin integración con medios de pago">
        El cliente transfiere por fuera del portal. Aquí solo se registra que el pago llegó; si adjuntó el comprobante, aparece al lado.
      </Callout>
      <div className="mt-5 space-y-3">
        {pendientes.map((s) => {
          const c = clienteDe(s.clienteId)
          return (
            <SectionCard key={s.id}>
              <div className="flex items-center gap-6">
                <div className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                  <Banknote className="size-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <button className="font-semibold text-planir hover:underline" onClick={() => openSalida("planir", s.id)}>
                      {s.id}
                    </button>
                    <span className="text-muted-foreground">· {c.razonSocial}</span>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {s.contenedores.length} contenedores · retiro el {fecha(s.fechaRetiro)} · solicitado el {fecha(s.solicitada)}
                  </div>
                  <div className="mt-2 text-xs">
                    {s.comprobante ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700">
                        <FileText className="size-3.5" /> {s.comprobante}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Sin comprobante adjunto</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Importe</div>
                  <div className="font-heading text-xl font-bold text-planir">{usd(total(s.proforma))}</div>
                </div>
                <Button onClick={() => setConfirmando(s.id)}>
                  <CheckCircle2 /> Marcar pago recibido
                </Button>
              </div>
            </SectionCard>
          )
        })}
        {pendientes.length === 0 && (
          <SectionCard>
            <p className="py-6 text-center text-sm text-muted-foreground">No hay pagos pendientes de confirmar.</p>
          </SectionCard>
        )}
      </div>
      <SectionCard title="Confirmados recientemente" className="mt-6 overflow-hidden">
        <Table>
          <TableBody>
            {confirmados.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">{s.id}</TableCell>
                <TableCell>{clienteDe(s.clienteId).razonSocial}</TableCell>
                <TableCell>{usd(total(s.proforma))}</TableCell>
                <TableCell className="text-muted-foreground">Confirmado el {fecha(s.pagoConfirmado)}</TableCell>
                <TableCell>
                  <EstadoSalidaBadge estado={s.estado} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </SectionCard>

      <Dialog open={!!actual} onOpenChange={(o) => !o && setConfirmando(null)}>
        {actual && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirmar pago de {actual.id}</DialogTitle>
              <DialogDescription>{clienteDe(actual.clienteId).razonSocial}. El retiro queda habilitado y el cliente recibe el aviso.</DialogDescription>
            </DialogHeader>
            <ProformaTable items={actual.proforma} totalLabel="Total recibido" />
            <div className="space-y-1.5">
              <Label>Referencia de la transferencia</Label>
              <Input value={referencia} onChange={(e) => setReferencia(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmando(null)}>
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  confirmar(actual.id)
                  setConfirmando(null)
                  toast.success(`Pago confirmado · ${actual.id}`, { description: "El retiro quedó habilitado." })
                }}
              >
                Confirmar pago
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// A05 · Proformas y suplementos
// ---------------------------------------------------------------------------

export function A05Proformas() {
  const data = useData()
  const [sel, setSel] = useState<string | null>(null)
  const filas = data.ingresos
    .filter((i) => ["aprobada", "ingresada", "cerrada"].includes(i.estado))
    .map((i) => {
      const supl = i.contenedores[0].salidasEstimadas.reduce((a, h) => a + (h.suplemento ?? 0), 0)
      const salida = data.salidas.find((s) => s.ingresoId === i.id)
      return { i, cliente: data.clientes.find((c) => c.id === i.clienteId)!, base: total(i.proforma), supl, salida }
    })
  const detalle = filas.find((f) => f.i.id === sel)
  return (
    <PlanirLayout role="admin" active="proformas">
      <PageHeader title="Proformas y suplementos" subtitle="La proforma se genera al aprobar el movimiento. Si el cliente corre la salida, se suman suplementos. La factura se emite al cerrar." />
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Solicitud</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Proforma original</TableHead>
              <TableHead className="text-right">Suplementos</TableHead>
              <TableHead className="text-right">Total estimado</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Facturación</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((f) => (
              <TableRow key={f.i.id} className="cursor-pointer" onClick={() => setSel(f.i.id)}>
                <TableCell className="pl-5 font-semibold text-planir">{f.i.id}</TableCell>
                <TableCell className="max-w-44 truncate">{f.cliente.razonSocial}</TableCell>
                <TableCell className="text-right tabular-nums">{usd(f.base)}</TableCell>
                <TableCell className={cn("text-right tabular-nums", f.supl > 0 && "font-medium text-brand")}>{f.supl > 0 ? `+${usd(f.supl)}` : "—"}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{usd(f.salida ? total(f.salida.proforma) : f.base + f.supl)}</TableCell>
                <TableCell>
                  <EstadoBadge estado={f.i.estado} />
                </TableCell>
                <TableCell>{f.i.estado === "cerrada" ? <ToneBadge tone="ok">Lista para facturar</ToneBadge> : <span className="text-xs text-muted-foreground">Al cerrar</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={!!detalle} onOpenChange={(o) => !o && setSel(null)}>
        {detalle && (
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {detalle.i.id} · {detalle.cliente.razonSocial}
              </DialogTitle>
              <DialogDescription>{detalle.i.contenedores.length} contenedores · {detalle.i.barco} {detalle.i.viaje}</DialogDescription>
            </DialogHeader>
            <div>
              <div className="mb-1 text-xs font-medium text-muted-foreground">Proforma al aprobar</div>
              <ProformaTable items={detalle.i.proforma} totalLabel="Subtotal" />
            </div>
            {detalle.i.contenedores[0].salidasEstimadas.length > 1 && (
              <div>
                <div className="mb-1 text-xs font-medium text-muted-foreground">Cambios de fecha de salida</div>
                <ul className="space-y-1 text-sm">
                  {detalle.i.contenedores[0].salidasEstimadas.slice(1).map((h, k) => (
                    <li key={k} className="flex justify-between">
                      <span>
                        {fechaCorta(h.fecha)} · {h.motivo}
                      </span>
                      <span className="font-medium text-brand">+{usd(h.suplemento ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detalle.salida && (
              <div className="rounded-lg bg-muted/60 p-3">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Proforma del retiro {detalle.salida.id}</div>
                <ProformaTable items={detalle.salida.proforma} />
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </PlanirLayout>
  )
}

// ---------------------------------------------------------------------------
// A06 · Estadías
// ---------------------------------------------------------------------------

export function A06Estadias() {
  const data = useData()
  const today = useHoy()
  const [cliente, setCliente] = useState("todos")
  const filas = data.ingresos
    .flatMap((i) => i.contenedores.filter((c) => c.ingresoReal).map((c) => ({ c, i, cli: data.clientes.find((x) => x.id === i.clienteId)! })))
    .filter((f) => cliente === "todos" || f.i.clienteId === cliente)
    .sort((a, b) => (b.c.salidaReal ?? "9").localeCompare(a.c.salidaReal ?? "9"))
  const cerradas = filas.filter((f) => f.c.salidaReal)
  const diasTotales = cerradas.reduce((a, f) => a + daysBetween(f.c.ingresoReal!, f.c.salidaReal!), 0)
  return (
    <PlanirLayout role="admin" active="estadias">
      <PageHeader
        title="Estadías"
        subtitle="Días reales por contenedor, del ingreso a la salida registrados en la playa. Para cruzar con ImporSys y facturar sin diferencias."
        actions={
          <Button variant="outline" onClick={() => toast.success("Se descargó estadias-2026-10.xlsx")}>
            <Download /> Exportar
          </Button>
        }
      />
      <div className="mb-5 grid grid-cols-4 gap-3">
        <KpiCard label="Contenedores retirados" value={cerradas.length} tone="neutral" />
        <KpiCard label="Días-contenedor facturables" value={diasTotales} tone="brand" />
        <KpiCard label="Estadía promedio" value={`${cerradas.length ? Math.round(diasTotales / cerradas.length) : 0} días`} tone="info" />
        <KpiCard label="Estadías en curso" value={filas.length - cerradas.length} tone="warn" />
      </div>
      <div className="mb-3 flex justify-end">
        <Select value={cliente} onValueChange={setCliente}>
          <SelectTrigger className="w-60 bg-white">
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
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Contenedor</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Ingreso real</TableHead>
              <TableHead>Salida real</TableHead>
              <TableHead className="pr-5 text-right">Días</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map(({ c, i, cli }) => (
              <TableRow key={c.numero}>
                <TableCell className="pl-5 font-medium">{c.numero}</TableCell>
                <TableCell className="max-w-44 truncate">{cli.razonSocial}</TableCell>
                <TableCell>
                  <button className="text-planir hover:underline" onClick={() => openIngreso("planir", i.id)}>
                    {i.id}
                  </button>
                </TableCell>
                <TableCell>{fechaHora(c.ingresoReal)}</TableCell>
                <TableCell>{c.salidaReal ? fechaHora(c.salidaReal) : <ToneBadge tone="warn">En playa</ToneBadge>}</TableCell>
                <TableCell className="pr-5 text-right font-semibold tabular-nums">
                  {daysBetween(c.ingresoReal!, c.salidaReal ?? today)}
                  {!c.salidaReal && <span className="font-normal text-muted-foreground"> a hoy</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </PlanirLayout>
  )
}
