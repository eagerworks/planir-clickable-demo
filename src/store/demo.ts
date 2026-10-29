import { create } from "zustand"
import {
  ADMINISTRACION,
  CLIENTE_DEMO,
  DEPOSITO_IMO,
  OPERADORA,
  USUARIO_DEMO,
  TARIFA_ESTADIA_DIA,
  checksOk,
  daysBetween,
  draftInicial,
  esTCP,
  itemImo,
  itemTraslado,
  pasosInternos,
  proformaIngreso,
  seedAyuda,
  seedClientes,
  seedIngresos,
  seedNotificaciones,
  seedSalidas,
  type Draft,
} from "@/data/seed"
import type { Cliente, Ingreso, Notificacion, PedidoAyuda, Salida } from "@/data/types"

export interface DemoData {
  clientes: Cliente[]
  ingresos: Ingreso[]
  salidas: Salida[]
  notificaciones: Notificacion[]
  ayuda: PedidoAyuda[]
  draft: Draft
  seq: number
}

const initialData = (): DemoData =>
  structuredClone({
    clientes: seedClientes,
    ingresos: seedIngresos,
    salidas: seedSalidas,
    notificaciones: seedNotificaciones,
    ayuda: seedAyuda,
    draft: draftInicial,
    seq: 100,
  })

// ---------------------------------------------------------------------------
// Historia principal: ING-0142 (Importadora Rambla) recorre todo el ciclo.
// Cada paso puede dispararse desde un botón o "forzarse" al saltar de pantalla.
// ---------------------------------------------------------------------------
export const STORY_ING = "ING-0142"
export const STORY_SAL = "SAL-0058"

const ing = (d: DemoData, id: string) => d.ingresos.find((i) => i.id === id)!
const sal = (d: DemoData, id: string) => d.salidas.find((s) => s.id === id)!
const cliente = (d: DemoData, id: string) => d.clientes.find((c) => c.id === id)!

function notify(d: DemoData, n: Omit<Notificacion, "id" | "leida">) {
  d.seq += 1
  d.notificaciones.unshift({ ...n, id: `x${d.seq}`, leida: false })
}

/** Etapa de la historia principal, derivada del estado. */
export function storyStage(d: DemoData): number {
  const i = d.ingresos.find((x) => x.id === STORY_ING)
  if (!i) return 0
  const s = d.salidas.find((x) => x.id === STORY_SAL)
  if (s) return s.estado === "retirada" ? 7 : s.estado === "habilitada" ? 6 : 5
  if (i.estado === "ingresada") return i.contenedores[0].salidasEstimadas.length > 1 ? 4 : 3
  if (i.estado === "aprobada") return 2
  return 1
}

/** Clase que se asume en la demo cuando el cliente declara o confirma carga IMO. */
const IMO_DECLARADO = "UN 1950 · Clase 2.1 · Aerosoles"

