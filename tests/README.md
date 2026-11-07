# Tests and generators

Run from this folder after `npm install` (needs Node 18+ and Ruby for the Psych checks):

- `node checks.js ../YAMLTool.html` — the 50 audit checks (all fail on ec12f3d, all pass now)
- `node scenarios.js ../YAMLTool.html` — drives the form for every guild
- `node roundtrip.js` — imports every dr-scripts sample profile and compares (needs a dr-scripts clone next to the YAML-Tool folder; checks.js uses it for the live-data checks too)

`gen/` holds the scripts that produced the bundled data and the settings index:
`gen_data.rb` (base.yaml defaults, towns, lockpicks, immortals), `bundle.js` (offline snapshots via the live transforms),
`scan_settings.rb` + `patch_settings.py` (lich-yaml-settings.html), `changelog.py`.
