import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowLeft, ArrowRight, Lock, PanelLeftClose, PanelLeftOpen, RotateCcw } from "lucide-react"
import { Logo } from "@/components/app/Logo"
import { PortalContainerContext } from "@/components/shell/portal"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { GROUPS, SCREENS, VIEW_META, type ScreenDef } from "@/screens/registry"
import { useDemo } from "@/store/demo"

function parseHash(): { screen?: string; focus?: string } {
  const [screen, focus] = window.location.hash.replace(/^#\/?/, "").split("/")
  return { screen: SCREENS.some((s) => s.id === screen) ? screen : undefined, focus: focus || undefined }
}

function Sidebar({ current, onReset }: { current: string; onReset: () => void }) {
  const go = useDemo((s) => s.go)
  return (
    <aside className="flex h-full w-[300px] shrink-0 flex-col border-r bg-white">
      <div className="space-y-3 border-b px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <Logo className="h-6" />
          <span className="text-sm font-semibold text-brand">prototipo</span>
        </div>
        <div className="text-xs leading-snug text-muted-foreground">Portal de playa de contenedores · vista Cliente y vista Planir</div>
        <Button variant="outline" size="sm" className="w-full border-planir/30 text-planir" onClick={onReset}>
          <RotateCcw /> Reiniciar demo
        </Button>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          {Object.values(VIEW_META).map((v) => (
            <span key={v.label} className="inline-flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", v.dot)} /> {v.label}
            </span>
          ))}
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {GROUPS.map((g, gi) => (
          <div key={g.title} className="mb-4">
            <div className="px-2 pb-1">
              <div className="font-heading text-sm font-bold text-planir">
                {gi + 1}. {g.title}
              </div>
              {g.subtitle && <div className="text-[11px] leading-snug text-muted-foreground">{g.subtitle}</div>}
            </div>
            <ul className="mt-1 space-y-0.5">
              {SCREENS.filter((s) => s.group === g.title).map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => go(s.id)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left text-[13px] leading-snug transition hover:bg-muted",
                      current === s.id && "bg-planir text-white hover:bg-planir",
                    )}
                  >
                    <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", VIEW_META[s.view].dot, current === s.id && "ring-2 ring-white")} />
                    <span className="flex-1">
                      <span className={cn("font-medium tabular-nums", current !== s.id && "text-muted-foreground")}>{s.id}</span> · {s.title}
                      {s.tag && (
                        <span
                          className={cn(
                            "ml-1.5 inline-block rounded px-1 py-px align-middle text-[9px] font-bold tracking-wider",
                            s.tag === "A VALIDAR" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800",
                          )}
                        >
                          {s.tag}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}

/** Ancho mínimo al que se diseña la app; en pantallas más chicas el marco se escala para que entre. */
const APP_MIN_WIDTH = 1280

function useSize(el: HTMLElement | null) {
  const [size, setSize] = useState({ w: 0, h: 0 })
  useEffect(() => {
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [el])
  return size
}

function BrowserFrame({ screen, focus }: { screen: ScreenDef; focus?: string }) {
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null)
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  const { w, h } = useSize(viewport)
  const scale = w > 0 ? Math.min(1, w / APP_MIN_WIDTH) : 1
  const url = typeof screen.url === "function" ? screen.url(focus ?? screen.focus) : screen.url
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-stone-300 bg-white shadow-[0_20px_60px_-20px_rgba(0,52,31,0.35)]">
      <div className="flex h-10 shrink-0 items-center gap-3 border-b bg-stone-100 px-4">
        <div className="flex gap-1.5">
          <span className="size-3 rounded-full bg-[#ff5f57]" />
          <span className="size-3 rounded-full bg-[#febc2e]" />
          <span className="size-3 rounded-full bg-[#28c840]" />
        </div>
        <div className="mx-auto flex h-6 w-full max-w-xl items-center justify-center gap-1.5 rounded-md bg-white px-3 text-xs text-muted-foreground">
          <Lock className="size-3" /> {url}
        </div>
        <div className="w-12" />
      </div>
      <div ref={setViewport} className="relative min-h-0 flex-1 overflow-hidden">
        {/* El transform crea el contenedor de los overlays fixed: dialogs y toasts quedan dentro del marco */}
        <div
          ref={setContainer}
          className="absolute top-0 left-0 origin-top-left"
          style={{ width: w / scale || "100%", height: h / scale || "100%", transform: `scale(${scale})` }}
        >
          <PortalContainerContext.Provider value={container}>
            <div key={`${screen.id}/${focus ?? ""}`} className="h-full overflow-auto">
              {container && screen.render(focus ?? screen.focus)}
            </div>
            <Toaster position="bottom-right" theme="light" richColors />
          </PortalContainerContext.Provider>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const { screen: current, focus, go, reset } = useDemo()
  const [collapsed, setCollapsed] = useState(false)
  const index = SCREENS.findIndex((s) => s.id === current)
  const screen = SCREENS[index] ?? SCREENS[0]
  const meta = VIEW_META[screen.view]

  // Hash ⇄ pantalla actual (permite compartir el link a una pantalla puntual)
  useEffect(() => {
    const { screen: s, focus: f } = parseHash()
    if (s) go(s, f)
    const onHash = () => {
      const h = parseHash()
      const st = useDemo.getState()
      if (h.screen && (h.screen !== st.screen || h.focus !== st.focus)) go(h.screen, h.focus)
    }
    window.addEventListener("hashchange", onHash)
    return () => window.removeEventListener("hashchange", onHash)
  }, [go])

  useEffect(() => {
    const target = `#/${current}${focus ? `/${focus}` : ""}`
    if (window.location.hash !== target) window.history.replaceState(null, "", target)
  }, [current, focus])

  const step = useCallback(
    (delta: number) => {
      const next = SCREENS[index + delta]
      if (next) go(next.id)
    },
    [index, go],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (t.closest("input, textarea, select, [contenteditable], [role=dialog], [role=listbox], [role=menu]")) return
      if (e.key === "ArrowRight") step(1)
      if (e.key === "ArrowLeft") step(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [step])

  const groupIndex = useMemo(() => GROUPS.findIndex((g) => g.title === screen.group), [screen.group])

  return (
    <TooltipProvider>
      <div className="flex h-screen overflow-hidden bg-[#eef1ef]">
        {!collapsed && <Sidebar current={screen.id} onReset={reset} />}
        <main className="flex min-w-0 flex-1 flex-col gap-3 px-6 pt-4 pb-3">
          <div className="flex items-start gap-3">
            <Button variant="ghost" size="icon-sm" onClick={() => setCollapsed((c) => !c)} title={collapsed ? "Mostrar pantallas" : "Ocultar pantallas"}>
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  {groupIndex + 1}. {screen.group}
                </span>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold", meta.chip)}>
                  <span className={cn("size-1.5 rounded-full", meta.dot)} /> {meta.label}
                </span>
                {screen.tag && (
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider", screen.tag === "A VALIDAR" ? "bg-amber-100 text-amber-800" : "bg-sky-100 text-sky-800")}>
                    {screen.tag}
                  </span>
                )}
              </div>
              <h1 className="mt-0.5 font-heading text-xl font-bold text-planir">
                {screen.id} · {screen.title}
              </h1>
              <p className="mt-0.5 max-w-4xl text-sm text-muted-foreground">{screen.context}</p>
            </div>
          </div>
          <BrowserFrame screen={screen} focus={focus} />
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="icon" onClick={() => step(-1)} disabled={index <= 0}>
              <ArrowLeft />
            </Button>
            <span className="min-w-16 text-center text-sm font-medium text-planir tabular-nums">
              {index + 1} / {SCREENS.length}
            </span>
            <Button variant="outline" size="icon" onClick={() => step(1)} disabled={index >= SCREENS.length - 1}>
              <ArrowRight />
            </Button>
          </div>
        </main>
      </div>
    </TooltipProvider>
  )
}
