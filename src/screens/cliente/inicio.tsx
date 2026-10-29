import { useState } from "react"
import { ArrowRight, CalendarClock, ClipboardList, Container, PackageOpen, Plus, TriangleAlert } from "lucide-react"
import { EstadoBadge, EstadoSalidaBadge, HelpLine, KpiCard, PageHeader, SectionCard } from "@/components/app/common"
import { ClientLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CLIENTE_DEMO, USUARIO_DEMO, daysBetween } from "@/data/seed"
import type { Ingreso, Salida } from "@/data/types"
import { fecha, fechaCorta } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go, openIngreso, openSalida } from "@/screens/nav"
import { useData, useHoy } from "@/store/demo"

const REQUIERE_ACCION = ["observada"]
const EN_CURSO = ["pendiente_aprobacion", "revision", "pendiente_externo", "aprobada"]

function useMisDatos() {
  const data = useData()
  const ingresos = data.ingresos.filter((i) => i.clienteId === CLIENTE_DEMO)
  const salidas = data.salidas.filter((s) => s.clienteId === CLIENTE_DEMO)
  const contenedores = ingresos.flatMap((i) => i.contenedores.filter((c) => c.ingresoReal && !c.salidaReal).map((c) => ({ ...c, ingreso: i })))
  return { ingresos, salidas, contenedores }
}

export function C05Inicio({ notificationsOpen }: { notificationsOpen?: boolean }) {
  const { ingresos, salidas, contenedores } = useMisDatos()
  const today = useHoy()
  const accion = ingresos.filter((i) => REQUIERE_ACCION.includes(i.estado))
  const pagos = salidas.filter((s) => s.estado === "pendiente_pago")
  const enCurso = ingresos.filter((i) => EN_CURSO.includes(i.estado))
  const proximas = contenedores
    .map((c) => ({ ...c, salida: c.salidasEstimadas.at(-1)!.fecha }))
    .sort((a, b) => a.salida.localeCompare(b.salida))
  return (
    <ClientLayout active="inicio" notificationsOpen={notificationsOpen}>
      <PageHeader title={`Hola, ${USUARIO_DEMO.split(" ")[0]}`} subtitle={`Esto es lo que está pasando con tus contenedores hoy, ${fecha(today)}.`} />

      <div className="grid grid-cols-4 gap-4">
        <KpiCard label="Requieren tu acción" value={accion.length + pagos.length} tone="error" hint="Datos a corregir o pagos" onClick={() => go("C06")} />
        <KpiCard label="Solicitudes en curso" value={enCurso.length} tone="info" hint="En revisión o aprobadas" onClick={() => go("C06")} />
        <KpiCard label="Contenedores en playa" value={contenedores.length} tone="brand" hint="Estadía corriendo" onClick={() => go("C23")} />
        <KpiCard label="Salidas este mes" value={salidas.length} tone="ok" hint="Retiros solicitados" onClick={() => go("C06")} />
      </div>

      <div className="mt-6 grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6">
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <TriangleAlert className="size-4 text-brand" /> Requieren tu acción
            </span>
          }
        >
          {accion.length + pagos.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No tenés nada pendiente. ¡Todo en orden!</p>
          ) : (
            <ul className="divide-y">
              {accion.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {i.id} · Ingreso <EstadoBadge estado={i.estado} />
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">
                      {i.validacion.filter((c) => c.resultado === "error").length} datos no coinciden con los documentos · {i.barco} {i.viaje}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openIngreso("cliente", i.id)}>
                    Revisar <ArrowRight />
                  </Button>
                </li>
              ))}
              {pagos.map((s) => (
                <li key={s.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      {s.id} · Salida <EstadoSalidaBadge estado={s.estado} />
                    </div>
                    <div className="mt-0.5 text-sm text-muted-foreground">Retiro previsto para el {fecha(s.fechaRetiro)}</div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openSalida("cliente", s.id)}>
                    Ver pago <ArrowRight />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <CalendarClock className="size-4 text-brand" /> Próximas salidas estimadas
            </span>
          }
          action={
            <button className="text-xs text-planir hover:underline" onClick={() => go("C23")}>
              Ver todos
            </button>
          }
        >
          <ul className="space-y-3">
            {proximas.slice(0, 4).map((c) => (
              <li key={c.numero} className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#fdeee8] text-brand">
                  <Container className="size-4" />
                </div>
                <div className="flex-1 text-sm">
                  <div className="font-medium">{c.numero}</div>
                  <div className="text-xs text-muted-foreground">
                    {c.ingreso.id} · {daysBetween(c.ingresoReal!, today)} días en playa
                  </div>
                </div>
                <div className="text-right text-sm font-medium">{fechaCorta(c.salida)}</div>
              </li>
            ))}
            {proximas.length === 0 && <li className="text-sm text-muted-foreground">No tenés contenedores en la playa.</li>}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <button onClick={() => go("C08")} className="group flex items-center gap-4 rounded-xl border bg-white p-5 text-left transition hover:border-brand/50">
          <div className="flex size-11 items-center justify-center rounded-xl bg-brand text-white">
            <Plus className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-heading font-semibold text-planir">Nueva solicitud de ingreso</div>
            <div className="text-sm text-muted-foreground">Traé contenedores de la terminal a la playa</div>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
        </button>
        <button onClick={() => go("C23")} className="group flex items-center gap-4 rounded-xl border bg-white p-5 text-left transition hover:border-brand/50">
          <div className="flex size-11 items-center justify-center rounded-xl bg-planir text-white">
            <PackageOpen className="size-5" />
          </div>
          <div className="flex-1">
            <div className="font-heading font-semibold text-planir">Solicitar un retiro</div>
            <div className="text-sm text-muted-foreground">Sacá contenedores que ya están en la playa</div>
          </div>
          <ArrowRight className="size-5 text-muted-foreground transition group-hover:translate-x-1" />
        </button>
      </div>
      <HelpLine className="mt-8 justify-center" />
    </ClientLayout>
  )
}

