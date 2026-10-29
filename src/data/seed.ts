import type { Check, Cliente, Contenedor, Ingreso, Notificacion, PedidoAyuda, Salida } from "./types"

// Tarifas ilustrativas (USD)
export const TARIFA_TRASLADO = 180
export const TARIFA_ESTADIA_DIA = 12
export const TARIFA_IMO = 90
export const PESO_MAXIMO = 32500

export const MAIL_PLAYA = "playa@planir.uy"
export const TEL_PLAYA = "+598 2915 4400"

export const TERMINALES = ["TCP · Terminal Cuenca del Plata", "Montecon", "Otra terminal"]
export const TIPOS_CONTENEDOR = ["20' DV", "40' DV", "40' HC", "40' RH (reefer)"]

export const PASOS_INTERNOS = [
  "Mensaje simplificado en ImporSys",
  "Orden de trabajo (OT) generada",
  "OT timbrada por Aduana",
  "Transporte coordinado",
]

export const CLIENTE_DEMO = "c-rambla"
export const USUARIO_DEMO = "Lucía Méndez"
export const OPERADORA = "Sofía Pereira"
export const ADMINISTRACION = "Martín Ruiz"

export const daysBetween = (from: string, to: string) =>
  Math.max(0, Math.round((new Date(to.slice(0, 10)).getTime() - new Date(from.slice(0, 10)).getTime()) / 86400000))

export function proformaIngreso(cantidad: number, desde: string, hasta: string, imo: boolean) {
  const dias = daysBetween(desde, hasta)
  return [
    { concepto: `Traslado terminal → playa (${cantidad} × USD ${TARIFA_TRASLADO})`, monto: cantidad * TARIFA_TRASLADO },
    { concepto: `Estadía estimada (${dias} días × ${cantidad} cont. × USD ${TARIFA_ESTADIA_DIA})`, monto: dias * cantidad * TARIFA_ESTADIA_DIA },
    ...(imo ? [{ concepto: `Manipuleo carga IMO (${cantidad} × USD ${TARIFA_IMO})`, monto: cantidad * TARIFA_IMO }] : []),
  ]
}

const ctr = (numero: string, tipo: string, precinto: string, peso: number, salida: string, extra: Partial<Contenedor> = {}): Contenedor => ({
  numero,
  tipo,
  precinto,
  peso,
  salidasEstimadas: [{ fecha: salida, registrado: "", motivo: "Estimada al ingresar" }],
  ...extra,
})

/** Chequeos estándar con todo coincidiendo. */
export function checksOk(i: Pick<Ingreso, "barco" | "viaje" | "bl" | "terminal" | "fechaLlegada" | "contenedores" | "imo">): Check[] {
  const fecha = i.fechaLlegada.split("-").reverse().join("/")
  return [
    { dato: "Barco y viaje", declarado: `${i.barco} · ${i.viaje}`, leido: `${i.barco} · ${i.viaje}`, documento: "BL", resultado: "ok" },
    { dato: "N° de BL", declarado: i.bl, leido: i.bl, documento: "BL", resultado: "ok" },
    { dato: "Fecha estimada de llegada", declarado: fecha, leido: fecha, documento: "BL", resultado: "ok" },
    { dato: "Terminal de origen", declarado: i.terminal.split(" · ")[0], leido: i.terminal.split(" · ")[0], documento: "Delivery Order", resultado: "ok" },
    { dato: "Cantidad de contenedores", declarado: String(i.contenedores.length), leido: String(i.contenedores.length), documento: "BL", resultado: "ok" },
    ...i.contenedores.flatMap((c): Check[] => [
      { dato: `Contenedor ${c.numero}`, declarado: c.numero, leido: c.numero, documento: "BL · Delivery Order", resultado: "ok" },
      { dato: `Precinto ${c.numero}`, declarado: c.precinto, leido: c.precinto, documento: "BL", resultado: "ok" },
      {
        dato: `Peso bruto ${c.numero}`,
        declarado: `${c.peso.toLocaleString("es-UY")} kg`,
        leido: `${c.peso.toLocaleString("es-UY")} kg`,
        documento: "BL",
        resultado: c.peso > PESO_MAXIMO ? "warning" : "ok",
        nota: c.peso > PESO_MAXIMO ? `Fuera de rango (máx. ${PESO_MAXIMO.toLocaleString("es-UY")} kg)` : undefined,
      },
    ]),
    i.imo
      ? { dato: "Carga IMO", declarado: "Sí", leido: "Cartilla de seguridad presente", documento: "Cartilla IMO", resultado: "ok" }
      : { dato: "Carga IMO", declarado: "No", leido: "Sin requisitos extra", documento: "—", resultado: "ok" },
  ]
}

