import { useDemo } from "@/store/demo"

// Pantallas de la sidebar que ya muestran una solicitud puntual; el resto abre el detalle genérico con foco.
const CLIENTE_INGRESO: Record<string, string> = { "ING-0139": "C16", "ING-0137": "C18", "ING-0133": "C21" }
const PLANIR_INGRESO: Record<string, string> = { "ING-0137": "P04", "ING-0127": "P05" }

export function openIngreso(view: "cliente" | "planir", id: string) {
  const go = useDemo.getState().go
  const map = view === "cliente" ? CLIENTE_INGRESO : PLANIR_INGRESO
  if (map[id]) go(map[id], id)
  else go(view === "cliente" ? "C20" : "P03", id)
}

export function openSalida(view: "cliente" | "planir", id: string) {
  useDemo.getState().go(view === "cliente" ? "C27" : "P10", id)
}

export function openRef(view: "cliente" | "planir", ref: string) {
  if (ref.startsWith("SAL")) openSalida(view, ref)
  else openIngreso(view, ref)
}

export const go = (screen: string, focus?: string) => useDemo.getState().go(screen, focus)
