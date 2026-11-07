// Executable checks for the audit findings. Each check describes the FIXED
// behaviour; on the original tool a failing check confirms the finding.
const { load, psych, tick } = require('./load');
const file = process.argv[2] || require('path').join(__dirname, '../YAMLTool.html');
const only = process.argv[3] ? new RegExp(process.argv[3]) : null;

const fs = require('fs'), path = require('path');
const DRS = path.join(__dirname, '../../dr-scripts');
function localFetch(url) { const m = String(url).match(/dr-scripts\/[^/]+\/(.+)$/); const f = m && path.join(DRS, m[1]); if (!f || !fs.existsSync(f)) return Promise.resolve({ ok: false, status: 404, text: async () => '' }); const t = fs.readFileSync(f, 'utf8'); return Promise.resolve({ ok: true, status: 200, text: async () => t }); }
function slowLocalFetch(url, o) { return new Promise(r => setTimeout(() => r(localFetch(url, o)), 500)); }
async function freshLive() { const dom = load(file, { fetch: localFetch }); await tick(1500); return dom; }
async function fresh() { const dom = load(file); await tick(250); return dom; }
function setv(w, id, val) { const el = w.document.getElementById(id); if (!el) throw new Error('no #' + id); if (el.tagName === 'SELECT' && ![...el.options].some(o => o.value === val)) { const o = w.document.createElement('option'); o.value = o.textContent = val; el.appendChild(o); } el.value = val; el.dispatchEvent(new w.Event('input', { bubbles: true })); el.dispatchEvent(new w.Event('change', { bubbles: true })); }
function out(w) { const y = w.buildYAML(); const p = psych(y); return { y, p, d: p.ok ? (p.data || {}) : null }; }
function tog(w, k, want) { if (!!w.eval('T')[k] !== want) w.togA(k); }
function guild(w, g) { setv(w, 'guild', g); if (w.onGuildChange) w.onGuildChange(); }

const C = [];
const check = (id, title, fn) => C.push({ id, title, fn });

