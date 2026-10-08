/* ============================================================
   TERAMERGE — PORTFOLIO · THE HAND-DRAWN FOLIO
   Loader → pencil-sketch entrance (click the door) → walk a
   sketched corridor of asset doors → open one to read the asset
   → view the whole portfolio. Content is ILLUSTRATIVE of the
   target acquisition criteria (Pipeline / In review / Target
   asset only; economics shown as "in review" / "target").
   ============================================================ */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (v,a,b)=> v<a?a:v>b?b:v;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = matchMedia('(max-width:820px)').matches;

  /* ---------- data ---------- */
  const TARGETS = [
    ['Target acquisitions','$60–70M'], ['Target units','500–700'], ['Target assets','8–12'],
    ['Core markets','2–4'], ['Target asset class','Class B / B+'], ['Target exit NOI','$5.5–7M'],
  ];
  const LV = ['Rent lift','Operating efficiency','Renovation','AI-enabled operations','Expense optimization'];
  const ASSETS = [
    { no:'01', market:'Indianapolis', name:'Asset 01', status:'Pipeline',     units:'150–200', cls:'B / B+', vintage:'1990–2015', valueAdd:'Yes', levers:LV },
    { no:'02', market:'Indianapolis', name:'Asset 02', status:'In review', units:'150–200', cls:'B / B+', vintage:'1985–2010', valueAdd:'Yes', levers:LV },
    { no:'03', market:'Nashville',    name:'Asset 03', status:'Target asset', units:'180–220', cls:'B+',    vintage:'1995–2015', valueAdd:'Yes', levers:LV },
    { no:'04', market:'Nashville',    name:'Asset 04', status:'Pipeline',     units:'120–160', cls:'B',     vintage:'1990–2008', valueAdd:'Yes', levers:LV },
    { no:'05', market:'Kansas City',  name:'Asset 05', status:'Target asset', units:'150–200', cls:'B / B+', vintage:'1988–2012', valueAdd:'Yes', levers:LV },
    { no:'06', market:'Kansas City',  name:'Asset 06', status:'Pipeline',     units:'160–200', cls:'B+',    vintage:'1996–2016', valueAdd:'Yes', levers:LV },
    { no:'07', market:'Charlotte',    name:'Asset 07', status:'Target asset', units:'180–240', cls:'B / B+', vintage:'1998–2018', valueAdd:'Yes', levers:LV },
    { no:'08', market:'Charlotte',    name:'Asset 08', status:'In review', units:'150–200', cls:'B+',    vintage:'1992–2014', valueAdd:'Yes', levers:LV },
  ];
  const LAYERS=[
    ['Building','The physical asset'], ['Units','The revenue base'], ['Occupancy','Target 94–96%'],
    ['Rents','Lift to market'], ['Expenses','Optimized'], ['Renovation','Value-add capex'],
    ['Operations','One standard'], ['NOI','Where levers compound'], ['Valuation','Stabilized NOI × cap rate'],
  ];
  const NOI=[['Current NOI','In review'],['Operating improvement','Target'],['Rent optimization','Target'],
    ['Expense optimization','Target'],['Stabilized NOI','Target'],['Exit value','Target']];
  const N = ASSETS.length;
  const uNum = u => parseInt(String(u).replace(/[^0-9]/,''),10) || 160;

  /* ================= signage ================= */
  $('targets').innerHTML = `<div class="targets__h">The strategy · targets</div>` +
    TARGETS.map(([l,v])=>`<div class="tg"><span class="v">${v}</span><span class="l">${l}</span></div>`).join('');

  /* ================= build the asset doors ================= */
  const doorsEl = $('doors');
  doorsEl.innerHTML = ASSETS.map((a,i)=>{
    const tgt = a.status==='Target asset';
    const floors = clamp(Math.round(uNum(a.units)/40),4,7);
    const roomBld = Array.from({length:floors}).map(()=>'<div class="room__f"></div>').join('');
    return `<div class="door" data-i="${i}" role="button" tabindex="-1" aria-label="${a.market} ${a.name}, ${a.status} — open">
      <div class="sgn"><i class="l"></i><i class="r"></i><div class="sgn__p"><div class="sgn__m">${a.market}</div><div class="sgn__n">${a.name}</div></div></div>
      <span class="hint hint--l"></span><span class="hint hint--r"></span>
      <div class="dframe"></div>
      <div class="room"><div class="room__bld">${roomBld}</div><div class="room__peek">${a.units} units · ${a.cls}</div></div>
      <div class="leaf">
        <div class="leaf__panels"><span></span><span></span></div><span class="leaf__knob"></span>
        <div class="tape">
          <div class="tape__m">${a.market}</div><div class="tape__n">${a.name}</div>
          <div class="tape__g">
            <div class="tape__k"><span class="l">Units</span><span class="v">${a.units}</span></div>
            <div class="tape__k"><span class="l">Class</span><span class="v">${a.cls}</span></div>
            <div class="tape__k"><span class="l">Vintage</span><span class="v">${a.vintage}</span></div>
            <div class="tape__k"><span class="l">Value-add</span><span class="v">${a.valueAdd}</span></div>
          </div>
          <div class="tape__foot"><span class="tape__st"><span class="d" style="${tgt?'background:#2b2b2b':''}"></span>${a.status}</span><span class="tape__open">open ›</span></div>
        </div>
      </div>
    </div>`;
  }).join('');
  const doors = [...doorsEl.children];

  /* mobile fallback directory — always built; CSS shows it only at ≤820px */
  {
    const ml = document.createElement('div'); ml.className='mlist';
    ml.innerHTML = ASSETS.map((a,i)=>`<div class="mcard" data-i="${i}">
      <div class="mcard__m">${a.market}</div><div class="mcard__n">${a.name}</div>
      <div class="mcard__g">
        <div><span class="l">Units</span><span class="v">${a.units}</span></div>
        <div><span class="l">Class</span><span class="v">${a.cls}</span></div>
        <div><span class="l">Vintage</span><span class="v">${a.vintage}</span></div>
        <div><span class="l">Status</span><span class="v">${a.status}</span></div>
      </div></div>`).join('');
    $('hall').appendChild(ml);
    ml.addEventListener('click', e=>{ const c=e.target.closest('.mcard'); if(c) openAsset(ASSETS[+c.dataset.i]); });
  }

  /* ================= asset detail panel ================= */
  const panel=$('panel'), panelBody=$('panelBody'), panelClose=$('panelClose'), panelScrim=$('panelScrim');
  let lastFocus=null;
  function openAsset(a){
    const floors=clamp(Math.round(uNum(a.units)/22),6,9);
    panelBody.innerHTML = `
      <div class="pv__head">
        <div><div class="pv__market">${a.market}</div><h2 class="pv__name" id="pName">${a.name}</h2></div>
        <span class="pv__status">${a.status}</span>
      </div>
      <p class="pv__illus">Illustrative of Teramerge's target acquisition criteria — units, class and vintage reflect the target profile. Deal-level economics are shown as targets or in review, never as owned positions or results.</p>
      <div class="pv__grid">
        <div>
          <div class="bld">${Array.from({length:floors}).map(()=>'<div class="bld__floor"></div>').join('')}</div>
          <div class="bld__base"></div>
          <div class="bld__tag">${a.units} units · ${a.cls} · ${a.vintage}</div>
        </div>
        <div class="levers">
          <p class="levers__intro">Where others see a building, we see <b>multiple levers of value</b> — one asset, deconstructed into occupancy, rent, expense, physical and operational value.</p>
          ${LAYERS.map((L,idx)=>`<div class="lever${idx===0?' active':''}" data-idx="${idx}" tabindex="0">
            <span class="lever__no">${String(idx+1).padStart(2,'0')}</span>
            <span class="lever__name">${L[0]}</span><span class="lever__note">${L[1]}</span></div>`).join('')}
        </div>
      </div>
      <div class="noiflow">
        <div class="noiflow__head">How value compounds</div>
        <div class="noiflow__row">${NOI.map((n,idx)=>`${idx?'<i>→</i>':''}<div class="noistep ${n[0]==='Stabilized NOI'||n[0]==='Exit value'?'end':''}"><span class="l">${n[0]}</span><span class="v">${n[1]}</span></div>`).join('')}</div>
        <p class="noiflow__note">Figures are illustrative targets consistent with the portfolio-level strategy — not asset-level results.</p>
      </div>`;
    const floorsEls=[...panelBody.querySelectorAll('.bld__floor')], levers=[...panelBody.querySelectorAll('.lever')];
    const lightTo=idx=>{ floorsEls.forEach((f,fi)=>f.classList.toggle('lit', fi>=floorsEls.length-1-idx));
      levers.forEach((l,li)=>l.classList.toggle('active', li===idx)); };
    levers.forEach(l=>{ const idx=+l.dataset.idx;
      l.addEventListener('mouseenter',()=>lightTo(idx)); l.addEventListener('click',()=>lightTo(idx)); l.addEventListener('focus',()=>lightTo(idx)); });
    lightTo(0);
    lastFocus=document.activeElement;
    panel.hidden=false; panel.setAttribute('aria-hidden','false');
    setTimeout(()=>panel.classList.add('on'),16);
    document.body.style.overflow='hidden';
    setTimeout(()=>panelClose.focus(),60);
  }
  function closeAsset(){
    panel.classList.remove('on'); panel.setAttribute('aria-hidden','true');
    document.body.style.overflow='';
    setTimeout(()=>{ panel.hidden=true; panelBody.innerHTML=''; },420);
    if(lastFocus&&lastFocus.focus) try{lastFocus.focus();}catch(e){}
  }
  panelClose.addEventListener('click', closeAsset);
  panelScrim.addEventListener('click', closeAsset);
  addEventListener('keydown', e=>{ if(e.key==='Escape' && !panel.hidden) closeAsset(); });

  /* ================= door open ================= */
  function fireOpen(door){
    if(!door.classList.contains('active')) return;
    door.classList.add('open');
    tick();
    setTimeout(()=>openAsset(ASSETS[+door.dataset.i]), 520);
  }
  doorsEl.addEventListener('click', e=>{ const d=e.target.closest('.door'); if(d) fireOpen(d); });

  /* ================= the walk (continuous corridor glide) ================= */
  const stage=$('stage'), spacer=$('spacer'), progressEl=$('progress'), hud=$('hud'),
        hudMarket=$('hudMarket'), hudNo=$('hudNo'), hudTot=$('hudTot'), hudStatus=$('hudStatus'),
        targetsEl=$('targets'), walk=$('walk'), prev=$('prev'), next=$('next'), viewAll=$('viewAll');
  const WALK_PER=620, SEG=1000;
  function trackLen(){ return WALK_PER*(N-1)+innerHeight*1.4; }
  function sizeSpacer(){ spacer.style.height=trackLen()+'px'; }
  sizeSpacer(); addEventListener('resize', sizeSpacer);

  let cur=-1, active=0, pTarget=0, pSmooth=0, last=0, raf=0, walking=false;
  function readScroll(){ const max=trackLen()-innerHeight; pTarget = max>0 ? clamp(scrollY,0,max)/max : 0; }
  function applyWalk(p){
    progressEl.style.transform=`scaleX(${p.toFixed(4)})`;
    const t=p*(N-1);
    let nearest=0, nd=1e9;
    doors.forEach((d,i)=>{
      const rel=i-t, z=-rel*SEG;
      d.style.transform=`translateZ(${z.toFixed(1)}px)`;
      d.style.opacity=(rel>=0 ? Math.max(0,1-rel/2.6) : Math.max(0,1+rel/0.5)).toFixed(3);
      d.style.filter = rel>0.4 ? `blur(${Math.min(3,(rel-0.4)*1.7).toFixed(2)}px)` : 'none';
      const ad=Math.abs(rel); if(ad<nd){ nd=ad; nearest=i; }
    });
    const idx=clamp(nearest,0,N-1), atDoor=nd<0.45;
    doors.forEach((d,i)=>{ const on=atDoor && i===idx; d.classList.toggle('active',on);
      d.setAttribute('tabindex', on?'0':'-1'); if(!on) d.classList.remove('open'); });
    if(idx!==cur){ cur=idx; active=idx; const a=ASSETS[idx];
      hudMarket.textContent=a.market; hudNo.textContent=String(idx+1).padStart(2,'0');
      hudTot.textContent='/ '+String(N).padStart(2,'0'); hudStatus.textContent=a.status;
      prev.disabled=idx===0; next.disabled=idx===N-1; tick(); }
    hud.classList.toggle('on',atDoor);
  }
  function loop(ts){ const dt=Math.min(0.05,(ts-last)/1000||0); last=ts;
    pSmooth += (pTarget-pSmooth)*(1-Math.exp(-dt*9));
    if(Math.abs(pTarget-pSmooth)<0.00008) pSmooth=pTarget;
    applyWalk(pSmooth); raf=requestAnimationFrame(loop); }
  // scroll updates immediately (robust even if rAF is throttled); the loop smooths between ticks
  addEventListener('scroll', ()=>{ readScroll(); applyWalk(pTarget); }, {passive:true});
  addEventListener('resize', ()=>{ readScroll(); applyWalk(pTarget); });

  function goTo(i){ i=clamp(i,0,N-1); const max=trackLen()-innerHeight; scrollTo({ top:(i/(N-1))*max, behavior:'smooth' }); }
  prev.addEventListener('click',()=>goTo(active-1));
  next.addEventListener('click',()=>goTo(active+1));
  addEventListener('keydown', e=>{ if(!walking || !panel.hidden || !$('finale').hidden) return;
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){ e.preventDefault(); goTo(active+1); }
    else if(e.key==='ArrowLeft'||e.key==='ArrowUp'){ e.preventDefault(); goTo(active-1); }
    else if(e.key==='Enter'){ const d=doors[active]; if(d&&d.classList.contains('active')) fireOpen(d); } });

  /* ================= finale ================= */
  const finale=$('finale'), finaleClose=$('finaleClose'), finaleScrim=$('finaleScrim');
  $('finaleStats').innerHTML=[['8–12','Assets'],['500–700','Units'],['2–4','Markets'],['$60–70M','Target acquisitions']]
    .map(([b,s])=>`<div class="finale__stat"><b>${b}</b><span>${s}</span></div>`).join('');
  $('finaleNet').innerHTML=ASSETS.map(a=>`<span class="finale__node">${a.market} · ${a.name}</span>`).join('');
  function openFinale(){ finale.hidden=false; finale.setAttribute('aria-hidden','false'); setTimeout(()=>finale.classList.add('on'),16); document.body.style.overflow='hidden'; }
  function closeFinale(){ finale.classList.remove('on'); finale.setAttribute('aria-hidden','true');
    document.body.style.overflow=''; setTimeout(()=>{ finale.hidden=true; },500); }
  viewAll.addEventListener('click', openFinale);
  finaleClose.addEventListener('click', closeFinale);
  finaleScrim.addEventListener('click', closeFinale);

  /* ================= enter: click the door → walk in ================= */
  const scene=$('scene'), sceneDoor=$('sceneDoor'), hall=$('hall');
  // reveal the corridor RIGHT NOW (never gated on a timer) — it appears behind the
  // zooming entrance scene, which then fades away on top of it
  function revealCorridor(){
    if(walking) return;
    walking=true; hall.hidden=false;
    walk.classList.add('on'); targetsEl.classList.add('on');
    document.body.classList.add('entered');
    document.body.style.overflow='';
    window.scrollTo(0,0); readScroll(); pSmooth=pTarget; applyWalk(pTarget);
    if(!raf) raf=requestAnimationFrame(loop);
  }
  function hideScene(){ document.body.classList.remove('entering'); if(scene) scene.style.display='none'; }
  function enter(){
    if(walking) return;
    if(reduce){ revealCorridor(); hideScene(); return; }
    document.body.classList.add('entering'); tick();
    revealCorridor();                                   // corridor is visible immediately
    const svg = scene ? scene.querySelector('.scene__svg') : null;
    if(svg) svg.addEventListener('animationend', hideScene, {once:true});
    setTimeout(hideScene, 1300);                        // fallback if animationend never fires
  }
  sceneDoor.addEventListener('click', enter);
  sceneDoor.addEventListener('keydown', e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); enter(); } });

  /* ================= sound (off by default) ================= */
  const soundBtn=$('soundBtn'); let soundOn=false, ac=null;
  soundBtn.addEventListener('click', ()=>{ soundOn=!soundOn; soundBtn.classList.toggle('on',soundOn);
    soundBtn.setAttribute('aria-pressed',soundOn?'true':'false'); soundBtn.querySelector('span').textContent=soundOn?'on':'off';
    if(soundOn&&!ac){ try{ ac=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ ac=null; } } });
  function tick(){ if(!soundOn||!ac) return;
    try{ const o=ac.createOscillator(), g=ac.createGain(); o.type='sine'; o.frequency.value=480;
      g.gain.value=0.0001; o.connect(g); g.connect(ac.destination); const t=ac.currentTime;
      g.gain.exponentialRampToValueAtTime(0.045,t+0.01); g.gain.exponentialRampToValueAtTime(0.0001,t+0.14);
      o.start(t); o.stop(t+0.16); }catch(e){} }

  /* ================= loader ================= */
  const loader=$('loader'), loadPct=$('loadPct'), loadPath=$('loadPath'), loadSkip=$('loadSkip');
  let pct=0, li=null;
  function finishLoad(){ if(li){ clearInterval(li); li=null; } loadPct.textContent='100%'; if(loadPath) loadPath.style.strokeDashoffset='0';
    loader.classList.add('is-done'); }
  loadSkip.addEventListener('click', finishLoad);
  if(reduce){ finishLoad(); }
  else{
    li=setInterval(()=>{ pct=Math.min(100, pct + (pct<80? 4+Math.random()*7 : 2+Math.random()*3));
      loadPct.textContent=Math.floor(pct)+'%';
      if(loadPath) loadPath.style.strokeDashoffset=String(1200*(1-pct/100));
      if(pct>=100){ clearInterval(li); li=null; setTimeout(()=>loader.classList.add('is-done'),260); }
    }, 130);
    setTimeout(finishLoad, 3200);
  }
})();
