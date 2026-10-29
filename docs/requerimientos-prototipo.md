# Planir · Portal de playa de contenedores — Requerimientos del prototipo

> Versión 0.2 · 29/10/2026 · Eagerworks
> Fuentes: reunión Planir <> Eagerworks (20/10/2026), documento "Módulos del portal de playa de contenedores" (Isabel Pick), documentos de ejemplo enviados por Planir (BL MSC, Delivery Order Montecon, cartilla IMO) y mail de Planir con el detalle de los controles por documento (29/10/2026).

> Cambios en 0.2: documentos según la terminal (Montecon: BL + DO; TCP: BL + confirmación de pago), detección de posible carga IMO en el BL, derivación de la carga IMO a Depósito 24 (la playa 1704 no la recibe), motivo "Pago no registrado en TCP", textos en español neutro (usted) y operadora Gimena Belgara.

## 1. Objetivo

Construir un **prototipo visual navegable** del portal para mostrarle a Planir cómo se vería el sistema y confirmar que entendimos los flujos. No es el producto: no hay backend, toda la data está hardcodeada y las acciones solo cambian el estado en memoria del navegador.

El prototipo tiene que permitir recorrer, de punta a punta y desde las dos vistas (Cliente y Planir), el ciclo de vida de un contenedor: **solicitud de ingreso → validación de documentos → aprobación → ingreso real → permanencia → solicitud de salida → pago (si corresponde) → retiro**.

## 2. Stack y entrega

| Tema | Decisión |
|---|---|
| Framework | React + TypeScript con Vite |
| Estilos | Tailwind CSS |
| Componentes | shadcn/ui (Button, Input, Select, Table, Badge, Dialog, Sheet, Tabs, Checkbox, Switch, Calendar/DatePicker, Toast, DropdownMenu, Tooltip, Progress) |
| Íconos | lucide-react |
| Estado | Store en memoria (React context o Zustand) con data semilla hardcodeada. Las acciones (aprobar, corregir, marcar pago…) modifican el store y se reflejan en ambas vistas. |
| Persistencia | Ninguna. Botón **"Reiniciar demo"** vuelve todo a la data semilla. |
| Plataforma | Web desktop (diseñado para 1280–1440 px de ancho). No se diseña mobile. |
| Idioma | Español rioplatense (voseo: "Cargá", "Revisá"), igual que el documento de Isabel. |
| Deploy | Vercel, URL pública para compartir con Planir (como tell-a-tale-prototipo.vercel.app). |

## 3. Shell del prototipo (igual a Tell a Tale)

Layout de tres zonas, **sin panel de comentarios**:

1. **Sidebar izquierda (~320 px)**
   - Título "Planir · Portal" + etiqueta "prototipo" y botón **Reiniciar demo**.
   - Lista de pantallas numeradas, agrupadas por vista (Cliente / Planir) y por flujo (ver §8). La pantalla activa queda resaltada.
   - Etiqueta opcional por pantalla: `PROPUESTA` (algo que sugerimos nosotros y Planir no pidió explícitamente) o `A VALIDAR` (supuesto que hay que confirmar).
2. **Centro**
   - La pantalla se muestra dentro de un **marco de navegador** (barra con puntitos y URL ficticia, p. ej. `portal.planir.uy/solicitudes/ING-0142`), sobre fondo gris claro.
   - Debajo: flechas anterior/siguiente y contador `12 / 48`.
   - Los botones de la pantalla **funcionan**: navegan a la pantalla siguiente del flujo y actualizan el estado.
3. **Encabezado de la pantalla (sobre el marco)**
   - Nombre de la pantalla, vista (chip "Cliente" o "Planir · Operador" / "Planir · Administración") y una línea de contexto de qué está pasando en el flujo.

Navegación también con teclado (← →).

## 4. Identidad visual

Tomada de planir.uy:

| Token | Valor | Uso |
|---|---|---|
| Verde Planir | `#00472C` | Header/sidebar del producto, botones primarios de la consola Planir |
| Naranja Planir | `#F15A29` | Acento, CTA principal del portal cliente, logo |
| Texto | `#333333` / `#383838` | Texto base |
| Gris claro | `#EBEAEA` | Fondos, bordes |
| Estados | verde / ámbar / rojo / azul / gris | Validado / En revisión-pendiente / Observado-rechazado / Informativo / Cancelado |

