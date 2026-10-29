import { useEffect, useState, type ReactNode } from "react"
import { ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardList, FileText, FlaskConical, Loader2, PackageOpen, Plus, ShieldAlert, Trash2, Upload } from "lucide-react"
import { Callout, Field, HelpLine, PageHeader, SectionCard, ToneBadge } from "@/components/app/common"
import { ClientLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { CLIENTE_DEMO, DEPOSITO_IMO, PESO_MAXIMO, SENALES_IMO, TERMINALES, TIPOS_CONTENEDOR, USUARIO_DEMO, checksOk, esTCP } from "@/data/seed"
import { fecha, kg, usd } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go } from "@/screens/nav"
import { STORY_ING, useCliente, useData, useDemo } from "@/store/demo"

// ---------------------------------------------------------------------------
// C08 · Tipo de solicitud
// ---------------------------------------------------------------------------

export function C08Tipo() {
  const data = useData()
  const enPlaya = data.ingresos.filter((i) => i.clienteId === CLIENTE_DEMO && i.estado === "ingresada").length
  return (
    <ClientLayout active={null}>
      <PageHeader title="Nueva solicitud" subtitle="¿Qué tipo de solicitud desea crear?" onBack={() => go("C05")} backLabel="Inicio" />
      <div className="grid max-w-3xl grid-cols-2 gap-5">
        <button onClick={() => go("C09")} className="group flex flex-col rounded-2xl border-2 border-transparent bg-white p-6 text-left shadow-sm ring-1 ring-border transition hover:border-brand">
          <div className="flex size-12 items-center justify-center rounded-xl bg-brand text-white">
            <ClipboardList className="size-6" />
          </div>
          <div className="mt-5 font-heading text-lg font-bold text-planir">Ingreso a la playa</div>
          <p className="mt-1 text-sm text-muted-foreground">Traslado de contenedores desde la terminal (TCP o Montecon) a la playa de Planir.</p>
          <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
            <li>· Datos del barco y del BL</li>
            <li>· Contenedores y precintos</li>
            <li>· BL y Delivery Order (Montecon) o confirmación de pago (TCP)</li>
            <li>· Cartilla de seguridad si es carga IMO</li>
          </ul>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand">
            Empezar <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </button>
        <button
          onClick={() => go("C23")}
          disabled={enPlaya === 0}
          className="group flex flex-col rounded-2xl border-2 border-transparent bg-white p-6 text-left shadow-sm ring-1 ring-border transition hover:border-planir disabled:opacity-60"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-planir text-white">
            <PackageOpen className="size-6" />
          </div>
          <div className="mt-5 font-heading text-lg font-bold text-planir">Salida de la playa</div>
          <p className="mt-1 text-sm text-muted-foreground">Retiro de contenedores que ya están en la playa. Se solicita desde el ingreso existente.</p>
          <div className="mt-4 text-xs text-muted-foreground">
            {enPlaya > 0 ? `Hay contenedores de ${enPlaya} ${enPlaya === 1 ? "ingreso" : "ingresos"} en la playa.` : "Todavía no hay contenedores en la playa."}
          </div>
          <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-planir">
            Elegir contenedores <ArrowRight className="size-4 transition group-hover:translate-x-1" />
          </span>
        </button>
      </div>
    </ClientLayout>
  )
}

// ---------------------------------------------------------------------------
// Asistente C09–C13
// ---------------------------------------------------------------------------

const STEPS = [
  { screen: "C09", label: "Operación" },
  { screen: "C10", label: "Contenedores" },
  { screen: "C11", label: "Carga IMO" },
  { screen: "C12", label: "Documentos" },
  { screen: "C13", label: "Revisar y enviar" },
]

