# Device Normalizer

<!-- README-I18N:START -->

[English](./README.md) | **Español**

<!-- README-I18N:END -->

> Un dashboard de cobertura de dispositivos para equipos de seguridad. Correlaciona
> fuentes de **EDR + MDM + IDP** en un único inventario normalizado, expone los
> gaps de cobertura y puntúa la postura general de la flota.

**Build de demo · corre 100% con datos sintéticos, sin backend.**

---

## Por qué existe

En la mayoría de las organizaciones, los dispositivos se trackean en tres sistemas
independientes:

| Capa | Herramienta típica | De qué se entera |
|---|---|---|
| **EDR** — detección en endpoint | CrowdStrike | cada host donde corre el sensor |
| **MDM** — gestión de dispositivos | JumpCloud | cada dispositivo que IT enroló |
| **IDP** — identidad | Okta | cada dispositivo que tocó un login |

Cada uno tiene su propio inventario. El solapamiento es parcial, y **donde están
los gaps es donde vive el riesgo**:

- Una laptop en MDM pero sin el agente de EDR.
- Un dispositivo con EDR corriendo que nunca se enroló en MDM.
- Un usuario con sesiones de Okta y ningún dispositivo gestionado (probable BYOD / shadow IT).
- Un dispositivo gestionado que dejó de reportar hace 90+ días.

Device Normalizer correlaciona dispositivos entre las tres fuentes, los deduplica,
los clasifica en un status de cobertura (`FULLY_MANAGED`, `NO_EDR`, `NO_MDM`,
`IDP_ONLY`, `SERVER`, `STALE`, …) y expone los gaps en un único dashboard.

## Qué tiene el demo

- **Dashboard (bento)** — gauge de risk score, banda de KPIs por status (7 categorías),
  health de controles, diff de sync, gráficos de distribución (status / source / región / OS),
  serie temporal de tendencias, inventario de dispositivos, lista de baja confianza.
- **People** — compliance por owner, con drill-down a los dispositivos de cada persona.
- **Dual-use** — usuarios con dispositivos corporativos y personales; flujo de acknowledge.
- **Controles** — checks taggeados como KRI / CIS (MDM-sin-EDR, dormancy de agente
  por fuente, zombie devices, …) con las listas de dispositivos afectados.
- **Search** — filtro del inventario normalizado por status, source, región.
- **Settings** — intervalo de sync, salud de la configuración de cada source,
  últimas corridas.
- **Asistente IA** — panel de Q&A acotado (respuestas canned en el demo).

Todos los números, hostnames, owners y organizaciones son **inventados**.

## Arquitectura (demo)

```
 ┌────────────── React app ──────────────┐
 │  pages → components                   │
 │            ↓ fetch() / api.*          │
 │   ┌──── mock-fetch.ts ────┐           │
 │   │ intercepts            │ ←── synthetic data
 │   │ /api/*  /auth/*       │           │
 │   └───────────────────────┘           │
 └───────────────────────────────────────┘
```

`src/lib/mock-fetch.ts` shimea `window.fetch` para devolver datos fabricados.
Tanto el objeto `api` tipado (`src/lib/api.ts`) **como** los `fetch()` directos
de las páginas secundarias pasan por ahí, así que toda vista renderiza sin
backend.

## Stack

| Capa | Elegido | Por qué |
|---|---|---|
| Framework | React 19 + TypeScript | type safety, hooks modernos |
| Build | Vite | dev rápido, salida estática simple |
| Estilos | Tailwind CSS v4 | utility-first, tokens amigables con OKLCH |
| Charts | Recharts | SVG componible y accesible |
| Motion | Motion (sucesor de framer-motion) | declarativo, respeta reduced-motion |
| Iconos | lucide-react | un solo set, stroke consistente |
| Datos mock | interceptor de `window.fetch` | sin dependencia de MSW, runtime puro, determinista |

## Correr

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # serve the production build
```

## Deploy

El build es 100% estático — copiá `dist/` a cualquier static host (Vercel,
Netlify, GitHub Pages, Cloudflare Pages).

```bash
npm run build
# upload dist/  →  done
```

## Notas de diseño

- **Layout bento** con jerarquía explícita (risk + sources como hero, banda
  de KPIs, paneles operacionales emparejados, tablas full-width) — reemplaza
  el stack de "todo-es-una-card" del que partía el rediseño.
- **Un solo accent** (sin íconos arcoíris en el nav), numerics tabulares,
  elevación de cards basada en lightness, tile de logo sólido.
- Respeta `prefers-reduced-motion`: las animaciones CSS colapsan, los reveals
  de framer-motion se suavizan.
- Theme claro / oscuro con toggle persistente.
- Mezcla español / inglés en algunas superficies — preservada del original.

## Limitaciones conocidas del demo

- El link `/auth/logout` da 404 en hosting estático (no hay backend) —
  puramente cosmético.
- Las respuestas del asistente IA son matches por keyword, no llamadas reales
  a un LLM.
- Una vulnerabilidad transitiva moderada en npm — ver `npm audit`.