- Tipografías: **Montserrat** (títulos) y **Poppins** (texto) — ambas de Google Fonts.
- Logo: isotipo "P" naranja + "PLANIR". Se usa la versión del sitio.
- Una sola librería de componentes para ambas vistas; el portal cliente y la consola Planir se diferencian solo por el header (cliente: blanco con logo; consola: verde con logo blanco) y el menú.

## 5. Actores

| Actor | Qué hace en el portal |
|---|---|
| **Cliente** (usuario de una empresa cliente: importador, despachante, agente) | Activa su cuenta por invitación, carga solicitudes de ingreso y salida, sube documentos, corrige lo observado, sigue estados, cambia la fecha estimada de salida, pide ayuda, ve proformas y documentos de cierre. |
| **Planir · Operador de playa** | Bandeja de solicitudes, revisa resultado de validación, resuelve revisiones humanas, marca pasos internos, aprueba / rechaza / deja pendiente con comentario, registra ingreso y salida reales, atiende pedidos de ayuda. |
| **Planir · Administración** | Alta de clientes e invitaciones, condición de pago por cliente (cuenta corriente / pago previo), costo de cancelación por cliente, confirma pagos recibidos, ve proformas, suplementos y estadías. |

En el prototipo los roles no se loguean por separado: cada pantalla dice qué rol la está viendo.

## 6. Modelo de datos (hardcodeado)

- **Cliente (empresa)**: razón social, RUT, contacto, usuarios, condición de pago (`cuenta corriente` | `pago previo`), costo de cancelación (on/off + monto), estado de la cuenta (invitado / activo).
- **Usuario**: nombre, email, empresa, rol.
- **Solicitud de ingreso** (ID `ING-0001`): cliente, barco + viaje, fecha estimada de llegada, terminal de origen (TCP o Montecon), N° de BL, descripción de la mercadería según el BL, fecha solicitada del movimiento, fecha estimada de salida, ¿carga IMO? (con N° UN y clase), evaluación de Depósito 24 si es IMO, contenedores, documentos, resultado de validación, pasos internos, comentarios, historial, estado.
- **Contenedor**: número (formato ISO `MSNU8293351`), tipo (20' DV, 40' HC…), precinto, peso bruto, fecha de ingreso real, fecha estimada de salida (con historial de cambios), fecha de salida real, días de estadía.
- **Documento**: tipo (BL, Delivery Order — Montecon, Confirmación de pago — TCP, Cartilla IMO, Comprobante de transferencia, Documento de salida), archivo (PDF de ejemplo), estado (pendiente / validado / observado / ilegible).
- **Resultado de validación**: por cada dato chequeado → valor declarado, valor leído en el documento, documento fuente, resultado (`coincide` | `no coincide` | `no encontrado` | `fuera de rango` | `ilegible`).
- **Solicitud de salida** (ID `SAL-0001`): ingreso de origen, contenedores a retirar, fecha solicitada de retiro, estado de pago, proforma.
- **Proforma**: servicio de ingreso + estadía estimada + suplementos por extensión. Montos ilustrativos en USD.
- **Evento de historial**: fecha/hora, actor, descripción.
- **Comentario**: autor (Planir / cliente), texto, fecha, visible para el cliente.
- **Notificación in-app**: destinatario, texto, link a la solicitud, leída/no leída.

## 7. Estados

### Solicitud de ingreso

```
Borrador → Validando → ┬→ Observada (el cliente debe corregir) ──→ Validando …
                       ├→ En revisión de Planir (valor anómalo / ilegible)
                       └→ Pendiente de aprobación
Pendiente de aprobación → Pendiente por causa externa (paro, clima, horario, pago no registrado en TCP,
                          evaluación de Depósito 24 para carga IMO) → …
                        → Aprobada → Ingresada (contenedor en playa)
                        → Rechazada
Cualquier estado antes de "Ingresada" → Cancelada (con o sin costo)
```