type Row = { id: string; tipo: "Ingreso" | "Salida"; barco: string; contenedores: number; estado: React.ReactNode; grupo: string; actualizado: string; open: () => void }

function rowsOf(ingresos: Ingreso[], salidas: Salida[]): Row[] {
  const fromIngresos = ingresos.map((i) => ({
    id: i.id,
    tipo: "Ingreso" as const,
    barco: `${i.barco} · ${i.viaje}`,
    contenedores: i.contenedores.length,
    estado: <EstadoBadge estado={i.estado} />,
    grupo: REQUIERE_ACCION.includes(i.estado) ? "accion" : EN_CURSO.includes(i.estado) ? "curso" : i.estado === "ingresada" ? "playa" : "cerradas",
    actualizado: i.actualizado,
    open: () => openIngreso("cliente", i.id),
  }))
  const fromSalidas = salidas.map((s) => {
    const i = ingresos.find((x) => x.id === s.ingresoId)
    return {
      id: s.id,
      tipo: "Salida" as const,
      barco: i ? `${i.barco} · ${i.viaje}` : "—",
      contenedores: s.contenedores.length,
      estado: <EstadoSalidaBadge estado={s.estado} />,
      grupo: s.estado === "pendiente_pago" ? "accion" : s.estado === "habilitada" ? "curso" : "cerradas",
      actualizado: s.pagoConfirmado ?? s.solicitada,
      open: () => openSalida("cliente", s.id),
    }
  })
  return [...fromIngresos, ...fromSalidas].sort((a, b) => b.id.localeCompare(a.id) || b.actualizado.localeCompare(a.actualizado))
}

