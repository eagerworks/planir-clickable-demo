import { createContext, useContext } from "react"

// Dialogs render inside the browser frame instead of covering the whole prototype.
export const PortalContainerContext = createContext<HTMLElement | null>(null)

export function usePortalContainer() {
  return useContext(PortalContainerContext) ?? undefined
}