const pasos = (done: boolean) => PASOS_INTERNOS.map((label) => ({ label, done }))

type IngresoBase = Omit<Ingreso, "validacion" | "pasos" | "comentarios" | "historial" | "proforma"> &
  Partial<Pick<Ingreso, "validacion" | "pasos" | "comentarios" | "historial" | "proforma">>

function ingreso(i: IngresoBase): Ingreso {
  const salida = i.contenedores[0]?.salidasEstimadas[0]?.fecha ?? i.fechaMovimiento
  return {
    validacion: checksOk(i),
    pasos: pasos(["aprobada", "ingresada", "cerrada"].includes(i.estado)),
    comentarios: [],
    historial: [
      { fecha: `${i.creado}T09:10`, actor: "cliente", texto: `Solicitud presentada por ${i.creadoPor}` },
      { fecha: `${i.creado}T09:11`, actor: "sistema", texto: "Documentos validados automáticamente" },
    ],
    proforma: proformaIngreso(i.contenedores.length, i.fechaMovimiento, salida, i.imo),
    ...i,
  }
}

export const seedClientes: Cliente[] = [
  {
    id: "c-rambla",
    razonSocial: "Importadora Rambla S.A.",
    rut: "21 448 120 0017",
    telefono: "+598 2600 1180",
    condicionPago: "pago_previo",
    costoCancelacion: true,
    montoCancelacion: 150,
    cancelacionesPrevias: 3,
    clienteDesde: "2024-03-12",
    usuarios: [
      { nombre: "Diego Suárez", email: "dsuarez@importadorarambla.com.uy", cargo: "Jefe de logística", estado: "activo" },
      { nombre: "Lucía Méndez", email: "lmendez@importadorarambla.com.uy", cargo: "Analista de comercio exterior", estado: "invitado" },
    ],
  },
  {
    id: "c-frio",
    razonSocial: "Frío Austral S.A.",
    rut: "21 702 334 0012",
    telefono: "+598 2508 7731",
    condicionPago: "cuenta_corriente",
    costoCancelacion: false,
    montoCancelacion: 150,
    cancelacionesPrevias: 0,
    clienteDesde: "2019-08-01",
    usuarios: [{ nombre: "Martín Ferreira", email: "mferreira@frioaustral.com.uy", cargo: "Gerente de operaciones", estado: "activo" }],
  },
  {
    id: "c-agro",
    razonSocial: "Agroquímica del Litoral S.R.L.",
    rut: "21 915 007 0019",
    telefono: "+598 4722 3390",
    condicionPago: "pago_previo",
    costoCancelacion: true,
    montoCancelacion: 150,
    cancelacionesPrevias: 1,
    clienteDesde: "2022-11-20",
    usuarios: [{ nombre: "Valeria Rodríguez", email: "vrodriguez@agrolitoral.com.uy", cargo: "Comercio exterior", estado: "activo" }],
  },
  {
    id: "c-cv",
    razonSocial: "Distribuidora Ciudad Vieja S.A.",
    rut: "21 330 815 0014",
    telefono: "+598 2916 4402",
    condicionPago: "cuenta_corriente",
    costoCancelacion: false,
    montoCancelacion: 150,
    cancelacionesPrevias: 0,
    clienteDesde: "2021-05-04",
    usuarios: [{ nombre: "Andrés Pintos", email: "apintos@dcvieja.com.uy", cargo: "Despachante", estado: "activo" }],
  },
  {
    id: "c-pc",
    razonSocial: "Logística Punta Carretas S.A.",
    rut: "21 587 442 0011",
    telefono: "+598 2711 9020",
    condicionPago: "pago_previo",
    costoCancelacion: true,
    montoCancelacion: 150,
    cancelacionesPrevias: 4,
    clienteDesde: "2025-02-17",
    usuarios: [{ nombre: "Carolina Silva", email: "csilva@lpc.com.uy", cargo: "Coordinadora logística", estado: "activo" }],
  },
]