### Solicitud de salida

```
Solicitada → (pago previo) Pendiente de pago → Retiro habilitado → Retirada (cerrada)
           → (cuenta corriente) ───────────────→ Retiro habilitado
```

Indicadores de alerta para la bandeja de Planir: **días sin respuesta del cliente** en estado Observada (amarillo > 5 días, rojo > 10 días), **detenida** (pendiente por causa externa), **pago a confirmar**, **pedido de ayuda abierto**.

## 8. Pantallas y flujos

Inventario de pantallas por vista. En la sidebar del prototipo se ordenan **por flujo, intercalando Cliente y Planir** para contar la historia de punta a punta:

1. Acceso del cliente: C01–C04
2. Inicio del cliente: C05–C07
3. Nueva solicitud de ingreso: C08–C15, C20
4. Planir revisa y aprueba: P01, P02, P03, C22, P08, C23
5. Datos que no coinciden: C16, C17, C18, C19, P04, P05, P12
6. Carga peligrosa (IMO): P13, C30, C31, P14, C32, P15
7. Pendientes, rechazos y cancelación: P06, C21, P16, P07, C25
8. Permanencia y salida: C24, C26, P10, C27, A04, C28, P11, C29, P09
9. Administración: A01, A02, A03, A05, A06

Los textos del portal están en español neutro, tratando de usted al cliente.

La historia principal es `ING-0142` (Importadora Rambla, pago previo) → `SAL-0058`. Cada flujo usa datos consistentes (mismos clientes, barcos y contenedores).

### 8.1 Cliente · Acceso

| # | Pantalla | Contenido / interacción |
|---|---|---|
| C01 | Activar cuenta (desde invitación) | "Le damos la bienvenida": quién de Planir lo invitó, empresa y email; botón Activar. |
| C02 | Crear contraseña | Contraseña + confirmación + reglas visibles. |
| C03 | Iniciar sesión | Email + contraseña, link "¿Olvidó su contraseña?". Panel lateral: "Gestión de contenedores en la playa de Planir". |
| C04 | Recuperar contraseña | Ingresar email → confirmación "Revise su email". |

### 8.2 Cliente · Inicio y seguimiento

| # | Pantalla | Contenido / interacción |
|---|---|---|
| C05 | Inicio | Resumen: solicitudes que requieren su acción, contenedores en playa, próximas salidas. Campana de notificaciones. Botón "Nueva solicitud". |
| C06 | Mis solicitudes | Tabla con ID, tipo (ingreso/salida), barco, contenedores, estado (badge), última actualización. Filtros por estado y tipo. |
| C07 | Notificaciones | Panel desplegable de la campana con avisos (observada, aprobada, ingresó, pendiente de pago, retiro habilitado, comentario de Planir). |

### 8.3 Cliente · Nueva solicitud de ingreso (camino feliz)

| # | Pantalla | Contenido / interacción |
|---|---|---|
| C08 | Tipo de solicitud | Elegir **Ingreso** o **Salida** (salida solo si hay contenedores en playa; si no, deshabilitado con explicación). |
| C09 | Paso 1 · Datos de la operación | Barco y viaje, N° de BL, terminal de origen (TCP o Montecon), fecha estimada de llegada, fecha solicitada del movimiento, fecha estimada de salida de la playa. La terminal define qué documentos se piden. Stepper arriba. |
| C10 | Paso 2 · Contenedores | Agregar contenedores: número, tipo, precinto, peso bruto. Cantidad visible. Validación de formato del número de contenedor. |
| C11 | Paso 3 · Carga peligrosa | ¿Es carga IMO? Sí/No. Si es Sí, se agrega la cartilla de seguridad como documento obligatorio y se avisa que la carga se deriva a Depósito 24 (la playa 1704 no recibe IMO). Si es No, se aclara que el portal igual revisa el BL en busca de señales de carga peligrosa. |
| C12 | Paso 4 · Documentos | Checklist según la terminal: **Montecon** → BL + un Delivery Order por contenedor; **TCP** → BL + confirmación de pago (PDF, captura o texto pegado del mail). Cartilla IMO si aplica. En TCP se avisa que el pago tiene que figurar en la terminal. No deja enviar si falta un obligatorio. |
| C13 | Paso 5 · Revisar y enviar | Resumen de todo. Si el cliente tiene costo de cancelación activo, aviso + checkbox "Entiendo que cancelar después de X tiene un costo de USD Y". Botón Enviar. |
| C14 | Validando documentos | Estado de carga ("Estamos validando sus documentos") con los chequeos apareciendo uno a uno. |
| C15 | Solicitud enviada | Todo coincide → "Solicitud ING-0142 enviada", queda en revisión de Planir. Mail de Playa para asistencia humana. |

