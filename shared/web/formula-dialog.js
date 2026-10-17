/* Formel-Dialog für die Moodle-Editoren (TinyMCE und Atto).
   Lädt KaTeX und den Formeleditor erst beim Öffnen, liefert LaTeX zurück und
   erkennt vorhandene Formeln (\( \), \[ \], $$ $$) im Text. Kein Moodle-Code:
   die Plugins übergeben baseUrl, Texte und den Rückruf. */
(function (global) {
  'use strict';

  var PATTERNS = [
    { source: '\\\\\\(([\\s\\S]+?)\\\\\\)', display: false },
    { source: '\\\\\\[([\\s\\S]+?)\\\\\\]', display: true },
    { source: '\\$\\$([\\s\\S]+?)\\$\\$', display: true }
  ];

  // Formel, die den Bereich [start, end] des Textes umschließt, sonst null.
  function findAt(text, start, end) {
    var found = null;
    PATTERNS.forEach(function (p) {
      var re = new RegExp(p.source, 'g'), m;
      while ((m = re.exec(text)) !== null) {
        var s = m.index, e = m.index + m[0].length;
        // Ein Cursor am Rand zählt nicht als "in der Formel", so lässt sich hinter einer Formel eine neue einfügen.
        var inside = start === end ? (start > s && start < e) : (start >= s && end <= e);
        if (inside && !(found && found.end - found.start <= e - s)) {
          found = { start: s, end: e, tex: m[1].trim(), display: p.display };
        }
      }
    });
    return found;
  }

  function wrap(tex, display) {
    return display ? '\\[ ' + tex + ' \\]' : '\\( ' + tex + ' \\)';
  }

  /* ---------- Nachladen der Dateien ---------- */
  var cache = {};
  function once(key, fn) {
    if (!cache[key]) { cache[key] = fn().then(null, function (e) { cache[key] = null; throw e; }); }
    return cache[key];
  }
  function style(url) {
    return new Promise(function (resolve, reject) {
      var l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = url;
      l.onload = function () { resolve(); };
      l.onerror = function () { reject(new Error(url)); };
      document.head.appendChild(l);
    });
  }
  function script(url, isLoaded) {
    return new Promise(function (resolve, reject) {
      if (isLoaded()) { resolve(); return; }
      var s = document.createElement('script');
      s.src = url;
      // UMD-Bundle (KaTeX): unter RequireJS würde es sich nur als anonymes
      // AMD-Modul eintragen. Darum define beim Laden ausblenden.
      var saved = global.define;
      if (saved && saved.amd) { global.define = undefined; }
      var restore = function () { if (saved) { global.define = saved; } };
      s.onload = function () { restore(); if (isLoaded()) { resolve(); } else { reject(new Error(url)); } };
      s.onerror = function () { restore(); reject(new Error(url)); };
      document.head.appendChild(s);
    });
  }
  function load(base) {
    return once('editor:' + base, function () {
      return Promise.all([
        style(base + 'katex/katex.min.css'),
        style(base + 'formeleditor/formeleditor.css'),
        style(base + 'formula-dialog.css'),
        script(base + 'katex/katex.min.js', function () { return !!global.katex; })
      ]).then(function () {
        return script(base + 'formeleditor/formeleditor-logik.js', function () { return !!global.FormelLogik; });
      }).then(function () {
        return script(base + 'formeleditor/formeleditor.js', function () { return !!global.FormelEditor; });
      });
    });
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) { e.className = cls; }
    if (text != null) { e.textContent = text; }
    return e;
  }

  /* opts: baseUrl (endet mit /), tex, display, anchor (Element, optional),
     strings {title, insert, apply, cancel, loading, loaderror, displaymode},
     onDone(tex, display) */
  function open(opts) {
    var S = opts.strings || {};
    var parent = (opts.anchor && opts.anchor.closest && opts.anchor.closest('.modal')) || document.body;
    var overlay = el('div', 'fd-overlay');
    var panel = el('div', 'fd-panel');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', S.title || '');
    var head = el('div', 'fd-head');
    head.appendChild(el('h2', 'fd-title', S.title || ''));
    var x = el('button', 'fd-x', '×');
    x.type = 'button'; x.setAttribute('aria-label', S.cancel || 'Cancel');
    head.appendChild(x);
    var host = el('div', 'fd-host');
    host.appendChild(el('p', 'fd-hint', S.loading || ''));
    var bar = el('div', 'fd-bar');
    var label = el('label', 'fd-display');
    var box = el('input'); box.type = 'checkbox'; box.checked = !!opts.display;
    label.appendChild(box); label.appendChild(document.createTextNode(' ' + (S.displaymode || '')));
    var cancel = el('button', 'fd-btn', S.cancel || 'Cancel'); cancel.type = 'button';
    var ok = el('button', 'fd-btn fd-primary', opts.tex ? S.apply : S.insert); ok.type = 'button';
    ok.disabled = true;
    bar.appendChild(label); bar.appendChild(cancel); bar.appendChild(ok);
    panel.appendChild(head); panel.appendChild(host); panel.appendChild(bar);
    overlay.appendChild(panel);
    parent.appendChild(overlay);

    var editor = null, value = opts.tex || '';
    function mount() {
      if (editor) { value = editor.getValue(); editor.destroy(); }
      editor = global.FormelEditor.mount(host, {
        value: value, transform: true, calculate: true, displayMode: box.checked,
        onChange: function (v) { value = v; }
      });
      ok.disabled = !editor;
    }
    function close() {
      if (editor && editor.destroy) { editor.destroy(); }
      overlay.remove();
    }
    x.addEventListener('click', close);
    cancel.addEventListener('click', close);
    box.addEventListener('change', function () { if (editor) { mount(); } });
    ok.addEventListener('click', function () {
      var tex = (editor ? editor.getValue() : value).trim();
      var display = box.checked;
      close();
      if (tex) { opts.onDone(tex, display); }
    });
    load(opts.baseUrl).then(function () {
      host.textContent = '';
      mount();
    }).catch(function () {
      host.textContent = '';
      host.appendChild(el('p', 'fd-hint', S.loaderror || ''));
    });
  }

  global.FormulaDialog = { open: open, findAt: findAt, wrap: wrap, load: load };
})(typeof window !== 'undefined' ? window : globalThis);
