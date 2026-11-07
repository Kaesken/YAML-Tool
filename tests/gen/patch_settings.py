import json, re, pathlib
R = pathlib.Path(__file__).parent.parent
src = (R / 'orig/lich-yaml-settings.html')
if not src.exists():
    src.write_text((R / 'repo/lich-yaml-settings.html').read_text())
s = src.read_text()
data = json.loads((R / 'gen/settings.json').read_text())
def rep(old, new):
    global s
    if s.count(old) != 1: raise SystemExit('not found: ' + old[:80])
    s = s.replace(old, new)
payload = json.dumps(data, ensure_ascii=False).replace('</', '<\\/')
s = re.sub(r'(<script id="data" type="application/json">).*?(</script>)', lambda m: m.group(1) + payload + m.group(2), s, count=1, flags=re.S)
# Copy as YAML: the key's real base.yaml value in block form (was broken for hashes)
rep("""function yamlFor(r) {
  let out = '';
  if (r.desc) out += '# ' + r.desc + '\\n';
  if (!r.in_base) out += '# not in base.yaml — read by: ' + r.scripts.map(disp).join(', ') + '\\n';
  if (!r.default) out += r.key + ':\\n';
  else if (r.default.includes('\\n') || /^- /.test(r.default)) out += r.key + ':\\n' + (/^\\s/.test(r.default) ? '' : '  ') + r.default + '\\n';
  else out += r.key + ': ' + r.default + '\\n';
  return out;
}""", """function yamlFor(r) {
  let out = '';
  if (r.desc) out += r.desc.match(/.{1,100}(\\s|$)/g).map(l => '# ' + l.trim()).join('\\n') + '\\n';
  if (!r.in_base) out += '# not in base.yaml — read by: ' + r.scripts.map(disp).join(', ') + '\\n';
  if (r.status && r.status.length) out += '# note: ' + r.status.join(', ') + '\\n';
  out += (r.yaml || (r.key + ':')) + '\\n';
  return out;
}""")
rep("""      (r.in_base && !r.scripts.length ? '<span class="pill nr">no code reference</span>' : '') +""",
    """      (r.in_base && !r.scripts.length ? '<span class="pill nr">no code reference</span>' : '') +
      (r.status || []).map(t => `<span class="pill nb">${esc(t)}</span>`).join('') +""")
rep("""  if (r.ref) h += `<div><div class="lbl">First read in code</div><pre>${esc(r.ref)}</pre></div>`;""",
    """  if (r.ref) h += `<div><div class="lbl">First read in code</div><pre>${esc(r.ref)}</pre></div>`;
  if (r.set_at) h += `<div><div class="lbl">Changed by a script at run time</div>${esc(r.set_at)} assigns this setting (for example from command-line arguments), so the value in your file can be replaced while that script runs.</div>`;
  if ((r.status || []).includes('deprecated')) h += `<div><div class="lbl">Deprecated</div>base.yaml marks this setting as deprecated; scripts may ignore it.</div>`;""")
s = s.replace('</header>', '  <p style="margin-top:10px"><a href="index.html" style="color:var(--accent)">← Back to the YAML Tool</a></p>\n  </header>', 1)
(R / 'repo/lich-yaml-settings.html').write_text(s)
print('ok', len(data['rows']))