### 8.4 Cliente · Corrección

| # | Pantalla | Contenido / interacción |
|---|---|---|
| C16 | Solicitud observada | Banner rojo "Hay datos que no coinciden". Tabla de resultados de validación: Dato · Lo declarado · Lo que dice el documento · Documento. Ej.: fecha de llegada 3/11 vs. 3/12 en el BL; precinto distinto en un contenedor. Mail de Playa visible. |
| C17 | Corregir y reenviar | Edición inline del dato o reemplazo del documento; botón Reenviar → vuelve a validar → C15. |
| C18 | En revisión de Planir | Banner ámbar: un valor fuera de rango (peso 60.000 kg) o documento ilegible. "Una persona de Planir está revisando su solicitud". |
| C19 | Pedir ayuda | Dialog: motivo + mensaje → queda registrado en la solicitud y le llega a Planir. |

### 8.4 bis · Carga peligrosa (IMO)

Caso `ING-0138` (Importadora Rambla, TCP): el cliente declaró carga general, pero el BL describe «SPRAY PAINT AEROSOL CANS».

| # | Vista | Pantalla | Contenido / interacción |
|---|---|---|---|
| P13 | Operador | Posible carga IMO no declarada | El chequeo "Mercadería peligrosa (IMO)" queda en ámbar con la señal detectada. Es una alerta, no una confirmación: la operadora elige **No es IMO, seguir** o **Consultar al cliente** (mensaje precargado). |
| C30 | Cliente | Planir consulta si es carga IMO | Solicitud observada con la consulta de Planir y la descripción del BL. Botón Responder. |
| C31 | Cliente | Responder: ¿es carga IMO? | No es IMO / Sí es IMO. Si es IMO, adjunta la cartilla de seguridad y ve el aviso de que la carga va a Depósito 24. |
| P14 | Operador | Derivar cartillas a Depósito 24 | Tarjeta "Carga IMO · Depósito 24" con N° UN y clase. Botón **Derivar cartillas a Depósito 24** → la solicitud queda pendiente por causa externa. No se puede aprobar sin la aceptación de Depósito 24. |
| C32 | Cliente | En evaluación de Depósito 24 | Pendiente por causa externa, con el comentario de Planir explicando por qué. |
| P15 | Operador | Respuesta de Depósito 24 | **Acepta** → vuelve a pendiente de aprobación. **No puede recibirla** → rechazo con el motivo precargado. |

`ING-0134` (Agroquímica del Litoral, Montecon) es carga IMO declarada desde el inicio y espera la derivación en la bandeja.

### 8.5 Cliente · Detalle y permanencia

| # | Pantalla | Contenido / interacción |
|---|---|---|
| C20 | Detalle de solicitud | Tabs: Resumen · Contenedores · Documentos · Historial. Línea de tiempo de estados, comentarios de Planir, botón Pedir ayuda / Cancelar. |
| C21 | Pendiente por causa externa | Comentario de Planir destacado ("Pendiente por paro en la terminal, se retoma el jueves"). |
| C22 | Aprobada + proforma | Estado Aprobada, proforma (servicio + estadía estimada), próximos pasos. |
| C23 | Contenedor en playa | Contenedores ingresados con fecha de ingreso real y días de estadía corriendo. |
| C24 | Cambiar fecha estimada de salida | Nueva fecha → muestra historial de fechas y el suplemento que genera (5/11 → 8/11 → 12/11). |
| C25 | Cancelar solicitud | Dialog: sin costo antes del punto de corte; con costo administrativo después (si el cliente lo tiene activo). |