function useRequiredDocs() {
  const draft = useDemo((s) => s.data.draft)
  return [
    { key: "BL", label: "Bill of Lading (BL)", hint: `BL ${draft.bl || "—"}, original o copia en PDF` },
    ...(esTCP(draft.terminal)
      ? [{ key: "PAGO", label: "Confirmación de pago a TCP", hint: "PDF, captura o texto del mail de pago" }]
      : draft.contenedores.map((c) => ({ key: `DO:${c.numero}`, label: "Delivery Order (Montecon)", hint: `Contenedor ${c.numero || "—"}` }))),
    ...(draft.imo ? [{ key: "IMO", label: "Cartilla de seguridad IMO", hint: "Dangerous Goods Declaration" }] : []),
  ]
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="mb-6 flex items-center gap-2">
      {STEPS.map((s, i) => (
        <li key={s.screen} className="flex flex-1 items-center gap-2">
          <button
            onClick={() => i < current && go(s.screen)}
            className={cn("flex items-center gap-2 text-sm whitespace-nowrap", i <= current ? "text-planir" : "text-muted-foreground", i < current && "hover:underline")}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full border-2 text-xs font-semibold",
                i < current && "border-planir bg-planir text-white",
                i === current && "border-brand bg-brand text-white",
                i > current && "border-border bg-white",
              )}
            >
              {i < current ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className={cn(i === current && "font-semibold")}>{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <span className={cn("h-px flex-1", i < current ? "bg-planir" : "bg-border")} />}
        </li>
      ))}
    </ol>
  )
}

