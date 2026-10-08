/* ============================================================
   TERAMERGE — PORTFOLIO · "The Cave of a Decade"
   Torch-fire canvas (realistic flames on the rock walls) ·
   cave env toggle · sliding rock-door CTAs · carved reveals ·
   count-ups · section index. GSAP + ScrollTrigger (optional).
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const gsap = window.gsap;

  /* ---------- section numbering / naming ---------- */
  const noOf = id => id.includes('found') ? '01' : id.includes('multi') ? '02' : id.includes('under') ? '03' : id.includes('trea') ? '04' : '00';
  const railIdx = id => id.includes('found') ? 0 : id.includes('multi') ? 1 : id.includes('under') ? 2 : id.includes('trea') ? 3 : -1;
  const cave = $('#cave');
  const railDots = $$('.rail__dot');
  const secName = $('#secName'), secNo = $('#secNo');

  /* ---------- treasury stars ---------- */
  const stars = $('#trxStars');
  if (stars) { let h = ''; for (let i = 0; i < 54; i++) { const x = (Math.random() * 100).toFixed(2), y = (Math.random() * 72).toFixed(2), s = (0.6 + Math.random() * 1.7).toFixed(1), d = (Math.random() * 5).toFixed(2); h += `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s"></i>`; } stars.innerHTML = h; }

  /* ============================================================
     TORCH FIRE  —  flickering flames bracketed on the rock walls
     ============================================================ */
  (function torches() {
    const cv = $('#torchfx');
    if (!cv) return;
    const ctx = cv.getContext('2d');
    let W, H, DPR = Math.min(devicePixelRatio || 1, 2);
    let torches = [], parts = [];

    function layout() {
      W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight || 800;
      cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      // torch brackets: two down each wall, a third pair on tall screens
      const ys = H > 820 ? [0.26, 0.56, 0.84] : [0.34, 0.74];
      const lx = Math.max(38, W * 0.07), rx = W - Math.max(38, W * 0.07);
      torches = [];
      ys.forEach((fy, i) => {
        const y = H * fy;
        torches.push({ x: lx, y, side: 1, ph: i * 1.7, scale: W < 640 ? 0.7 : 1 });
        torches.push({ x: rx, y, side: -1, ph: i * 1.7 + 0.9, scale: W < 640 ? 0.7 : 1 });
      });
    }
    layout();
    addEventListener('resize', layout, { passive: true });

    function spawn(t, flick) {
      // flame particles rise from the torch head
      const n = 2;
      for (let i = 0; i < n; i++) {
        const sp = t.scale;
        parts.push({
          x: t.x + (Math.random() - 0.5) * 7 * sp,
          y: t.y - 6 * sp,
          vx: (Math.random() - 0.5) * 0.5 + t.side * 0.06,
          vy: -(0.9 + Math.random() * 1.3) * sp,
          life: 1, decay: 0.016 + Math.random() * 0.02,
          r: (5 + Math.random() * 7) * sp * (0.8 + flick * 0.4),
          hot: Math.random()
        });
      }
    }

    let raf, t0 = performance.now();
    function frame(now) {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(40, now - t0); t0 = now;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (const t of torches) {
        const flick = 0.72 + 0.28 * (Math.sin(now * 0.012 + t.ph) * 0.5 + 0.5) + (Math.random() - 0.5) * 0.12;
        // warm pool of light thrown onto the rock wall
        const R = 230 * t.scale * flick;
        let g = ctx.createRadialGradient(t.x, t.y - 10, 2, t.x, t.y - 10, R);
        g.addColorStop(0, `rgba(255,180,90,${0.42 * flick})`);
        g.addColorStop(0.35, `rgba(214,120,48,${0.2 * flick})`);
        g.addColorStop(1, 'rgba(60,24,6,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(t.x, t.y - 10, R, 0, 7); ctx.fill();
        // dark iron bracket + stick (drawn as a subtle silhouette)
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = 'rgba(18,10,4,0.75)'; ctx.lineWidth = 3 * t.scale; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(t.x + t.side * 16 * t.scale, t.y + 16 * t.scale); ctx.lineTo(t.x, t.y); ctx.stroke();
        ctx.globalCompositeOperation = 'lighter';
        spawn(t, flick);
      }

      // update + draw flame particles
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx * dt * 0.12; p.y += p.vy * dt * 0.12; p.vy *= 0.985; p.life -= p.decay;
        if (p.life <= 0) { parts.splice(i, 1); continue; }
        const a = p.life;
        const rr = p.r * (0.6 + p.life * 0.5);
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rr);
        // hot core -> orange -> smoky red
        if (p.life > 0.6) { g.addColorStop(0, `rgba(255,244,196,${0.9 * a})`); g.addColorStop(0.4, `rgba(255,176,74,${0.6 * a})`); }
        else { g.addColorStop(0, `rgba(255,150,54,${0.7 * a})`); g.addColorStop(0.5, `rgba(196,74,26,${0.4 * a})`); }
        g.addColorStop(1, 'rgba(60,18,4,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, rr, 0, 7); ctx.fill();
      }
      if (parts.length > 900) parts.splice(0, parts.length - 900);
      ctx.globalCompositeOperation = 'source-over';
    }
    if (!reduce) raf = requestAnimationFrame(frame);
    else { // static warm glows for reduced-motion
      layout();
      for (const t of torches) {
        const g = ctx.createRadialGradient(t.x, t.y - 10, 2, t.x, t.y - 10, 200 * t.scale);
        g.addColorStop(0, 'rgba(255,170,80,0.35)'); g.addColorStop(1, 'rgba(60,24,6,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(t.x, t.y - 10, 200 * t.scale, 0, 7); ctx.fill();
      }
    }
  })();

  /* ============================================================
     CAVE ENV  —  turn the torch-lit cave on once inside
     ============================================================ */
  const chaps = $$('[data-env]');
  let curId = '';
  function pick() {
    const mid = scrollY + innerHeight * 0.5; let best = chaps[0], bd = Infinity;
    for (const c of chaps) { const r = c.getBoundingClientRect(); const cy = scrollY + r.top + r.height / 2; const d = Math.abs(cy - mid); if (d < bd) { bd = d; best = c; } }
    if (!best || best.id === curId) return;
    curId = best.id;
    const env = best.dataset.env;
    if (cave) { cave.classList.toggle('is-on', env !== 'out'); cave.classList.toggle('is-trea', env === 'trea'); }
    if (secName) secName.textContent = best.dataset.name || '';
    if (secNo) secNo.textContent = noOf(best.id);
    const ri = railIdx(best.id);
    railDots.forEach((d, i) => d.classList.toggle('is-on', i === ri));
  }
  let tick = false;
  addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(() => { tick = false; pick(); }); } }, { passive: true });
  pick();

  /* ---------- smooth scroll helper ---------- */
  function goTo(id) { const t = document.getElementById(id); if (t) t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: id.startsWith('ch-') ? 'start' : 'start' }); }

  /* ---------- enter button (mouth → descend) ---------- */
  const enter = $('#enterBtn');
  if (enter) enter.addEventListener('click', () => goTo(enter.dataset.scroll));

  /* ---------- rail dots ---------- */
  railDots.forEach(d => d.addEventListener('click', () => goTo(d.dataset.go)));

  /* ---------- SLIDING ROCK DOORS ---------- */
  $$('.opencta--slide').forEach(btn => {
    btn.addEventListener('click', () => {
      const gate = document.getElementById(btn.dataset.open);
      const to = btn.dataset.to;
      if (gate && !gate.classList.contains('is-open')) {
        gate.classList.add('is-open');
        // after the stone has begun to slide, walk into the chamber
        setTimeout(() => goTo(to), reduce ? 0 : 760);
      } else {
        goTo(to);
      }
    });
  });

  /* ---------- count-up ---------- */
  function countUp(el) {
    if (el.dataset.done) return; el.dataset.done = '1';
    const to = +el.dataset.to;
    if (reduce || !gsap) { el.textContent = to.toLocaleString(); return; }
    const o = { v: 0 };
    gsap.to(o, { v: to, duration: 1.5, ease: 'power2.out', onUpdate() { el.textContent = Math.round(o.v).toLocaleString(); } });
  }

  /* ---------- reveals + counts (IntersectionObserver) ---------- */
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.16, rootMargin: '0px 0px -7% 0px' });
    $$('.r').forEach(el => io.observe(el));
    const ioc = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); ioc.unobserve(e.target); } }), { threshold: 0.45 });
    $$('.count').forEach(el => ioc.observe(el));
  } else {
    $$('.r').forEach(e => e.classList.add('in'));
    $$('.count').forEach(countUp);
  }

  /* ---------- mouth parallax (subtle) ---------- */
  if (gsap && window.ScrollTrigger && !reduce) {
    gsap.registerPlugin(window.ScrollTrigger);
    gsap.to('.mouth__img', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '#c-mouth', start: 'top top', end: 'bottom top', scrub: true } });
    addEventListener('load', () => window.ScrollTrigger.refresh());
  }

  /* ---------- nav active hint on scroll into treasury (leave cave anchor) ---------- */
})();
