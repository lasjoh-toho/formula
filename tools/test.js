// Prüft die Formel-Erkennung im Text (ohne Browser). Aufruf: npm test
'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const ctx = {};
ctx.globalThis = ctx;
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/../shared/web/formula-dialog.js', 'utf8'), ctx);
const F = ctx.FormulaDialog;

const t = 'a \\(x^2\\) und $$y$$ b \\[ \\frac12 \\] c';
assert.deepStrictEqual({...F.findAt(t, 4, 4)}, {start: 2, end: 9, tex: 'x^2', display: false});
assert.strictEqual(F.findAt(t, 0, 0), null);
assert.strictEqual(F.findAt(t, 2, 2), null, 'Cursor vor der Formel');
assert.strictEqual(F.findAt(t, 9, 9), null, 'Cursor hinter der Formel');
assert.strictEqual(F.findAt(t, 2, 9).tex, 'x^2', 'markierte Formel');
assert.strictEqual(F.findAt(t, t.indexOf('frac'), t.indexOf('frac')).display, true);
assert.strictEqual(F.findAt(t, t.indexOf('y$$'), t.indexOf('y$$')).tex, 'y');
assert.strictEqual(F.wrap('x', false), '\\( x \\)');
assert.strictEqual(F.wrap('x', true), '\\[ x \\]');
console.log('ok');
