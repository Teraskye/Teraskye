/* ============================================================
   TERAMERGE — PORTFOLIO · "The Stone Archive" controller
   Scroll SCRUBS the real cave footage forward a fixed amount
   per scroll (deterministic, Blob-loaded so seeking is smooth).
   Two scrolls reach the door → CTA → click opens the door at
   once → crossfade into a chamber built on the stone-village
   render. Foundation → Multifamily → Under Contract → Treasury.
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const scenes = $$('.scene');
  const nav = $('#nav'), rtn = $('#rtn'), rail = $('#rail'), hud = $('#hud'), hudName = $('#hudName'), hudNo = $('#hudNo');
  const board = $('#board'), boardK = $('#boardK'), boardN = $('#boardN'), boardS = $('#boardS');
  const cue = $('#cue'), cueText = $('#cueText'), cta = $('#cta'), ctaText = $('#ctaText');
  const loadEl = $('#load'), loadBar = $('#loadBar');

  const BOARDS = {
    'p-enter': ['The Portfolio of', 'Teramerge', 'A decade, carved in stone', false],
    'p-found': ['Chamber I', 'The Foundation', 'Proven track record', false],
    'p-multi': ['Chamber II', 'Multifamily', 'Live in market', false],
    'p-under': ['Chamber III', 'Under Contract', 'Scaling · coming soon', false],
    'p-trea':  ['Chamber IV', 'The Treasury', 'The platform, in full', true],
  };
  const railIdx = id => id.includes('found') ? 0 : id.includes('multi') ? 1 : id.includes('under') ? 2 : id.includes('trea') ? 3 : -1;

  let current = 0, busy = false, cool = false, started = false;
  const path = { v:null, near:0, end:0, step:0 };   // step: 0,1 approach done count; 2 = at door
  let rafSeek = 0;

  /* ---------- count-up ---------- */
  function countUp(el){
    if(el.dataset.done) return; el.dataset.done = '1';
    const to = +el.dataset.to;
    if(reduce){ el.textContent = to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1300;
    (function tick(now){ const p = Math.min(1,(now-t0)/dur); const e = 1-Math.pow(1-p,3); el.textContent = Math.round(to*e).toLocaleString(); if(p<1) requestAnimationFrame(tick); })(t0);
  }

  /* ---------- smooth scrub to a time ---------- */
  function stopSeek(){ if(rafSeek) cancelAnimationFrame(rafSeek); rafSeek = 0; }
  let seekSafety = 0;
  function finishSeek(v, to, done){ try{ v.currentTime = to; }catch(e){} busy = false; stopSeek(); if(seekSafety){ clearTimeout(seekSafety); seekSafety = 0; } done && done(); }
  function seekTo(v, to, dur, done){
    if(!v){ done && done(); return; }
    stopSeek(); if(seekSafety) clearTimeout(seekSafety);
    busy = true;
    const from = v.currentTime, t0 = performance.now(), ms = Math.max(60, dur*1000);
    let settled = false;
    try{ v.pause(); }catch(e){}
    const step = (now)=>{
      if(settled) return;
      const p = Math.min(1,(now-t0)/ms); const e = 1-Math.pow(1-p,3);
      try{ v.currentTime = from + (to-from)*e; }catch(e){}
      if(p < 1){ rafSeek = requestAnimationFrame(step); }
      else { settled = true; finishSeek(v, to, done); }
    };
    rafSeek = requestAnimationFrame(step);
    // safety: if rAF is throttled/paused (e.g. background tab), still land on target
    seekSafety = setTimeout(()=>{ if(!settled){ settled = true; finishSeek(v, to, done); } }, ms + 500);
  }

  /* ---------- chrome ---------- */
  function setChrome(scene){
    const kind = scene.dataset.kind, id = scene.id;
    nav.classList.toggle('is-dim', id !== 'p-enter');
    rtn.hidden = (kind !== 'chamber');
    rail.classList.toggle('is-on', id !== 'p-enter');
    const ri = railIdx(id);
    [...rail.children].forEach((b,i)=> b.classList.toggle('is-on', i === ri));
    hudName.textContent = scene.dataset.name || '';
    hudNo.textContent = scene.dataset.no || '00';
  }

  /* ---------- enter a scene ---------- */
  function onEnter(scene){
    setChrome(scene);
    if(scene.dataset.kind === 'path'){
      const v = scene.querySelector('.path__v');
      path.v = v; path.near = +scene.dataset.near || 5; path.end = +scene.dataset.end || 9; path.step = 0;
      if(v){ try{ v.pause(); v.currentTime = 0; }catch(e){} }
      const b = BOARDS[scene.id];
      if(b){ boardK.textContent = b[0]; boardN.textContent = b[1]; boardS.textContent = b[2]; board.classList.toggle('board--gold', !!b[3]); board.classList.add('is-on'); }
      cta.classList.remove('is-on');
      cueText.textContent = scene.id === 'p-enter' ? 'Scroll to walk forward' : 'Scroll to approach the door';
      cue.classList.add('is-on');
    } else {
      board.classList.remove('is-on'); cue.classList.remove('is-on'); cta.classList.remove('is-on');
      scene.querySelectorAll('.count').forEach(countUp);
    }
  }
  function leave(scene){ if(scene.dataset.kind === 'path'){ stopSeek(); const v = scene.querySelector('.path__v'); if(v){ try{ v.pause(); }catch(e){} } } }

  /* ---------- crossfade to a scene ---------- */
  function show(id){
    const next = document.getElementById(id); if(!next || scenes[current] === next) return;
    const cur = scenes[current];
    if(cur){ leave(cur); cur.classList.remove('is-active'); }
    current = scenes.indexOf(next);
    next.classList.add('is-active');
    onEnter(next);
  }

  /* ---------- walking the path (scrub forward) ---------- */
  function showCTA(){
    const gold = scenes[current].id === 'p-trea';
    ctaText.textContent = gold ? 'Break the seal' : 'Open the door';
    cta.classList.toggle('cta--gold', gold);
    cta.classList.add('is-on');
  }
  function stepTime(i){ return path.near * (i+1) / 2; }   // 2 equal forward moves → the door
  function advance(){
    if(busy || !path.v || path.step >= 2) return;
    const i = path.step;
    seekTo(path.v, stepTime(i), 0.6, ()=>{
      path.step = i + 1;
      if(path.step >= 2){ board.classList.remove('is-on'); cue.classList.remove('is-on'); showCTA(); }
    });
  }
  function back(){
    if(busy || !path.v || path.step <= 0) return;
    const i = path.step - 1;
    cta.classList.remove('is-on');
    seekTo(path.v, i === 0 ? 0 : stepTime(i-1), 0.5, ()=>{
      path.step = i;
      const b = BOARDS[scenes[current].id];
      if(b){ board.classList.add('is-on'); }
      cue.classList.add('is-on');
    });
  }
  function openDoor(){
    if(busy || !path.v || path.step < 2) return;
    cta.classList.remove('is-on');
    seekTo(path.v, path.end, 0.85, ()=>{ const nx = scenes[current].dataset.next; if(nx) show(nx); });
  }

  /* ---------- input ---------- */
  function forward(){
    const kind = scenes[current].dataset.kind;
    if(kind === 'path'){ if(path.step >= 2) openDoor(); else advance(); }
    else if(kind === 'chamber'){ const nx = scenes[current].dataset.next; if(nx) show(nx); }
  }
  function gesture(dir){ if(cool || busy) return; cool = true; setTimeout(()=>cool=false, 520); if(dir > 0) forward(); else if(scenes[current].dataset.kind === 'path') back(); }
  addEventListener('wheel', (e)=>{ if(!started) return; e.preventDefault(); if(Math.abs(e.deltaY) > 6) gesture(e.deltaY > 0 ? 1 : -1); }, { passive:false });
  let ty = 0;
  addEventListener('touchstart', (e)=>{ ty = e.touches[0].clientY; }, { passive:true });
  addEventListener('touchend', (e)=>{ if(!started) return; const dy = e.changedTouches[0].clientY - ty; if(dy < -36) gesture(1); else if(dy > 36) gesture(-1); }, { passive:true });
  addEventListener('keydown', (e)=>{ if(!started) return; if(e.key === 'ArrowDown' || e.key === ' '){ e.preventDefault(); gesture(1); } else if(e.key === 'ArrowUp'){ e.preventDefault(); gesture(-1); } else if(e.key === 'Enter'){ openDoor(); } else if(e.key === 'Escape'){ show('p-enter'); } });

  cta.addEventListener('click', openDoor);
  rtn.addEventListener('click', ()=>{ if(busy) return; show('p-enter'); });
  [...rail.children].forEach(b => b.addEventListener('click', ()=>{ if(busy) return; show(b.dataset.go); }));

  /* ---------- Blob-load the videos (makes scrubbing/seeking reliable) ---------- */
  const VIDS = ['enter', 'straight', 'steps'];
  const blobURL = {};
  async function loadBlobs(onStep){
    for(const name of VIDS){
      try{ const r = await fetch('assets/video/' + name + '.mp4'); const b = await r.blob(); blobURL[name] = URL.createObjectURL(b); }catch(e){}
      onStep && onStep();
    }
    $$('.scene.path .path__v').forEach(v=>{ const name = v.closest('.scene').dataset.video; if(blobURL[name]){ v.src = blobURL[name]; try{ v.load(); }catch(e){} } });
  }

  /* ---------- boot ---------- */
  let readied = false;
  function ready(){
    if(readied) return; readied = true;
    const s0 = scenes[0].querySelector('.path__v');
    if(s0){ try{ s0.pause(); s0.currentTime = 0; }catch(e){} }
    onEnter(scenes[0]);
    if(loadEl) loadEl.classList.add('is-done');
    setTimeout(()=>{ started = true; }, 400);
  }
  (async function boot(){
    const total = VIDS.length + 1; let done = 0;
    const bump = ()=>{ done++; if(loadBar) loadBar.style.width = Math.round(done/total*100)+'%'; };
    const im = new Image(); im.onload = im.onerror = bump; im.src = 'assets/stone/sunburst-clean.jpg';
    await loadBlobs(bump);
    ready();
  })();
  setTimeout(ready, 12000); // safety
})();