const ing139Base = {
  barco: "CAP SAN LORENZO",
  viaje: "643S",
  bl: "MEDUYA175110",
  terminal: "TCP · Terminal Cuenca del Plata",
  fechaLlegada: "2026-11-03",
  imo: false,
  contenedores: [ctr("MSCU4471023", "20' DV", "FJ27701188", 18240, "2026-11-20")],
}

export const seedIngresos: Ingreso[] = [
  // ---- Importadora Rambla (cliente demo) ----
  ingreso({
    id: "ING-0139",
    clienteId: "c-rambla",
    creadoPor: "Diego Suárez",
    ...ing139Base,
    fechaMovimiento: "2026-11-04",
    documentos: [
      { tipo: "BL", nombre: "BL_MEDUYA175110.pdf", estado: "observado" },
      { tipo: "DO", nombre: "DO_TCP_1601127.pdf", estado: "validado", contenedor: "MSCU4471023" },
    ],
    validacion: checksOk(ing139Base).map((c) =>
      c.dato === "Fecha estimada de llegada"
        ? { ...c, leido: "03/12/2026", resultado: "error" as const }
        : c.dato === "Precinto MSCU4471023"
          ? { ...c, leido: "FJ27701183", resultado: "error" as const }
          : c,
    ),
    historial: [
      { fecha: "2026-10-26T15:02", actor: "cliente", texto: "Solicitud presentada por Diego Suárez" },
      { fecha: "2026-10-26T15:03", actor: "sistema", texto: "Observada: 2 datos no coinciden con el BL" },
    ],
    estado: "observada",
    creado: "2026-10-26",
    actualizado: "2026-10-26",
    diasSinRespuesta: 2,
  }),
  ingreso({
    id: "ING-0137",
    clienteId: "c-rambla",
    creadoPor: "Diego Suárez",
    barco: "MAERSK LIMA",
    viaje: "641W",
    bl: "MAEU251190876",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-30",
    fechaMovimiento: "2026-10-31",
    imo: false,
    contenedores: [ctr("MRKU5523190", "40' HC", "ML4410287", 60000, "2026-11-14")],
    documentos: [
      { tipo: "BL", nombre: "BL_MAEU251190876.pdf", estado: "en_revision" },
      { tipo: "DO", nombre: "DO_TCP_1600982.pdf", estado: "validado", contenedor: "MRKU5523190" },
    ],
    historial: [
      { fecha: "2026-10-25T11:20", actor: "cliente", texto: "Solicitud presentada por Diego Suárez" },
      { fecha: "2026-10-25T11:21", actor: "sistema", texto: "En revisión de Planir: peso fuera de rango" },
    ],
    estado: "revision",
    creado: "2026-10-25",
    actualizado: "2026-10-25",
  }),
  ingreso({
    id: "ING-0136",
    clienteId: "c-rambla",
    creadoPor: "Diego Suárez",
    barco: "CMA CGM ARGENTINA",
    viaje: "0MX4ES",
    bl: "CMDUUYM0298814",
    terminal: "Montecon",
    fechaLlegada: "2026-11-02",
    fechaMovimiento: "2026-11-04",
    imo: false,
    contenedores: [
      ctr("CMAU3302178", "20' DV", "CA0918273", 14310, "2026-11-18"),
      ctr("CMAU3309911", "20' DV", "CA0918274", 13980, "2026-11-18"),
    ],
    documentos: [
      { tipo: "BL", nombre: "BL_CMDUUYM0298814.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_Montecon_1594702.pdf", estado: "validado", contenedor: "CMAU3302178" },
      { tipo: "DO", nombre: "DO_Montecon_1594703.pdf", estado: "validado", contenedor: "CMAU3309911" },
    ],
    historial: [
      { fecha: "2026-10-24T10:05", actor: "cliente", texto: "Solicitud presentada por Diego Suárez" },
      { fecha: "2026-10-24T10:06", actor: "sistema", texto: "Documentos validados automáticamente" },
      { fecha: "2026-10-27T16:40", actor: "planir", texto: "Aprobada por Sofía Pereira" },
    ],
    estado: "aprobada",
    creado: "2026-10-24",
    actualizado: "2026-10-27",
  }),
  ingreso({
    id: "ING-0133",
    clienteId: "c-rambla",
    creadoPor: "Diego Suárez",
    barco: "KOTA PAHLAWAN",
    viaje: "043E",
    bl: "PCIUSHA0614402",
    terminal: "Montecon",
    fechaLlegada: "2026-10-27",
    fechaMovimiento: "2026-10-29",
    imo: false,
    contenedores: [ctr("CAAU8381089", "40' HC", "PL7730291", 21470, "2026-11-12")],
    documentos: [
      { tipo: "BL", nombre: "BL_PCIUSHA0614402.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DeliveryOrder_Montecon_1594773.pdf", estado: "validado", contenedor: "CAAU8381089" },
    ],
    estado: "pendiente_aprobacion",
    creado: "2026-10-24",
    actualizado: "2026-10-24",
  }),
  ingreso({
    id: "ING-0124",
    clienteId: "c-rambla",
    creadoPor: "Diego Suárez",
    barco: "MSC SARA ELENA",
    viaje: "NX642A",
    bl: "MEDUYA168877",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-15",
    fechaMovimiento: "2026-10-17",
    imo: false,
    contenedores: [ctr("MSDU2209174", "20' DV", "FJ27511902", 16420, "2026-11-03", { ingresoReal: "2026-10-17T10:30" })],
    documentos: [
      { tipo: "BL", nombre: "BL_MEDUYA168877.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_TCP_1598840.pdf", estado: "validado", contenedor: "MSDU2209174" },
    ],
    estado: "ingresada",
    creado: "2026-10-13",
    actualizado: "2026-10-17",
  }),
  ingreso({
    id: "ING-0109",
    clienteId: "c-rambla",
    creadoPor: "Diego Suárez",
    barco: "MSC ROMA",
    viaje: "NX639R",
    bl: "MEDUYA161204",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-02",
    fechaMovimiento: "2026-10-03",
    imo: false,
    contenedores: [
      ctr("MSMU7710023", "40' HC", "FJ27330017", 9820, "2026-10-17", { ingresoReal: "2026-10-03T09:15", salidaReal: "2026-10-20T15:40", salidaId: "SAL-0049" }),
      ctr("MSMU7712261", "40' HC", "FJ27330018", 10110, "2026-10-17", { ingresoReal: "2026-10-03T09:15", salidaReal: "2026-10-20T15:40", salidaId: "SAL-0049" }),
    ],
    documentos: [
      { tipo: "BL", nombre: "BL_MEDUYA161204.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_TCP_1597112.pdf", estado: "validado", contenedor: "MSMU7710023" },
      { tipo: "DO", nombre: "DO_TCP_1597113.pdf", estado: "validado", contenedor: "MSMU7712261" },
    ],
    estado: "cerrada",
    creado: "2026-09-30",
    actualizado: "2026-10-20",
  }),

  // ---- Frío Austral (cuenta corriente) ----
  ingreso({
    id: "ING-0140",
    clienteId: "c-frio",
    creadoPor: "Martín Ferreira",
    barco: "MSC LETIZIA",
    viaje: "NX643A",
    bl: "MEDUYA176032",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-31",
    fechaMovimiento: "2026-11-02",
    imo: false,
    contenedores: [
      ctr("MEDU9134520", "40' RH (reefer)", "FJ27712001", 27410, "2026-11-10"),
      ctr("MEDU9134811", "40' RH (reefer)", "FJ27712002", 27190, "2026-11-10"),
      ctr("MEDU9135022", "40' RH (reefer)", "FJ27712003", 26980, "2026-11-10"),
    ],
    documentos: [
      { tipo: "BL", nombre: "BL_MEDUYA176032.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_TCP_1601302.pdf", estado: "validado", contenedor: "MEDU9134520" },
      { tipo: "DO", nombre: "DO_TCP_1601303.pdf", estado: "validado", contenedor: "MEDU9134811" },
      { tipo: "DO", nombre: "DO_TCP_1601304.pdf", estado: "validado", contenedor: "MEDU9135022" },
    ],
    estado: "pendiente_aprobacion",
    creado: "2026-10-27",
    actualizado: "2026-10-27",
  }),
  ingreso({
    id: "ING-0126",
    clienteId: "c-frio",
    creadoPor: "Martín Ferreira",
    barco: "CAP SAN ANTONIO",
    viaje: "640S",
    bl: "SUDU26A0R4471",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-18",
    fechaMovimiento: "2026-10-19",
    imo: false,
    contenedores: [
      ctr("SUDU8812239", "40' HC", "HS0041120", 22300, "2026-11-02", { ingresoReal: "2026-10-19T11:05", salidaId: "SAL-0055" }),
      ctr("SUDU8814410", "40' HC", "HS0041121", 21950, "2026-11-02", { ingresoReal: "2026-10-19T11:05", salidaId: "SAL-0055" }),
    ],
    documentos: [
      { tipo: "BL", nombre: "BL_SUDU26A0R4471.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_TCP_1599050.pdf", estado: "validado", contenedor: "SUDU8812239" },
      { tipo: "DO", nombre: "DO_TCP_1599051.pdf", estado: "validado", contenedor: "SUDU8814410" },
    ],
    estado: "ingresada",
    creado: "2026-10-16",
    actualizado: "2026-10-19",
  }),
  ingreso({
    id: "ING-0112",
    clienteId: "c-frio",
    creadoPor: "Martín Ferreira",
    barco: "MSC ROMA",
    viaje: "NX639R",
    bl: "MEDUYA161377",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-09-30",
    fechaMovimiento: "2026-10-01",
    imo: false,
    contenedores: [ctr("MEDU9120044", "40' RH (reefer)", "FJ27330101", 26800, "2026-10-14", { ingresoReal: "2026-10-01T10:00", salidaReal: "2026-10-15T09:30", salidaId: "SAL-0046" })],
    documentos: [{ tipo: "BL", nombre: "BL_MEDUYA161377.pdf", estado: "validado" }],
    estado: "cerrada",
    creado: "2026-09-28",
    actualizado: "2026-10-15",
  }),

  // ---- Agroquímica del Litoral (pago previo, IMO) ----
  ingreso({
    id: "ING-0128",
    clienteId: "c-agro",
    creadoPor: "Valeria Rodríguez",
    barco: "MAIPO",
    viaje: "V.2411S",
    bl: "HLCUVER2409118",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-13",
    fechaMovimiento: "2026-10-14",
    imo: true,
    contenedores: [ctr("TCNU7738102", "40' HC", "LAB135380", 5245.8, "2026-10-30", { ingresoReal: "2026-10-14T13:20", salidaId: "SAL-0056" })],
    documentos: [
      { tipo: "BL", nombre: "BL_HLCUVER2409118.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_TCP_1598611.pdf", estado: "validado", contenedor: "TCNU7738102" },
      { tipo: "IMO", nombre: "Cartilla_IMO_MAIPO_V2411S.pdf", estado: "validado" },
    ],
    estado: "ingresada",
    creado: "2026-10-10",
    actualizado: "2026-10-14",
  }),
  ingreso({
    id: "ING-0105",
    clienteId: "c-agro",
    creadoPor: "Valeria Rodríguez",
    barco: "MAIPO",
    viaje: "V.2409S",
    bl: "HLCUVER2408802",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-09-24",
    fechaMovimiento: "2026-09-25",
    imo: true,
    contenedores: [ctr("TCNU7731550", "40' HC", "LAB131022", 6120, "2026-10-09", { ingresoReal: "2026-09-25T12:00", salidaReal: "2026-10-10T10:45", salidaId: "SAL-0044" })],
    documentos: [{ tipo: "BL", nombre: "BL_HLCUVER2408802.pdf", estado: "validado" }],
    estado: "cerrada",
    creado: "2026-09-22",
    actualizado: "2026-10-10",
  }),

  // ---- Distribuidora Ciudad Vieja (observada hace 12 días) ----
  ingreso({
    id: "ING-0127",
    clienteId: "c-cv",
    creadoPor: "Andrés Pintos",
    barco: "MSC ANTONELLA",
    viaje: "NX640A",
    bl: "MEDUYA166610",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-20",
    fechaMovimiento: "2026-10-21",
    imo: false,
    contenedores: [ctr("MSCU6620158", "20' DV", "FJ27499310", 17650, "2026-11-05")],
    documentos: [
      { tipo: "BL", nombre: "BL_MEDUYA166610.pdf", estado: "observado" },
      { tipo: "DO", nombre: "DO_TCP_1598702.pdf", estado: "validado", contenedor: "MSCU6620158" },
    ],
    validacion: checksOk({
      barco: "MSC ANTONELLA",
      viaje: "NX640A",
      bl: "MEDUYA166610",
      terminal: "TCP · Terminal Cuenca del Plata",
      fechaLlegada: "2026-10-20",
      imo: false,
      contenedores: [ctr("MSCU6620158", "20' DV", "FJ27499310", 17650, "2026-11-05")],
    }).map((c) =>
      c.dato === "Contenedor MSCU6620158" ? { ...c, leido: "MSCU6620185", resultado: "error" as const, nota: "El número no figura en el BL" } : c,
    ),
    historial: [
      { fecha: "2026-10-16T09:40", actor: "cliente", texto: "Solicitud presentada por Andrés Pintos" },
      { fecha: "2026-10-16T09:41", actor: "sistema", texto: "Observada: el contenedor no figura en el BL" },
    ],
    estado: "observada",
    creado: "2026-10-16",
    actualizado: "2026-10-16",
    diasSinRespuesta: 12,
  }),

  // ---- Logística Punta Carretas (pago previo) ----
  ingreso({
    id: "ING-0135",
    clienteId: "c-pc",
    creadoPor: "Carolina Silva",
    barco: "ZIM ROTTERDAM",
    viaje: "18E",
    bl: "ZIMUMVD8830142",
    terminal: "Montecon",
    fechaLlegada: "2026-10-30",
    fechaMovimiento: "2026-11-01",
    imo: false,
    contenedores: [ctr("ZCSU8820017", "40' HC", "ZM5520981", 19870, "2026-11-15")],
    documentos: [
      { tipo: "BL", nombre: "BL_ZIMUMVD8830142_scan.pdf", estado: "ilegible" },
      { tipo: "DO", nombre: "DO_Montecon_1594790.pdf", estado: "validado", contenedor: "ZCSU8820017" },
    ],
    validacion: [
      { dato: "Documento BL", declarado: "ZIMUMVD8830142", leido: "No se pudo leer", documento: "BL", resultado: "warning", nota: "Escaneo borroso: necesita revisión humana" },
    ],
    historial: [
      { fecha: "2026-10-24T17:12", actor: "cliente", texto: "Solicitud presentada por Carolina Silva" },
      { fecha: "2026-10-24T17:13", actor: "sistema", texto: "En revisión de Planir: BL ilegible" },
    ],
    estado: "revision",
    creado: "2026-10-24",
    actualizado: "2026-10-24",
  }),
  ingreso({
    id: "ING-0141",
    clienteId: "c-pc",
    creadoPor: "Carolina Silva",
    barco: "MSC LETIZIA",
    viaje: "NX643A",
    bl: "MEDUYA176118",
    terminal: "TCP · Terminal Cuenca del Plata",
    fechaLlegada: "2026-10-31",
    fechaMovimiento: "2026-11-02",
    imo: false,
    contenedores: [ctr("MEDU3318204", "20' DV", "FJ27712240", 15400, "2026-11-09")],
    documentos: [
      { tipo: "BL", nombre: "BL_MEDUYA176118.pdf", estado: "validado" },
      { tipo: "DO", nombre: "DO_TCP_1601340.pdf", estado: "validado", contenedor: "MEDU3318204" },
    ],
    estado: "pendiente_aprobacion",
    creado: "2026-10-27",
    actualizado: "2026-10-27",
  }),
]

