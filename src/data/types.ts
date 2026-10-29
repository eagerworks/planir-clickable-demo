export type CondicionPago = "cuenta_corriente" | "pago_previo"

export interface Usuario {
  nombre: string
  email: string
  cargo: string
  estado: "activo" | "invitado"
}

export interface Cliente {
  id: string
  razonSocial: string
  rut: string
  telefono: string
  condicionPago: CondicionPago
  costoCancelacion: boolean
  montoCancelacion: number
  usuarios: Usuario[]
  cancelacionesPrevias: number
  clienteDesde: string
}

export type EstadoIngreso =
  | "borrador"
  | "observada"
  | "revision"
  | "pendiente_aprobacion"
  | "pendiente_externo"
  | "aprobada"
  | "ingresada"
  | "cerrada"
  | "rechazada"
  | "cancelada"

export type EstadoSalida = "pendiente_pago" | "habilitada" | "retirada"

export type TipoDocumento = "BL" | "DO" | "PAGO" | "IMO" | "COMPROBANTE" | "SALIDA"

export interface Documento {
  tipo: TipoDocumento
  nombre: string
  estado: "validado" | "observado" | "ilegible" | "en_revision"
  contenedor?: string
}

export interface CambioSalida {
  fecha: string // nueva fecha estimada
  registrado: string
  motivo: string
  suplemento?: number
}

export interface Contenedor {
  numero: string
  tipo: string
  precinto: string
  peso: number
  ingresoReal?: string
  salidaReal?: string
  /** Historial de fechas estimadas de salida; la última es la vigente. */
  salidasEstimadas: CambioSalida[]
  salidaId?: string
}

export type ResultadoCheck = "ok" | "error" | "warning"

export interface Check {
  dato: string
  declarado: string
  leido: string
  documento: string
  resultado: ResultadoCheck
  nota?: string
}

export interface Evento {
  fecha: string
  actor: "cliente" | "sistema" | "planir"
  texto: string
}

export interface Comentario {
  fecha: string
  autor: string
  texto: string
  deCliente?: boolean
}

export interface ItemProforma {
  concepto: string
  monto: number
}

export interface Ingreso {
  id: string
  clienteId: string
  creadoPor: string
  barco: string
  viaje: string
  bl: string
  terminal: string
  fechaLlegada: string
  fechaMovimiento: string
  imo: boolean
  /** N° UN, clase y descripción de la carga peligrosa, según la cartilla o el BL. */
  imoDetalle?: string
  /** La playa 1704 no recibe IMO: Depósito 24 evalúa si puede hacer el traslado y almacenamiento. */
  evaluacionD24?: "pendiente" | "aceptada"
  /** Descripción de la mercadería tal como figura en el BL. */
  mercaderia?: string
  contenedores: Contenedor[]
  documentos: Documento[]
  validacion: Check[]
  pasos: { label: string; done: boolean }[]
  comentarios: Comentario[]
  historial: Evento[]
  estado: EstadoIngreso
  creado: string
  actualizado: string
  /** Días que la solicitud lleva esperando acción del cliente. */
  diasSinRespuesta?: number
  motivoPendiente?: string
  motivoRechazo?: string
  proforma: ItemProforma[]
}

export interface Salida {
  id: string
  ingresoId: string
  clienteId: string
  contenedores: string[]
  fechaRetiro: string
  estado: EstadoSalida
  proforma: ItemProforma[]
  comprobante?: string
  solicitada: string
  pagoConfirmado?: string
  documentos: Documento[]
}

export interface Notificacion {
  id: string
  para: "cliente" | "planir"
  fecha: string
  texto: string
  ref: string
  leida: boolean
  tono: "info" | "ok" | "warn" | "error"
}

export interface PedidoAyuda {
  id: string
  clienteId: string
  ref: string
  usuario: string
  motivo: string
  mensaje: string
  fecha: string
  resuelto: boolean
}