### 8.6 Cliente · Salida

| # | Pantalla | Contenido / interacción |
|---|---|---|
| C26 | Solicitar retiro | Desde un ingreso con contenedores en playa: elegir contenedores (todos o algunos) y fecha de retiro. Reutiliza datos del ingreso. |
| C27 | Pendiente de pago | Cliente con pago previo: proforma final (servicio + suplementos), datos para transferencia, opción de adjuntar comprobante. "El retiro se habilita cuando Planir confirme el pago". |
| C28 | Retiro habilitado | Confirmación con fecha y contenedores habilitados. |
| C29 | Salida completada | Fechas reales, días de estadía por contenedor, documentos de cierre descargables. Solicitud cerrada. |

### 8.7 Planir · Operador de playa

| # | Pantalla | Contenido / interacción |
|---|---|---|
| P01 | Iniciar sesión (Planir) | Login de la consola. |
| P02 | Bandeja de solicitudes | KPIs arriba (pendientes de aprobación, en revisión, observadas, detenidas, pagos a confirmar). Tabla: ID, cliente, tipo, barco, documentación, estado, alerta (días sin respuesta). Filtros: estado, tipo, cliente, fecha, "solo con alertas". |
| P03 | Detalle · lista para aprobar | Resultado de validación (todo verde), documentos, contenedores, **pasos internos** con checkbox (propuesta: Mensaje simplificado en ImporSys · OT generada · OT timbrada por Aduana · Transporte coordinado). Comentario para el cliente. Aprobar / Rechazar / Dejar pendiente. Aprobar se habilita al completar los pasos. |
| P04 | Detalle · revisión humana | Chequeo en ámbar (peso fuera de rango / BL ilegible). Opciones: aceptar el valor, pedir corrección al cliente (con mensaje). |
| P05 | Detalle · observada hace 12 días | Alerta de días sin respuesta. Datos de contacto del cliente (mail, teléfono) y botón "Escribir al cliente". |
| P06 | Dejar pendiente | Dialog con motivo (pago no registrado en TCP — solo para TCP —, paro, clima, horario de terminal, otro) + comentario visible para el cliente. |
| P07 | Rechazar | Dialog con motivo obligatorio. |
| P08 | Registrar ingreso real | Por contenedor: fecha y hora real de ingreso. Al guardar, el cliente recibe el aviso de que su contenedor ingresó. |
| P09 | Contenedores en playa | Inventario: contenedor, cliente, ingreso, días de estadía, fecha estimada de salida, estado de salida. La carga IMO figura en Depósito 24. |
| P10 | Solicitud de salida | Verificar requisitos, estado de pago (cuenta corriente → habilitar directo; pago previo → esperar confirmación de Administración). Habilitar retiro. |
| P11 | Registrar salida real | Fecha/hora real por contenedor → calcula días de estadía, adjuntar documentos de salida, cerrar. |
| P12 | Pedidos de ayuda | Lista de pedidos abiertos de clientes, con link a la solicitud y marcar como resuelto. |
| P16 | Pago no registrado en TCP | `ING-0130` (Frío Austral): el cliente informó el pago pero todavía no figura en TCP, que no libera el contenedor. Queda detenida; el paso interno "Pago verificado en el sistema de TCP" sigue sin tildar. |

### 8.8 Planir · Administración

| # | Pantalla | Contenido / interacción |
|---|---|---|
| A01 | Clientes | Tabla: empresa, usuarios, condición de pago, costo de cancelación (switch), solicitudes activas. |
| A02 | Nuevo cliente / invitar | Datos de la empresa, condición de pago, costo de cancelación, usuarios a invitar (email). Envía invitación → C01. |
| A03 | Detalle de cliente | Datos, usuarios (invitado / activo, reenviar invitación), historial de solicitudes, cancelaciones previas. |
| A04 | Pagos a confirmar | Salidas pendientes de pago con monto de la proforma y comprobante adjunto si lo hay. Botón **Marcar pago recibido** → habilita el retiro. Sin integración con medios de pago. |
| A05 | Proformas y suplementos | Por solicitud: proforma original, suplementos por cambio de fecha, total. |
| A06 | Estadías | Reporte de días reales por contenedor (ingreso real → salida real), filtrable por cliente y mes, botón "Exportar" (visual). |