function enviarDraft(d: DemoData) {
  const f = d.draft
  const contenedores = f.contenedores.map((c) => ({
    ...c,
    salidasEstimadas: [{ fecha: f.fechaSalida, registrado: "", motivo: "Estimada al ingresar" }],
  }))
  const documentos: Ingreso["documentos"] = [
    { tipo: "BL", nombre: f.documentos.BL ?? `BL_${f.bl}.pdf`, estado: "validado" },
    ...(esTCP(f.terminal)
      ? [{ tipo: "PAGO" as const, nombre: f.documentos.PAGO ?? "Pago_TCP.pdf", estado: "validado" as const }]
      : f.contenedores.map((c, idx) => ({
          tipo: "DO" as const,
          nombre: f.documentos[`DO:${c.numero}`] ?? `DeliveryOrder_Montecon_${1594810 + idx}.pdf`,
          estado: "validado" as const,
          contenedor: c.numero,
        }))),
    ...(f.imo ? [{ tipo: "IMO" as const, nombre: f.documentos.IMO ?? "Cartilla_IMO.pdf", estado: "validado" as const }] : []),
  ]
  const nuevo: Ingreso = {
    id: STORY_ING,
    clienteId: CLIENTE_DEMO,
    creadoPor: USUARIO_DEMO,
    barco: f.barco,
    viaje: f.viaje,
    bl: f.bl,
    terminal: f.terminal,
    fechaLlegada: f.fechaLlegada,
    fechaMovimiento: f.fechaMovimiento,
    imo: f.imo,
    imoDetalle: f.imo ? IMO_DECLARADO : undefined,
    contenedores,
    documentos,
    validacion: [],
    pasos: [],
    comentarios: [],
    historial: [
      { fecha: "2026-10-28T10:42", actor: "cliente", texto: `Solicitud presentada por ${USUARIO_DEMO}` },
      { fecha: "2026-10-28T10:43", actor: "sistema", texto: "Documentos validados automáticamente: todo coincide" },
    ],
    estado: "pendiente_aprobacion",
    creado: "2026-10-28",
    actualizado: "2026-10-28",
    proforma: proformaIngreso(contenedores.length, f.fechaMovimiento, f.fechaSalida, f.imo),
  }
  nuevo.validacion = checksOk(nuevo)
  nuevo.pasos = pasosInternos(f.terminal).map((label) => ({ label, done: false }))
  d.ingresos = [nuevo, ...d.ingresos.filter((i) => i.id !== STORY_ING)]
  notify(d, { para: "cliente", fecha: "2026-10-28T10:43", texto: `Solicitud ${STORY_ING} enviada. Todo coincide: queda en revisión de Planir.`, ref: STORY_ING, tono: "ok" })
  notify(d, { para: "planir", fecha: "2026-10-28T10:43", texto: `Nueva solicitud ${STORY_ING} de Importadora Rambla lista para revisar.`, ref: STORY_ING, tono: "info" })
}

function aprobar(d: DemoData, id: string, comentario?: string) {
  const i = ing(d, id)
  i.pasos = i.pasos.map((p) => ({ ...p, done: true }))
  if (i.imo) i.evaluacionD24 = "aceptada"
  i.estado = "aprobada"
  i.actualizado = "2026-10-29"
  i.motivoPendiente = undefined
  i.historial.push({ fecha: "2026-10-29T09:15", actor: "planir", texto: `Aprobada por ${OPERADORA}` })
  if (comentario) i.comentarios.push({ fecha: "2026-10-29T09:15", autor: `${OPERADORA} · Planir`, texto: comentario })
  notify(d, { para: "cliente", fecha: "2026-10-29T09:15", texto: `${id} fue aprobada. Ya puede ver la proforma.`, ref: id, tono: "ok" })
}

function ingresar(d: DemoData, id: string, fechaHora = "2026-10-31T08:40") {
  const i = ing(d, id)
  i.contenedores.forEach((c) => (c.ingresoReal = fechaHora))
  i.estado = "ingresada"
  i.actualizado = fechaHora.slice(0, 10)
  i.historial.push({ fecha: fechaHora, actor: "planir", texto: `Ingreso real registrado (${i.contenedores.length} contenedores)` })
  notify(d, {
    para: "cliente",
    fecha: fechaHora,
    texto: `${i.contenedores.length === 1 ? `El contenedor de ${id} ingresó` : `Los ${i.contenedores.length} contenedores de ${id} ingresaron`} a ${i.imo ? DEPOSITO_IMO : "la playa"}.`,
    ref: id,
    tono: "info",
  })
}

export function suplemento(desde: string, hasta: string, cantidad: number) {
  return Math.max(0, daysBetween(desde, hasta)) * cantidad * TARIFA_ESTADIA_DIA
}

function cambiarFecha(d: DemoData, id: string, fecha = "2026-11-12") {
  const i = ing(d, id)
  const prev = i.contenedores[0].salidasEstimadas.at(-1)!.fecha
  const monto = suplemento(prev, fecha, i.contenedores.length)
  i.contenedores.forEach((c) =>
    c.salidasEstimadas.push({ fecha, registrado: "2026-11-03", motivo: `Cambio solicitado por ${USUARIO_DEMO}`, suplemento: monto }),
  )
  i.historial.push({ fecha: "2026-11-03T11:02", actor: "cliente", texto: `Nueva fecha estimada de salida: ${fecha.split("-").reverse().join("/")} (suplemento USD ${monto})` })
  notify(d, { para: "planir", fecha: "2026-11-03T11:02", texto: `Importadora Rambla corrió la salida de ${id} al ${fecha.split("-").reverse().join("/")}.`, ref: id, tono: "info" })
}

