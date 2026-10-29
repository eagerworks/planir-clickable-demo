# Planir · Prototipo del portal de playa de contenedores

Prototipo navegable (sin backend) para mostrarle a Planir cómo se verían el portal de clientes y la consola interna. Requerimientos en [`/docs/requerimientos-prototipo.md`](/docs/requerimientos-prototipo.md).

## Correr

```bash
npm install
npm run dev
```

Abrí http://localhost:5173. Se navega con la sidebar, con las flechas de abajo o con ← →. Cada pantalla tiene su link (`/#/P03`, `/#/C20/ING-0139`).

## Cómo está armado

- `src/data/seed.ts`: datos hardcodeados (clientes, solicitudes, salidas, notificaciones) y tarifas ilustrativas.
- `src/store/demo.ts`: store en memoria (zustand). Las acciones de los botones cambian el estado y se ven en las dos vistas. **Reiniciar demo** vuelve a la data semilla.
- Historia principal: `ING-0142` → `SAL-0058` recorre todo el ciclo. Cada pantalla declara en `prepare` la etapa que necesita, así se puede saltar a cualquier pantalla y ver un estado coherente.
- `src/screens/registry.tsx`: orden de la sidebar, agrupado por flujo, con el texto de contexto de cada pantalla.
- `src/screens/cliente/*` y `src/screens/planir/*`: pantallas. Los detalles de solicitud son un único componente que cambia según el estado.
- El marco de navegador renderiza la app a 1280 px de ancho y la escala si la ventana es más chica.

Stack: Vite + React + TypeScript, Tailwind v4, shadcn/ui (Radix), lucide-react, sonner.