**Total: 54 pantallas.**

## 9. Reglas de validación simuladas

La validación es una simulación: cada solicitud semilla trae su resultado precalculado. Se muestra como **tabla de resultados** (sin visor del PDF).

| Dato declarado | Se compara contra | Regla |
|---|---|---|
| Barco y viaje | BL | Debe coincidir |
| Fecha estimada de llegada | BL | Debe coincidir |
| Terminal de origen | Delivery Order (Montecon) / confirmación de pago (TCP) | Debe coincidir |
| Marca y número de cada contenedor, cantidad | BL (rider) y Delivery Order (Montecon) | Todos los números y la cantidad deben coincidir con la solicitud |
| Retiro autorizado (Montecon) | Delivery Order | La fecha del movimiento no puede ser anterior a la fecha desde la que el DO autoriza el retiro |
| Pago a TCP | Confirmación de pago | Debe estar adjunta. Que figure en TCP lo verifica Planir (paso interno); si no figura → pendiente "Pago no registrado en TCP" |
| Precinto por contenedor | BL (rider) | Debe coincidir |
| Peso bruto | BL | Si supera el umbral (propuesta: > 32.500 kg por contenedor) → **En revisión de Planir** |
| Mercadería peligrosa (IMO) | BL | Se busca N° UN, clase IMO/IMDG y descripciones de riesgo (explosivos y pirotecnia, aerosoles y gases comprimidos, solventes e inflamables, sólidos inflamables o reactivos, comburentes y peróxidos, tóxicos e infecciosos, radiactivos, ácidos y corrosivos, baterías de litio). Si el cliente declaró No y aparece una señal → **En revisión de Planir** (es una alerta, no una clasificación) |
| Carga IMO = Sí | Cartilla de seguridad | Documento obligatorio; contenedor y precinto deben coincidir con la cartilla. La solicitud no se aprueba hasta que Depósito 24 acepta |
| Documento legible | — | Si no se puede leer → **En revisión de Planir** |
| Contenedor inexistente | — | Caso raro: aviso "No encontramos este contenedor en el documento" |

Resultado: todo coincide → Pendiente de aprobación. Algo no coincide → Observada (aviso directo al cliente). Valor anómalo o ilegible → En revisión de Planir.

## 10. Notificaciones in-app

Solo campana + toasts dentro del portal (sin maquetas de mail).

| Evento | Cliente | Planir |
|---|---|---|
| Solicitud enviada y validada OK | ✓ | ✓ (entra a la bandeja, sin mail) |
| Solicitud observada | ✓ con detalle de qué corregir | ✓ (alerta si pasan X días) |
| En revisión humana | ✓ | ✓ |
| Comentario / pendiente por causa externa | ✓ | — |
| Posible carga IMO / respuesta del cliente | ✓ | ✓ |
| Derivada a Depósito 24 / respuesta de Depósito 24 | ✓ | — |
| Aprobada (con proforma) | ✓ | — |
| Contenedor ingresó | ✓ | — |
| Cambio de fecha de salida / suplemento | ✓ | ✓ |
| Solicitud de salida | — | ✓ |
| Pendiente de pago / pago confirmado / retiro habilitado | ✓ | ✓ (Administración) |
| Salida completada | ✓ | — |
| Pedido de ayuda | — | ✓ |

Todo aviso al cliente incluye el mail de Playa de Planir para asistencia humana.

## 11. Data semilla

Clientes ficticios (nombres inventados), con barcos, contenedores y precintos tomados de los documentos de ejemplo para que la demo se sienta real. El cliente que "usa" el portal es **Lucía Méndez, de Importadora Rambla S.A.**

