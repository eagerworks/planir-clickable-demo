import type { ReactNode } from "react"
import { consultaImo } from "@/data/seed"
import { registerPrepares, STORY_ING, STORY_SAL, useDemo } from "@/store/demo"
import { C01Invitacion, C02CrearContrasena, C03Login, C04Recuperar } from "./cliente/acceso"
import { C17Corregir, ClienteIngresoDetalle } from "./cliente/detalle"
import { C05Inicio, C06MisSolicitudes, C23Contenedores } from "./cliente/inicio"
import { C08Tipo, C09Operacion, C10Contenedores, C11Imo, C12Documentos, C13Revisar, C14Validando, C15Enviada } from "./cliente/nueva"
import { C26SolicitarRetiro, ClienteSalidaDetalle } from "./cliente/salida"
import { A01Clientes, A02NuevoCliente, A03DetalleCliente, A04Pagos, A05Proformas, A06Estadias } from "./planir/admin"
import { P02Bandeja, P09Inventario, P12Ayuda, PlanirIngresoDetalle, PlanirSalidaDetalle } from "./planir/operador"

export type View = "cliente" | "operador" | "admin"

export const VIEW_META: Record<View, { label: string; dot: string; chip: string }> = {
  cliente: { label: "Cliente", dot: "bg-brand", chip: "bg-[#fdeee8] text-[#c2410c]" },
  operador: { label: "Planir · Operador", dot: "bg-planir", chip: "bg-accent text-planir" },
  admin: { label: "Planir · Administración", dot: "bg-sky-600", chip: "bg-sky-50 text-sky-800" },
}

export interface ScreenDef {
  id: string
  title: string
  group: string
  view: View
  url: string | ((focus?: string) => string)
  context: string
  tag?: "PROPUESTA" | "A VALIDAR"
  /** Entidad que muestra por defecto (se puede pisar al navegar desde una tabla). */
  focus?: string
  prepare?: () => void
  render: (focus?: string) => ReactNode
}

export const GROUPS: { title: string; subtitle?: string }[] = [
  { title: "Acceso del cliente", subtitle: "Planir invita; el cliente activa su cuenta" },
  { title: "Inicio del cliente", subtitle: "Qué ve el cliente al entrar" },
  { title: "Nueva solicitud de ingreso", subtitle: "Camino feliz: todo coincide" },
  { title: "Planir revisa y aprueba", subtitle: "Pasos internos, aprobación e ingreso real" },
  { title: "Datos que no coinciden", subtitle: "Correcciones, revisión humana y ayuda" },
  { title: "Carga peligrosa (IMO)", subtitle: "Detección en el BL y derivación a Depósito 24" },
  { title: "Pendientes, rechazos y cancelación" },
  { title: "Permanencia y salida", subtitle: "Cambio de fecha, retiro, pago y cierre" },
  { title: "Administración", subtitle: "Clientes, proformas y estadías" },
]

const [G1, G2, G3, G4, G5, GIMO, G6, G7, G8] = GROUPS.map((g) => g.title)
const ingUrl = (base: string) => (f?: string) => `${base}/solicitudes/${f}`

const story = (stage: number) => () => useDemo.getState().ensureStory(stage)

/** Caso IMO (ING-0138): 1 = Planir consultó, 2 = el cliente confirmó IMO, 3 = derivada a Depósito 24. */
const IMO_ING = "ING-0138"
const imoStage = (stage: number) => () => {
  const s = useDemo.getState()
  const i = () => useDemo.getState().data.ingresos.find((x) => x.id === IMO_ING)!
  if (stage >= 1 && i().estado === "revision") s.pedirCorreccion(IMO_ING, consultaImo("«SPRAY PAINT AEROSOL CANS»"))
  if (stage >= 2 && i().estado === "observada") s.responderImo(IMO_ING, true)
  if (stage >= 3 && i().estado === "pendiente_aprobacion" && !i().evaluacionD24) s.derivarD24(IMO_ING)
}

