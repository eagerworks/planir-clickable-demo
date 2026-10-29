import { useState, type ReactNode } from "react"
import {
  Bell,
  Building2,
  ClipboardList,
  Container,
  CreditCard,
  FileSpreadsheet,
  Home,
  Inbox,
  LifeBuoy,
  LogOut,
  Plus,
  Receipt,
  Search,
  Timer,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ADMINISTRACION, CLIENTE_DEMO, OPERADORA, USUARIO_DEMO } from "@/data/seed"
import type { Notificacion } from "@/data/types"
import { TONE_DOT, fechaHora } from "@/lib/format"
import { cn } from "@/lib/utils"
import { go, openRef } from "@/screens/nav"
import { useDemo } from "@/store/demo"
import { Logo } from "./Logo"

const initials = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")

function NotificationsPopover({ para, defaultOpen, dark }: { para: "cliente" | "planir"; defaultOpen?: boolean; dark?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen)
  const notifs = useDemo((s) => s.data.notificaciones).filter((n) => n.para === para)
  const marcarLeidas = useDemo((s) => s.marcarLeidas)
  const unread = notifs.filter((n) => !n.leida).length
  const toneOf: Record<Notificacion["tono"], keyof typeof TONE_DOT> = { info: "info", ok: "ok", warn: "warn", error: "error" }
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn("relative flex size-9 items-center justify-center rounded-full transition", dark ? "hover:bg-muted" : "hover:bg-muted")}>
          <Bell className="size-5 text-planir" />
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex size-4.5 items-center justify-center rounded-full bg-brand text-[10px] font-semibold text-white">{unread}</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-heading text-sm font-semibold text-planir">Notificaciones</div>
          {unread > 0 && (
            <button className="text-xs text-planir hover:underline" onClick={() => marcarLeidas(para)}>
              Marcar todas como leídas
            </button>
          )}
        </div>
        <ul className="max-h-96 divide-y overflow-auto">
          {notifs.map((n) => (
            <li key={n.id}>
              <button
                className={cn("flex w-full gap-3 px-4 py-3 text-left hover:bg-muted/60", !n.leida && "bg-accent/40")}
                onClick={() => {
                  setOpen(false)
                  openRef(para, n.ref)
                }}
              >
                <span className={cn("mt-1.5 size-2 shrink-0 rounded-full", TONE_DOT[toneOf[n.tono]])} />
                <span className="flex-1">
                  <span className={cn("block text-sm", !n.leida && "font-medium")}>{n.texto}</span>
                  <span className="text-xs text-muted-foreground">{fechaHora(n.fecha)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Portal del cliente
// ---------------------------------------------------------------------------

type ClientNav = "inicio" | "solicitudes" | "contenedores" | "nueva" | null

export function ClientLayout({ active, children, notificationsOpen }: { active: ClientNav; children: ReactNode; notificationsOpen?: boolean }) {
  const cliente = useDemo((s) => s.data.clientes.find((c) => c.id === CLIENTE_DEMO)!)
  const items: { key: ClientNav; label: string; screen: string; icon: ReactNode }[] = [
    { key: "inicio", label: "Inicio", screen: "C05", icon: <Home className="size-4" /> },
    { key: "solicitudes", label: "Solicitudes", screen: "C06", icon: <ClipboardList className="size-4" /> },
    { key: "contenedores", label: "Contenedores", screen: "C23", icon: <Container className="size-4" /> },
  ]
  return (
    <div className="flex min-h-full flex-col bg-[#f6f7f6]">
      <header className="sticky top-0 z-20 border-b bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-8">
          <button onClick={() => go("C05")} className="flex items-center gap-3">
            <Logo className="h-6" />
            <span className="border-l pl-3 text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground uppercase">Portal clientes</span>
          </button>
          <nav className="flex items-center gap-1">
            {items.map((it) => (
              <button
                key={it.key}
                onClick={() => go(it.screen)}
                className={cn(
                  "relative flex h-16 items-center gap-2 px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition hover:text-planir",
                  active === it.key && "text-planir after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-brand",
                )}
              >
                {it.icon}
                {it.label}
              </button>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Button variant="brand" onClick={() => go("C08")}>
              <Plus /> Nueva solicitud
            </Button>
            <NotificationsPopover para="cliente" defaultOpen={notificationsOpen} />
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-full py-1 pr-2 pl-1 hover:bg-muted">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-planir text-xs text-white">{initials(USUARIO_DEMO)}</AvatarFallback>
                </Avatar>
                <span className="text-left leading-tight whitespace-nowrap">
                  <span className="block text-sm font-medium">{USUARIO_DEMO}</span>
                  <span className="block text-xs text-muted-foreground">{cliente.razonSocial}</span>
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mi cuenta</DropdownMenuLabel>
                <DropdownMenuItem>Datos de la empresa</DropdownMenuItem>
                <DropdownMenuItem>Usuarios</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => go("C03")}>
                  <LogOut /> Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-8 py-8">{children}</main>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Consola Planir
// ---------------------------------------------------------------------------

export type PlanirRole = "operador" | "admin"
type PlanirNav = "bandeja" | "contenedores" | "ayuda" | "clientes" | "pagos" | "proformas" | "estadias" | null

export function PlanirLayout({ role, active, children }: { role: PlanirRole; active: PlanirNav; children: ReactNode }) {
  const data = useDemo((s) => s.data)
  const pendientes = data.ingresos.filter((i) => ["pendiente_aprobacion", "revision"].includes(i.estado)).length
  const ayuda = data.ayuda.filter((h) => !h.resuelto).length
  const pagos = data.salidas.filter((s) => s.estado === "pendiente_pago").length

  const operacion = [
    { key: "bandeja" as const, label: "Bandeja de solicitudes", screen: "P02", icon: <Inbox className="size-4" />, count: pendientes },
    { key: "contenedores" as const, label: "Contenedores en playa", screen: "P09", icon: <Container className="size-4" /> },
    { key: "ayuda" as const, label: "Pedidos de ayuda", screen: "P12", icon: <LifeBuoy className="size-4" />, count: ayuda },
  ]
  const admin = [
    { key: "clientes" as const, label: "Clientes", screen: "A01", icon: <Building2 className="size-4" /> },
    { key: "pagos" as const, label: "Pagos a confirmar", screen: "A04", icon: <CreditCard className="size-4" />, count: pagos },
    { key: "proformas" as const, label: "Proformas", screen: "A05", icon: <Receipt className="size-4" /> },
    { key: "estadias" as const, label: "Estadías", screen: "A06", icon: <Timer className="size-4" /> },
  ]
  const sections = role === "operador" ? [{ title: "Operación", items: operacion }] : [{ title: "Administración", items: admin }]
  const user = role === "operador" ? { name: OPERADORA, role: "Operadora de playa" } : { name: ADMINISTRACION, role: "Administración" }

  return (
    <div className="flex h-full overflow-hidden bg-[#f6f7f6]">
      <aside className="flex h-full w-56 shrink-0 flex-col bg-planir text-white">
        <div className="flex h-16 items-center gap-2 px-5">
          <Logo onDark className="h-6" />
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase">Consola</span>
        </div>
        <nav className="flex-1 space-y-6 px-3 py-4">
          {sections.map((sec) => (
            <div key={sec.title}>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-white/50 uppercase">{sec.title}</div>
              <ul className="space-y-0.5">
                {sec.items.map((it) => (
                  <li key={it.key}>
                    <button
                      onClick={() => go(it.screen)}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 hover:text-white",
                        active === it.key && "bg-white/15 font-medium text-white",
                      )}
                    >
                      {it.icon}
                      <span className="flex-1 text-left">{it.label}</span>
                      {!!it.count && <span className="rounded-full bg-brand px-1.5 text-xs font-semibold">{it.count}</span>}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {role === "admin" && (
            <div>
              <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-white/50 uppercase">Reportes</div>
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/60" disabled>
                <FileSpreadsheet className="size-4" /> Exportar a Excel
              </button>
            </div>
          )}
        </nav>
        <div className="flex items-center gap-3 border-t border-white/10 px-5 py-4">
          <Avatar className="size-8">
            <AvatarFallback className="bg-brand text-xs text-white">{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-white/60">{user.role}</div>
          </div>
        </div>
      </aside>
      <div data-scroll-root className="flex min-w-0 flex-1 flex-col overflow-auto">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b bg-white px-8">
          <div className="relative w-80">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar solicitud, contenedor o cliente…" className="h-9 pl-9" />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <NotificationsPopover para="planir" />
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Acceso (login, invitación)
// ---------------------------------------------------------------------------

export function AuthLayout({ children, consola = false }: { children: ReactNode; consola?: boolean }) {
  return (
    <div className="grid min-h-full grid-cols-[minmax(0,5fr)_minmax(0,6fr)] bg-white">
      <div className="relative flex flex-col justify-between overflow-hidden bg-planir p-10 text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, #fff 0 2px, transparent 2px 46px), repeating-linear-gradient(0deg, #fff 0 2px, transparent 2px 22px)",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -bottom-24 size-96 rounded-full bg-brand/30 blur-3xl" />
        <Logo onDark className="relative h-8" />
        <div className="relative">
          <div className="text-xs font-semibold tracking-[0.2em] text-brand uppercase">{consola ? "Consola interna" : "Portal de clientes"}</div>
          <h2 className="mt-3 text-3xl leading-tight font-bold">
            {consola ? "Todas las solicitudes de la playa, en un solo lugar." : "Gestioná tus contenedores en la playa de Planir, sin cadenas de mails."}
          </h2>
          <p className="mt-4 max-w-sm text-sm text-white/70">
            {consola
              ? "Revisá lo que validó el portal, marcá tus pasos internos y respondé a los clientes desde acá."
              : "Cargá tus solicitudes de ingreso y salida, subí los documentos y seguí el estado de cada contenedor."}
          </p>
        </div>
        <div className="relative text-xs text-white/50">Planir · Puerto de Montevideo</div>
      </div>
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  )
}
