// Language layer: the demo is written in Spanish (the language of the pilot); in English
// mode this script translates everything on screen with the dictionary in idioma-en.js.
// It is a classic script loaded in <head> (before the page renders), so the visitor never
// sees Spanish flash by. Spanish mode loads nothing else and leaves the page untouched.
//
//   window.IDIOMA        "en" (default) or "es"
//   cambiarIdioma("es")  saves the choice and reloads the page
//
// Dictionary keys are the Spanish text exactly as it appears on screen. A key may contain
// {n} (any number, with its separators) and {s} (any text, such as a store or client name);
// the translation reuses them in order. An element with data-en="…" shows that text in
// English (for words whose meaning depends on where they are).
(function () {
  var CLAVE = "demo-ia-pymes:idioma";
  var idioma = "en";
  try { if (localStorage.getItem(CLAVE) === "es") idioma = "es"; } catch (e) { /* sin localStorage */ }
  try { if (/[?&]lang=es\b/.test(location.search)) idioma = "es"; if (/[?&]lang=en\b/.test(location.search)) idioma = "en"; } catch (e) { /* ignorar */ }
  window.IDIOMA = idioma;
  document.documentElement.lang = idioma;
  window.cambiarIdioma = function (nuevo) {
    try { localStorage.setItem(CLAVE, nuevo); } catch (e) { /* ignorar */ }
    var url = new URL(location.href);
    url.searchParams.delete("lang");
    location.href = url.toString();
  };
  if (idioma !== "en") return;

  // Dates: the Spanish code asks for "es-DO"; in English the same calls answer in en-US.
  var aIngles = function (l) { return l === undefined || (typeof l === "string" && /^es/i.test(l)) ? "en-US" : l; };
  ["toLocaleDateString", "toLocaleTimeString", "toLocaleString"].forEach(function (f) {
    var original = Date.prototype[f];
    Date.prototype[f] = function (l, o) { return original.call(this, aIngles(l), o); };
  });

  var DICC = window.TRADUCCION_EN || {};
  var exactas = Object.create(null);
  var conNumeros = Object.create(null);
  var conTexto = [];
  var NUM = /\d[\d.,:]*\d|\d/g;
  var escapeRe = function (s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); };
  Object.keys(DICC).forEach(function (k) {
    if (k.indexOf("{s}") >= 0) {
      var partes = k.split(/(\{n\}|\{s\})/);
      var re = partes.map(function (p) { return p === "{n}" ? "(\\d[\\d.,:]*\\d|\\d)" : p === "{s}" ? "(.+?)" : escapeRe(p); }).join("");
      conTexto.push({ re: new RegExp("^" + re + "$"), en: DICC[k], largo: k.length });
    } else if (k.indexOf("{n}") >= 0) conNumeros[k] = DICC[k];
    else exactas[k] = DICC[k];
  });
  conTexto.sort(function (a, b) { return b.largo - a.largo; });

  var rellenar = function (plantilla, valores) {
    var i = 0;
    return plantilla.replace(/\{n\}|\{s\}/g, function () { var v = valores[i++]; return v === undefined ? "" : traducir(v, true); });
  };
  var memoria = Object.create(null);
  function traducir(texto, interno) {
    var limpio = texto.replace(/\s+/g, " ").trim();
    if (!limpio || !/[A-Za-zÁÉÍÓÚÑáéíóúñ¿¡]/.test(limpio)) return texto;
    if (limpio in memoria) return memoria[limpio] === null ? texto : envolver(texto, memoria[limpio]);
    var r = null;
    if (limpio in exactas) r = exactas[limpio];
    else {
      var nums = limpio.match(NUM);
      if (nums) {
        var clave = limpio.replace(NUM, "{n}");
        if (clave in conNumeros) r = rellenar(conNumeros[clave], nums);
      }
      if (r === null) {
        for (var j = 0; j < conTexto.length; j++) {
          var m = limpio.match(conTexto[j].re);
          if (m) { r = rellenar(conTexto[j].en, m.slice(1)); break; }
        }
      }
    }
    memoria[limpio] = r;
    if (r === null) return interno ? limpio : texto;
    return envolver(texto, r);
  }
  // Keep the spaces around the original text (they separate inline elements).
  function envolver(original, traducido) {
    var antes = original.match(/^\s*/)[0], despues = original.match(/\s*$/)[0];
    return (antes ? " " : "") + traducido + (despues ? " " : "");
  }
  window.traducirTexto = function (t) { return traducir(String(t), true); };

  var SALTAR = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CODE: 1, PRE: 1, NOSCRIPT: 1 };
  var ATRIBUTOS = ["placeholder", "title", "aria-label", "alt"];
  function saltar(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentNode) {
      if (SALTAR[e.tagName] || e.isContentEditable || e.hasAttribute("data-sin-traducir")) return true;
    }
    return false;
  }
  function textoNodo(n) {
    if (!n.parentNode || saltar(n.parentNode)) return;
    var t = n.nodeValue, nuevo = traducir(t);
    if (nuevo !== t) n.nodeValue = nuevo;
  }
  function atributos(el) {
    // data-en="…": traducción fija para un texto ambiguo (por ejemplo, «Dirección» como cargo).
    var fija = el.getAttribute("data-en");
    if (fija !== null && el.textContent !== fija) { el.textContent = fija; return; }
    if (saltar(el)) return;
    for (var i = 0; i < ATRIBUTOS.length; i++) {
      var v = el.getAttribute(ATRIBUTOS[i]);
      if (v) { var nv = traducir(v); if (nv !== v) el.setAttribute(ATRIBUTOS[i], nv); }
    }
    if (el.tagName === "INPUT" && (el.type === "button" || el.type === "submit") && el.value) { var vv = traducir(el.value); if (vv !== el.value) el.value = vv; }
  }
  function recorrer(raiz) {
    if (raiz.nodeType === 3) return textoNodo(raiz);
    if (raiz.nodeType !== 1 || SALTAR[raiz.tagName]) return;
    atributos(raiz);
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    for (var n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? textoNodo(n) : atributos(n);
  }
  var tituloOriginal = null;
  function titulo() {
    if (document.title && document.title !== tituloOriginal) { var t = traducir(document.title); if (t !== document.title) { tituloOriginal = t; document.title = t; } }
  }
  var observador = new MutationObserver(function (cambios) {
    for (var i = 0; i < cambios.length; i++) {
      var c = cambios[i];
      if (c.type === "childList") for (var j = 0; j < c.addedNodes.length; j++) recorrer(c.addedNodes[j]);
      else if (c.type === "characterData") textoNodo(c.target);
      else if (c.type === "attributes") atributos(c.target);
    }
    titulo();
  });
  observador.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATRIBUTOS });
  document.addEventListener("DOMContentLoaded", function () { recorrer(document.documentElement); titulo(); });
})();