function solicitarRetiro(d: DemoData, id: string, contenedores?: string[], fecha?: string) {
  const i = ing(d, id)
  const elegidos = contenedores ?? i.contenedores.map((c) => c.numero)
  const retiro = fecha ?? i.contenedores[0].salidasEstimadas.at(-1)!.fecha
  const n = elegidos.length
  const ingreso = i.contenedores[0].ingresoReal ?? i.fechaMovimiento
  const estimada = i.contenedores[0].salidasEstimadas[0].fecha
  const base = daysBetween(ingreso, estimada)
  const extra = daysBetween(estimada, retiro)
  const c = cliente(d, i.clienteId)
  const nuevas = d.salidas.filter((x) => x.id !== STORY_SAL && Number(x.id.slice(4)) >= 59).length
  const salId = id === STORY_ING ? STORY_SAL : `SAL-${String(59 + nuevas).padStart(4, "0")}`
  const s: Salida = {
    id: salId,
    ingresoId: id,
    clienteId: i.clienteId,
    contenedores: elegidos,
    fechaRetiro: retiro,
    estado: c.condicionPago === "pago_previo" ? "pendiente_pago" : "habilitada",
    proforma: [
      itemTraslado(n, i.imo),
      { concepto: `Estadía estimada al ingresar (${base} días × ${n} cont.)`, monto: base * n * TARIFA_ESTADIA_DIA },
      ...(extra > 0 ? [{ concepto: `Suplemento por extensión (${extra} días × ${n} cont.)`, monto: extra * n * TARIFA_ESTADIA_DIA }] : []),
      ...(i.imo ? [itemImo(n)] : []),
    ],
    solicitada: "2026-11-10",
    documentos: [],
  }
  d.salidas = [s, ...d.salidas.filter((x) => x.id !== salId)]
  i.contenedores.forEach((ct) => elegidos.includes(ct.numero) && (ct.salidaId = salId))
  i.historial.push({ fecha: "2026-11-10T09:30", actor: "cliente", texto: `Retiro solicitado para el ${retiro.split("-").reverse().join("/")} (${salId})` })
  notify(d, { para: "planir", fecha: "2026-11-10T09:30", texto: `${c.razonSocial} solicitó el retiro ${salId}.`, ref: salId, tono: "info" })
  if (s.estado === "pendiente_pago")
    notify(d, { para: "cliente", fecha: "2026-11-10T09:30", texto: `${salId} está pendiente de pago. El retiro se habilita cuando Planir confirme la transferencia.`, ref: salId, tono: "warn" })
  return salId
}

function confirmarPago(d: DemoData, id: string) {
  const s = sal(d, id)
  s.estado = "habilitada"
  s.pagoConfirmado = id === STORY_SAL ? "2026-11-11" : "2026-10-28"
  notify(d, {
    para: "cliente",
    fecha: `${s.pagoConfirmado}T10:00`,
    texto: `Confirmamos su pago. El retiro ${id} quedó habilitado para el ${s.fechaRetiro.split("-").reverse().join("/")}.`,
    ref: id,
    tono: "ok",
  })
}

function registrarSalida(d: DemoData, id: string) {
  const s = sal(d, id)
  const i = ing(d, s.ingresoId)
  const fecha = `${s.fechaRetiro}T14:20`
  i.contenedores.forEach((c) => s.contenedores.includes(c.numero) && (c.salidaReal = fecha))
  s.estado = "retirada"
  s.documentos = [{ tipo: "SALIDA", nombre: `Constancia_salida_${id}.pdf`, estado: "validado" }]
  if (i.contenedores.every((c) => c.salidaReal)) i.estado = "cerrada"
  i.historial.push({ fecha, actor: "planir", texto: `Salida real registrada (${id})` })
  notify(d, { para: "cliente", fecha, texto: `Sus contenedores salieron de la playa. ${id} quedó cerrada con su constancia.`, ref: id, tono: "ok" })
}