export const seedSalidas: Salida[] = [
  {
    id: "SAL-0056",
    ingresoId: "ING-0128",
    clienteId: "c-agro",
    contenedores: ["TCNU7738102"],
    fechaRetiro: "2026-10-30",
    estado: "pendiente_pago",
    proforma: [
      { concepto: "Traslado terminal → playa (1 × USD 180)", monto: 180 },
      { concepto: "Estadía (16 días × 1 cont. × USD 12)", monto: 192 },
      { concepto: "Manipuleo carga IMO (1 × USD 90)", monto: 90 },
    ],
    comprobante: "Transferencia_BROU_28-10.pdf",
    solicitada: "2026-10-27",
    documentos: [],
  },
  {
    id: "SAL-0055",
    ingresoId: "ING-0126",
    clienteId: "c-frio",
    contenedores: ["SUDU8812239", "SUDU8814410"],
    fechaRetiro: "2026-11-02",
    estado: "habilitada",
    proforma: [
      { concepto: "Traslado terminal → playa (2 × USD 180)", monto: 360 },
      { concepto: "Estadía (14 días × 2 cont. × USD 12)", monto: 336 },
    ],
    solicitada: "2026-10-26",
    documentos: [],
  },
  {
    id: "SAL-0049",
    ingresoId: "ING-0109",
    clienteId: "c-rambla",
    contenedores: ["MSMU7710023", "MSMU7712261"],
    fechaRetiro: "2026-10-20",
    estado: "retirada",
    proforma: [
      { concepto: "Traslado terminal → playa (2 × USD 180)", monto: 360 },
      { concepto: "Estadía (17 días × 2 cont. × USD 12)", monto: 408 },
    ],
    solicitada: "2026-10-16",
    pagoConfirmado: "2026-10-19",
    documentos: [{ tipo: "SALIDA", nombre: "Constancia_salida_SAL-0049.pdf", estado: "validado" }],
  },
  {
    id: "SAL-0046",
    ingresoId: "ING-0112",
    clienteId: "c-frio",
    contenedores: ["MEDU9120044"],
    fechaRetiro: "2026-10-15",
    estado: "retirada",
    proforma: [
      { concepto: "Traslado terminal → playa (1 × USD 180)", monto: 180 },
      { concepto: "Estadía (14 días × 1 cont. × USD 12)", monto: 168 },
    ],
    solicitada: "2026-10-13",
    documentos: [{ tipo: "SALIDA", nombre: "Constancia_salida_SAL-0046.pdf", estado: "validado" }],
  },
  {
    id: "SAL-0044",
    ingresoId: "ING-0105",
    clienteId: "c-agro",
    contenedores: ["TCNU7731550"],
    fechaRetiro: "2026-10-10",
    estado: "retirada",
    proforma: [
      { concepto: "Traslado terminal → playa (1 × USD 180)", monto: 180 },
      { concepto: "Estadía (15 días × 1 cont. × USD 12)", monto: 180 },
      { concepto: "Manipuleo carga IMO (1 × USD 90)", monto: 90 },
    ],
    solicitada: "2026-10-08",
    pagoConfirmado: "2026-10-09",
    documentos: [{ tipo: "SALIDA", nombre: "Constancia_salida_SAL-0044.pdf", estado: "validado" }],
  },
]

