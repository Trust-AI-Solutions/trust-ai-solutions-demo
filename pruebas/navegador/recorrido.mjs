// Recorre cada pantalla y hace clic en sus botones (con la IA respondiendo un error de
// prueba), para que el recolector vea también los textos que las pruebas no tocan.
// Uso: RECOLECTAR=archivo BASE_URL=http://localhost:3000 node pruebas/navegador/recorrido.mjs
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { preparar } from "./recolector.mjs";
const REPO = fileURLToPath(new URL("../../", import.meta.url)).replace(/\/$/, "");
const require = createRequire(REPO + "/package.json");
const { chromium } = require("playwright");
const BASE = process.env.BASE_URL;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: false });
const p = await ctx.newPage();
await preparar(p, process.env.IDIOMA || "es");
await p.route("**/api/ia", (r) => r.fulfill({ status: 503, json: { error: "La IA no está disponible en este momento. Intente de nuevo en un minuto." } }));
p.on("dialog", (d) => d.dismiss());
const NO = /restablecer|borrar|eliminar|descargar|exportar|imprimir|salir|limpiar/i;
async function clics(selector, limite = 40) {
  const n = Math.min(await p.locator(selector).count(), limite);
  for (let i = 0; i < n; i++) {
    const el = p.locator(selector).nth(i);
    try {
      const t = (await el.innerText({ timeout: 300 }).catch(() => "")) + (await el.getAttribute("id")) + (await el.getAttribute("class"));
      if (NO.test(t) || !(await el.isVisible())) continue;
      await el.click({ timeout: 800 });
      await p.waitForTimeout(150);
      await p.keyboard.press("Escape").catch(() => {});
    } catch { /* seguir */ }
  }
}
async function visitar(url, vistas, dentro) {
  await p.goto(BASE + url); await p.waitForTimeout(600);
  for (const v of vistas) {
    await p.goto(BASE + url + "#" + v); await p.waitForTimeout(400);
    await clics(dentro, 40);
    await p.goto(BASE + url + "#" + v); await p.waitForTimeout(200);
  }
}
await p.goto(BASE + "/"); await p.waitForTimeout(800); await p.keyboard.press("Escape");
await visitar("/minis/", ["hoy", "mes", "semana", "prevision", "stock", "choferes", "productos", "tiendas", "datos", "whatsapp"], "main button:not([data-solo-demo]), main select, main .fila-dia");
await visitar("/rodelo/", ["inicio", "chat", "reportes", "alertas", "indicadores"], "main button, main .alert-item, main [data-reporte], main tr[data-id]");
await visitar("/delidom/", ["hoy", "nuevo", "pegar", "hist"], "main button, main .pedido, main [data-pedido], main tr");
await b.close();
