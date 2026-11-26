# Trust AI Solutions · Three small businesses, three AI solutions (English / Español)

A live, bilingual demo of the AI tools **The Trust for the Americas** built in the beta phase of
**Trust AI Solutions** (Dominican Republic, July–August 2026, with **Banco BHD** and the
**Ministry of Industry, Commerce and SMEs (MICM)**). It opens in **English**; the **ES** button in
the top bar switches to the original Spanish version (and **EN** switches back).

The three businesses are real and agreed to show their names. **Everything inside each demo is
sample data**: stores, chains, clients, products, prices, people, phone numbers and documents.

| Solution | What you see | AI agents |
|---|---|---|
| **Minis by Mónica** (`/minis/`) — bakery supplying 28 supermarkets on consignment | The pilot's current management panel: Today, Month, reconciliation against the chain's sales report, dispatch forecast, in-store stock, driver routes, products, stores and data; plus the driver's WhatsApp assistant | `minis-chofer`: the driver reports each store's count over WhatsApp; the visit can't close until every product is counted. `minis-reporte`: reads the chain's daily sales report (PDF) |
| **Grupo Rodelo** (`/rodelo/`) — snack maker, Santiago | Rodelo Copilot: executive summary, executive chat, morning reports by department, alerts and KPIs | `rodelo-copiloto`: answers business questions with figures from the data and ends with a recommendation |
| **Delidom** (`/delidom/`) — fruit-pulp maker, 807 clients | Order Center: today's orders by route (pending → in preparation → dispatched), new order, 72 mm ticket, history | `delidom-lector`: transcribes a pasted WhatsApp message, a PDF purchase order or a photo; the catalog is matched in the browser and a person confirms |

The home page also explains the program (who The Trust is, how Trust AI Solutions works), the
beta results (5 tools in 5 weeks, 5 of 5 businesses more productive, ~1-year payback, BHD's
approval to scale to 50 businesses), the other two beta businesses (Hulkcell and Engomas /
SD Karting), the owners' testimonials and how the bank–Trust–business partnership works. It opens
with Mónica Quiñones' video testimonial (Minis by Mónica).

## Development tools and attribution

**Jorge Marquez Gaspar**, Senior Manager and leader of Trust AI Solutions, leads the work
from business diagnostics and proposals through design, building, and delivery of AI tools.

**OpenAI Codex** helped adapt this repository for Sites, add portfolio navigation and
personal attribution, and run build, functional, browser, and bilingual checks for the
portfolio publication. This credit covers the portfolio preparation; it does not attribute
the original client implementations to Codex.

Codex uses [AGENTS.md](AGENTS.md) as the project guidance. Claude Code can use the same
guidance through [CLAUDE.md](CLAUDE.md). Both should preserve the sample-data boundaries,
bilingual interface, human review of AI outputs, and required checks.

The AI agents inside the demos currently use **Claude through the Anthropic API**.
Codex is a development tool for this project, separate from the model serving demo requests.

[View the portfolio](https://trust-ai-solutions-portfolio.trust-oea-6692.chatgpt.site/).

## How the two languages work

- The code, the data and the agents' instructions are written in Spanish (the pilot's language).
- `public/comun/idioma.js` (loaded first on every page) translates everything on screen when the
  language is English, using the dictionary `public/comun/idioma-en.js`. Spanish mode loads
  nothing extra, so it is exactly the original site.
- The dictionary is generated from `traducciones/en/*.json` with `npm run traducciones`. Keys are
  the Spanish text as it appears on screen; `{n}` stands for any number and `{s}` for any name.
- The browser sends the chosen language to `/api/ia`; in English the agents answer in English.
- The choice is saved in the browser (`localStorage`), and `?lang=en` / `?lang=es` in the URL
  forces one.

## How it works

```
browser                                             Netlify or Render                Anthropic
public/<solution>/ ── conversation + mode ──▶ /api/ia (netlify/functions/ia) ──▶ Claude
       ▲                                          │ adds the agent's instructions
       │ tool result                              │ and tools (modos.mjs)
       └── public/<solution>/js/herramientas ◀── asks for a tool ──┘
           (queries the sample data in the browser)
```

- Data is generated in the browser from a fixed seed, anchored to today
  (`public/<solution>/js/datos.js`). There is no database.
- What you create during the demo (visits, uploaded sales, routes, orders, resolved alerts) is
  kept in the browser per solution. "Reset" in the top bar clears that solution; "Reset the demo"
  on the home page clears all three.
- The Anthropic key exists only on the server (`ANTHROPIC_API_KEY`); the browser never sees it.
  `CLAVE_DEMO` is a demo password the browser sends in the `x-clave-demo` header.
- Model: `claude-opus-5-5` (change with `MODELO_IA`, `ESFUERZO_IA`, `ESFUERZO_DOCUMENTO`).

## Run it

```bash
npm ci
ANTHROPIC_API_KEY=... CLAVE_DEMO=... npm start   # http://localhost:3000
npm run pruebas      # unit tests
npm run navegador    # end-to-end browser tests with a scripted "Claude" (needs Playwright)
```

Deploy: `servidor.mjs` + `render.yaml` (Render) or `netlify.toml` (Netlify). The Spanish
documentation (deploy steps, demo script, design notes, rules) is in [LEEME.md](LEEME.md),
[GUION-DEMO.md](GUION-DEMO.md), [DESIGN.md](DESIGN.md), [PRODUCT.md](PRODUCT.md) and
[AGENTS.md](AGENTS.md).

## Contact

solucionesia@trust-oea.org · Trust AI Solutions · The Trust for the Americas