export const SCREENS: ScreenDef[] = [
  // 1 · Acceso
  {
    id: "C01",
    title: "Invitación: activar cuenta",
    group: G1,
    view: "cliente",
    url: "portal.planir.uy/invitacion/8f3a…",
    context: "Planir da de alta a la empresa y le manda una invitación por mail. El cliente llega acá desde el link.",
    render: () => <C01Invitacion />,
  },
  {
    id: "C02",
    title: "Crear contraseña",
    group: G1,
    view: "cliente",
    url: "portal.planir.uy/invitacion/8f3a…/contrasena",
    context: "El usuario define su contraseña. Las reglas se marcan a medida que escribe.",
    render: () => <C02CrearContrasena />,
  },
  {
    id: "C03",
    title: "Iniciar sesión",
    group: G1,
    view: "cliente",
    url: "portal.planir.uy/ingresar",
    context: "Login del portal de clientes.",
    render: () => <C03Login />,
  },
  {
    id: "C04",
    title: "Recuperar contraseña",
    group: G1,
    view: "cliente",
    url: "portal.planir.uy/recuperar",
    context: "Si el cliente olvidó su contraseña, recibe un link por mail para crear una nueva.",
    render: () => <C04Recuperar />,
  },

  // 2 · Inicio
  {
    id: "C05",
    title: "Inicio",
    group: G2,
    view: "cliente",
    url: "portal.planir.uy/inicio",
    context: "Resumen para el cliente: lo que requiere su acción, solicitudes en curso y contenedores en playa con su fecha estimada de salida.",
    render: () => <C05Inicio />,
  },
  {
    id: "C06",
    title: "Solicitudes",
    group: G2,
    view: "cliente",
    url: "portal.planir.uy/solicitudes",
    context: "Todos los ingresos y salidas de la empresa con su estado. Reemplaza la cadena de mails: cada pedido tiene número e historial.",
    render: () => <C06MisSolicitudes />,
  },
  {
    id: "C07",
    title: "Notificaciones",
    group: G2,
    view: "cliente",
    url: "portal.planir.uy/inicio",
    context: "Los avisos llegan a la campana del portal: datos a corregir, aprobaciones, ingresos, pagos y comentarios de Planir.",
    render: () => <C05Inicio notificationsOpen />,
  },

  // 3 · Nueva solicitud
  {
    id: "C08",
    title: "Tipo de solicitud",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva",
    context: "Ingreso y salida son etapas distintas. La salida se pide desde un ingreso que ya está en la playa.",
    render: () => <C08Tipo />,
  },
  {
    id: "C09",
    title: "Datos de la operación",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva/operacion",
    context: "Barco, BL, terminal y fechas, precargados con el BL de ejemplo de MSC que mandó Planir. La terminal define los documentos: Montecon pide BL y Delivery Order; TCP, BL y confirmación de pago.",
    render: () => <C09Operacion />,
  },
  {
    id: "C10",
    title: "Contenedores y precintos",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva/contenedores",
    context: "Uno o más contenedores por solicitud, con su precinto y peso. El formato del número se valida al escribir.",
    tag: "A VALIDAR",
    render: () => <C10Contenedores />,
  },
  {
    id: "C11",
    title: "¿Carga peligrosa (IMO)?",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva/imo",
    context: "Si es IMO, se pide la cartilla de seguridad y se avisa que la carga va a Depósito 24: la playa 1704 no recibe IMO. Si no, se aclara que el portal igual revisa el BL.",
    render: () => <C11Imo />,
  },
  {
    id: "C12",
    title: "Documentos",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva/documentos",
    context: "Montecon: BL y un Delivery Order por contenedor. TCP: BL y la confirmación de pago (PDF o texto del mail). Cartilla IMO si aplica. Para ver la diferencia, cambiar la terminal en el paso 1.",
    tag: "A VALIDAR",
    render: () => <C12Documentos />,
  },
  {
    id: "C13",
    title: "Revisar y enviar",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva/revisar",
    context: "Resumen antes de enviar. Este cliente tiene activado el costo de cancelación, así que tiene que aceptarlo.",
    render: () => <C13Revisar />,
  },
  {
    id: "C14",
    title: "Validando documentos",
    group: G3,
    view: "cliente",
    url: "portal.planir.uy/solicitudes/nueva/validando",
    context: "El portal compara lo declarado con los documentos. En este caso todo coincide y pasa directo a Planir, sin mails.",
    render: () => <C14Validando />,
  },
  {
    id: "C15",
    title: "Solicitud enviada",
    group: G3,
    view: "cliente",
    url: `portal.planir.uy/solicitudes/${STORY_ING}/enviada`,
    context: "Confirmación con los próximos pasos y el contacto de la playa por si necesita asistencia humana.",
    prepare: story(1),
    render: () => <C15Enviada />,
  },
  {
    id: "C20",
    title: "Detalle de solicitud",
    group: G3,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El cliente sigue el estado, ve la validación, los documentos, el historial y los comentarios de Planir.",
    focus: STORY_ING,
    prepare: story(1),
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },

  // 4 · Planir aprueba
  {
    id: "P01",
    title: "Iniciar sesión en la consola",
    group: G4,
    view: "operador",
    url: "consola.planir.uy/ingresar",
    context: "La consola interna de Planir: misma identidad visual, menús según el rol.",
    render: () => <C03Login consola />,
  },
  {
    id: "P02",
    title: "Bandeja de solicitudes",
    group: G4,
    view: "operador",
    url: "consola.planir.uy/bandeja",
    context: "Todo lo que entra por el portal, con filtros por estado y cliente, y alertas: días sin respuesta, detenidas, pedidos de ayuda.",
    prepare: story(1),
    render: () => <P02Bandeja />,
  },
  {
    id: "P03",
    title: "Detalle: pasos internos y aprobación",
    group: G4,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "La validación salió OK. La operadora tilda sus pasos internos y aprueba; el cliente recibe el aviso con la proforma.",
    tag: "A VALIDAR",
    focus: STORY_ING,
    prepare: story(1),
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },
  {
    id: "C22",
    title: "Solicitud aprobada + proforma",
    group: G4,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El cliente ve la aprobación, el comentario de Planir y la proforma. Desde acá, cancelar tiene costo (si está activado).",
    focus: STORY_ING,
    prepare: story(2),
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },
  {
    id: "P08",
    title: "Registrar ingreso real",
    group: G4,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "Cuando el contenedor llega a la playa se registra la fecha real: es la base para calcular la estadía.",
    focus: STORY_ING,
    prepare: story(2),
    render: (f) => <PlanirIngresoDetalle id={f!} dialog="ingreso" />,
  },
  {
    id: "C23",
    title: "Contenedores en playa",
    group: G4,
    view: "cliente",
    url: "portal.planir.uy/contenedores",
    context: "El cliente ve qué tiene en la playa, desde cuándo y cuándo piensa retirarlo. Desde acá cambia la fecha o pide el retiro.",
    prepare: story(3),
    render: () => <C23Contenedores />,
  },

  // 5 · Datos que no coinciden
  {
    id: "C16",
    title: "Solicitud observada",
    group: G5,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "La fecha de llegada y un precinto no coinciden con el BL. El aviso le llega directo al cliente con lo que cargó y lo que dice el documento.",
    focus: "ING-0139",
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },
  {
    id: "C17",
    title: "Corregir y reenviar",
    group: G5,
    view: "cliente",
    url: (f) => `portal.planir.uy/solicitudes/${f}/corregir`,
    context: "El cliente corrige el dato (o reemplaza el documento) y se vuelve a validar. Para probarlo: “Usar este valor” y reenviar.",
    focus: "ING-0139",
    render: (f) => <C17Corregir id={f!} />,
  },
  {
    id: "C18",
    title: "En revisión de Planir (valor anómalo)",
    group: G5,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El peso coincide con el BL pero está fuera de rango (60.000 kg): no se rechaza, pasa a revisión humana.",
    tag: "A VALIDAR",
    focus: "ING-0137",
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },
  {
    id: "C19",
    title: "Pedir ayuda a Planir",
    group: G5,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El cliente siempre tiene una salida para hablar con una persona. El pedido queda en la solicitud y le llega a la operadora.",
    focus: "ING-0137",
    render: (f) => (
      <ClienteIngresoDetalle
        id={f!}
        dialog="ayuda"
        ayudaPreset={{ motivo: "Duda sobre un dato", mensaje: "El peso es correcto: es maquinaria pesada en un contenedor reforzado. ¿Necesitan algún documento extra?" }}
      />
    ),
  },
  {
    id: "P04",
    title: "Revisión humana",
    group: G5,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "La operadora ve por qué quedó en revisión y decide: acepta el valor y sigue, o le pide una corrección al cliente.",
    focus: "ING-0137",
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },
  {
    id: "P05",
    title: "Observada hace 12 días",
    group: G5,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "El cliente no respondió. Planir ve la alerta y puede intervenir de forma personalizada si es una buena carga.",
    focus: "ING-0127",
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },
  {
    id: "P12",
    title: "Pedidos de ayuda",
    group: G5,
    view: "operador",
    url: "consola.planir.uy/ayuda",
    context: "Lista de clientes que pidieron hablar con una persona, con link a la solicitud y su teléfono.",
    render: () => <P12Ayuda />,
  },

  // 6 · Carga IMO
  {
    id: "P13",
    title: "Posible carga IMO no declarada",
    group: GIMO,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "El cliente declaró carga general, pero el BL describe aerosoles de pintura. Sin N° UN ni clase es solo una señal de alerta: pasa a revisión humana y la operadora consulta al cliente.",
    tag: "A VALIDAR",
    focus: IMO_ING,
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },
  {
    id: "C30",
    title: "Planir consulta si es carga IMO",
    group: GIMO,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El cliente ve la consulta junto con la descripción del BL. Hasta que responda, la solicitud queda detenida.",
    focus: IMO_ING,
    prepare: imoStage(1),
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },
  {
    id: "C31",
    title: "Responder: ¿es carga IMO?",
    group: GIMO,
    view: "cliente",
    url: (f) => `portal.planir.uy/solicitudes/${f}/responder`,
    context: "Si es IMO, adjunta la cartilla de seguridad. Si no, la solicitud vuelve a Planir con la confirmación del cliente.",
    focus: IMO_ING,
    prepare: imoStage(1),
    render: (f) => <C17Corregir id={f!} />,
  },
  {
    id: "P14",
    title: "Derivar cartillas a Depósito 24",
    group: GIMO,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "La playa 1704 no recibe IMO, sea cual sea la clase. La operadora deriva las cartillas a Depósito 24; sin su aceptación no se puede aprobar.",
    tag: "A VALIDAR",
    focus: IMO_ING,
    prepare: imoStage(2),
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },
  {
    id: "C32",
    title: "En evaluación de Depósito 24",
    group: GIMO,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El cliente ve que la carga está en evaluación de Depósito 24 y el motivo.",
    focus: IMO_ING,
    prepare: imoStage(3),
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },
  {
    id: "P15",
    title: "Respuesta de Depósito 24",
    group: GIMO,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "Si Depósito 24 acepta, vuelve a pendiente de aprobación. Si no puede recibirla, se rechaza con el motivo precargado.",
    focus: IMO_ING,
    prepare: imoStage(3),
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },

  // 7 · Pendientes, rechazos, cancelación
  {
    id: "P06",
    title: "Dejar pendiente (causa externa)",
    group: G6,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "Paro, clima u horario de la terminal: la solicitud queda detenida con un comentario visible para el cliente. En TCP se suma el motivo “Pago no registrado en TCP”.",
    focus: "ING-0133",
    render: (f) => <PlanirIngresoDetalle id={f!} dialog="pendiente" />,
  },
  {
    id: "C21",
    title: "Pendiente por causa externa",
    group: G6,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "El cliente ve que no es un olvido: está pendiente por un motivo externo y sabe cuándo se retoma.",
    focus: "ING-0133",
    prepare: () => {
      const s = useDemo.getState()
      const i = s.data.ingresos.find((x) => x.id === "ING-0133")
      if (i?.estado === "pendiente_aprobacion")
        s.dejarPendiente("ING-0133", "Paro en la terminal", "Hay paro en Montecon. Retomamos el movimiento apenas se normalice la actividad; le avisaremos por este medio.")
    },
    render: (f) => <ClienteIngresoDetalle id={f!} />,
  },
  {
    id: "P16",
    title: "Pago no registrado en TCP",
    group: G6,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "El cliente informó el pago, pero todavía no figura en TCP y la terminal no libera el contenedor. Queda detenida hasta que se acredite; el paso “Pago verificado en TCP” sigue sin tildar.",
    focus: "ING-0130",
    render: (f) => <PlanirIngresoDetalle id={f!} />,
  },
  {
    id: "P07",
    title: "Rechazar solicitud",
    group: G6,
    view: "operador",
    url: ingUrl("consola.planir.uy"),
    context: "Cuando el pedido no se puede hacer. El motivo es obligatorio y le llega al cliente.",
    focus: "ING-0141",
    render: (f) => (
      <PlanirIngresoDetalle id={f!} dialog="rechazar" rechazoPreset="La naviera informó que el contenedor MEDU3318204 sigue en tránsito a Buenos Aires y no se descarga en Montevideo en este viaje." />
    ),
  },
  {
    id: "C25",
    title: "Cancelar solicitud (con costo)",
    group: G6,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "La solicitud ya fue aprobada y el cliente tiene activado el costo de cancelación: se le avisa antes de confirmar.",
    tag: "A VALIDAR",
    focus: "ING-0136",
    render: (f) => <ClienteIngresoDetalle id={f!} dialog="cancelar" />,
  },

  // 8 · Permanencia y salida
  {
    id: "C24",
    title: "Cambiar fecha estimada de salida",
    group: G7,
    view: "cliente",
    url: ingUrl("portal.planir.uy"),
    context: "La salida estimada cambia seguido. Queda el historial de fechas y se calcula el suplemento por estadía.",
    focus: STORY_ING,
    prepare: story(3),
    render: (f) => <ClienteIngresoDetalle id={f!} dialog="fecha" />,
  },
  {
    id: "C26",
    title: "Solicitar retiro",
    group: G7,
    view: "cliente",
    url: (f) => `portal.planir.uy/solicitudes/${f}/retiro`,
    context: "Reutiliza los datos del ingreso: elige contenedores y fecha. Ve la proforma y si tiene que pagar antes de retirar.",
    tag: "A VALIDAR",
    focus: STORY_ING,
    prepare: story(4),
    render: (f) => <C26SolicitarRetiro id={f!} />,
  },
  {
    id: "P10",
    title: "Solicitud de salida",
    group: G7,
    view: "operador",
    url: (f) => `consola.planir.uy/salidas/${f}`,
    context: "Planir verifica los requisitos. Como el cliente es de pago previo, el retiro espera la confirmación de Administración.",
    focus: STORY_SAL,
    prepare: story(5),
    render: (f) => <PlanirSalidaDetalle id={f!} />,
  },
  {
    id: "C27",
    title: "Pendiente de pago",
    group: G7,
    view: "cliente",
    url: (f) => `portal.planir.uy/salidas/${f}`,
    context: "Como un peaje: el cliente ve el importe, los datos para transferir y puede adjuntar el comprobante. Sin pasarela de pago.",
    tag: "A VALIDAR",
    focus: STORY_SAL,
    prepare: story(5),
    render: (f) => <ClienteSalidaDetalle id={f!} />,
  },
  {
    id: "A04",
    title: "Pagos a confirmar",
    group: G7,
    view: "admin",
    url: "consola.planir.uy/pagos",
    context: "Administración ve los retiros pendientes de pago y marca el pago como recibido. El retiro se habilita solo.",
    prepare: story(5),
    render: () => <A04Pagos />,
  },
  {
    id: "C28",
    title: "Retiro habilitado",
    group: G7,
    view: "cliente",
    url: (f) => `portal.planir.uy/salidas/${f}`,
    context: "El cliente recibe la confirmación del pago y los datos para el transportista.",
    focus: STORY_SAL,
    prepare: story(6),
    render: (f) => <ClienteSalidaDetalle id={f!} />,
  },
  {
    id: "P11",
    title: "Registrar salida real",
    group: G7,
    view: "operador",
    url: (f) => `consola.planir.uy/salidas/${f}`,
    context: "Con la salida real se calculan los días de estadía y se adjunta la constancia de salida.",
    focus: STORY_SAL,
    prepare: story(6),
    render: (f) => <PlanirSalidaDetalle id={f!} dialog="salida" />,
  },
  {
    id: "C29",
    title: "Salida completada",
    group: G7,
    view: "cliente",
    url: (f) => `portal.planir.uy/salidas/${f}`,
    context: "Cierre: días reales de estadía por contenedor y documentos de salida. Todo queda registrado en el mismo pedido.",
    focus: STORY_SAL,
    prepare: story(7),
    render: (f) => <ClienteSalidaDetalle id={f!} />,
  },
  {
    id: "P09",
    title: "Contenedores en playa",
    group: G7,
    view: "operador",
    url: "consola.planir.uy/contenedores",
    context: "Inventario: días de estadía, salidas próximas, carga IMO (en Depósito 24) y estado de cada retiro.",
    render: () => <P09Inventario />,
  },

  // 9 · Administración
  {
    id: "A01",
    title: "Clientes y condiciones",
    group: G8,
    view: "admin",
    url: "consola.planir.uy/clientes",
    context: "Por cliente: cuenta corriente o pago previo, y costo de cancelación activado o no. Se cambia directo desde la tabla.",
    render: () => <A01Clientes />,
  },
  {
    id: "A02",
    title: "Nuevo cliente e invitación",
    group: G8,
    view: "admin",
    url: "consola.planir.uy/clientes/nuevo",
    context: "Alta de la empresa con sus condiciones comerciales y el primer usuario, que recibe la invitación (pantalla C01).",
    render: () => <A02NuevoCliente />,
  },
  {
    id: "A03",
    title: "Detalle de cliente",
    group: G8,
    view: "admin",
    url: (f) => `consola.planir.uy/clientes/${f}`,
    context: "Usuarios, historial de solicitudes, cancelaciones previas y condiciones. Desde acá se invitan más usuarios.",
    focus: "c-rambla",
    render: (f) => <A03DetalleCliente id={f!} />,
  },
  {
    id: "A05",
    title: "Proformas y suplementos",
    group: G8,
    view: "admin",
    url: "consola.planir.uy/proformas",
    context: "Proforma al aprobar, suplementos por cambio de fecha y total. Las cerradas quedan listas para facturar.",
    render: () => <A05Proformas />,
  },
  {
    id: "A06",
    title: "Estadías",
    group: G8,
    view: "admin",
    url: "consola.planir.uy/estadias",
    context: "Días reales por contenedor, para cruzar con ImporSys y facturar sin diferencias con el Excel.",
    render: () => <A06Estadias />,
  },
]

registerPrepares(Object.fromEntries(SCREENS.filter((s) => s.prepare).map((s) => [s.id, s.prepare!])))
