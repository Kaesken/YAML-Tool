// Import each sample profile, rebuild it, and compare what Lich would load
// (base.yaml merged with the profile) before and after.
const {load,tick,psych}=require('./load');const fs=require('fs'),path=require('path');
const dir=path.join(__dirname,'../../dr-scripts/profiles/Samples');
const files=fs.readdirSync(dir,{recursive:true}).filter(f=>/\.yaml$/.test(f)).map(f=>path.join(dir,f));
const base=psych(fs.readFileSync(path.join(__dirname,'../../dr-scripts/profiles/base.yaml'),'utf8')).data;
const canon=x=>Array.isArray(x)?x.map(canon):(x&&typeof x==='object')?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canon(x[k])])):x;
(async()=>{
  let bad=0;
  for(const f of files){
    const text=fs.readFileSync(f,'utf8'); const o=psych(text); if(!o.ok||!o.data){ console.log('skip',path.basename(f)); continue; }
    const dom=load(); await tick(300); const w=dom.window; w.confirm=()=>true;
    if(o.data.guild){} 
    w.importProfile(text); await tick(150);
    const y=w.buildYAML(); const p=psych(y);
    if(!p.ok){ console.log('PSYCH FAIL',path.basename(f),p.error); bad++; continue; }
    const A=Object.assign({},base,o.data), B=Object.assign({},base,p.data);
    const diffs=[...new Set([...Object.keys(A),...Object.keys(B)])].filter(k=>JSON.stringify(canon(A[k]??null))!==JSON.stringify(canon(B[k]??null)));
    if(diffs.length||dom.errors.length){ bad++; console.log(path.relative(dir,f),'DIFF',diffs.map(k=>k+': '+String(JSON.stringify(A[k])).slice(0,90)+' => '+String(JSON.stringify(B[k])).slice(0,90)).join('\n   '),dom.errors.slice(0,2)); }
  }
  console.log(files.length,'files,',bad,'with differences');
})();
