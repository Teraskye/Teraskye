/* ============================================================
   TERAMERGE — CANOPY  ·  interaction engine
   TWO INDEPENDENT SYSTEMS:
     SCROLL  -> camera push, story/scene reveals, network reveal, grade
     TIME    -> leaves/mist/motes/light + network's living pulse
   The video loops on its own (time). Scroll only moves a smoothed
   target; when scrolling stops the story holds but the world keeps living.
   ============================================================ */
(() => {
  'use strict';

  const R = {
    signal: [201, 212, 181],
    ember:  [232, 201, 154],
    bone:   [236, 230, 218],
  };

  const clamp = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
  const lerp  = (a, b, t) => a + (b - a) * t;
  const smoothstep = (e0, e1, x) => {
    if (e0 === e1) return x < e0 ? 0 : 1;
    const t = clamp((x - e0) / (e1 - e0));
    return t * t * (3 - 2 * t);
  };

  const prefersReduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let MOTION = !prefersReduced;

  /* ---------- elements ---------- */
  const boot       = document.getElementById('boot');
  const video      = document.getElementById('forest');
  const stageInner = document.getElementById('stageInner');
  const fx         = document.getElementById('fx');
  const veil       = document.getElementById('veil');
  const wash       = document.getElementById('wash');
  const progress   = document.getElementById('progress');
  const indexNo    = document.getElementById('indexNo');
  const indexName  = document.getElementById('indexName');
  const indexTotal = document.getElementById('indexTotal');
  const dotsWrap   = document.getElementById('dots');
  const scroller   = document.getElementById('scroll');
  const root       = document.documentElement;

  /* per-section background theme: film (cinematic forest), paper (clean
     reading page), ink (deep dramatic ground). rgb + alpha of the wash,
     and how much the living particles show through. */
  const MODES = {
    film:  { c: [247,244,237], a: 0.00, env: 1.00 },   // cinematic — forest full
    paper: { c: [247,244,237], a: 0.82, env: 0.18 },   // clean reading page, forest still breathes through
    ink:   { c: [8,11,9],      a: 0.55, env: 0.74 },   // deep dramatic ground for the big numbers
  };

  /* ---------- scene model ---------- */
  const FADE = 0.022;   // crossfade half-width in global progress
  const SPAN = 0.16;    // child reveal ramp (in scene sub-progress)

  const scenes = [...document.querySelectorAll('.scene')].map(el => {
    const reveals = [...el.querySelectorAll('[data-reveal]')].map(r => ({
      el: r, at: parseFloat(r.dataset.reveal) || 0, shown: -1,
    }));
    return {
      el,
      start: parseFloat(el.dataset.start),
      end:   parseFloat(el.dataset.end),
      name:  el.dataset.name || '',
      mode:  el.dataset.mode || 'film',
      calm:  el.dataset.calm !== undefined ? parseFloat(el.dataset.calm) : 0.6,
      reveals,
      op: -1,           // last applied opacity (dirty check)
    };
  });

  /* ---------- build the interactive dot-nav + section index ---------- */
  let activeIdx = -1;
  const dots = scenes.map((s, i) => {
    const b = document.createElement('button');
    b.className = 'dots__dot';
    b.type = 'button';
    b.setAttribute('aria-label', s.name);
    b.innerHTML = `<span class="dots__tip">${s.name}</span>`;
    b.addEventListener('click', () => {
      const mid = (s.start + s.end) / 2;
      const max = (scroller.offsetHeight + scroller.offsetTop) - window.innerHeight;
      window.scrollTo({ top: Math.round(mid * max), behavior: 'smooth' });
    });
    dotsWrap && dotsWrap.appendChild(b);
    return b;
  });
  if (indexTotal) indexTotal.textContent = '/ ' + String(scenes.length).padStart(2, '0');

  /* =========================================================
     SCROLL SYSTEM  — read target, smooth it in the raf loop
     ========================================================= */
  let pTarget = 0, pSmooth = 0;
  let duration = 10, seekPending = false;   // scroll-scrubbed film

  function readScroll() {
    const max = (scroller.offsetHeight + scroller.offsetTop) - window.innerHeight;
    const y = window.scrollY || root.scrollTop || 0;
    pTarget = clamp(max > 0 ? y / max : 0);
  }
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', () => { readScroll(); layout(); });

  /* =========================================================
     FX CANVAS  — mist + motes + instrument network
     ========================================================= */
  const ctx = fx.getContext('2d', { alpha: true });
  let W = 0, H = 0, DPR = 1;
  let motes = [], mist = [], leaves = [];

  // instrument network — normalised (0..1) constellation, upper/right
  const NODES = [
    { x: 0.555, y: 0.50, rid: true  },  // hub
    { x: 0.60,  y: 0.32, rid: true  },
    { x: 0.725, y: 0.45 },
    { x: 0.645, y: 0.63 },
    { x: 0.83,  y: 0.60 },
    { x: 0.78,  y: 0.30 },
    { x: 0.70,  y: 0.75, rid: true  },
  ];
  const EDGES = [
    [0,1],[0,2],[0,3],[0,5],[2,4],[3,6],[1,5],[2,5],
  ];

  function layout() {
    DPR = Math.min(devicePixelRatio || 1, 2);
    W = innerWidth || root.clientWidth || 1;
    H = innerHeight || root.clientHeight || 1;
    fx.width  = Math.floor(W * DPR);
    fx.height = Math.floor(H * DPR);
    fx.style.width = W + 'px';
    fx.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    const area = W * H;
    // fewer, quieter motes — restraint over density
    const count = Math.round(clamp(area / 46000, 14, 48));
    motes = new Array(count).fill(0).map(() => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: lerp(0.6, 1.9, Math.random() ** 2),
      a: lerp(0.05, 0.2, Math.random()),
      vy: lerp(3, 11, Math.random()),          // px/s upward drift
      swayA: lerp(5, 20, Math.random()),
      swayF: lerp(0.12, 0.4, Math.random()),
      phase: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.18,
    }));
    mist = new Array(2).fill(0).map((_, i) => ({
      x: Math.random() * W,
      y: lerp(0.25, 0.8, Math.random()) * H,
      r: lerp(0.5, 0.9, Math.random()) * Math.max(W, H),
      a: lerp(0.022, 0.042, Math.random()),
      dx: (Math.random() < 0.5 ? -1 : 1) * lerp(3, 9, Math.random()),
      dy: (Math.random() < 0.5 ? -1 : 1) * lerp(1, 4, Math.random()),
      phase: i * 2.1,
    }));
    // a few slow-drifting leaves — ambient life that keeps the frozen film
    // feeling real even when the scroll (and so the video) is completely still.
    const lc = Math.round(clamp(area / 130000, 5, 11));
    leaves = new Array(lc).fill(0).map(() => ({
      x: Math.random() * W, y: Math.random() * H,
      s: lerp(7, 15, Math.random()),
      vy: lerp(5, 15, Math.random()),                 // fall speed px/s
      swayA: lerp(22, 64, Math.random()), swayF: lerp(0.12, 0.34, Math.random()),
      rot: Math.random() * Math.PI * 2, vr: lerp(-0.5, 0.5, Math.random()),
      a: lerp(0.05, 0.14, Math.random()), phase: Math.random() * Math.PI * 2,
      warm: Math.random() < 0.4,
    }));
  }

  function drawLeaves(t) {
    for (const l of leaves) {
      if (MOTION) {
        l.y += l.vy * FRAME_DT; l.rot += l.vr * FRAME_DT;
        if (l.y > H + 24) { l.y = -24; l.x = Math.random() * W; }
      }
      const x = l.x + (MOTION ? Math.sin(t * l.swayF + l.phase) * l.swayA : 0);
      if (!Number.isFinite(x)) continue;
      const col = l.warm ? R.ember : R.signal;
      ctx.save();
      ctx.translate(x, l.y);
      ctx.rotate(l.rot + (MOTION ? Math.sin(t * 0.6 + l.phase) * 0.3 : 0));
      ctx.beginPath();
      ctx.moveTo(0, -l.s * 0.5);
      ctx.quadraticCurveTo(l.s * 0.5, 0, 0, l.s * 0.5);
      ctx.quadraticCurveTo(-l.s * 0.5, 0, 0, -l.s * 0.5);
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${(l.a * envDim).toFixed(3)})`;
      ctx.fill();
      ctx.restore();
    }
  }

  function drawMist(t) {
    if (W <= 0 || H <= 0) return;
    for (const m of mist) {
      const span = W + m.r;
      const drift = MOTION ? (Math.sin(t * 0.05 + m.phase) * 40 + t * m.dx * 4) : 0;
      const cx = (((m.x + drift) % span) + span) % span;
      const cy = m.y + (MOTION ? Math.cos(t * 0.037 + m.phase) * 26 : 0);
      const rr = Math.max(m.r, 1);
      if (!Number.isFinite(cx) || !Number.isFinite(cy) || !Number.isFinite(rr)) continue;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
      g.addColorStop(0, `rgba(${R.bone[0]},${R.bone[1]},${R.bone[2]},${m.a})`);
      g.addColorStop(1, 'rgba(236,230,218,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawMotes(t) {
    for (const p of motes) {
      if (MOTION) {
        p.y -= p.vy * FRAME_DT;
        if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
      }
      const sway = MOTION ? Math.sin(t * p.swayF + p.phase) * p.swayA : 0;
      const x = p.x + sway;
      const tw = MOTION ? (0.72 + 0.28 * Math.sin(t * 0.9 + p.phase)) : 1;
      const col = p.warm ? R.ember : R.bone;
      ctx.beginPath();
      ctx.arc(x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${col[0]},${col[1]},${col[2]},${p.a * tw * envDim})`;
      ctx.fill();
    }
  }

  // network: reveal from scroll, life (pulse/breath) from time
  function drawNetwork(t) {
    return;   // disabled — the constellation diagram was distracting over the middle sections
    const reveal = smoothstep(0.19, 0.50, pSmooth);
    // present from Master AI, recedes as the forest opens (Multifamily)
    // the calm field above the canvas already governs how much shows through,
    // so the network is not additionally dimmed here — it stays the one quiet
    // signal of intelligence in the Master AI beat.
    const netA = smoothstep(0.185, 0.235, pSmooth) * (1 - smoothstep(0.60, 0.685, pSmooth)) * envMix;
    if (netA <= 0.001) return;

    const pt = i => ({ x: NODES[i].x * W, y: NODES[i].y * H });
    const breath = MOTION ? 0.78 + 0.22 * Math.sin(t * 1.1) : 1;

    // edges (draw progressively)
    EDGES.forEach((e, i) => {
      const eStart = (i / EDGES.length) * 0.7;
      const frac = smoothstep(eStart, eStart + 0.34, reveal);
      if (frac <= 0) return;
      const a = pt(e[0]), b = pt(e[1]);
      const ex = lerp(a.x, b.x, frac), ey = lerp(a.y, b.y, frac);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y); ctx.lineTo(ex, ey);
      ctx.strokeStyle = `rgba(${R.signal[0]},${R.signal[1]},${R.signal[2]},${0.42 * netA})`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // living data pulse along completed edges (TIME)
      if (frac >= 1 && MOTION) {
        const u = ((t * 0.14 + i * 0.37) % 1);
        const px = lerp(a.x, b.x, u), py = lerp(a.y, b.y, u);
        ctx.beginPath();
        ctx.arc(px, py, 1.7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${R.signal[0]},${R.signal[1]},${R.signal[2]},${0.85 * netA})`;
        ctx.fill();
      }
    });

    // nodes
    NODES.forEach((n, i) => {
      const appear = smoothstep((i / NODES.length) * 0.6, (i / NODES.length) * 0.6 + 0.12, reveal);
      if (appear <= 0) return;
      const x = n.x * W, y = n.y * H;
      const a = appear * netA * breath;
      // ring
      ctx.beginPath();
      ctx.arc(x, y, 3.4, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${R.signal[0]},${R.signal[1]},${R.signal[2]},${0.75 * a})`;
      ctx.lineWidth = 1;
      ctx.stroke();
      // core
      ctx.beginPath();
      ctx.arc(x, y, 1.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${R.bone[0]},${R.bone[1]},${R.bone[2]},${0.9 * a})`;
      ctx.fill();
      // survey reticle ticks on key nodes — the instrument motif
      if (n.rid) {
        ctx.strokeStyle = `rgba(${R.signal[0]},${R.signal[1]},${R.signal[2]},${0.4 * a})`;
        const L = 9, G = 6;
        [[0,-1],[0,1],[-1,0],[1,0]].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.moveTo(x + dx * G, y + dy * G);
          ctx.lineTo(x + dx * (G + L), y + dy * (G + L));
          ctx.stroke();
        });
      }
    });
  }

  /* =========================================================
     LUMINANCE SENSOR  — background-aware readability (TIME)
     samples the frame behind the text and nudges scrim alpha
     ========================================================= */
  const lc = document.createElement('canvas');
  lc.width = 32; lc.height = 18;
  const lctx = lc.getContext('2d', { willReadFrequently: true });
  let lum = 0.4, lumTarget = 0.4, lumAcc = 0, videoReady = false;

  function sampleLuminance() {
    if (!videoReady || video.readyState < 2) return;
    try {
      lctx.drawImage(video, 0, 0, 32, 18);
      // sample the left-central band (where most text lives)
      const d = lctx.getImageData(2, 4, 16, 10).data;
      let s = 0, n = 0;
      for (let i = 0; i < d.length; i += 4) {
        s += (0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
        n++;
      }
      lumTarget = clamp((s / n) / 255);
    } catch (_) { /* not decodable yet */ }
  }

  /* =========================================================
     SCENE + CAMERA + GRADE update  (SCROLL system)
     ========================================================= */
  let activeName = '';
  let intro = 0;    // one-time load reveal for the opening scene (time-based)
  let curCalm = 0.2; // how much the environment recedes for reading (0 cinematic .. 1 calm)
  let envDim = 1;    // particle/network brightness, quieted in calm zones
  let envMix = 1;    // blended per-section environment presence (from MODES)
  let paperChrome = false;
  const washCur = { r: 247, g: 244, b: 237, a: 0 };  // smoothed background wash

  function applyScenes() {
    let topOp = 0, topName = activeName, topIdx = activeIdx;
    let calmSum = 0, opSum = 0;
    // per-section theme blend
    let wr = 0, wg = 0, wb = 0, wa = 0, envSum = 0, paperW = 0;

    scenes.forEach((s, i) => {
      const rise = s.start <= 0 ? 1 : smoothstep(s.start - FADE, s.start + FADE, pSmooth);
      const fall = s.end   >= 1 ? 1 : 1 - smoothstep(s.end - FADE, s.end + FADE, pSmooth);
      const op = clamp(Math.min(rise, fall));

      if (Math.abs(op - s.op) > 0.002 || (op > 0 && op < 1)) {
        s.el.style.opacity = op.toFixed(3);
        s.el.style.visibility = op > 0.008 ? 'visible' : 'hidden';
        s.op = op;
      }

      if (op > 0.008) {
        let sp = clamp((pSmooth - s.start) / (s.end - s.start));
        // opening scene reveals on load even before any scroll happens
        if (s.start <= 0) sp = Math.max(sp, intro);
        for (const r of s.reveals) {
          const rv = smoothstep(r.at, r.at + SPAN, sp);
          if (Math.abs(rv - r.shown) > 0.004) {
            r.el.style.opacity = rv.toFixed(3);
            r.el.style.transform = `translate3d(0,${((1 - rv) * 22).toFixed(2)}px,0)`;
            r.shown = rv;
          }
        }
        if (op > topOp) { topOp = op; topName = s.name; topIdx = i; }
      }

      // blend each scene's calm level + background theme, weighted by presence
      const w = Math.max(op, 0);
      calmSum += w * s.calm; opSum += w;
      const m = MODES[s.mode] || MODES.film;
      wr += w * m.c[0]; wg += w * m.c[1]; wb += w * m.c[2];
      wa += w * m.a;   envSum += w * m.env;
      if (s.mode === 'paper') paperW += w;
    });

    // smoothly settle the environment's calm level toward the blended target
    const calmTarget = opSum > 0 ? calmSum / opSum : 0.2;
    curCalm += (calmTarget - curCalm) * 0.12;
    root.style.setProperty('--calm', curCalm.toFixed(3));

    // background WASH — the per-section theme made visible
    if (opSum > 0) {
      const tr = wr / opSum, tg = wg / opSum, tb = wb / opSum, ta = wa / opSum;
      washCur.r += (tr - washCur.r) * 0.14;
      washCur.g += (tg - washCur.g) * 0.14;
      washCur.b += (tb - washCur.b) * 0.14;
      washCur.a += (ta - washCur.a) * 0.14;
      envMix += ((envSum / opSum) - envMix) * 0.12;
    }
    if (wash) wash.style.background =
      `rgba(${Math.round(washCur.r)},${Math.round(washCur.g)},${Math.round(washCur.b)},${washCur.a.toFixed(3)})`;

    // chrome flips dark when a light reading page dominates
    const wantPaper = opSum > 0 && (paperW / opSum) > 0.5;
    if (wantPaper !== paperChrome) {
      paperChrome = wantPaper;
      document.body.classList.toggle('paper-chrome', paperChrome);
    }

    // section index + dot-nav
    if (topIdx !== activeIdx && topIdx >= 0) {
      activeIdx = topIdx;
      activeName = topName;
      if (indexNo)   indexNo.textContent = String(topIdx + 1).padStart(2, '0');
      if (indexName) indexName.textContent = topName;
      dots.forEach((d, i) => d.classList.toggle('is-active', i === topIdx));
    }
  }

  function applyCamera() {
    // camera push — SCROLL only (holds when scroll stops)
    if (!MOTION) return;
    const scale = lerp(1.02, 1.17, pSmooth);
    const ty = lerp(0, -3.2, pSmooth);
    stageInner.style.transform = `scale(${scale.toFixed(4)}) translate3d(0,${ty.toFixed(2)}%,0)`;
  }

  function applyGrade() {
    // forest "opens up" — brighter through Multifamily onward
    const open = smoothstep(0.58, 0.74, pSmooth);
    const bright = 0.64 + 0.2 * open;
    root.style.setProperty('--grade-bright', bright.toFixed(3));
    // protective veil grows a touch as it brightens (still a soft top gradient)
    root.style.setProperty('--grade-veil', (0.42 * open).toFixed(3));
    // background-aware scrim strength
    root.style.setProperty('--lum', lum.toFixed(3));
    // progress bar
    progress.style.transform = `scaleX(${pSmooth.toFixed(4)})`;
  }

  /* the film is SCROLL-SCRUBBED: its time follows scroll, so it holds still
     when you stop (no free-running playback). Ambient life on the canvas
     (leaves, air, mist) keeps the frozen frame feeling real. */
  function scrub() {
    if (!video || !videoReady || seekPending) return;
    if (video.seekable.length && video.seekable.end(0) < 0.5) return;  // not seekable yet
    const target = clamp(pSmooth) * (duration - 0.05);
    if (Math.abs(target - video.currentTime) > 0.03) {
      seekPending = true;
      try { video.currentTime = target; } catch (_) { seekPending = false; }
    }
  }

  /* =========================================================
     MAIN LOOP  — single rAF driving both systems
     ========================================================= */
  let last = performance.now();
  let FRAME_DT = 0.016;

  function frame(now) {
    // schedule the next frame FIRST so nothing below can ever stop the loop.
    // (When the tab is hidden the browser simply withholds the next callback
    //  and resumes it on return — the environment continues, never resets.)
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    FRAME_DT = dt;
    const t = now / 1000;

    // self-heal: if the real viewport size appears (or changes) after an
    // early 0-width layout, rebuild the stage to match.
    const vw = innerWidth || root.clientWidth || 0;
    const vh = innerHeight || root.clientHeight || 0;
    if (vw > 0 && vh > 0 && (Math.abs(vw - W) > 1 || Math.abs(vh - H) > 1)) layout();

    // one-time intro reveal (opening scene), time-driven
    intro = MOTION ? clamp(intro + dt / 1.15) : 1;

    // smooth the scroll target (frame-rate independent)
    const k = 1 - Math.exp(-dt * 7.5);
    pSmooth += (pTarget - pSmooth) * k;
    if (Math.abs(pTarget - pSmooth) < 0.0002) pSmooth = pTarget;

    // luminance sensor (throttled ~7fps)
    lumAcc += dt;
    if (lumAcc > 0.14) { lumAcc = 0; sampleLuminance(); }
    lum += (lumTarget - lum) * (1 - Math.exp(-dt * 3));

    // SCROLL-driven
    applyScenes();
    applyCamera();
    applyGrade();
    scrub();

    // TIME-driven environment — particles follow each section's theme
    // (full in cinematic film sections, quieted behind a paper reading page).
    envDim = envMix;
    if (W > 0 && H > 0) {
      ctx.clearRect(0, 0, W, H);
      try { drawMist(t); drawLeaves(t); drawMotes(t); drawNetwork(t); }
      catch (err) { if (!frame._warned) { frame._warned = 1; console.warn('draw error', err && err.message); } }
    }
  }

  /* =========================================================
     BOOT + lifecycle
     ========================================================= */
  function start() {
    layout();
    // optional deep-link to a scroll position, e.g. #p=0.43 (share/return to a section)
    const hp = (location.hash.match(/p=([0-9.]+)/) || [])[1];
    if (hp !== undefined) {
      try { history.scrollRestoration = 'manual'; } catch (_) {}
      window.scrollTo(0, Math.round(scroller.offsetHeight * clamp(parseFloat(hp))));
    }
    readScroll();
    pSmooth = pTarget;
    intro = 1;                 // if deep-linked past the top, skip the intro fade
    if (!hp) intro = 0;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function endBoot() { boot && boot.classList.add('is-done'); }

  if (video) {
    video.addEventListener('loadedmetadata', () => {
      if (video.duration && isFinite(video.duration)) duration = video.duration;
    });
    video.addEventListener('seeked', () => { seekPending = false; });
    const ready = () => { videoReady = true; endBoot(); };
    video.addEventListener('loadeddata', ready, { once: true });
    video.addEventListener('canplaythrough', ready, { once: true });
    // The dev server serves no HTTP Range, so a plain <video src> is NOT
    // seekable and can't be scrubbed. Fetch it as a Blob → object URL, which
    // is fully seekable in memory.
    const src = video.dataset.src;
    fetch(src).then(r => r.blob()).then(b => { video.src = URL.createObjectURL(b); video.load(); })
      .catch(() => { video.src = src; video.load(); });   // fallback (may not seek, still shows)
    // safety: never let the loader trap the page
    setTimeout(() => { videoReady = videoReady || video.readyState >= 2; endBoot(); }, 2600);
  } else {
    endBoot();
  }

  // the rAF loop pauses itself when the tab is hidden (the browser withholds
  // callbacks) and resumes on return — reset the clock so dt doesn't spike.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) last = performance.now();
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else { start(); }
})();
