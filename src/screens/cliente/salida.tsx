import { useState } from "react"
import { toast } from "sonner"
import { Banknote, Check, CheckCircle2, Clock, Download, FileText, Truck, Upload } from "lucide-react"
import { Callout, DocList, EstadoSalidaBadge, Field, HelpLine, PageHeader, ProformaTable, SectionCard } from "@/components/app/common"
import { ClientLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { TARIFA_ESTADIA_DIA, TARIFA_IMO, TARIFA_TRASLADO, daysBetween } from "@/data/seed"
import type { Salida } from "@/data/types"
import { fecha, fechaHora, total, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go, openIngreso, openSalida } from "@/screens/nav"
import { useCliente, useDemo, useHoy, useIngreso, useSalida } from "@/store/demo"

export function C26SolicitarRetiro({ id }: { id: string }) {
  const ingreso = useIngreso(id)!
  const cliente = useCliente(ingreso.clienteId)
  const today = useHoy()
  const solicitar = useDemo((s) => s.solicitarRetiro)
  const disponibles = ingreso.contenedores.filter((c) => c.ingresoReal && !c.salidaId)
  const [elegidos, setElegidos] = useState(disponibles.map((c) => c.numero))
  const [fechaRetiro, setFechaRetiro] = useState(disponibles[0]?.salidasEstimadas.at(-1)!.fecha ?? today)

  if (disponibles.length === 0)
    return (
      <ClientLayout active="contenedores">
        <PageHeader title={`Solicitar retiro · ${id}`} onBack={() => openIngreso("cliente", id)} backLabel={id} />
        <Callout tone="info" title="Ya pediste el retiro de todos los contenedores de esta solicitud">
          <Button variant="link" className="h-auto p-0" onClick={() => openSalida("cliente", ingreso.contenedores[0].salidaId!)}>
            Ver el retiro
          </Button>
        </Callout>
      </ClientLayout>
    )

  const n = elegidos.length
  const ingresoReal = disponibles[0].ingresoReal!
  const dias = daysBetween(ingresoReal, fechaRetiro)
  const preview = [
    { concepto: `Traslado terminal → playa (${n} × USD ${TARIFA_TRASLADO})`, monto: n * TARIFA_TRASLADO },
    { concepto: `Estadía (${dias} días × ${n} cont. × USD ${TARIFA_ESTADIA_DIA})`, monto: dias * n * TARIFA_ESTADIA_DIA },
    ...(ingreso.imo ? [{ concepto: `Manipuleo carga IMO (${n} × USD ${TARIFA_IMO})`, monto: n * TARIFA_IMO }] : []),
  ]
  const toggle = (num: string) => setElegidos((e) => (e.includes(num) ? e.filter((x) => x !== num) : [...e, num]))

  return (
    <ClientLayout active="contenedores">
      <PageHeader
        onBack={() => go("C23")}
        backLabel="Contenedores en playa"
        title="Solicitar retiro"
        subtitle={`Desde ${ingreso.id} · ${ingreso.barco} ${ingreso.viaje}. Reutilizamos los datos del ingreso: solo elegí qué contenedores y cuándo.`}
      />
      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-4">
          <SectionCard title="¿Qué contenedores retirás?">
            <ul className="space-y-2">
              {disponibles.map((c) => (
                <li key={c.numero}>
                  <label
                    className={cn(
                      "flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition",
                      elegidos.includes(c.numero) ? "border-planir/40 bg-accent/40" : "hover:bg-muted/50",
                    )}
                  >
                    <Checkbox checked={elegidos.includes(c.numero)} onCheckedChange={() => toggle(c.numero)} />
                    <div className="flex-1">
                      <div className="font-semibold">{c.numero}</div>
                      <div className="text-xs text-muted-foreground">
                        {c.tipo} · precinto {c.precinto}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div>Ingresó el {fecha(c.ingresoReal)}</div>
                      <div className="text-xs text-muted-foreground">{daysBetween(c.ingresoReal!, today)} días en playa</div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">Podés retirar algunos ahora y el resto más adelante.</p>
          </SectionCard>
          <SectionCard title="¿Cuándo?">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fecha de retiro</Label>
                <Input type="date" value={fechaRetiro} min={today} onChange={(e) => setFechaRetiro(e.target.value)} />
              </div>
              <Field label="Fecha estimada vigente" value={fecha(disponibles[0].salidasEstimadas.at(-1)!.fecha)} />
            </div>
          </SectionCard>
        </div>
        <div className="space-y-4">
          <SectionCard title="Proforma del retiro">
            <ProformaTable items={preview} totalLabel="Total a la fecha de retiro" />
          </SectionCard>
          {cliente.condicionPago === "pago_previo" ? (
            <Callout tone="warn" icon={<Banknote className="size-5" />} title="Pago previo al retiro">
              Antes de retirar tenés que transferir el total de la proforma. Cuando Planir confirma el pago, el retiro queda habilitado.
            </Callout>
          ) : (
            <Callout tone="ok" icon={<CheckCircle2 className="size-5" />} title="Cuenta corriente">
              No tenés que pagar antes: el retiro se habilita directamente.
            </Callout>
          )}
          <Button
            className="w-full"
            size="lg"
            variant="brand"
            disabled={n === 0}
            onClick={() => {
              const salId = solicitar(ingreso.id, elegidos, fechaRetiro)
              toast.success(`Solicitaste el retiro ${salId}`)
              openSalida("cliente", salId)
            }}
          >
            Solicitar retiro de {n} {n === 1 ? "contenedor" : "contenedores"}
          </Button>
        </div>
      </div>
    </ClientLayout>
  )
}

function SalidaTracker({ salida, pagoPrevio }: { salida: Salida; pagoPrevio: boolean }) {
  const pasos = [
    { label: "Solicitada", done: true },
    ...(pagoPrevio ? [{ label: "Pago confirmado", done: salida.estado !== "pendiente_pago" }] : []),
    { label: "Retiro habilitado", done: salida.estado !== "pendiente_pago" },
    { label: "Retirada", done: salida.estado === "retirada" },
  ]
  return (
    <div className="flex items-center gap-2 rounded-xl border bg-white px-5 py-4">
      {pasos.map((p, i) => (
        <div key={p.label} className="flex flex-1 items-center gap-2 last:flex-none">
          <span className={cn("flex size-6 items-center justify-center rounded-full text-xs", p.done ? "bg-planir text-white" : "bg-muted text-muted-foreground")}>
            {p.done ? <Check className="size-3.5" /> : i + 1}
          </span>
          <span className={cn("text-sm whitespace-nowrap", p.done ? "font-medium text-planir" : "text-muted-foreground")}>{p.label}</span>
          {i < pasos.length - 1 && <span className={cn("h-0.5 flex-1 rounded", pasos[i + 1].done ? "bg-planir" : "bg-border")} />}
        </div>
      ))}
    </div>
  )
}

export function ClienteSalidaDetalle({ id }: { id: string }) {
  const salida = useSalida(id)
  const ingreso = useIngreso(salida?.ingresoId ?? "")
  const cliente = useCliente(salida?.clienteId ?? "c-rambla")
  const adjuntar = useDemo((s) => s.adjuntarComprobante)
  if (!salida || !ingreso) return <ClientLayout active="solicitudes">No encontramos el retiro {id}.</ClientLayout>
  const ctrs = ingreso.contenedores.filter((c) => salida.contenedores.includes(c.numero))
  const pagoPrevio = cliente.condicionPago === "pago_previo" || !!salida.pagoConfirmado

  return (
    <ClientLayout active="solicitudes">
      <PageHeader
        onBack={() => go("C06")}
        backLabel="Solicitudes"
        title={`${salida.id} · Salida`}
        badge={<EstadoSalidaBadge estado={salida.estado} />}
        subtitle={
          <>
            Desde{" "}
            <button className="font-medium text-planir hover:underline" onClick={() => openIngreso("cliente", ingreso.id)}>
              {ingreso.id}
            </button>{" "}
            · {ctrs.length} {ctrs.length === 1 ? "contenedor" : "contenedores"} · retiro el {fecha(salida.fechaRetiro)}
          </>
        }
      />
      <div className="space-y-4">
        <SalidaTracker salida={salida} pagoPrevio={pagoPrevio} />
        {salida.estado === "pendiente_pago" && (
          <Callout tone="warn" icon={<Clock className="size-5" />} title="Pendiente de pago">
            El retiro se habilita cuando Planir confirme la transferencia. Funciona como un peaje: pagás antes de salir y la factura llega al terminar.
          </Callout>
        )}
        {salida.estado === "habilitada" && (
          <Callout tone="ok" icon={<CheckCircle2 className="size-5" />} title={`Retiro habilitado para el ${fecha(salida.fechaRetiro)}`}>
            {salida.pagoConfirmado ? `Confirmamos tu pago el ${fecha(salida.pagoConfirmado)}. ` : ""}Coordiná el camión: el transportista tiene que presentar el número de retiro{" "}
            <b>{salida.id}</b> en portería.
          </Callout>
        )}
        {salida.estado === "retirada" && (
          <Callout tone="neutral" icon={<CheckCircle2 className="size-5" />} title="Tus contenedores salieron de la playa">
            Te dejamos la constancia de salida y el detalle de los días de estadía. La factura final llega a tu email.
          </Callout>
        )}
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_340px] gap-6">
        <div className="space-y-4">
          <SectionCard title="Contenedores" className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Contenedor</TableHead>
                  <TableHead>Ingreso real</TableHead>
                  <TableHead>{salida.estado === "retirada" ? "Salida real" : "Retiro previsto"}</TableHead>
                  <TableHead className="text-right">Días de estadía</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ctrs.map((c) => (
                  <TableRow key={c.numero}>
                    <TableCell>
                      <div className="font-medium">{c.numero}</div>
                      <div className="text-xs text-muted-foreground">{c.tipo}</div>
                    </TableCell>
                    <TableCell>{fechaHora(c.ingresoReal)}</TableCell>
                    <TableCell>{c.salidaReal ? fechaHora(c.salidaReal) : fecha(salida.fechaRetiro)}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">{daysBetween(c.ingresoReal!, c.salidaReal ?? salida.fechaRetiro)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </SectionCard>

          {salida.estado === "pendiente_pago" && (
            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  <Banknote className="size-4" /> Datos para la transferencia
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                <Field label="Banco" value="Itaú Uruguay" />
                <Field label="Cuenta en USD" value="1 234 567 / 001" />
                <Field label="Titular" value="Planir S.A. · RUT 21 100 200 0018" />
                <Field label="Importe" value={<span className="text-brand">{usd(total(salida.proforma))}</span>} />
                <Field label="Referencia" value={salida.id} />
              </div>
              <div className={cn("mt-5 flex items-center gap-4 rounded-xl border p-4", salida.comprobante ? "border-emerald-200 bg-emerald-50/50" : "border-dashed")}>
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">{salida.comprobante ? <FileText className="size-5 text-emerald-700" /> : <Upload className="size-5 text-muted-foreground" />}</div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">Comprobante de transferencia {!salida.comprobante && <span className="font-normal text-muted-foreground">(opcional)</span>}</div>
                  <div className="text-xs text-muted-foreground">
                    {salida.comprobante ? `${salida.comprobante} · Planir lo va a confirmar` : "Adjuntarlo acelera la confirmación del pago."}
                  </div>
                </div>
                {!salida.comprobante && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      adjuntar(salida.id)
                      toast.success("Adjuntaste el comprobante", { description: "Le avisamos a Administración de Planir." })
                    }}
                  >
                    <Upload /> Adjuntar
                  </Button>
                )}
              </div>
            </SectionCard>
          )}

          {salida.estado === "habilitada" && (
            <SectionCard
              title={
                <span className="flex items-center gap-2">
                  <Truck className="size-4" /> Para el transportista
                </span>
              }
            >
              <div className="grid grid-cols-3 gap-4">
                <Field label="N° de retiro" value={salida.id} />
                <Field label="Fecha" value={fecha(salida.fechaRetiro)} />
                <Field label="Horario de playa" value="Lun a vie · 7:00 a 18:00" />
              </div>
            </SectionCard>
          )}

          {salida.documentos.length > 0 && (
            <SectionCard title="Documentos de salida" action={<Button size="sm" variant="outline"><Download /> Descargar</Button>}>
              <DocList docs={salida.documentos} />
            </SectionCard>
          )}
        </div>
        <div className="space-y-4">
          <SectionCard title="Proforma">
            <ProformaTable items={salida.proforma} totalLabel={salida.estado === "pendiente_pago" ? "Total a pagar" : "Total"} />
            <p className="mt-3 text-xs text-muted-foreground">La factura se emite al terminar el servicio con los días reales de estadía.</p>
          </SectionCard>
          <HelpLine className="px-1" />
        </div>
      </div>
    </ClientLayout>
  )
}