const STORY_STEPS: ((d: DemoData) => void)[] = [
  () => {},
  enviarDraft,
  (d) => aprobar(d, STORY_ING),
  (d) => ingresar(d, STORY_ING),
  (d) => cambiarFecha(d, STORY_ING),
  (d) => solicitarRetiro(d, STORY_ING),
  (d) => confirmarPago(d, STORY_SAL),
  (d) => registrarSalida(d, STORY_SAL),
]

function ensureStoryIn(d: DemoData, stage: number) {
  let guard = 0
  while (storyStage(d) < stage && guard++ < 10) STORY_STEPS[storyStage(d) + 1](d)
}

// ---------------------------------------------------------------------------

const prepares: Record<string, () => void> = {}

/** Cada pantalla puede declarar qué estado necesita para tener sentido al saltar directo a ella. */
export function registerPrepares(p: Record<string, () => void>) {
  Object.assign(prepares, p)
}

interface DemoState {
  screen: string
  focus?: string
  data: DemoData
  go: (screen: string, focus?: string) => void
  reset: () => void
  update: (fn: (d: DemoData) => void) => void
  ensureStory: (stage: number) => void

  setDraft: (patch: Partial<Draft>) => void
  enviarSolicitud: () => void
  togglePaso: (id: string, idx: number) => void
  aprobar: (id: string, comentario?: string) => void
  rechazar: (id: string, motivo: string) => void
  dejarPendiente: (id: string, motivo: string, comentario: string) => void
  aceptarRevision: (id: string) => void
  pedirCorreccion: (id: string, mensaje: string) => void
  corregir: (id: string, valores: { fechaLlegada: string; precinto: string }) => boolean
  reenviar: (id: string) => void
  responderImo: (id: string, esImo: boolean) => void
  derivarD24: (id: string) => void
  aceptaD24: (id: string) => void
  registrarIngreso: (id: string, fechaHora?: string) => void
  cambiarFecha: (id: string, fecha: string) => void
  solicitarRetiro: (id: string, contenedores: string[], fecha: string) => string
  adjuntarComprobante: (salidaId: string) => void
  confirmarPago: (salidaId: string) => void
  registrarSalida: (salidaId: string) => void
  cancelar: (id: string, conCosto: boolean) => void
  pedirAyuda: (ref: string, motivo: string, mensaje: string) => void
  resolverAyuda: (id: string) => void
  marcarLeidas: (para: "cliente" | "planir") => void
  setCondicion: (clienteId: string, c: Cliente["condicionPago"]) => void
  toggleCancelacion: (clienteId: string) => void
  crearCliente: (c: Pick<Cliente, "razonSocial" | "rut" | "telefono" | "condicionPago" | "costoCancelacion">, usuario: { nombre: string; email: string }) => void
  invitarUsuario: (clienteId: string, u: { nombre: string; email: string; cargo: string }) => void
  activarCuenta: () => void
}