export const seedNotificaciones: Notificacion[] = [
  { id: "n1", para: "cliente", fecha: "2026-10-27T16:40", texto: "ING-0136 fue aprobada. Ya podés ver la proforma.", ref: "ING-0136", leida: false, tono: "ok" },
  { id: "n2", para: "cliente", fecha: "2026-10-26T15:03", texto: "ING-0139 tiene 2 datos que no coinciden con el BL. Revisalos y reenviá.", ref: "ING-0139", leida: false, tono: "error" },
  { id: "n3", para: "cliente", fecha: "2026-10-25T11:21", texto: "ING-0137 quedó en revisión de Planir: peso fuera de rango.", ref: "ING-0137", leida: false, tono: "warn" },
  { id: "n4", para: "cliente", fecha: "2026-10-17T10:30", texto: "El contenedor MSDU2209174 (ING-0124) ingresó a la playa.", ref: "ING-0124", leida: true, tono: "info" },
  { id: "p1", para: "planir", fecha: "2026-10-27T18:05", texto: "Frío Austral pidió ayuda en ING-0140.", ref: "ING-0140", leida: false, tono: "warn" },
  { id: "p2", para: "planir", fecha: "2026-10-27T14:22", texto: "Nueva solicitud ING-0141 de Logística Punta Carretas lista para revisar.", ref: "ING-0141", leida: false, tono: "info" },
  { id: "p3", para: "planir", fecha: "2026-10-28T08:50", texto: "Agroquímica del Litoral adjuntó el comprobante de SAL-0056.", ref: "SAL-0056", leida: false, tono: "info" },
]

