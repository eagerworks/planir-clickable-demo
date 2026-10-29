import { useState } from "react"
import { Building2, Check, MailCheck } from "lucide-react"
import { AuthLayout } from "@/components/app/layouts"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CLIENTE_DEMO, OPERADORA, USUARIO_DEMO } from "@/data/seed"
import { cn } from "@/lib/utils"
import { go } from "@/screens/nav"
import { useCliente, useDemo } from "@/store/demo"

const EMAIL_DEMO = "lmendez@importadorarambla.com.uy"

export function C01Invitacion() {
  const cliente = useCliente(CLIENTE_DEMO)
  return (
    <AuthLayout>
      <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-accent text-planir">
        <Building2 className="size-6" />
      </div>
      <h1 className="text-2xl font-bold text-planir">Te damos la bienvenida</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {OPERADORA}, de Planir, te invitó a usar el portal de la playa de contenedores en nombre de <b className="text-foreground">{cliente.razonSocial}</b>.
      </p>
      <div className="mt-6 space-y-3 rounded-xl border bg-muted/40 p-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Empresa</span>
          <span className="font-medium">{cliente.razonSocial}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Usuario</span>
          <span className="font-medium">{USUARIO_DEMO}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Email</span>
          <span className="font-medium">{EMAIL_DEMO}</span>
        </div>
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Desde el portal vas a poder cargar solicitudes de ingreso y salida, subir documentos y seguir el estado de tus contenedores.</p>
      <Button variant="brand" size="lg" className="mt-6 w-full" onClick={() => go("C02")}>
        Activar mi cuenta
      </Button>
    </AuthLayout>
  )
}

export function C02CrearContrasena() {
  const [pass, setPass] = useState("Planir2026!")
  const [confirm, setConfirm] = useState("Planir2026!")
  const activar = useDemo((s) => s.activarCuenta)
  const reglas = [
    { ok: pass.length >= 8, label: "Al menos 8 caracteres" },
    { ok: /[A-Z]/.test(pass), label: "Una mayúscula" },
    { ok: /\d/.test(pass), label: "Un número" },
    { ok: pass.length > 0 && pass === confirm, label: "Las contraseñas coinciden" },
  ]
  const valid = reglas.every((r) => r.ok)
  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-planir">Creá tu contraseña</h1>
      <p className="mt-2 text-sm text-muted-foreground">Vas a entrar con {EMAIL_DEMO}</p>
      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Contraseña</Label>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Repetí la contraseña</Label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </div>
        <ul className="space-y-1.5 text-xs">
          {reglas.map((r) => (
            <li key={r.label} className={cn("flex items-center gap-2", r.ok ? "text-emerald-700" : "text-muted-foreground")}>
              <Check className={cn("size-3.5", !r.ok && "opacity-30")} /> {r.label}
            </li>
          ))}
        </ul>
      </div>
      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!valid}
        onClick={() => {
          activar()
          go("C03")
        }}
      >
        Crear contraseña y continuar
      </Button>
    </AuthLayout>
  )
}

export function C03Login({ consola = false }: { consola?: boolean }) {
  return (
    <AuthLayout consola={consola}>
      <h1 className="text-2xl font-bold text-planir">{consola ? "Consola Planir" : "Iniciar sesión"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">{consola ? "Acceso para el equipo de Planir." : "Entrá al portal de clientes de Planir."}</p>
      <div className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input defaultValue={consola ? "spereira@planir.uy" : EMAIL_DEMO} />
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Contraseña</Label>
            {!consola && (
              <button className="text-xs text-planir hover:underline" onClick={() => go("C04")}>
                ¿Olvidaste tu contraseña?
              </button>
            )}
          </div>
          <Input type="password" defaultValue="Planir2026!" />
        </div>
      </div>
      <Button size="lg" variant={consola ? "default" : "brand"} className="mt-6 w-full" onClick={() => go(consola ? "P02" : "C05")}>
        Entrar
      </Button>
      {!consola && <p className="mt-6 text-center text-xs text-muted-foreground">¿Tu empresa todavía no tiene acceso? Escribinos a playa@planir.uy</p>}
    </AuthLayout>
  )
}

export function C04Recuperar() {
  const [sent, setSent] = useState(false)
  return (
    <AuthLayout>
      {sent ? (
        <>
          <div className="mb-6 inline-flex size-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <MailCheck className="size-6" />
          </div>
          <h1 className="text-2xl font-bold text-planir">Revisá tu email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Si {EMAIL_DEMO} tiene una cuenta, te mandamos un link para crear una nueva contraseña. El link vence en 1 hora.
          </p>
          <Button variant="outline" size="lg" className="mt-6 w-full" onClick={() => go("C03")}>
            Volver a iniciar sesión
          </Button>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-planir">¿Olvidaste tu contraseña?</h1>
          <p className="mt-2 text-sm text-muted-foreground">Ingresá tu email y te mandamos un link para crear una nueva.</p>
          <div className="mt-6 space-y-1.5">
            <Label>Email</Label>
            <Input defaultValue={EMAIL_DEMO} />
          </div>
          <Button size="lg" className="mt-6 w-full" onClick={() => setSent(true)}>
            Enviar link
          </Button>
          <button className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground" onClick={() => go("C03")}>
            Volver
          </button>
        </>
      )}
    </AuthLayout>
  )
}
