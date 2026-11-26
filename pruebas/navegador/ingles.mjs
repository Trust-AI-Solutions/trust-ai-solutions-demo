// Parte de pruebas/navegador.mjs: recorre toda la demo en inglés y falla si queda texto en
// español en pantalla (los nombres de tiendas, productos, clientes y personas se quedan como
// están). Lista lo que falta para agregarlo a traducciones/en/.
import { spawn } from "node:child_process";
import { readFileSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";

const archivo = `${tmpdir()}/demo-ingles-${process.pid}.jsonl`;
rmSync(archivo, { force: true });
const hijo = spawn(process.execPath, [fileURLToPath(new URL("./recorrido.mjs", import.meta.url))], { stdio: "inherit", env: { ...process.env, IDIOMA: "en", RECOLECTAR_EN: archivo } });
await new Promise((ok) => hijo.on("exit", ok));

const M = await import("../../public/minis/js/datos.js");
const R = await import("../../public/rodelo/js/datos.js");
const D = await import("../../public/delidom/js/datos.js");
const nombres = new Set();
const add = (x) => { if (typeof x === "string" && x.trim().length > 2) nombres.add(x.trim()); };
M.TIENDAS.forEach((t) => { add(t.nombre); add(t.enReporte); }); M.PRODUCTOS.forEach((p) => add(p.nombre)); M.CHOFERES.forEach((c) => add(c.nombre));
D.PRODUCTOS.forEach((p) => { add(p.nombre); add(p.descripcion); });
D.CLIENTES.forEach((c) => Object.values(c).forEach(add));
D.RUTAS.forEach((x) => add(x.zona));
M.PRODUCTOS.forEach((p) => add(p.nombre.toLowerCase())); D.CLIENTES.forEach((c) => add(String(c.nombre).toLowerCase()));
// Lugares de los datos ficticios (se quedan en español).
["San Cristóbal", "Santo Domingo Este", "Santo Domingo", "Los Alcarrizos", "Pedro Brand", "Distrito Nacional", "Sto. Dgo. Este", "Sto. Dgo. Oeste", "Las Caobas", "Santiago", "Ramón", "Doña Mati", "Doña Ana"].forEach(add);
const r = R.generarDatos("2026-11-25");
for (const k of Object.keys(r)) if (Array.isArray(r[k])) r[k].forEach((x) => { if (x && typeof x === "object") ["nombre", "cliente", "vendedor", "producto", "zona"].forEach((c) => add(x[c])); });
[...R.PRESENTACIONES, "Minis by Mónica", "Mónica Quiñones", "Hiper Las Palmas", "Supermercados Caribe", "Mercado Del Sol", "Grupo Rodelo", "Delidom", "Banco BHD", "Industria, Comercio y Mipymes", "República Dominicana", "Gobierno de la República Dominicana"].forEach(add);
const lista = [...nombres].sort((a, b) => b.length - a.length);

// Palabras que delatan español (y no existen en inglés).
const ESPANOL = /\b(de|del|la|las|los|el|que|para|por|con|sin|una|uno|es|está|están|más|según|hoy|ayer|mes|semana|tienda|tiendas|pedido|pedidos|ventas|cliente|clientes|chofer|choferes|ruta|rutas|informe|reporte|unidades|fecha|total del|guardar|cerrar|buscar|agregar|ver|aquí|usted|sus|este|esta|cuando|todavía|también|desde|hasta|entre|cada|nuevo|nueva|producto|productos|despacho|resumen|alerta|alertas)\b|[áéíóúñ¿¡]/i;
const textos = existsSync(archivo) ? [...new Set(readFileSync(archivo, "utf8").trim().split("\n").filter(Boolean).map((l) => JSON.parse(l)))] : [];
const quedan = textos.filter((t) => {
  let x = t;
  for (const n of lista) x = x.split(n).join(" ");
  x = x.replace(/RD\$|US\$/g, " ");
  if (/\b(gal|fdo|bags?|und)\b/.test(x) && /\d/.test(x)) return false;   // líneas de pedido (datos)
  if (t === "ES") return false;                                            // el botón para cambiar a español
  if (/(Caribe|Del Sol|Las Palmas) de /.test(t)) return false;              // tienda dicha como la diría el chofer
  return ESPANOL.test(x);
});
rmSync(archivo, { force: true });
console.log(`${textos.length} textos vistos en inglés`);
if (quedan.length) {
  console.log(`✗ ${quedan.length} quedan en español:`);
  for (const q of quedan.slice(0, 400)) console.log("   " + JSON.stringify(q));
  process.exit(1);
}
console.log("✓ nada en español en la versión inglesa");