export function C06MisSolicitudes() {
  const { ingresos, salidas } = useMisDatos()
  const [tab, setTab] = useState("todas")
  const [tipo, setTipo] = useState<"todas" | "Ingreso" | "Salida">("todas")
  const rows = rowsOf(ingresos, salidas)
  const visibles = rows.filter((r) => (tab === "todas" || r.grupo === tab) && (tipo === "todas" || r.tipo === tipo))
  const count = (g: string) => rows.filter((r) => r.grupo === g).length
  return (
    <ClientLayout active="solicitudes">
      <PageHeader
        title="Solicitudes"
        subtitle="Todos los ingresos y salidas de tu empresa, con su estado."
        actions={
          <Button variant="brand" onClick={() => go("C08")}>
            <Plus /> Nueva solicitud
          </Button>
        }
      />
      <div className="mb-4 flex items-center justify-between">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="todas">Todas ({rows.length})</TabsTrigger>
            <TabsTrigger value="accion">Requieren acción ({count("accion")})</TabsTrigger>
            <TabsTrigger value="curso">En curso ({count("curso")})</TabsTrigger>
            <TabsTrigger value="playa">En playa ({count("playa")})</TabsTrigger>
            <TabsTrigger value="cerradas">Cerradas ({count("cerradas")})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-1 rounded-lg border bg-white p-0.5 text-sm">
          {(["todas", "Ingreso", "Salida"] as const).map((t) => (
            <button key={t} onClick={() => setTipo(t)} className={cn("rounded-md px-3 py-1", tipo === t ? "bg-planir text-white" : "text-muted-foreground hover:text-foreground")}>
              {t === "todas" ? "Ingresos y salidas" : `${t}s`}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Solicitud</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Barco · viaje</TableHead>
              <TableHead>Contenedores</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Actualizada</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.map((r) => (
              <TableRow key={r.id} className="cursor-pointer" onClick={r.open}>
                <TableCell className="pl-5 font-semibold text-planir">{r.id}</TableCell>
                <TableCell>
                  <span className={cn("inline-flex items-center gap-1.5 text-sm", r.tipo === "Ingreso" ? "text-planir" : "text-brand")}>
                    {r.tipo === "Ingreso" ? <ClipboardList className="size-3.5" /> : <PackageOpen className="size-3.5" />}
                    {r.tipo}
                  </span>
                </TableCell>
                <TableCell>{r.barco}</TableCell>
                <TableCell>{r.contenedores}</TableCell>
                <TableCell>{r.estado}</TableCell>
                <TableCell className="text-muted-foreground">{fecha(r.actualizado)}</TableCell>
                <TableCell className="pr-5 text-right">
                  <ArrowRight className="ml-auto size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No hay solicitudes en este filtro.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </ClientLayout>
  )
}

export function C23Contenedores() {
  const { contenedores } = useMisDatos()
  const today = useHoy()
  return (
    <ClientLayout active="contenedores">
      <PageHeader title="Contenedores en playa" subtitle="Lo que tenés guardado en la playa de Planir y cuándo pensás retirarlo." />
      <div className="overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              <TableHead className="pl-5">Contenedor</TableHead>
              <TableHead>Solicitud</TableHead>
              <TableHead>Ingresó</TableHead>
              <TableHead>Días en playa</TableHead>
              <TableHead>Salida estimada</TableHead>
              <TableHead>Retiro</TableHead>
              <TableHead className="pr-5 text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contenedores.map((c) => {
              const sal = c.salidasEstimadas.at(-1)!
              return (
                <TableRow key={c.numero}>
                  <TableCell className="pl-5">
                    <div className="font-semibold">{c.numero}</div>
                    <div className="text-xs text-muted-foreground">
                      {c.tipo} · precinto {c.precinto}
                    </div>
                  </TableCell>
                  <TableCell>
                    <button className="font-medium text-planir hover:underline" onClick={() => openIngreso("cliente", c.ingreso.id)}>
                      {c.ingreso.id}
                    </button>
                  </TableCell>
                  <TableCell>{fecha(c.ingresoReal)}</TableCell>
                  <TableCell>
                    <span className="font-semibold tabular-nums">{daysBetween(c.ingresoReal!, today)}</span>
                  </TableCell>
                  <TableCell>
                    {fecha(sal.fecha)}
                    {c.salidasEstimadas.length > 1 && <div className="text-xs text-muted-foreground">cambiada {c.salidasEstimadas.length - 1} vez</div>}
                  </TableCell>
                  <TableCell>
                    {c.salidaId ? (
                      <button className="text-sm font-medium text-brand hover:underline" onClick={() => openSalida("cliente", c.salidaId!)}>
                        {c.salidaId}
                      </button>
                    ) : (
                      <span className="text-sm text-muted-foreground">Sin solicitar</span>
                    )}
                  </TableCell>
                  <TableCell className="pr-5 text-right">
                    {!c.salidaId && (
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => go("C24", c.ingreso.id)}>
                          Cambiar fecha
                        </Button>
                        <Button size="sm" onClick={() => go("C26", c.ingreso.id)}>
                          Solicitar retiro
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
            {contenedores.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  No tenés contenedores en la playa.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Los días de estadía se cuentan desde el ingreso real a la playa. Si corrés la fecha de salida, se suma un suplemento a la proforma.
      </p>
    </ClientLayout>
  )
}
