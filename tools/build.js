// Baut beide Plugins: kopiert shared/web in die Plugins, erzeugt amd/build (TinyMCE)
// und yui/build (Atto). Aufruf: npm install && npm run build
'use strict';
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const {minify} = require('terser');

const root = path.resolve(__dirname, '..');
const plugins = {
  tiny: {dir: path.join(root, 'tiny/formula'), component: 'tiny_formula'},
  atto: {dir: path.join(root, 'atto/formula'), component: 'atto_formula'},
};

function copyDir(from, to) {
  fs.rmSync(to, {recursive: true, force: true});
  fs.mkdirSync(to, {recursive: true});
  for (const e of fs.readdirSync(from, {withFileTypes: true})) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    if (e.isDirectory()) { copyDir(a, b); } else { fs.copyFileSync(a, b); }
  }
}

async function buildAmd({dir, component}) {
  const src = path.join(dir, 'amd/src'), out = path.join(dir, 'amd/build');
  fs.rmSync(out, {recursive: true, force: true});
  fs.mkdirSync(out, {recursive: true});
  for (const f of fs.readdirSync(src).filter((n) => n.endsWith('.js'))) {
    const name = f.replace(/\.js$/, '');
    const code = fs.readFileSync(path.join(src, f), 'utf8');
    const onlyDefault = /^export default\b/m.test(code) && !/^export (const|function|let|var)\b/m.test(code);
    const res = babel.transformSync(code, {
      babelrc: false, configFile: false, filename: f, comments: true, sourceType: 'module',
      presets: [[require.resolve('@babel/preset-env'), {modules: false, targets: {chrome: '80', firefox: '78', safari: '13.1'}}]],
      plugins: [[require.resolve('@babel/plugin-transform-modules-amd'), {noInterop: true}]],
      moduleIds: true, moduleId: `${component}/${name}`,
    });
    let js = res.code;
    // Moodle-Konvention: Ein Modul mit nur einem Default-Export liefert diesen Wert zurück.
    if (onlyDefault) { js = js.replace(/\}\);?\s*$/, 'return _exports.default;\n});'); }
    const min = await minify(js, {format: {comments: /@module|@license/i}, mangle: {reserved: ['require']}, compress: true});
    fs.writeFileSync(path.join(out, name + '.min.js'), min.code + '\n');
  }
}

async function buildYui({dir}) {
  const srcDir = path.join(dir, 'yui/src/button');
  const build = JSON.parse(fs.readFileSync(path.join(srcDir, 'build.json'), 'utf8'));
  const meta = JSON.parse(fs.readFileSync(path.join(srcDir, 'meta/button.json'), 'utf8'));
  const name = build.name;
  const body = build.builds[name].jsfiles.map((f) => fs.readFileSync(path.join(srcDir, 'js', f), 'utf8')).join('\n');
  const wrap = (code) => `YUI.add('${name}', function (Y, NAME) {\n\n${code}\n\n}, '@VERSION@', ${JSON.stringify(meta[name], null, 4)});\n`;
  const out = path.join(dir, 'yui/build', name);
  fs.rmSync(out, {recursive: true, force: true});
  fs.mkdirSync(out, {recursive: true});
  const full = wrap(body);
  fs.writeFileSync(path.join(out, name + '.js'), full);
  fs.writeFileSync(path.join(out, name + '-debug.js'), full);
  const min = await minify(full, {format: {comments: false}, mangle: {reserved: ['Y', 'M', 'YUI']}, compress: true});
  fs.writeFileSync(path.join(out, name + '-min.js'), min.code + '\n');
}

(async () => {
  for (const p of Object.values(plugins)) {
    copyDir(path.join(root, 'shared/web'), path.join(p.dir, 'web'));
  }
  await buildAmd(plugins.tiny);
  await buildYui(plugins.atto);
  console.log('Fertig.');
})().catch((e) => { console.error(e); process.exit(1); });
