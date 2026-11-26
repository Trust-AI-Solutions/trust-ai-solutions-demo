// Arma public/comun/idioma-en.js (el diccionario español → inglés que usa comun/idioma.js)
// juntando los archivos de traducciones/en/*.json. Los archivos que vienen después en orden
// alfabético pisan a los anteriores (por ejemplo, correcciones.json gana).
// Uso: npm run traducciones
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
const dir = fileURLToPath(new URL("./en/", import.meta.url));
const destino = fileURLToPath(new URL("../public/comun/idioma-en.js", import.meta.url));
const todo = {};
const cuenta = (s) => (s.match(/\{n\}/g) ?? []).length + "/" + (s.match(/\{s\}/g) ?? []).length;
for (const f of readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
  const parte = JSON.parse(readFileSync(dir + f, "utf8"));
  for (const [es, en] of Object.entries(parte)) {
    if (typeof en !== "string" || !en.trim()) throw new Error(`${f}: sin traducción para «${es}»`);
    if (cuenta(es) !== cuenta(en)) throw new Error(`${f}: «${es}» y «${en}» no tienen los mismos {n}/{s}`);
    todo[es] = en;
  }
}
const ordenado = Object.fromEntries(Object.entries(todo).sort(([a], [b]) => a.localeCompare(b, "es")));
writeFileSync(destino, `// GENERADO por traducciones/construir.mjs: no editar a mano (editar traducciones/en/*.json).\nwindow.TRADUCCION_EN = ${JSON.stringify(ordenado, null, 0).replace(/","/g, '",\n"')};\n`);
console.log(`${Object.keys(ordenado).length} frases en ${destino.split("/public/")[1]}`);
