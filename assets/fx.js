/* ============================================================
   TERASKYE — shared presentation FX engine (fx.js)
   Self-initialising, additive, reduced-motion aware. Does NOT
   redo each page's existing reveal; adds premium extras only.
   Opt-in via data-attributes:
     data-reveal[="up|left|right|scale|blur"]  data-reveal-group="90"
     data-split          (line-by-line heading reveal)
     data-tilt[="8"]     (3D mouse tilt)
     data-parallax="0.15"
     data-count="330" [data-count-pre="$"] [data-count-suf="B"] [data-count-dur]
     data-reader + data-reader-track (Mont-Fort arrow gallery)
     data-magnetic="0.3" (auto-applied to common CTA classes too)
   ============================================================ */
(() => {
  'use strict';
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer:fine)').matches;
  const doc = document, clamp = (v,a,b)=> v<a?a:v>b?b:v;
  const IOok = 'IntersectionObserver' in window;
  const ready = fn => (doc.readyState !== 'loading') ? fn() : doc.addEventListener('DOMContentLoaded', fn);

  ready(() => {

  /* ---------- 1 · cursor light ---------- */
  if (FINE && !RM) {
    const cur = doc.createElement('div'); cur.className = 'fx-cursor'; doc.body.appendChild(cur);
    let cx = innerWidth/2, cy = innerHeight/2, tx = cx, ty = cy, shown = false;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; if(!shown){ shown = true; cur.classList.add('on'); } }, {passive:true});
    addEventListener('pointerdown', ()=> cur.classList.add('hot'));
    addEventListener('pointerup', ()=> cur.classList.remove('hot'));
    const hot = 'a,button,[data-tilt],[data-magnetic],.cta,.talk,input,textarea,label';
    doc.addEventListener('pointerover', e => { if (e.target.closest(hot)) cur.classList.add('hot'); });
    doc.addEventListener('pointerout',  e => { if (e.target.closest(hot)) cur.classList.remove('hot'); });
    (function anim(){ cx += (tx-cx)*0.2; cy += (ty-cy)*0.2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(anim); })();
  }

  /* ---------- 2 · scroll reveal (opt-in via data-fxr; won't touch existing .r/.terr/data-reveal) ---------- */
  doc.querySelectorAll('[data-fxr-group]').forEach(g => {
    const step = parseInt(g.getAttribute('data-fxr-group'), 10) || 90;
    [...g.children].forEach((c, i) => {
      if (!c.hasAttribute('data-fxr')) c.setAttribute('data-fxr', 'up');
      if (!c.hasAttribute('data-fxr-delay')) c.setAttribute('data-fxr-delay', i*step);
    });
  });
  const revEls = [...doc.querySelectorAll('[data-fxr]')];
  const showRev = el => { const d = parseInt(el.getAttribute('data-fxr-delay'),10)||0; if(d) el.style.transitionDelay = d+'ms'; el.classList.add('fx-in'); };
  if (revEls.length) {
    if (RM || !IOok) revEls.forEach(el => el.classList.add('fx-in'));
    else { const io = new IntersectionObserver((es)=>{ for(const e of es) if(e.isIntersecting){ showRev(e.target); io.unobserve(e.target); } }, {threshold:0.14, rootMargin:'0px 0px -7% 0px'});
      revEls.forEach(el => io.observe(el)); }
  }

  /* ---------- 3 · text-line reveal ---------- */
  doc.querySelectorAll('[data-split]').forEach(el => {
    if (el.dataset.splitDone) return; el.dataset.splitDone = '1';
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    el.innerHTML = lines.map(l => `<span class="fx-line"><span>${l}</span></span>`).join('');
    const kids = [...el.querySelectorAll('.fx-line')];
    if (RM || !IOok) { kids.forEach(k => k.classList.add('fx-in')); return; }
    const io = new IntersectionObserver((es)=>{ for(const e of es) if(e.isIntersecting){
      kids.forEach((k,i)=>{ k.querySelector('span').style.transitionDelay = (i*95)+'ms'; k.classList.add('fx-in'); }); io.disconnect(); } }, {threshold:0.2});
    io.observe(el);
  });

  /* ---------- 4 · 3D tilt (opt-in via [data-tilt] or body[data-fx-tilt="selector"]) ---------- */
  const tiltEls = new Set(doc.querySelectorAll('[data-tilt]'));
  const tiltSel = doc.body.getAttribute('data-fx-tilt');
  if (tiltSel) { try { doc.querySelectorAll(tiltSel).forEach(e => tiltEls.add(e)); } catch(_){} }
  if (FINE && !RM) tiltEls.forEach(el => {
    const max = parseFloat(el.getAttribute('data-tilt')) || 6;
    let rx=0, ry=0, trx=0, tRy=0, raf=0, active=false;
    const run = () => { rx += (trx-rx)*0.14; ry += (tRy-ry)*0.14;
      el.style.transform = `perspective(900px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
      if (active || Math.abs(trx-rx)>0.02 || Math.abs(tRy-ry)>0.02) raf = requestAnimationFrame(run); else { el.style.transform=''; raf=0; } };
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect();
      trx = -((e.clientY-r.top)/r.height - 0.5) * 2 * max; tRy = ((e.clientX-r.left)/r.width - 0.5) * 2 * max;
      active = true; if(!raf) run(); });
    el.addEventListener('pointerleave', () => { trx=0; tRy=0; active=false; });
  });

  /* ---------- 4b · global mouse 3D (perspective tilt driven by window, for pointer-events:none layers) ---------- */
  const scene3dSel = doc.body.getAttribute('data-fx-scene3d');
  if (scene3dSel && FINE && !RM) {
    let els = []; try { els = [...doc.querySelectorAll(scene3dSel)]; } catch(_){}
    if (els.length) {
      let nx=0, ny=0, tx=0, ty=0;
      addEventListener('pointermove', e => { tx = e.clientX/innerWidth - 0.5; ty = e.clientY/innerHeight - 0.5; }, {passive:true});
      (function anim(){ nx += (tx-nx)*0.06; ny += (ty-ny)*0.06;
        const t = `perspective(1300px) rotateX(${(-ny*3.6).toFixed(2)}deg) rotateY(${(nx*4.6).toFixed(2)}deg)`;
        for (const el of els) el.style.transform = t;
        requestAnimationFrame(anim); })();
    }
  }

  /* ---------- 5 · parallax depth ---------- */
  const para = [...doc.querySelectorAll('[data-parallax]')];
  if (para.length && !RM) {
    const upd = () => { const vh = innerHeight; for (const el of para) {
      const r = el.getBoundingClientRect(); const sp = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      const off = (r.top + r.height/2) - vh/2; el.style.transform = `translate3d(0, ${(-off*sp).toFixed(1)}px, 0)`; } };
    addEventListener('scroll', upd, {passive:true}); addEventListener('resize', upd); upd();
  }

  /* ---------- 6 · count-up ---------- */
  doc.querySelectorAll('[data-count]').forEach(el => {
    const raw = el.getAttribute('data-count'); const target = parseFloat(raw) || 0;
    const dec = raw.includes('.') ? raw.split('.')[1].length : 0;
    const dur = parseInt(el.getAttribute('data-count-dur'),10) || 1700;
    const pre = el.getAttribute('data-count-pre') || '', suf = el.getAttribute('data-count-suf') || '';
    const set = v => el.textContent = pre + v.toLocaleString('en-US',{minimumFractionDigits:dec,maximumFractionDigits:dec}) + suf;
    set(0);
    if (RM || !IOok) { set(target); return; }
    const io = new IntersectionObserver((es)=>{ for(const e of es) if(e.isIntersecting){ io.disconnect();
      const t0 = performance.now(); (function tick(now){ const p = clamp((now-t0)/dur,0,1); set(target*(1-Math.pow(1-p,3))); if(p<1) requestAnimationFrame(tick); })(performance.now()); } }, {threshold:0.6});
    io.observe(el);
  });

  /* ---------- 7 · magnetic CTAs ---------- */
  if (FINE && !RM) doc.querySelectorAll('.cta, .talk, .fb__cta, .btn, button[type="submit"], [data-magnetic]').forEach(el => {
    if (el.dataset.mag) return; el.dataset.mag = '1';
    const s = parseFloat(el.getAttribute('data-magnetic')) || 0.28;
    el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX-r.left)/r.width-0.5)*r.width*s*0.5}px, ${((e.clientY-r.top)/r.height-0.5)*r.height*s*0.8}px)`; });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* ---------- 8 · Mont-Fort arrow reader ---------- */
  doc.querySelectorAll('[data-reader]').forEach(root => {
    const track = root.querySelector('[data-reader-track]'); if (!track) return;
    const items = [...track.children]; if (items.length < 2) return;
    const ctrl = doc.createElement('div'); ctrl.className = 'fx-reader__ctrl';
    const prev = doc.createElement('button'), next = doc.createElement('button');
    prev.className = 'fx-reader__arrow fx-reader__prev'; prev.type='button'; prev.setAttribute('aria-label','Previous'); prev.innerHTML = '&larr;';
    next.className = 'fx-reader__arrow fx-reader__next'; next.type='button'; next.setAttribute('aria-label','Next'); next.innerHTML = '&rarr;';
    const bar = doc.createElement('div'); bar.className = 'fx-reader__bar'; const barI = doc.createElement('i'); bar.appendChild(barI);
    const count = doc.createElement('div'); count.className = 'fx-reader__count';
    ctrl.append(prev, bar, count, next); root.appendChild(ctrl);
    const nearest = () => { let best=0, bd=Infinity; items.forEach((it,i)=>{ const d=Math.abs(it.offsetLeft - track.scrollLeft); if(d<bd){bd=d;best=i;} }); return best; };
    const upd = () => { const maxS = track.scrollWidth - track.clientWidth;
      const p = maxS>0 ? track.scrollLeft/maxS : 0; barI.style.transform = `translateX(${(p*233).toFixed(1)}%)`;
      const i = nearest(); count.textContent = String(i+1).padStart(2,'0') + ' / ' + String(items.length).padStart(2,'0');
      prev.disabled = track.scrollLeft <= 2; next.disabled = track.scrollLeft >= maxS-2; };
    const go = dir => { const i = clamp(nearest()+dir, 0, items.length-1); track.scrollTo({left: items[i].offsetLeft, behavior: RM?'auto':'smooth'}); };
    prev.addEventListener('click', ()=>go(-1)); next.addEventListener('click', ()=>go(1));
    track.addEventListener('scroll', ()=>{ requestAnimationFrame(upd); }, {passive:true});
    // drag to pan
    let down=false, sx=0, sl=0, moved=false;
    track.addEventListener('pointerdown', e=>{ down=true; moved=false; sx=e.clientX; sl=track.scrollLeft; track.setPointerCapture&&track.setPointerCapture(e.pointerId); });
    track.addEventListener('pointermove', e=>{ if(!down) return; const dx=e.clientX-sx; if(Math.abs(dx)>4) moved=true; track.scrollLeft = sl-dx; });
    const end=()=>{ down=false; }; track.addEventListener('pointerup', end); track.addEventListener('pointercancel', end);
    track.addEventListener('click', e=>{ if(moved){ e.preventDefault(); e.stopPropagation(); } }, true);
    addEventListener('resize', upd); upd();
  });

  });
})();