export const useDemo = create<DemoState>((set, get) => {
  const update = (fn: (d: DemoData) => void) =>
    set((s) => {
      const d = structuredClone(s.data)
      fn(d)
      return { data: d }
    })

  return {
    screen: "C01",
    data: initialData(),
    go: (screen, focus) => {
      // Con foco explícito se muestra esa entidad tal cual está; sin foco, la pantalla prepara su escenario.
      if (!focus) prepares[screen]?.()
      set({ screen, focus })
    },
    reset: () => {
      set({ data: initialData() })
      prepares[get().screen]?.()
    },
    update,
    ensureStory: (stage) => {
      if (storyStage(get().data) < stage) update((d) => ensureStoryIn(d, stage))
    },

    setDraft: (patch) => update((d) => Object.assign(d.draft, patch)),
    enviarSolicitud: () => update((d) => storyStage(d) === 0 && enviarDraft(d)),
    togglePaso: (id, idx) =>
      update((d) => {
        const p = ing(d, id).pasos[idx]
        p.done = !p.done
      }),
    aprobar: (id, comentario) => update((d) => aprobar(d, id, comentario)),
    rechazar: (id, motivo) =>
      update((d) => {
        const i = ing(d, id)
        i.estado = "rechazada"
        i.motivoRechazo = motivo
        i.historial.push({ fecha: "2026-10-28T12:10", actor: "planir", texto: `Rechazada por ${OPERADORA}: ${motivo}` })
        notify(d, { para: "cliente", fecha: "2026-10-28T12:10", texto: `${id} fue rechazada: ${motivo}`, ref: id, tono: "error" })
      }),
    dejarPendiente: (id, motivo, comentario) =>
      update((d) => {
        const i = ing(d, id)
        i.estado = "pendiente_externo"
        i.motivoPendiente = motivo
        i.comentarios.push({ fecha: "2026-10-28T11:30", autor: `${OPERADORA} · Planir`, texto: comentario })
        i.historial.push({ fecha: "2026-10-28T11:30", actor: "planir", texto: `Pendiente por causa externa: ${motivo}` })
        notify(d, { para: "cliente", fecha: "2026-10-28T11:30", texto: `${id} está pendiente: ${comentario}`, ref: id, tono: "warn" })
      }),
    aceptarRevision: (id) =>
      update((d) => {
        const i = ing(d, id)
        i.validacion = i.validacion.map((c) => (c.resultado === "warning" ? { ...c, resultado: "ok", nota: `Aceptado por ${OPERADORA}` } : c))
        i.documentos = i.documentos.map((doc) => (doc.estado === "en_revision" || doc.estado === "ilegible" ? { ...doc, estado: "validado" } : doc))
        i.estado = "pendiente_aprobacion"
        i.historial.push({ fecha: "2026-10-28T10:05", actor: "planir", texto: `Revisión humana: valor aceptado por ${OPERADORA}` })
        notify(d, { para: "cliente", fecha: "2026-10-28T10:05", texto: `Revisamos ${id}: el dato es correcto y la solicitud sigue su curso.`, ref: id, tono: "ok" })
      }),
    pedirCorreccion: (id, mensaje) =>
      update((d) => {
        const i = ing(d, id)
        i.estado = "observada"
        i.diasSinRespuesta = 0
        i.comentarios.push({ fecha: "2026-10-28T10:05", autor: `${OPERADORA} · Planir`, texto: mensaje })
        i.historial.push({ fecha: "2026-10-28T10:05", actor: "planir", texto: "Revisión humana: se pidió corrección al cliente" })
        notify(d, { para: "cliente", fecha: "2026-10-28T10:05", texto: `${id}: ${mensaje}`, ref: id, tono: "error" })
      }),
    corregir: (id, valores) => {
      let ok = false
      update((d) => {
        const i = ing(d, id)
        i.fechaLlegada = valores.fechaLlegada
        i.contenedores[0].precinto = valores.precinto
        i.validacion = i.validacion.map((c) => {
          if (c.dato === "Fecha estimada de llegada") {
            const declarado = valores.fechaLlegada.split("-").reverse().join("/")
            return { ...c, declarado, resultado: declarado === c.leido ? "ok" : "error" }
          }
          if (c.dato.startsWith("Precinto")) return { ...c, declarado: valores.precinto, resultado: valores.precinto === c.leido ? "ok" : "error" }
          return c
        })
        ok = i.validacion.every((c) => c.resultado === "ok")
        i.historial.push({ fecha: "2026-10-28T11:05", actor: "cliente", texto: `Corregida y reenviada por ${USUARIO_DEMO}` })
        if (ok) {
          i.estado = "pendiente_aprobacion"
          i.diasSinRespuesta = undefined
          i.documentos = i.documentos.map((doc) => ({ ...doc, estado: "validado" }))
          i.historial.push({ fecha: "2026-10-28T11:06", actor: "sistema", texto: "Documentos validados automáticamente: todo coincide" })
          notify(d, { para: "planir", fecha: "2026-10-28T11:06", texto: `Importadora Rambla corrigió ${id}: lista para revisar.`, ref: id, tono: "info" })
        }
      })
      return ok
    },
    reenviar: (id) =>
      update((d) => {
        const i = ing(d, id)
        i.estado = "revision"
        i.diasSinRespuesta = undefined
        i.historial.push({ fecha: "2026-10-28T11:05", actor: "cliente", texto: `Documento reemplazado y reenviado por ${USUARIO_DEMO}` })
        notify(d, { para: "planir", fecha: "2026-10-28T11:05", texto: `Importadora Rambla reenvió ${id}: lista para revisar.`, ref: id, tono: "info" })
      }),
    responderImo: (id, esImo) =>
      update((d) => {
        const i = ing(d, id)
        if (esImo) {
          i.imo = true
          i.imoDetalle = IMO_DECLARADO
          i.documentos.push({ tipo: "IMO", nombre: `Cartilla_IMO_${i.contenedores[0].numero}.pdf`, estado: "validado" })
          i.proforma = proformaIngreso(i.contenedores.length, i.fechaMovimiento, i.contenedores[0].salidasEstimadas.at(-1)!.fecha, true)
        }
        i.validacion = i.validacion.map((c) =>
          c.dato === "Mercadería peligrosa (IMO)"
            ? esImo
              ? { ...c, declarado: "Sí", leido: IMO_DECLARADO, documento: "BL · Cartilla IMO", resultado: "ok", nota: "Confirmado por el cliente" }
              : { ...c, declarado: "No", resultado: "ok", nota: "El cliente confirmó que no es carga IMO" }
            : c,
        )
        i.documentos = i.documentos.map((doc) => (doc.estado === "en_revision" ? { ...doc, estado: "validado" } : doc))
        i.estado = "pendiente_aprobacion"
        i.diasSinRespuesta = undefined
        i.historial.push({
          fecha: "2026-10-28T11:05",
          actor: "cliente",
          texto: esImo ? `${USUARIO_DEMO} confirmó carga IMO y adjuntó la cartilla de seguridad` : `${USUARIO_DEMO} confirmó que no es carga IMO`,
        })
        notify(d, {
          para: "planir",
          fecha: "2026-10-28T11:05",
          texto: esImo ? `Importadora Rambla confirmó que ${id} es carga IMO: derivar las cartillas a ${DEPOSITO_IMO}.` : `Importadora Rambla confirmó que ${id} no es carga IMO.`,
          ref: id,
          tono: esImo ? "warn" : "info",
        })
      }),
    derivarD24: (id) =>
      update((d) => {
        const i = ing(d, id)
        i.evaluacionD24 = "pendiente"
        i.estado = "pendiente_externo"
        i.motivoPendiente = `Evaluación de ${DEPOSITO_IMO}`
        const texto = `Por tratarse de carga IMO, la playa 1704 no puede recibir el contenedor. Derivamos las cartillas a ${DEPOSITO_IMO} para que evalúe el traslado y el almacenamiento; le avisaremos cuando respondan.`
        i.comentarios.push({ fecha: "2026-10-28T11:30", autor: `${OPERADORA} · Planir`, texto })
        i.historial.push({ fecha: "2026-10-28T11:30", actor: "planir", texto: `Cartillas IMO derivadas a ${DEPOSITO_IMO}` })
        notify(d, { para: "cliente", fecha: "2026-10-28T11:30", texto: `${id} está en evaluación de ${DEPOSITO_IMO} por ser carga IMO.`, ref: id, tono: "warn" })
      }),
    aceptaD24: (id) =>
      update((d) => {
        const i = ing(d, id)
        i.evaluacionD24 = "aceptada"
        i.estado = "pendiente_aprobacion"
        i.motivoPendiente = undefined
        i.comentarios.push({
          fecha: "2026-10-28T15:10",
          autor: `${OPERADORA} · Planir`,
          texto: `${DEPOSITO_IMO} confirmó que puede trasladar y almacenar la carga. Seguimos con la aprobación.`,
        })
        i.historial.push({ fecha: "2026-10-28T15:10", actor: "planir", texto: `${DEPOSITO_IMO} aceptó el traslado y almacenamiento` })
        notify(d, { para: "cliente", fecha: "2026-10-28T15:10", texto: `${DEPOSITO_IMO} aceptó la carga IMO de ${id}. La solicitud sigue su curso.`, ref: id, tono: "ok" })
      }),
    registrarIngreso: (id, fechaHora) =>
      update((d) => {
        if (id === STORY_ING) ensureStoryIn(d, 2)
        ingresar(d, id, fechaHora)
      }),
    cambiarFecha: (id, fecha) => update((d) => cambiarFecha(d, id, fecha)),
    solicitarRetiro: (id, contenedores, fecha) => {
      let salId = STORY_SAL
      update((d) => {
        salId = solicitarRetiro(d, id, contenedores, fecha)
      })
      return salId
    },
    adjuntarComprobante: (salidaId) =>
      update((d) => {
        sal(d, salidaId).comprobante = "Transferencia_Itau_10-11.pdf"
        notify(d, { para: "planir", fecha: "2026-11-10T16:10", texto: `Importadora Rambla adjuntó el comprobante de ${salidaId}.`, ref: salidaId, tono: "info" })
      }),
    confirmarPago: (salidaId) => update((d) => confirmarPago(d, salidaId)),
    registrarSalida: (salidaId) => update((d) => registrarSalida(d, salidaId)),
    cancelar: (id, conCosto) =>
      update((d) => {
        const i = ing(d, id)
        i.estado = "cancelada"
        i.historial.push({ fecha: "2026-10-28T13:00", actor: "cliente", texto: `Cancelada por ${USUARIO_DEMO}${conCosto ? " (con costo administrativo)" : ""}` })
        notify(d, { para: "planir", fecha: "2026-10-28T13:00", texto: `Importadora Rambla canceló ${id}${conCosto ? " · aplica costo administrativo" : ""}.`, ref: id, tono: "warn" })
      }),
    pedirAyuda: (ref, motivo, mensaje) =>
      update((d) => {
        d.seq += 1
        d.ayuda.unshift({ id: `h${d.seq}`, clienteId: CLIENTE_DEMO, ref, usuario: USUARIO_DEMO, motivo, mensaje, fecha: "2026-10-28T11:40", resuelto: false })
        notify(d, { para: "planir", fecha: "2026-10-28T11:40", texto: `Importadora Rambla pidió ayuda en ${ref}.`, ref, tono: "warn" })
      }),
    resolverAyuda: (id) => update((d) => void (d.ayuda.find((h) => h.id === id)!.resuelto = true)),
    marcarLeidas: (para) => update((d) => d.notificaciones.forEach((n) => n.para === para && (n.leida = true))),
    setCondicion: (clienteId, c) => update((d) => void (cliente(d, clienteId).condicionPago = c)),
    toggleCancelacion: (clienteId) =>
      update((d) => {
        const c = cliente(d, clienteId)
        c.costoCancelacion = !c.costoCancelacion
      }),
    crearCliente: (c, usuario) =>
      update((d) => {
        d.clientes.push({
          ...c,
          id: `c-${d.seq++}`,
          montoCancelacion: 150,
          cancelacionesPrevias: 0,
          clienteDesde: "2026-10-28",
          usuarios: [{ ...usuario, cargo: "Contacto principal", estado: "invitado" }],
        })
      }),
    invitarUsuario: (clienteId, u) => update((d) => void cliente(d, clienteId).usuarios.push({ ...u, estado: "invitado" })),
    activarCuenta: () =>
      update((d) => {
        const u = cliente(d, CLIENTE_DEMO).usuarios.find((x) => x.nombre === USUARIO_DEMO)
        if (u) u.estado = "activo"
      }),
  }
})

export const ADMIN_NOMBRE = ADMINISTRACION

/** "Hoy" de la demo: avanza a medida que avanza la historia principal. */
export function hoy(d: DemoData) {
  const st = storyStage(d)
  return st >= 7 ? "2026-11-12" : st >= 5 ? "2026-11-10" : st >= 3 ? "2026-11-03" : "2026-10-28"
}

// Selectores
export const useData = () => useDemo((s) => s.data)
export const useIngreso = (id: string) => useDemo((s) => s.data.ingresos.find((i) => i.id === id))
export const useSalida = (id: string) => useDemo((s) => s.data.salidas.find((x) => x.id === id))
export const useCliente = (id: string) => useDemo((s) => s.data.clientes.find((c) => c.id === id)!)
export const useHoy = () => useDemo((s) => hoy(s.data))