export const seedAyuda: PedidoAyuda[] = [
  {
    id: "h1",
    clienteId: "c-frio",
    ref: "ING-0140",
    usuario: "Martín Ferreira",
    motivo: "Cambio de fecha",
    mensaje: "¿Pueden traer los reefers antes del jueves? Tenemos un embarque de exportación que depende de esto.",
    fecha: "2026-10-27T18:05",
    resuelto: false,
  },
]

/** Datos precargados del formulario de nueva solicitud (camino feliz, tomados del BL de ejemplo de MSC). */
export const draftInicial = {
  barco: "HUAN BAO 68",
  viaje: "260710",
  bl: "MEDUYA172632",
  terminal: "TCP · Terminal Cuenca del Plata",
  fechaLlegada: "2026-10-30",
  fechaMovimiento: "2026-10-31",
  fechaSalida: "2026-11-05",
  imo: false,
  contenedores: [
    { numero: "MSNU8293351", tipo: "40' HC", precinto: "FJ27657254", peso: 5631.9 },
    { numero: "MSNU8299238", tipo: "40' HC", precinto: "FJ27657255", peso: 5613.4 },
  ],
  // claves: "BL", "IMO", "DO:<contenedor>"
  documentos: {} as Record<string, string>,
}

export type Draft = typeof draftInicial
