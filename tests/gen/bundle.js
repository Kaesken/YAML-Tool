// Loads the built page with dr-scripts served locally and writes the data it
// derived, so the offline fallback matches the live transform exactly.
const path=require('path'),fs=require('fs');
const {load,tick}=require('../harness/load');
const DRS=path.join(__dirname,'../dr-scripts');
function localFetch(url){ const m=String(url).match(/dr-scripts\/[^/]+\/(.+)$/); const f=m&&path.normalize(path.join(DRS,m[1])); if(!f||!fs.existsSync(f)) return Promise.resolve({ok:false,status:404,text:async()=>''}); const t=fs.readFileSync(f,'utf8'); return Promise.resolve({ok:true,status:200,text:async()=>t}); }
(async()=>{
  const dom=load(path.join(__dirname,'../repo/YAMLTool.html'),{fetch:localFetch}); await tick(2500);
  const w=dom.window; const st=w.document.getElementById('data-status').textContent;
  if(!/live data/.test(st)) { console.error('not all live: '+st); process.exit(1); }
  const out={};
  ['SPELL_DB','HUNTING_ZONES','ZONE_RANKS','ZONE_PROVINCES','T2_SKILL_GROUPS','TRAP_OPTS','WORKORDER_RECIPES','GOD_ALTAR_TOWNS','BARB_BERSERKS','BARB_FORMS','BARB_MEDITATIONS','BARB_ROARS','BARB_ROAR_CMDS'].forEach(k=>{ out[k]=w.eval(k); });
  out.NEUTRAL_GODS=[...w.eval('NEUTRAL_GODS')];
  fs.writeFileSync(path.join(__dirname,'bundled.json'),JSON.stringify(out));
  console.log(Object.entries(out).map(([k,v])=>k+':'+(Array.isArray(v)?v.length:Object.keys(v).length)).join(' '));
})();
