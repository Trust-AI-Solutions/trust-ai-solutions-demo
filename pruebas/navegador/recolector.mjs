// Las pruebas del navegador corren en español (la lengua del código). Con RECOLECTAR=archivo,
// además guardan cada texto que aparece en pantalla: con eso se arma el diccionario inglés.
import { appendFileSync } from "node:fs";

export async function preparar(pagina, idioma = "es") {
  await pagina.addInitScript((i) => { try { localStorage.setItem("demo-ia-pymes:idioma", i); } catch {} }, idioma);
  const archivo = idioma === "en" ? process.env.RECOLECTAR_EN : process.env.RECOLECTAR;
  if (!archivo) return;
  const vistos = new Set();
  await pagina.exposeFunction("__texto", (t) => { if (!vistos.has(t)) { vistos.add(t); appendFileSync(archivo, JSON.stringify(t) + "\n"); } });
  await pagina.addInitScript(() => {
    const enviados = new Set();
    const mandar = (t) => { t = (t || "").replace(/\s+/g, " ").trim(); if (t && /[A-Za-zÁÉÍÓÚÑáéíóúñ]/.test(t) && !enviados.has(t)) { enviados.add(t); window.__texto(t); } };
    const saltar = (el) => el.closest?.("script,style,textarea,code,pre,noscript,[data-sin-traducir]");
    const revisar = (raiz) => {
      if (raiz.nodeType === 3) { if (raiz.parentElement && !saltar(raiz.parentElement)) mandar(raiz.nodeValue); return; }
      if (raiz.nodeType !== 1 || saltar(raiz)) return;
      const w = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
      for (let n = raiz; n; n = w.nextNode()) {
        if (n.nodeType === 3) { if (!saltar(n.parentElement)) mandar(n.nodeValue); }
        else if (!saltar(n)) for (const a of ["placeholder", "title", "aria-label", "alt"]) mandar(n.getAttribute(a));
      }
    };
    // Se lee un momento después: en inglés, la capa de idioma ya cambió el texto.
    const pendientes = new Set();
    let reloj = null;
    const vaciar = () => { reloj = null; for (const n of pendientes) revisar(n); pendientes.clear(); mandar(document.title); };
    new MutationObserver((cs) => { for (const c of cs) { if (c.type === "childList") c.addedNodes.forEach((n) => pendientes.add(n)); else pendientes.add(c.target); } reloj ??= setTimeout(vaciar, 30); })
      .observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ["placeholder", "title", "aria-label", "alt"] });
    document.addEventListener("DOMContentLoaded", () => setTimeout(() => { revisar(document.documentElement); mandar(document.title); }, 30));
  });
}