function DocsAside() {
  const docs = useRequiredDocs()
  const subidos = useDemo((s) => s.data.draft.documentos)
  const faltan = docs.filter((d) => !subidos[d.key])
  return (
    <div className="sticky top-24 space-y-3">
      <SectionCard title="Documentos requeridos">
        <ul className="space-y-2">
          {docs.map((d) => {
            const ok = !!subidos[d.key]
            return (
              <li key={d.key} className={cn("rounded-lg border px-3 py-2", ok ? "border-emerald-200 bg-emerald-50" : d.key === "IMO" ? "border-amber-200 bg-amber-50" : "border-border bg-white")}>
                <div className="flex items-center justify-between gap-2 text-sm font-medium">
                  {d.label}
                  {ok ? <Check className="size-4 text-emerald-600" /> : <span className="text-xs font-normal text-muted-foreground">Falta</span>}
                </div>
                <div className="text-xs text-muted-foreground">{d.key === "IMO" && !ok ? "Requerida por carga IMO" : d.hint}</div>
              </li>
            )
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          {faltan.length === 0 ? "Están todos los documentos necesarios." : `Faltan ${faltan.length} ${faltan.length === 1 ? "documento" : "documentos"}. Se cargan en el paso 4.`}
        </p>
      </SectionCard>
      <HelpLine className="px-1" />
    </div>
  )
}

function WizardShell({ step, children, onNext, nextLabel = "Continuar", nextDisabled, nextVariant = "default" }: {
  step: number
  children: ReactNode
  onNext: () => void
  nextLabel?: ReactNode
  nextDisabled?: boolean
  nextVariant?: "default" | "brand"
}) {
  return (
    <ClientLayout active={null}>
      <PageHeader title="Nueva solicitud de ingreso" subtitle="Complete los datos de la operación. El portal los compara con los documentos adjuntos." onBack={() => go("C08")} backLabel="Tipo de solicitud" />
      <Stepper current={step} />
      <div className="grid grid-cols-[minmax(0,1fr)_300px] gap-6">
        <div>
          {children}
          <div className="mt-6 flex justify-between">
            <Button variant="outline" onClick={() => go(step === 0 ? "C08" : STEPS[step - 1].screen)}>
              <ArrowLeft /> Atrás
            </Button>
            <Button variant={nextVariant} size="lg" onClick={onNext} disabled={nextDisabled}>
              {nextLabel}
            </Button>
          </div>
        </div>
        <DocsAside />
      </div>
    </ClientLayout>
  )
}

function FormField({ label, hint, children, className }: { label: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export function C09Operacion() {
  const draft = useDemo((s) => s.data.draft)
  const setDraft = useDemo((s) => s.setDraft)
  const cliente = useCliente(CLIENTE_DEMO)
  return (
    <WizardShell step={0} onNext={() => go("C10")}>
      <SectionCard title="Datos de la operación">
        <div className="grid grid-cols-2 gap-x-5 gap-y-4">
          <Field label="Cliente" value={cliente.razonSocial} />
          <Field label="Persona de contacto" value={`${USUARIO_DEMO} · lmendez@importadorarambla.com.uy`} />
          <FormField label="Barco">
            <Input value={draft.barco} onChange={(e) => setDraft({ barco: e.target.value.toUpperCase() })} />
          </FormField>
          <FormField label="Viaje">
            <Input value={draft.viaje} onChange={(e) => setDraft({ viaje: e.target.value.toUpperCase() })} />
          </FormField>
          <FormField label="N° de BL" hint="Tal cual figura en el Bill of Lading">
            <Input value={draft.bl} onChange={(e) => setDraft({ bl: e.target.value.toUpperCase() })} />
          </FormField>
          <FormField
            label="Terminal de origen"
            hint={esTCP(draft.terminal) ? "TCP: se pide el BL y la confirmación de pago a la terminal." : "Montecon: se pide el BL y el Delivery Order de cada contenedor."}
          >
            <Select value={draft.terminal} onValueChange={(v) => setDraft({ terminal: v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TERMINALES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField label="Fecha estimada de llegada del barco">
            <Input type="date" value={draft.fechaLlegada} onChange={(e) => setDraft({ fechaLlegada: e.target.value })} />
          </FormField>
          <FormField label="Fecha solicitada del movimiento" hint="Fecha en que se necesita el contenedor en la playa">
            <Input type="date" value={draft.fechaMovimiento} onChange={(e) => setDraft({ fechaMovimiento: e.target.value })} />
          </FormField>
          <FormField label="Fecha estimada de salida de la playa" hint="Es una estimación: se puede cambiar después." className="col-span-2 max-w-[calc(50%-10px)]">
            <Input type="date" value={draft.fechaSalida} onChange={(e) => setDraft({ fechaSalida: e.target.value })} />
          </FormField>
        </div>
      </SectionCard>
    </WizardShell>
  )
}

const CONTAINER_RE = /^[A-Z]{4}\d{7}$/

export function C10Contenedores() {
  const draft = useDemo((s) => s.data.draft)
  const setDraft = useDemo((s) => s.setDraft)
  const rows = draft.contenedores
  const setRow = (idx: number, patch: Partial<(typeof rows)[number]>) => setDraft({ contenedores: rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)) })
  const invalid = rows.some((r) => !CONTAINER_RE.test(r.numero) || !r.precinto)
  return (
    <WizardShell step={1} onNext={() => go("C11")} nextDisabled={rows.length === 0 || invalid}>
      <SectionCard
        title={
          <span className="flex items-center gap-2">
            Contenedores <ToneBadge tone="info">{rows.length}</ToneBadge>
          </span>
        }
        action={
          <Button size="sm" variant="outline" onClick={() => setDraft({ contenedores: [...rows, { numero: "", tipo: "40' HC", precinto: "", peso: 0 }] })}>
            <Plus /> Agregar contenedor
          </Button>
        }
      >
        <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_36px] gap-3 pb-2 text-xs font-medium text-muted-foreground">
          <span>Número de contenedor</span>
          <span>Tipo</span>
          <span>Precinto</span>
          <span>Peso bruto (kg)</span>
          <span />
        </div>
        <div className="space-y-2">
          {rows.map((r, idx) => {
            const badNumber = r.numero.length > 0 && !CONTAINER_RE.test(r.numero)
            return (
              <div key={idx}>
                <div className="grid grid-cols-[1.3fr_1fr_1fr_1fr_36px] items-center gap-3">
                  <Input value={r.numero} aria-invalid={badNumber} placeholder="ABCU1234567" onChange={(e) => setRow(idx, { numero: e.target.value.toUpperCase().replace(/\s/g, "") })} />
                  <Select value={r.tipo} onValueChange={(v) => setRow(idx, { tipo: v })}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_CONTENEDOR.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input value={r.precinto} placeholder="Ej. FJ27657254" onChange={(e) => setRow(idx, { precinto: e.target.value.toUpperCase() })} />
                  <Input type="number" value={r.peso || ""} onChange={(e) => setRow(idx, { peso: Number(e.target.value) })} />
                  <Button variant="ghost" size="icon" onClick={() => setDraft({ contenedores: rows.filter((_, i) => i !== idx) })} disabled={rows.length === 1}>
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
                {badNumber && <p className="mt-1 text-xs text-red-600">El número debe tener 4 letras y 7 números (formato ISO 6346).</p>}
                {r.peso > PESO_MAXIMO && <p className="mt-1 text-xs text-amber-700">Peso alto: si el documento lo confirma, una persona de Planir lo revisará.</p>}
              </div>
            )
          })}
        </div>
      </SectionCard>
    </WizardShell>
  )
}

export function C11Imo() {
  const imo = useDemo((s) => s.data.draft.imo)
  const setDraft = useDemo((s) => s.setDraft)
  const option = (value: boolean, title: string, desc: string, icon: ReactNode) => (
    <button
      onClick={() => setDraft({ imo: value })}
      className={cn("flex items-start gap-4 rounded-xl border-2 bg-white p-5 text-left transition", imo === value ? (value ? "border-amber-500 bg-amber-50/50" : "border-planir bg-accent/40") : "border-border hover:border-stone-300")}
    >
      <span className={cn("mt-0.5 flex size-5 items-center justify-center rounded-full border-2", imo === value ? (value ? "border-amber-500" : "border-planir") : "border-stone-300")}>
        {imo === value && <span className={cn("size-2.5 rounded-full", value ? "bg-amber-500" : "bg-planir")} />}
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
    <WizardShell step={2} onNext={() => go("C12")}>
      <SectionCard title="¿Es carga peligrosa (IMO)?">
        <div className="grid grid-cols-2 gap-4">
          {option(false, "No, es carga general", "No requiere documentos adicionales.", <PackageOpen className="size-4" />)}
          {option(true, "Sí, es carga IMO", "Mercadería peligrosa clasificada según el código IMDG.", <FlaskConical className="size-4" />)}
        </div>
        {imo ? (
          <div className="mt-4">
            <Callout tone="warn" icon={<ShieldAlert className="size-5" />} title={`La carga IMO no ingresa a la playa: se deriva a ${DEPOSITO_IMO}`}>
              La playa 1704 no recibe contenedores IMO, sea cual sea su clase. Planir envía las cartillas a {DEPOSITO_IMO}, que evalúa si puede hacer el traslado y el
              almacenamiento. Debe adjuntar la <b>cartilla de seguridad</b> (Dangerous Goods Declaration) en el paso siguiente.
            </Callout>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-muted/60 p-4 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">El portal también revisa el BL</div>
            Busca N° UN, clase IMO/IMDG y descripciones de riesgo ({SENALES_IMO.slice(0, 4).join(", ").toLowerCase()}, etc.). Si encuentra alguna señal, una persona de Planir
            le consultará antes de continuar.
          </div>
        )}
      </SectionCard>
    </WizardShell>
  )
}

const TEXTO_PAGO_TCP = `Buenas tardes, confirmamos el pago de los contenedores del BL MEDUYA172632 (HUAN BAO 68 / 260710).
Transferencia BROU del 28/10, ref. 88412093. Saludos.`

function UploadSlot({ docKey, label, hint, sample, allowText }: { docKey: string; label: string; hint: string; sample: string; allowText?: boolean }) {
  const file = useDemo((s) => s.data.draft.documentos[docKey])
  const setDraft = useDemo((s) => s.setDraft)
  const documentos = useDemo((s) => s.data.draft.documentos)
  const [progress, setProgress] = useState<number | null>(null)
  const [texto, setTexto] = useState<string | null>(null)

  const upload = () => {
    setProgress(10)
    let p = 10
    const t = setInterval(() => {
      p += 30
      setProgress(Math.min(p, 100))
      if (p >= 100) {
        clearInterval(t)
        setProgress(null)
        setDraft({ documentos: { ...useDemo.getState().data.draft.documentos, [docKey]: sample } })
      }
    }, 180)
  }
  const remove = () => {
    const next = { ...documentos }
    delete next[docKey]
    setDraft({ documentos: next })
  }

  const pegar = () => {
    setDraft({ documentos: { ...documentos, [docKey]: "Texto del mail de pago" } })
    setTexto(null)
  }

  return (
    <div className={cn("rounded-xl border p-4", file ? "border-emerald-200 bg-emerald-50/50" : "border-dashed border-stone-300 bg-white")}>
      <div className="flex items-center gap-4">
        <div className={cn("flex size-10 items-center justify-center rounded-lg", file ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground")}>
          {file ? <FileText className="size-5" /> : <Upload className="size-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold">
            {label} <span className="font-normal text-muted-foreground">· {hint}</span>
          </div>
          {progress !== null ? (
            <Progress value={progress} className="mt-2 h-1.5" />
          ) : file ? (
            <div className="mt-0.5 flex items-center gap-1.5 text-xs text-emerald-700">
              <CheckCircle2 className="size-3.5" /> {file} · cargado
            </div>
          ) : (
            <div className="mt-0.5 text-xs text-muted-foreground">
              Arrastre el PDF aquí o selecciónelo desde su computadora
              {allowText && texto === null && (
                <>
                  {" · "}
                  <button className="font-medium text-planir hover:underline" onClick={() => setTexto(TEXTO_PAGO_TCP)}>
                    o pegue el texto del mail
                  </button>
                </>
              )}
            </div>
          )}
        </div>
        {file ? (
          <Button variant="ghost" size="sm" onClick={remove}>
            Quitar
          </Button>
        ) : (
          <Button variant="outline" size="sm" onClick={upload} disabled={progress !== null}>
            {progress !== null ? <Loader2 className="animate-spin" /> : <Upload />} Subir archivo
          </Button>
        )}
      </div>
      {texto !== null && !file && (
        <div className="mt-3 space-y-2 pl-14">
          <Textarea rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} className="bg-white text-sm" />
          <div className="flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setTexto(null)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={pegar} disabled={!texto.trim()}>
              Usar este texto
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function C12Documentos() {
  const draft = useDemo((s) => s.data.draft)
  const docs = useRequiredDocs()
  const [tried, setTried] = useState(false)
  const faltan = docs.filter((d) => !draft.documentos[d.key])
  const tcp = esTCP(draft.terminal)
  const sample = (key: string, idx: number) =>
    key === "BL"
      ? `BL_${draft.bl}.pdf`
      : key === "IMO"
        ? `Cartilla_IMO_${draft.barco.replace(/\s/g, "")}.pdf`
        : key === "PAGO"
          ? `Pago_TCP_${draft.bl}.pdf`
          : `DeliveryOrder_Montecon_${1594810 + idx - 1}.pdf`
  return (
    <WizardShell
      step={3}
      onNext={() => {
        setTried(true)
        if (faltan.length === 0) go("C13")
      }}
    >
      <SectionCard title="Documentos">
        <div className="space-y-3">
          {docs.map((d, idx) => (
            <UploadSlot key={d.key} docKey={d.key} label={d.label} hint={d.hint} sample={sample(d.key, idx)} allowText={d.key === "PAGO"} />
          ))}
        </div>
        {tried && faltan.length > 0 && (
          <div className="mt-4">
            <Callout tone="error" title={`Falta ${faltan.length === 1 ? "un documento obligatorio" : `${faltan.length} documentos obligatorios`}`}>
              {faltan.map((f) => `${f.label} (${f.hint})`).join(" · ")}
            </Callout>
          </div>
        )}
        {tcp && (
          <div className="mt-4">
            <Callout tone="info" title="El pago tiene que figurar en TCP">
              Planir verifica el pago en el sistema de la terminal. Si todavía no está registrado, TCP no libera el contenedor y la solicitud queda pendiente hasta que se
              acredite.
            </Callout>
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">Se aceptan PDF o fotos legibles. Si un documento no se puede leer, una persona de Planir lo revisa.</p>
      </SectionCard>
    </WizardShell>
  )
}

export function C13Revisar() {
  const draft = useDemo((s) => s.data.draft)
  const cliente = useCliente(CLIENTE_DEMO)
  const [acepto, setAcepto] = useState(false)
  const necesitaAceptar = cliente.costoCancelacion
  const docs = useRequiredDocs()
  const faltan = docs.filter((d) => !draft.documentos[d.key]).length
  const editar = (screen: string) => (
    <button className="text-xs font-medium text-planir hover:underline" onClick={() => go(screen)}>
      Editar
    </button>
  )
  return (
    <WizardShell step={4} onNext={() => go("C14")} nextLabel="Enviar solicitud" nextVariant="brand" nextDisabled={(necesitaAceptar && !acepto) || faltan > 0}>
      <div className="space-y-4">
        <SectionCard title="Operación" action={editar("C09")}>
          <div className="grid grid-cols-3 gap-4">
            <Field label="Barco · viaje" value={`${draft.barco} · ${draft.viaje}`} />
            <Field label="N° de BL" value={draft.bl} />
            <Field label="Terminal" value={draft.terminal} />
            <Field label="Llegada estimada" value={fecha(draft.fechaLlegada)} />
            <Field label="Movimiento solicitado" value={fecha(draft.fechaMovimiento)} />
            <Field label="Salida estimada" value={fecha(draft.fechaSalida)} />
          </div>
        </SectionCard>
        <SectionCard title={`Contenedores (${draft.contenedores.length})`} action={editar("C10")}>
          <ul className="divide-y text-sm">
            {draft.contenedores.map((c) => (
              <li key={c.numero} className="grid grid-cols-4 py-2 first:pt-0 last:pb-0">
                <span className="font-medium">{c.numero}</span>
                <span>{c.tipo}</span>
                <span>Precinto {c.precinto}</span>
                <span className="text-right">{kg(c.peso)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-sm">
            Carga IMO: <b>{draft.imo ? "Sí" : "No"}</b> {editar("C11")}
          </div>
        </SectionCard>
        <SectionCard title="Documentos" action={editar("C12")}>
          <ul className="space-y-1.5 text-sm">
            {docs.map((d) => (
              <li key={d.key} className="flex items-center gap-2">
                {draft.documentos[d.key] ? <Check className="size-4 text-emerald-600" /> : <span className="size-4 text-center text-red-600">!</span>}
                <span className="font-medium">{d.label}</span>
                <span className="text-muted-foreground">· {draft.documentos[d.key] ?? "falta"}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
        {necesitaAceptar && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <label className="flex cursor-pointer items-start gap-3 text-sm">
              <Checkbox checked={acepto} onCheckedChange={(v) => setAcepto(!!v)} className="mt-0.5 bg-white" />
              <span>
                Entiendo que si cancelo la solicitud <b>después de que Planir la apruebe</b>, se cobra un costo administrativo de <b>{usd(cliente.montoCancelacion)}</b>.
                <span className="mt-1 block text-xs text-amber-800">Cancelar antes de la aprobación no tiene costo.</span>
              </span>
            </label>
          </div>
        )}
      </div>
    </WizardShell>
  )
}

// ---------------------------------------------------------------------------
// C14 · Validando — C15 · Enviada
// ---------------------------------------------------------------------------

export function C14Validando() {
  const draft = useDemo((s) => s.data.draft)
  const enviar = useDemo((s) => s.enviarSolicitud)
  const checks = checksOk({
    ...draft,
    contenedores: draft.contenedores.map((c) => ({ ...c, salidasEstimadas: [] })),
  })
  const [n, setN] = useState(0)
  useEffect(() => {
    if (n < checks.length) {
      const t = setTimeout(() => setN((x) => x + 1), 230)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => {
      enviar()
      go("C15")
    }, 700)
    return () => clearTimeout(t)
  }, [n, checks.length, enviar])
  return (
    <ClientLayout active={null}>
      <div className="mx-auto max-w-2xl py-6">
        <div className="text-center">
          <Loader2 className="mx-auto size-10 animate-spin text-brand" />
          <h1 className="mt-4 text-2xl font-bold text-planir">Estamos validando sus documentos</h1>
          <p className="mt-1 text-sm text-muted-foreground">Comparamos los datos cargados con el BL y {esTCP(draft.terminal) ? "la confirmación de pago" : "los Delivery Order"}. Tarda unos segundos.</p>
        </div>
        <SectionCard className="mt-6">
          <Progress value={(n / checks.length) * 100} className="mb-4 h-1.5" />
          <ul className="space-y-2 text-sm">
            {checks.map((c, i) => (
              <li key={c.dato} className={cn("flex items-center gap-3 transition-opacity", i < n ? "opacity-100" : "opacity-30")}>
                {i < n ? <Check className="size-4 text-emerald-600" /> : <span className="size-4 rounded-full border-2 border-stone-300" />}
                <span className="flex-1">{c.dato}</span>
                <span className="text-muted-foreground">{i < n ? "coincide" : "…"}</span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>
    </ClientLayout>
  )
}

export function C15Enviada() {
  const solicitud = useDemo((s) => s.data.ingresos.find((i) => i.id === STORY_ING))
  return (
    <ClientLayout active={null}>
      <div className="mx-auto max-w-2xl py-6 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-9 text-emerald-600" />
        </div>
        <h1 className="mt-5 text-2xl font-bold text-planir">Solicitud {STORY_ING} enviada</h1>
        <p className="mt-2 text-muted-foreground">
          Validamos sus documentos y <b className="text-foreground">los {solicitud?.validacion.length ?? 0} datos coinciden</b>. Ahora la revisa el equipo de Planir.
        </p>
      </div>
      <SectionCard className="mx-auto max-w-2xl" title="¿Qué sigue?">
        <ol className="space-y-4 text-sm">
          {[
            ["Planir revisa y aprueba", "Hacen sus gestiones internas (ImporSys, orden de trabajo, Aduana y transporte)."],
            ["Le avisamos", "Verá el estado y los comentarios en el portal. Si algo queda pendiente, le explicamos el motivo."],
            ["Traemos sus contenedores", "Cuando ingresen a la playa le avisamos y empieza a correr la estadía."],
          ].map(([t, d], i) => (
            <li key={t} className="flex gap-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-semibold text-planir">{i + 1}</span>
              <span>
                <span className="font-semibold">{t}</span>
                <span className="block text-muted-foreground">{d}</span>
              </span>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex gap-3">
          <Button onClick={() => go("C20")}>Ver la solicitud</Button>
          <Button variant="outline" onClick={() => go("C05")}>
            Ir al inicio
          </Button>
        </div>
      </SectionCard>
      <HelpLine className="mt-6 justify-center" />
    </ClientLayout>
  )
}