check('yamlsyntax-1/basics-1', 'tricky strings round-trip and the profile parses', async () => {
  const dom = await fresh(); const w = dom.window;
  w.eval('S').emptyRoomMsgs.push("'Ello, anyone here?", '* waves hello', 'Note: is anyone here?', 'anyone? #justasking', 'yes');
  setv(w, 'safeRoom', '*1234');
  const { p, d } = out(w);
  if (!p.ok) return 'Psych failed: ' + p.error;
  const m = d.empty_hunting_room_messages;
  return JSON.stringify(m) === JSON.stringify(["'Ello, anyone here?", '* waves hello', 'Note: is anyone here?', 'anyone? #justasking', 'yes']) || 'got ' + JSON.stringify(m);
});
check('yamlsyntax-2', 'T2 script with ": " stays a string', async () => {
  const dom = await fresh(); const w = dom.window;
  w.eval('S').trainingList.push({ skills: ['Athletics'], start: '10', moons: false, scripts: 'athletics\necho note: hi #x' });
  const { p, d } = out(w); if (!p.ok) return p.error;
  const s = d.training_list[0].scripts; return (s[1] === 'echo note: hi #x') || JSON.stringify(s);
});
check('basics-3/combat-2/docs-3', 'stop_hunting_if_bleeding not overridden by default', async () => {
  const w = (await fresh()).window; const { d } = out(w); return !('stop_hunting_if_bleeding' in d) || 'emitted ' + d.stop_hunting_if_bleeding;
});
check('basics-5', 'tie_gem_pouches not overridden by default', async () => { const w = (await fresh()).window; const { d } = out(w); return !('tie_gem_pouches' in d) || 'emitted'; });
check('basics-11', 'sell_loot_money_on_hand not written by default', async () => { const w = (await fresh()).window; const { d } = out(w); return !('sell_loot_money_on_hand' in d) || d.sell_loot_money_on_hand; });
check('basics-6', 'ignored_npcs not frozen by default', async () => { const w = (await fresh()).window; const { d } = out(w); return !('ignored_npcs' in d) || 'emitted'; });
check('spells-2/combat-3', 'train_with_spells not forced false for a caster', async () => { const w = (await fresh()).window; guild(w, 'Cleric'); const { d } = out(w); return d.train_with_spells !== false || 'false'; });
check('basics-2/yamlsyntax-3', 'blank box loot limit not written as 0', async () => { const w = (await fresh()).window; tog(w, 'hasBoxes', true); const { d } = out(w); return !('box_loot_limit' in d) || d.box_loot_limit; });
check('basics-9/docs-12', 'stop_pick_on_mindlock keeps base true', async () => { const w = (await fresh()).window; tog(w, 'hasBoxes', true); const { d } = out(w); return d.stop_pick_on_mindlock !== false || 'false'; });
check('basics-27', 'no bare pick: hash', async () => { const w = (await fresh()).window; tog(w, 'hasBoxes', true); const { d } = out(w); return !('pick' in d) || d.pick !== null || 'pick: nil'; });
check('basics-16', 'fill_pouch_with_box not forced', async () => { const w = (await fresh()).window; tog(w, 'hasBoxes', true); const { d } = out(w); return !('fill_pouch_with_box' in d) || 'emitted'; });
check('basics-10', 'bescort fare does not force bescort_hide false', async () => { const w = (await fresh()).window; tog(w, 'bescortFare', true); const { d } = out(w); return d.bescort_hide !== false || 'false'; });
check('basics-4/completeness-5', 'skinning keeps base arrange_types', async () => { const w = (await fresh()).window; tog(w, 'skinTieBundle', true); const { d } = out(w); return (d.skinning && d.skinning.arrange_types && d.skinning.skin !== false) || JSON.stringify(d.skinning); });
check('basics-12/yamlsyntax-9', 'blank burgle room is not 1188', async () => { const w = (await fresh()).window; tog(w, 'hasBurgle', true); const { d } = out(w); return !(d.burgle_settings && d.burgle_settings.room === 1188) || '1188'; });
check('yamlsyntax-12', 'no null fang_cove_override_town', async () => { const w = (await fresh()).window; setv(w, 'hometown', 'Fang Cove'); const { d } = out(w); return !('fang_cove_override_town' in d) || d.fang_cove_override_town !== null || 'null'; });
check('crafting-1/yamlsyntax-4', 'enabled craft without tools keeps base tool list', async () => { const w = (await fresh()).window; w.toggleCraft('forging'); const { p, d } = out(w); if (!p.ok) return p.error; return !('forging_tools' in d) || !(d.forging_tools || []).includes(null) || JSON.stringify(d.forging_tools); });
check('crafting-2', 'workorders repair No writes false', async () => { const w = (await fresh()).window; w.toggleCraft('alchemy'); tog(w, 'workordersRepair', false); const { d } = out(w); return d.workorders_repair === false || 'got ' + d.workorders_repair; });
check('crafting-3/data-6', 'workorder_recipes not emitted by default', async () => { const w = (await fresh()).window; w.toggleCraft('alchemy'); const { d } = out(w); return !('workorder_recipes' in d) || 'emitted'; });
check('crafting-8', 'general crafting settings kept without an enabled craft', async () => { const w = (await fresh()).window; setv(w, 'workorderDiff', 'easy'); const { d } = out(w); return d.workorder_diff === 'easy' || 'dropped'; });
check('crafting-4', 'engineering belt is engineering_belt', async () => { const w = (await fresh()).window; const key = w.eval('CRAFTS').find(c => /shap|engin/.test(c.key)).key; w.toggleCraft(key); const cs = w.eval('S').crafting[key]; cs.useBelt = true; cs.beltName = 'tool belt'; cs.beltItems.push('rasp'); const { d } = out(w); return ('engineering_belt' in d) || Object.keys(d).filter(k => /belt/.test(k)).join(','); });
check('guild-1/yamlsyntax-5', 'Moon Mage default does not nil astrology_prediction_skills', async () => { const w = (await fresh()).window; guild(w, 'Moon Mage'); const { d } = out(w); return !('astrology_prediction_skills' in d) || (d.astrology_prediction_skills && d.astrology_prediction_skills.magic) || 'nil'; });
check('guild-3', 'barb_famine_healing never half-filled', async () => { const w = (await fresh()).window; guild(w, 'Barbarian'); await tick(); setv(w, 'g_famineHealthThresh', '50'); const { d } = out(w); return !d.barb_famine_healing || d.barb_famine_healing.inner_fire_threshold != null || 'half'; });
check('guild-4', 'Necro ritual_type has no store option', async () => { const w = (await fresh()).window; guild(w, 'Necromancer'); await tick(); const el = w.document.getElementById('g_thanatRitualType'); return ![...el.options].some(o => o.value === 'store') || 'store offered'; });
check('guild-6', 'pray_to_chadatru on Paladin, not Cleric', async () => { const w = (await fresh()).window; guild(w, 'Cleric'); await tick(); const { d } = out(w); return !('pray_to_chadatru' in d) || 'cleric emits'; });
check('guild-2/spells-15', 'single waggle-sets id', async () => { const w = (await fresh()).window; return w.document.querySelectorAll('#waggle-sets').length <= 1 || 'duplicate id'; });
check('spells-1/completeness-4', 'combat_spell_training emitted', async () => { const w = (await fresh()).window; guild(w, 'Cleric'); const S = w.eval('S'); S.configuredSpells.push({ name: 'Bless', abbrev: 'BLESS', skill: 'Augmentation', mana: 5, combatTrainSlots: ['Augmentation'], trainSlots: [], waggleSets: [] }); const { d } = out(w); return !!d.combat_spell_training || 'missing'; });
check('spells-13/completeness-16', 'no cast_only_to_train in training_spells', async () => { const w = (await fresh()).window; guild(w, 'Cleric'); const S = w.eval('S'); S.configuredSpells.push({ name: 'Bless', abbrev: 'BLESS', skill: 'Augmentation', mana: 5, trainSlots: ['Augmentation'], waggleSets: [] }); const { d } = out(w); return !(d.training_spells && 'cast_only_to_train' in d.training_spells.Augmentation) || 'present'; });
check('spells-19', 'non-magic guild drops spells and cambrinth', async () => { const w = (await fresh()).window; guild(w, 'Barbarian'); const S = w.eval('S'); S.cambrinthItems.push({ name: 'armband', cap: '32', stored: false }); S.configuredSpells.push({ name: 'X', trainSlots: ['Utility'], waggleSets: [] }); const { d } = out(w); return !d.cambrinth && !d.training_spells || 'still emitted'; });
check('spells-8/yamlsyntax-11', 'blank cambrinth cap not nil', async () => { const w = (await fresh()).window; guild(w, 'Cleric'); w.eval('S').cambrinthItems.push({ name: 'armband', cap: '', stored: false }); const { d } = out(w); return !('cambrinth_cap' in d) || d.cambrinth_cap != null || 'nil'; });
check('training-1/docs-1', 'duration labelled in minutes', async () => { const w = (await fresh()).window; return /minute/i.test(w.document.body.innerHTML.match(/Duration[^<]*<span[^>]*>[^<]*/i)?.[0] || '') || 'still seconds'; });
check('training-2', 'no forced d1 arg', async () => { const w = (await fresh()).window; const S = w.eval('S'); if (S.hunts) S.hunts[0].zones.push('rats'); else S.huntZones.push('rats'); const { d } = out(w); const a = d.hunting_info && d.hunting_info[0].args; return !a || !a.includes('d1') || 'd1 forced'; });
check('training-6', 'no Locks ability', async () => { const w = (await fresh()).window; return !w.eval('T2_ABILITIES').some(a => a[0] === 'Locks') || 'Locks present'; });
check('training-7/data-9', 'no Scouting skill offline', async () => { const w = (await fresh()).window; const g = w.eval('T2_SKILL_GROUPS'); return !Object.values(g).flat().includes('Scouting') || 'Scouting'; });
check('training-12', 'template scripts lowercase', async () => { const w = (await fresh()).window; w.loadT2Template(); return !w.eval('S').trainingList.some(b => /\bAthletics\b|\bOutdoorsmanship\b/.test(b.scripts)) || 'capitalised'; });
check('training-14', 'training_abilities keeps Hunt', async () => { const w = (await fresh()).window; w.eval('S').trainingAbilities.push({ name: 'Perc', secs: '60' }); const { d } = out(w); return (d.training_abilities && 'Hunt' in d.training_abilities) || JSON.stringify(d.training_abilities); });
check('training-9/docs-11', 'download not blocked for a crafter with no T2/hunt', async () => { const w = (await fresh()).window; setv(w, 'charName', 'Mahtra'); w.renderGenerate(); let blocked = null; const orig = w.showErrorBox; w.showErrorBox = (t) => { blocked = t; }; w.downloadYAML(); w.showErrorBox = orig; return !blocked || 'blocked: ' + blocked; });
check('critic-6', 'filename normalised', async () => { const w = (await fresh()).window; setv(w, 'charName', 'MAHTRA smith'); w.renderGenerate(); return /^Mahtra-setup\.yaml$/.test(w.document.getElementById('gen-filename').textContent) || w.document.getElementById('gen-filename').textContent; });
check('data-1/combat-1/data-2', 'INV COMBAT paste parses cleanly', async () => {
  const w = (await fresh()).window; w.document.getElementById('combatPaste').value = 'inv combat\nAll of your worn combat equipment:\n  a battered leather shield\n  some dark leather gloves with seams\n[Use INVENTORY HELP for more options.]\nLying at your feet you see:\n  a rock';
  w.parseCombatGear(); const { p, d } = out(w); if (!p.ok) return p.error;
  const names = (d.gear || []).map(g => (g.adjective ? g.adjective + ' ' : '') + g.name);
  return JSON.stringify(names) === JSON.stringify(['battered shield', 'dark gloves']) || JSON.stringify(names);
});
check('data-2', 'container paste strips articles', async () => { const w = (await fresh()).window; w.document.getElementById('containerPaste').value = 'All of your containers:\n  a leather backpack\n  an oak pouch'; w.document.getElementById('containerPaste').value += '\n  some ox-hide saddlebags\n[Use INVENTORY HELP for more options.]\nLying at your feet you see:\n  a sack'; w.parseContainers(); const c = (w.eval('S').parsedContainers || []).map(x => x.name); return JSON.stringify(c) === JSON.stringify(['leather backpack', 'oak pouch', 'ox-hide saddlebags']) || JSON.stringify(c); });
check('combat-5', 'unworn armor not in gear_sets.standard', async () => { const w = (await fresh()).window; const S = w.eval('S'); S.armorGear.push({ noun: 'shield', adj: 'oak', isWorn: false, gearSets: { standard: true } }); const { d } = out(w); return !(d.gear_sets && (d.gear_sets.standard || []).includes('oak shield')) || 'in standard'; });
check('combat-7', 'dance_skill offers no ranged skills', async () => { const w = (await fresh()).window; const o = [...w.document.getElementById('danceSkill').options].map(x => x.value); return !o.some(x => /Bow|Crossbow|Slings|Thrown/.test(x)) || o.join(','); });
check('data-5/training-4', 'escort zones accepted (live data)', async () => { const w = (await freshLive()).window; const z = w.eval('HUNTING_ZONES'); return (z.includes('grave_worms') && z.length > 300) || 'missing (' + z.length + ')'; });
check('data-7', 'live data load keeps guild values', async () => { const dom = load(file, { fetch: slowLocalFetch }); await tick(150); const w = dom.window; guild(w, 'Barbarian'); await tick(); setv(w, 'g_warhorn', 'horn'); await tick(900); const el = w.document.getElementById('g_warhorn'); return (el && el.value === 'horn') || 'wiped'; });
check('data-14', 'live data URL uses main', async () => { const w = (await fresh()).window; return /\/main\//.test(w.eval('DR_BASE')) || w.eval('DR_BASE'); });
check('spells-4', 'no metamagic in spell picker', async () => { const w = (await fresh()).window; return !w.eval('SPELL_DB').some(s => /scream|roar/i.test(s.skill || '') || s.metamagic) || 'present'; });
check('yamlsyntax-8', 'duplicate waggle set names rejected', async () => { const w = (await fresh()).window; guild(w, 'Barbarian'); const i = w.document.getElementById('barbNewWaggleName'); i.value = 'buff'; w.addWaggleSet(); i.value = 'Buff'; w.addWaggleSet(); return w.eval('S').waggleSets.length === 1 || 'dupes'; });
check('basics-25', 'hometown list has Ain Ghazal', async () => { const w = (await fresh()).window; return [...w.document.getElementById('hometown').options].some(o => o.value === "Ain Ghazal") || 'missing'; });
check('data-10/basics-19', 'Everild selectable', async () => { const w = (await fresh()).window; return [...w.document.getElementById('favorGod').options].some(o => o.value === 'Everild') || 'missing'; });
check('completeness-1', 'raw extra YAML and include supported', async () => { const w = (await fresh()).window; return (typeof w.importProfile === 'function' && !!w.document.getElementById('extraYaml')) || 'missing'; });
check('completeness-18', 'worn_trashcan producible', async () => { const w = (await fresh()).window; return !!w.document.getElementById('wornTrashcan') || 'missing'; });

(async () => {
  let pass = 0, fail = 0; const res = [];
  for (const c of C) {
    if (only && !only.test(c.id)) continue;
    let r; try { r = await c.fn(); } catch (e) { r = 'ERROR ' + e.message.split('\n')[0]; }
    const ok = r === true; ok ? pass++ : fail++;
    res.push(`${ok ? 'PASS' : 'FAIL'} [${c.id}] ${c.title}${ok ? '' : ' -> ' + r}`);
  }
  console.log(res.join('\n')); console.log(`\n${pass} pass, ${fail} fail`);
})();
