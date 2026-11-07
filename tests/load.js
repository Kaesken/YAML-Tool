// Loads YAMLTool.html in jsdom with scripts, no network. Exposes window.
const { JSDOM, VirtualConsole } = require('jsdom');
const fs = require('fs');
const path = require('path');
function load(file = path.join(__dirname, '../YAMLTool.html'), opts = {}) {
  const html = fs.readFileSync(file, 'utf8');
  const vc = new VirtualConsole();
  const errors = [];
  vc.on('jsdomError', e => errors.push(String(e && (e.stack || e.message) || e)));
  vc.on('error', e => errors.push(String(e)));
  if (opts.console) vc.sendTo(console);
  const dom = new JSDOM(html, {
    runScripts: 'dangerously', pretendToBeVisual: true, virtualConsole: vc,
    url: 'https://example.test/YAMLTool.html',
    beforeParse(w) {
      w.fetch = opts.fetch || (() => Promise.reject(new Error('offline')));
      w.navigator.clipboard = { writeText: async t => { w.__clip = t; } };
      w.URL.createObjectURL = () => 'blob:x'; w.URL.revokeObjectURL = () => {};
      w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
      w.alert = m => errors.push('alert: ' + m); w.confirm = () => true;
    }
  });
  dom.errors = errors;
  return dom;
}
// Parse YAML text with Ruby Psych exactly like Lich (unsafe_load).
function psych(text) {
  const { execFileSync } = require('child_process');
  const out = execFileSync('ruby', ['-ryaml', '-rjson', '-e',
    'begin; d = YAML.unsafe_load(STDIN.read); puts JSON.generate({ok: true, data: d}); rescue Exception => e; puts JSON.generate({ok: false, error: "#{e.class}: #{e.message}"}); end'],
    { input: text }).toString();
  return JSON.parse(out);
}
module.exports = { load, psych, tick: (ms = 50) => new Promise(r => setTimeout(r, ms)) };
