// Drives the UI for every guild and checks the file loads in Psych and the
// page logs no errors.
const {load,tick,psych}=require('./load');
const file=process.argv[2]||require('path').join(__dirname,'../YAMLTool.html');
function setv(w,id,val){ const el=w.document.getElementById(id); if(!el) throw new Error('no #'+id); if(el.tagName==='SELECT'&&![...el.options].some(o=>o.value===val)){ const o=w.document.createElement('option'); o.value=o.textContent=val; el.appendChild(o);} el.value=val; el.dispatchEvent(new w.Event('input',{bubbles:true})); el.dispatchEvent(new w.Event('change',{bubbles:true})); }
const GUILDS=['Barbarian','Bard','Cleric','Empath','Moon Mage','Necromancer','Paladin','Ranger','Thief','Trader','Warrior Mage'];
(async()=>{
  let fails=0;
  for(const g of GUILDS){
    const dom=load(file); await tick(300); const w=dom.window; const S=w.eval('S'), T=w.eval('T');
    try{
      setv(w,'charName',"o'Brien test"); setv(w,'guild',g); w.onGuildChange(); await tick(100);
      setv(w,'hometown','Fang Cove'); setv(w,'fangCoveOverrideTown','Crossing'); setv(w,'safeRoom','1234');
      setv(w,'forceHealerTown','Crossing'); setv(w,'wornTrashcan','bucket'); setv(w,'wornTrashcanVerb','put');
      ['stopBleed','climbRope','hasBurgle','hasBoxes','listen','bescortFare','skinSkin','skinDissectThan','harvestTraps','sellLootBundle','avoidAthleticsInJustice','useLockpickRing','burgleRetry','workorderRecipes'].forEach(k=>w.togA(k));
      setv(w,'burgleRoom','555'); setv(w,'burgleLootContainer','backpack'); setv(w,'burgleEntryType','priorityrope'); setv(w,'burgleRopeAdj','heavy');
      setv(w,'boxLootLimit','5'); setv(w,'lockpickType','stout'); setv(w,'refillTown','Crossing');
      setv(w,'sellLootMoneyOnHand','2 gold'); setv(w,'gemPouchNoun','sack'); setv(w,'lootAdditions','nugget\nbar'); setv(w,'lootSubtractions','rock');
      setv(w,'lootSpecialName','jadeite stone'); setv(w,'lootSpecialBag','pouch'); w.addLootSpecial();
      setv(w,'favorGod','Albreda'); w.onFavorGodChange(); setv(w,'waterHolder','chalice'); setv(w,'favorGoal','20'); setv(w,'favorTown','Shard');
      setv(w,'w_Small_Edged','steel scimitar'); setv(w,'w_Bow','composite bow'); setv(w,'w_Light_Thrown','throwing hammer');
      S.weaponSlotFlags['Light Thrown'].lodges=true; S.weaponSlotFlags['Small Edged'].wield=true; w.renderWeaponSlots(); setv(w,'danceSkill','Small Edged');
      w.document.getElementById('combatPaste').value='All of your worn combat equipment:\n  a battered leather shield\n  some quilted gloves\n[Use INVENTORY HELP]'; w.parseCombatGear();
      setv(w,'newGearSetName','stealing'); w.addGearSetName(); S.armorGear[1].gearSets.stealing=true; S.armorGear[1].tieTo='belt';
      w.loadT2Template(); w.eval('S').trainingList[0].scripts+='\necho "a: b" # c';
      setv(w,'huntZoneInput','rats'); w.addHuntZone(); setv(w,'huntDuration','30'); w.setHunt('dance','d2'); w.toggleHuntSkill('stop_on','Evasion');
      w.addHunt(); setv(w,'huntZoneInput','grave_worms'); w.addHuntZone(); w.toggleHuntSkill('stop_on_low','Parry Ability');
      w.toggleCrossingSkill('Athletics'); setv(w,'ctMaxThreshold','30');
      setv(w,'taAbility','Perc'); setv(w,'taSecs','120'); w.addTrainingAbility();
      w.toggleCraft('forging'); w.toggleCraft('engineering'); const cs=S.crafting.engineering; cs.useBelt=true; cs.beltName='tool belt'; cs.beltItems.push('carving knife'); w.setCraftExtra('engineering','carving_tools','rasp\nriffler');
      setv(w,'forceCraftingTown','Crossing'); setv(w,'workorderDiff','hard');
      setv(w,'anyKeyInput','safety_escape_health_threshold'); w.addExtraSetting(); w.setExtraSetting('safety_escape_health_threshold','60');
      setv(w,'includeInput','shared'); w.addInclude(); setv(w,'unionKeyInput','loot_additions'); w.addUnionKey();
      setv(w,'extraYaml','my_custom: [1, 2]\nalmanac_no_use_rooms:\n  - !ruby/regexp /Foo/i');
      if(w.eval('MAGIC_GUILDS').includes(g)){
        const sp=w.getGuildSpells(g).filter(s=>!s.ritual).slice(0,4); sp.forEach(s=>w.toggleSpellSelect(s));
        const C=S.configuredSpells; C[0].trainSlots=['Augmentation']; C[0].useCambrinth=true; C[0].cambrinthAmounts='5,5 | 10'; C[0].mana='5';
        if(C[1]){ C[1].combatTrainSlots=['Warding']; C[1].inOffensive=true; C[1].castOnlyToTrain=true; }
        if(C[2]){ C[2].trainSlots=['Sorcery']; setv(w,'sorceryRoom','777'); C[2].waggleSets=['default','prehunt_buffs']; S.selectedWaggles.add('default'); S.selectedWaggles.add('prehunt_buffs'); setv(w,'prehuntBuffingRoom','888'); }
        if(C[3]) S.buffSpells.push(C[3].name);
        S.cambrinthItems.push({name:'cambrinth armband',cap:'32',stored:false},{name:'cambrinth ring',cap:'',stored:true}); w.togA('cambDistribute');
        w.expandAll=1; for(let i=0;i<C.length;i++){ w.toggleExpandSpell(i); }
      }
      if(g==='Barbarian'){ S.barbBuffs.push('Avalanche','Bear'); S.barbRoarCooldowns["Anger the Earth"]='120'; setv(w,'barbNewWaggleName','default'); w.addWaggleSet(); S.waggleSets[0].useBuffs=true; w.togA('roarsAsBattleCries'); }
      if(g==='Thief'){ S.thiefKhri.push('Hasten','Safe'); S.thiefBuffLines=[['Hasten','Safe']]; setv(w,'thiefNewWaggleName','burgle'); w.addWaggleSet(); S.waggleSets[0].lines=[['Safe']]; }
      if(g==='Bard'){ S.bardScreams=['Havoc']; }
      w.updateCurrentPreview(); await tick(200);
      w.goStep(1); await tick(150);
      const y=w.buildYAML(); const p=psych(y);
      const res=w.validateProfile();
      if(!p.ok) throw new Error('psych: '+p.error);
      const d=p.data;
      const need=['hometown','fang_cove_override_town','hunting_info','training_list','gear','gear_sets','burgle_settings','favor_god','loot_specials','my_custom','safety_escape_health_threshold','include','union_keys','crossing_training','engineering_belt','carving_tools','weapon_training'];
      const miss=need.filter(k=>!(k in d)); if(miss.length) throw new Error('missing '+miss.join(','));
      if(d.hunting_info.length!==2) throw new Error('hunts '+d.hunting_info.length);
      if(!String(d.almanac_no_use_rooms[0]).includes('Foo')) throw new Error('regexp');
      if(w.eval('MAGIC_GUILDS').includes(g)&&!d.training_spells&&!d.crossing_training_sorcery) throw new Error('no training spells');
      if(dom.errors.length) throw new Error('page errors: '+dom.errors.slice(0,2).join(' | ').slice(0,400));
      if(process.env.SHOW===g){ console.log(y); console.log(JSON.stringify(res)); }
      console.log('ok',g,Object.keys(d).length,'keys; errors',res.errors.map(e=>e.t).join('/')||'-','warnings',res.warnings.length);
    }catch(e){ fails++; console.log('FAIL',g,e.message.slice(0,500)); }
  }
  console.log(fails?fails+' failed':'all guilds ok');
})();
