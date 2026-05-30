# Device Normalizer

<!-- README-I18N:START -->

[English](./README.md) | **Español**

<!-- README-I18N:END -->

![Dashboard de Device Normalizer](docs/screenshots/dashboard.png)

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

## Cómo funciona

### Arquitectura

![Arquitectura](docs/diagrams/architecture.png)

`src/lib/mock-fetch.ts` shimea `window.fetch` para que tanto `lib/api.ts`
como los `fetch()` directos de las páginas secundarias pasen por el
interceptor. Toda vista renderiza sin backend.
[Abrir diagrama →](docs/diagrams/architecture.html)

### Correlación de sources

![Flowchart de correlación de sources](docs/diagrams/source-correlation.png)

Cómo se clasifica un device a partir de sus sources — `Has EDR? → Has MDM?`
en cascada produce los statuses canónicos (`FULLY_MANAGED`, `NO_EDR`, …).
[Abrir diagrama →](docs/diagrams/source-correlation.html)

### Lifecycle de un sync

![Sequence diagram del sync](docs/diagrams/sync-sequence.png)

Un trigger dispara `POST /api/sync/trigger`, después la UI hace polling
de `/api/sync/last` cada 2 s hasta que aparece un run ID nuevo, y cierra
con un toast. [Abrir diagrama →](docs/diagrams/sync-sequence.html)

### Modelo de datos

![Modelo de datos](docs/diagrams/data-model.png)

La forma de los recursos normalizados — `Device` como aggregate root, con
`Summary`, `SyncRun`, `Insight` y `Control` alrededor.
[Abrir diagrama →](docs/diagrams/data-model.html)

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

## Screenshots

<table>
  <tr>
    <td width="50%"><a href="docs/screenshots/controls.png"><img src="docs/screenshots/controls.png" alt="Controls"></a><br><sub><b>Controles</b> — checks taggeados como KRI/CIS cruzando Okta, JumpCloud y CrowdStrike.</sub></td>
    <td width="50%"><a href="docs/screenshots/people.png"><img src="docs/screenshots/people.png" alt="People"></a><br><sub><b>People</b> — compliance por owner con drill-down.</sub></td>
  </tr>
  <tr>
    <td><a href="docs/screenshots/dual-use.png"><img src="docs/screenshots/dual-use.png" alt="Dual-use"></a><br><sub><b>Dual-use</b> — devices corporativos vs personales, con flujo de acknowledge.</sub></td>
    <td><a href="docs/screenshots/search.png"><img src="docs/screenshots/search.png" alt="Asset search"></a><br><sub><b>Asset search</b> — filtro del inventario normalizado.</sub></td>
  </tr>
  <tr>
    <td><a href="docs/screenshots/settings.png"><img src="docs/screenshots/settings.png" alt="Settings"></a><br><sub><b>Settings</b> — intervalo de sync, health de sources, últimas corridas.</sub></td>
    <td><a href="docs/screenshots/ai-assistant.png"><img src="docs/screenshots/ai-assistant.png" alt="Asistente IA"></a><br><sub><b>Asistente IA</b> — panel de Q&A acotado (canned en el demo).</sub></td>
  </tr>
</table>

## Limitaciones conocidas del demo

- El link `/auth/logout` da 404 en hosting estático (no hay backend) —
  puramente cosmético.
- Las respuestas del asistente IA son matches por keyword, no llamadas reales
  a un LLM.
- Una vulnerabilidad transitiva moderada en npm — ver `npm audit`.
