/* ============================================================
   TERAMERGE — PORTFOLIO · "The Asset Vault" controller
   No loader. Vault door + CTA → the lock spins and the round
   door swings open → next chamber door → inside the asset.
   Data-driven: every chamber (Foundation/Multifamily/Under
   Contract) follows the same door + lock-open + layout rules.
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const doorEl = $('#door'), chamberEl = $('#chamber'), finaleEl = $('#finale');
  const nav = $('#nav'), rail = $('#rail');
  const doorNo = $('#doorNo'), doorEye = $('#doorEye'), doorTitle = $('#doorTitle'), doorSub = $('#doorSub'), doorCtaText = $('#doorCtaText');

  /* black transition veil */
  const fade = document.createElement('div');
  fade.id = 'fadeveil';
  fade.style.cssText = 'position:fixed;inset:0;z-index:60;background:#050302;opacity:0;pointer-events:none;transition:opacity .5s ease;';
  document.body.appendChild(fade);
  const veil = (on, color) => { if (color) fade.style.background = color; fade.style.opacity = on ? '1' : '0'; };

  /* ---------------- data ---------------- */
  const CH = {
    found: { no:'01', pill:'Proven track record', name:'The Foundation', img:'assets/asset-foundation.png',
      markets:['Maryland','New Jersey','Atlanta, Georgia','Miami, Florida','Dallas, Texas','Minneapolis, Minnesota','St. Louis, Missouri','Berkeley Hills, California','South Carolina','Florida'],
      lead:'Where the operating record was built.',
      fields:[['Status','Assets Under Management'],['Scale',{chips:[['$28M+',1],['350+ Doors',1],['10 Markets',0],['72 Acres',0]]}],['Holdings',{stack:['Multi-Unit Residential','Single-Family','Land & Commercial']}],['Operating record','Student housing, residential care, luxury downtown residential and land. Owned and operated across ten markets and four asset classes.']],
      strategy:['Acquire','Transform','Operate','Scale'], stratList:['Value-Add & Appreciate'] },
    multi: { no:'02', pill:'Live in market', name:'Multifamily', img:'assets/asset-multifamily-blend.png',
      markets:['North Carolina','Alabama'],
      lead:'The core strategy, in market.',
      fields:[['Status','Assets Under Management'],['Scale',{chips:[['$11M+',1],['110+ Doors',1]]}],['Entry','Acquired below value. Equity on day one.'],['Execution','Underwritten, closed and operated on the Teramerge intelligence platform.']],
      strategy:['Acquire','Transform','Operate','Scale'], stratList:['Value-Add & Appreciate'] },
    under: { no:'03', pill:'Scaling now · Coming soon', name:'Under Contract', img:'assets/asset-undercontract-blend.png',
      markets:['Atlanta, GA','Austin, TX','Florida'],
      lead:'The platform, scaling.',
      fields:[['Status','Coming Soon'],['Asset','Multifamily'],['Scale',{chips:[['$70M+',1],['800+ Doors',1]]}]],
      strategy:['Acquire','Transform','Operate','Scale'], stratList:['Value-Add & Appreciate'] },
  };
  const STEPS = [
    { t:'door', img:'entrance', eye:'The Asset Vault', title:'Portfolio', sub:'A curated collection, held in the vault', cta:'Open the Vault' },
    { t:'door', no:'01', img:'found', title:'The Foundation', sub:'Proven track record', cta:'Open the Chamber' },
    { t:'chamber', key:'found' },
    { t:'door', no:'02', img:'multi', title:'Multifamily', sub:'Live in market', cta:'Open the Chamber' },
    { t:'chamber', key:'multi' },
    { t:'door', no:'03', img:'under', title:'Under Contract', sub:'Scaling now · Coming soon', cta:'Open the Chamber' },
    { t:'chamber', key:'under' },
    { t:'door', no:'04', img:'trea', title:'The Treasury', sub:'The platform, in full', cta:'Break the Seal' },
    { t:'treasury' },
  ];
  const railStepToIdx = { 1:0, 3:1, 5:2, 7:3 };

  let step = 0, busy = false, curTab = 'overview';

  /* ---------------- right-panel builders ---------------- */
  const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  function val(v){
    if (v && typeof v === 'object'){
      if (v.chips) return `<div class="chips">${v.chips.map(c=>`<span class="${c[1]?'hi':''}">${c[0]}</span>`).join('')}</div>`;
      if (v.stack) return `<div class="stack">${v.stack.map(x=>`<span>${x}</span>`).join('')}</div>`;
    }
    return `<div class="pf__v">${v}</div>`;
  }
  function field(k, v){ return `<div class="pf"><div class="pf__k">${k}</div>${val(v)}</div>`; }
  function panelHTML(c, tab){
    if (tab === 'overview') return `<div class="pf"><div class="pf__lead">${c.lead}</div></div>` + c.fields.map(([k,v])=>field(k,v)).join('');
    if (tab === 'strategy'){
      let s = `<div class="pf"><div class="pf__k">Value-creation path</div><div class="flow">${c.strategy.map((x,i)=>`<b>${x}</b>${i<c.strategy.length-1?'<i>&rarr;</i>':''}`).join('')}</div></div>`;
      s += `<div class="pf"><div class="pf__k">Strategy</div><div class="stack">${c.stratList.map(x=>`<span>${x}</span>`).join('')}</div></div>`;
      return s;
    }
    if (tab === 'performance') return [['Occupancy'],['Revenue'],['NOI']].map(([k])=>`<div class="pf"><div class="pf__k">${k}</div><span class="locked">${LOCK} Disclosed to qualified investors</span></div>`).join('') + `<p class="note">Disclosed to qualified investors and buyers · released under NDA.</p>`;
    return `<div class="pf"><div class="pf__k">Model</div><div class="pf__v">Abstract massing</div></div><div class="pf"><div class="pf__k">Unit-level detail</div><span class="locked">${LOCK} Disclosed to qualified investors</span></div><p class="note">The render is illustrative of the holding — not a survey drawing.</p>`;
  }

  /* ---------------- render a chamber ---------------- */
  function buildChamber(key){
    const c = CH[key];
    $('#chNo').textContent = c.no;
    $('#chPill').textContent = c.pill;
    $('#chName').textContent = c.name;
    $('#chMarkets').innerHTML = c.markets.map(m=>`<li>${m}</li>`).join('');
    const img = $('#chImg'); img.src = c.img; img.alt = c.name;
    curTab = 'overview';
    $$('#chTabs .ctab').forEach(b=>b.classList.toggle('is-on', b.dataset.tab==='overview'));
    $('#chPanel').innerHTML = panelHTML(c, 'overview');
    chamberEl.dataset.key = key;
  }

  /* ---------------- render the current step ---------------- */
  function activate(el){ [doorEl, chamberEl, finaleEl].forEach(s=>s.classList.toggle('is-active', s===el)); }
  function setDoor(s){
    doorEl.style.setProperty('--door-img', `url(assets/doors/${s.img}.jpg)`);
    doorNo.textContent = s.no || '';
    doorEye.textContent = s.eye || '';
    doorEye.style.display = s.eye ? '' : 'none';
    doorTitle.textContent = s.title;
    doorSub.textContent = s.sub || '';
    doorCtaText.textContent = s.cta;
    doorEl.classList.remove('is-opening');
  }
  function render(){
    const s = STEPS[step];
    nav.classList.toggle('is-dim', s.t !== 'chamber');
    rail.classList.toggle('is-on', step > 0);
    const ri = s.t === 'chamber' ? ({found:0,multi:1,under:2})[s.key] : (s.t==='treasury'?3:-1);
    $$('.rail__i').forEach((b,i)=>b.classList.toggle('is-on', i===ri));
    if (s.t === 'door'){ setDoor(s); activate(doorEl); }
    else if (s.t === 'chamber'){ buildChamber(s.key); activate(chamberEl); }
    else if (s.t === 'treasury'){ activate(finaleEl); startFinale(); }
  }
  function go(i){ step = Math.max(0, Math.min(STEPS.length-1, i)); render(); }

  /* ---------------- the lock opens ---------------- */
  function openDoor(){
    if (busy) return; busy = true;
    if (reduce){ veil(true,'#eef2fb'); setTimeout(()=>{ go(step+1); veil(false); busy=false; }, 300); return; }
    doorEl.classList.add('is-opening');            // the round door swings open → bright light floods out
    setTimeout(()=> veil(true,'#eef2fb'), 1650);   // move into the light (bright flash)
    setTimeout(()=>{                               // under the light: swap to the next scene, reset the door
      doorEl.classList.remove('is-opening');
      go(step+1);
      veil(false);
      busy = false;
    }, 2200);
  }
  function jump(i){ if (busy) return; busy=true; veil(true,'#050302'); setTimeout(()=>{ go(i); veil(false); busy=false; }, 560); }

  /* ---------------- treasury (aurora) ---------------- */
  let fxOn = false;
  function startFinale(){
    const host = $('#trxStars');
    if (host && !host.childElementCount){ let h=''; for(let i=0;i<120;i++){ const s=(Math.random()*1.6+.6).toFixed(1); h+=`<i style="left:${(Math.random()*100).toFixed(2)}%;top:${(Math.random()*100).toFixed(2)}%;width:${s}px;height:${s}px;--tw:${(2.4+Math.random()*3.6).toFixed(2)}s;--dl:${(Math.random()*4).toFixed(2)}s"></i>`; } host.innerHTML=h; }
    const cv = $('#finaleFx');
    if (cv && !fxOn && !reduce){ fxOn=true; const ctx=cv.getContext('2d'); const DPR=Math.min(devicePixelRatio||1,2);
      const rs=()=>{ cv.width=innerWidth*DPR; cv.height=innerHeight*DPR; }; rs(); addEventListener('resize',rs);
      const P=[]; for(let i=0;i<90;i++) P.push({x:Math.random()*cv.width,y:Math.random()*cv.height,r:(Math.random()*1.5+.5)*DPR,s:(Math.random()*.5+.12)*DPR,tw:Math.random()*6.3});
      (function loop(){ ctx.clearRect(0,0,cv.width,cv.height); for(const p of P){ p.y-=p.s; p.tw+=.03; p.x+=Math.sin(p.tw)*.12*DPR; if(p.y<-6){p.y=cv.height+6;p.x=Math.random()*cv.width;} const a=Math.max(0,.34+Math.sin(p.tw)*.3); ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,6.28); ctx.shadowColor='rgba(244,206,120,.9)'; ctx.shadowBlur=6*DPR; ctx.fillStyle='rgba(245,216,142,'+a.toFixed(2)+')'; ctx.fill(); } requestAnimationFrame(loop); })();
    }
    $$('#finale [data-count]').forEach((el, idx)=>{
      if (el.dataset.done) return; el.dataset.done='1';
      const to=+el.getAttribute('data-count'), pre=el.getAttribute('data-pre')||'', suf=el.getAttribute('data-suf')||'';
      el.textContent = pre+'0'+suf;
      setTimeout(()=>{ const t0=performance.now(), dur=2200; (function tick(t){ const k=Math.min(1,(t-t0)/dur); const e=1-Math.pow(1-k,3); el.textContent=pre+Math.round(to*e).toLocaleString()+suf; if(k<1) requestAnimationFrame(tick); })(t0); }, 500+idx*70);
    });
  }

  /* ---------------- events ---------------- */
  $('#doorCta').addEventListener('click', openDoor);
  $('#proceed').addEventListener('click', ()=> jump(step+1));
  $('#rtn').addEventListener('click', ()=> jump(0));
  $('#finaleBack').addEventListener('click', ()=> jump(0));
  $('#chTabs').addEventListener('click', e=>{ const b=e.target.closest('.ctab'); if(!b) return; curTab=b.dataset.tab; $$('#chTabs .ctab').forEach(x=>x.classList.toggle('is-on',x===b)); $('#chPanel').innerHTML = panelHTML(CH[chamberEl.dataset.key], curTab); });
  $$('.rail__i').forEach(b=> b.addEventListener('click', ()=> jump(+b.dataset.go)));
  addEventListener('keydown', e=>{ if(e.key==='Escape') jump(0); else if((e.key==='Enter'||e.key===' ') && STEPS[step].t==='door'){ e.preventDefault(); openDoor(); } });

  /* ---------------- boot ---------------- */
  render();
})();