| Cliente | Condición | Costo de cancelación | Casos que ilustra |
|---|---|---|---|
| Importadora Rambla S.A. (cliente demo) | Pago previo | On (USD 150) | `ING-0142` camino feliz con el BL de MSC `MEDUYA172632` (HUAN BAO 68, `MSNU8293351` / `MSNU8299238`), desde Montecon con un DO por contenedor, hasta la salida `SAL-0058` con pago previo. `ING-0138` posible carga IMO no declarada (aerosoles en el BL) → consulta → Depósito 24. `ING-0139` observada (fecha 3/11 vs. 3/12 y precinto distinto). `ING-0137` peso 60.000 kg → revisión humana. `ING-0133` Delivery Order Montecon (`CAAU8381089`, KOTA PAHLAWAN 043E) → pendiente por paro. `ING-0136` aprobada → cancelación con costo. |
| Frío Austral S.A. | Cuenta corriente | Off | Reefers pendientes de aprobación con pedido de ayuda; `ING-0130` detenida por pago no registrado en TCP; salida habilitada sin pago. |
| Agroquímica del Litoral S.R.L. | Pago previo | On | Carga IMO (MAIPO V.2411S, UN 1263 clase 3, precinto `LAB135380`) aceptada por Depósito 24, con salida pendiente de pago y comprobante. `ING-0134` IMO declarada (UN 2902 clase 6.1) esperando la derivación a Depósito 24. |
| Distribuidora Ciudad Vieja S.A. | Cuenta corriente | Off | Observada hace 12 días sin respuesta. |
| Logística Punta Carretas S.A. | Pago previo | On | BL ilegible → revisión humana; solicitud a rechazar. |

Tarifas ilustrativas: traslado USD 180 por contenedor, estadía USD 12 por día y contenedor, carga IMO en Depósito 24 USD 90.

Usuarios de Planir en la demo: **Gimena Belgara** (operadora de playa) y **Martín Ruiz** (Administración).

## 12. Fuera de alcance del prototipo

- Backend, autenticación real, persistencia, envío de mails.
- Lectura real de PDFs / OCR / IA (la validación es simulada).
- Integración con medios de pago (Planir marca el pago manualmente).
- Integración con ImporSys, Aduana, transportistas.
- Módulo E (borradores automáticos de mail de timbrado / pedido de camión) y módulo F (asistente de consultas, cola de transportistas, analítica, depósito interportuario).
- Configuración de checklist, umbrales y pasos internos desde la UI.
- Versión mobile.
- Panel de comentarios sobre las pantallas.

## 13. Supuestos a validar con Planir

Se marcan en el prototipo con la etiqueta `A VALIDAR`:

1. Una solicitud de ingreso = un BL con uno o más contenedores.
2. Montecon: un Delivery Order por contenedor. TCP: una confirmación de pago por solicitud (puede ser el texto del mail).
3. La salida puede ser parcial (retirar algunos contenedores de un mismo ingreso).
4. Pasos internos propuestos: Mensaje simplificado en ImporSys · OT generada · OT timbrada · Transporte coordinado (la lista exacta la define Planir).
5. Umbral de peso anómalo: 32.500 kg por contenedor.
6. Alerta por falta de respuesta del cliente: 5 días (amarillo) / 10 días (rojo).
7. Punto de corte para el costo de cancelación: a partir de que Planir aprueba la solicitud.
8. El cliente puede adjuntar el comprobante de transferencia (opcional); el pago lo confirma Administración.
9. Las altas de clientes las hace Planir (no hay autoregistro).
10. Ante una señal de carga IMO en el BL, la solicitud pasa a revisión humana y la operadora decide si consulta al cliente.
11. Depósito 24 no usa el portal: Planir le deriva las cartillas por fuera y registra su respuesta (acepta / no puede recibirla).
12. La carga IMO se factura con un recargo por contenedor y la estadía se cuenta igual que en la playa.

## 14. Criterios de aceptación del prototipo

- Se puede recorrer todas las pantallas desde la sidebar y con anterior/siguiente.
- Los botones principales de cada pantalla llevan al paso siguiente del flujo y el cambio de estado se ve en la otra vista (p. ej. el operador aprueba en P03 → el cliente ve "Aprobada" en C06 y una notificación nueva).
- "Reiniciar demo" deja todo como al principio.
- Diseño consistente en todas las pantallas (mismos componentes, colores, tipografía, badges de estado).
- Desplegado en una URL pública de Vercel.
