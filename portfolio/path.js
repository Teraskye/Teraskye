/* ============================================================
   TERASKYE — PORTFOLIO · "The Vault of Paths" controller
   Fixed-stage scene machine: init → path (scroll to approach,
   step-play the approach video, click to open the door) →
   chamber (reference-style data) → archive hub. Interactive,
   horizontal, click-driven — no long vertical scroll.
   ============================================================ */
(function () {
  const $ = s => document.querySelector(s);
  const $$ = s => [...document.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

  const nav = $('#nav'), rtn = $('#rtn'), pindex = $('#pindex'), hud = $('#hud');
  const hudNo = $('#hudNo'), hudName = $('#hudName');
  const scenes = {}; $$('.scene').forEach(s => scenes[s.id] = s);
  const idxOf = id => id.includes('found') ? 0 : id.includes('multi') ? 1 : id.includes('under') ? 2 : id.includes('trea') ? 3 : -1;

  let current = 's-init';
  let busy = false;        // a video segment is playing
  let cooldown = false;    // gesture throttle
  let rafSeg = 0;
  const path = { v: null, near: 0, end: 0, step: 0, opened: false };

  /* ---------- treasury stars ---------- */
  (function stars() {
    const el = $('#treaStars'); if (!el) return; let h = '';
    for (let i = 0; i < 54; i++) { const x = (Math.random() * 100).toFixed(2), y = (Math.random() * 100).toFixed(2), s = (.6 + Math.random() * 1.7).toFixed(1), d = (Math.random() * 5).toFixed(2); h += `<i style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s"></i>`; }
    el.innerHTML = h;
  })();

  /* ---------- count-up ---------- */
  function countUp(el) {
    const to = +el.dataset.to; el.dataset.done = '1';
    if (reduce) { el.textContent = to.toLocaleString(); return; }
    const t0 = performance.now(), dur = 1400;
    (function tick(now) { const p = Math.min(1, (now - t0) / dur); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e).toLocaleString(); if (p < 1) requestAnimationFrame(tick); })(t0);
  }

  /* ---------- video segment play ---------- */
  function stopSeg() { if (rafSeg) cancelAnimationFrame(rafSeg); rafSeg = 0; }
  function playTo(v, target, done) {
    busy = true; stopSeg();
    const run = () => {
      const chk = () => {
        if (!v) { busy = false; return; }
        if (v.currentTime >= target - 0.04 || v.ended) { v.pause(); try { v.currentTime = Math.min(target, (v.duration || target) - 0.01); } catch (e) {} busy = false; stopSeg(); done && done(); return; }
        rafSeg = requestAnimationFrame(chk);
      };
      rafSeg = requestAnimationFrame(chk);
    };
    const p = v.play();
    if (p && p.catch) p.catch(() => { try { v.currentTime = target; } catch (e) {} busy = false; done && done(); });
    run();
  }

  /* ---------- path: advance one step ---------- */
  function advancePath() {
    if (busy || path.opened || !path.v) return;
    const v = path.v, near = path.near;
    if (path.step >= 3) return; // already at the door → need CTA
    const target = near * (path.step + 1) / 3;
    const cue = scenes[current].querySelector('[data-cue]');
    playTo(v, target, () => {
      path.step++;
      if (path.step >= 3) { // reached the door
        if (cue) cue.classList.add('is-gone');
        const cta = scenes[current].querySelector('[data-open]');
        if (cta) cta.hidden = false;
      }
    });
  }

  /* ---------- path: open the door ---------- */
  function openDoor() {
    if (busy || path.opened || !path.v) return;
    path.opened = true;
    const sc = scenes[current];
    const cta = sc.querySelector('[data-open]'); if (cta) cta.hidden = true;
    const next = sc.dataset.next;
    playTo(path.v, path.end, () => { go(next); });
  }

  /* ---------- scene enter/leave ---------- */
  function leave(id) {
    const sc = scenes[id]; if (!sc) return;
    if (sc.dataset.kind === 'path') { stopSeg(); const v = sc.querySelector('.path__v'); if (v) { try { v.pause(); } catch (e) {} } }
  }

  function go(id) {
    if (!scenes[id] || id === current) return;
    leave(current);
    scenes[current].classList.remove('is-active', 'is-enter');
    current = id;
    const sc = scenes[id];
    sc.classList.add('is-active', 'is-enter');
    onEnter(sc);
    // focus for keyboard
    sc.setAttribute('tabindex', '-1');
  }

  function setUI(kind, sc) {
    const i = idxOf(sc.id);
    // nav dims on paths for immersion
    nav.classList.toggle('is-dim', kind === 'path');
    // return-to-archive only in chambers
    rtn.hidden = !(kind === 'chamber');
    // chamber index on paths + chambers
    pindex.hidden = !(kind === 'path' || kind === 'chamber');
    $$('.pindex__i').forEach((b, bi) => b.classList.toggle('is-on', bi === i));
    // hud
    const no = sc.dataset.hud, nm = sc.dataset.hudname;
    if (no && nm) { hud.hidden = false; hudNo.textContent = no; hudName.textContent = nm; }
    else hud.hidden = true;
  }

  function onEnter(sc) {
    const kind = sc.dataset.kind;
    setUI(kind, sc);

    if (kind === 'init') { setTimeout(() => go('p-enter'), reduce ? 200 : 2000); return; }

    if (kind === 'path') {
      const v = sc.querySelector('.path__v');
      path.v = v; path.near = +sc.dataset.near || 5; path.end = +sc.dataset.end || 9; path.step = 0; path.opened = false;
      const cue = sc.querySelector('[data-cue]'); if (cue) cue.classList.remove('is-gone');
      const cta = sc.querySelector('[data-open]'); if (cta) cta.hidden = true;
      if (v) {
        v.preload = 'auto';
        try { v.pause(); v.currentTime = 0; } catch (e) {}
        try { v.load(); } catch (e) {}
      }
      return;
    }

    if (kind === 'chamber') {
      sc.querySelectorAll('.count').forEach(el => { if (!el.dataset.done) countUp(el); });
      return;
    }
    // archive: nothing extra
  }

  /* ---------- input: wheel / touch / keys ---------- */
  function forward() {
    const kind = scenes[current].dataset.kind;
    if (kind === 'path') {
      if (path.step >= 3 && !path.opened) openDoor(); // at the door → open on further intent
      else advancePath();
    } else if (kind === 'chamber') {
      const nx = scenes[current].dataset.next; if (nx) go(nx);
    }
  }
  function gesture(dir) { // dir: +1 forward, -1 back
    if (cooldown || busy) return;
    cooldown = true; setTimeout(() => cooldown = false, 620);
    if (dir > 0) forward();
  }

  addEventListener('wheel', (e) => {
    const kind = scenes[current].dataset.kind;
    if (kind === 'path' || kind === 'chamber') { e.preventDefault(); if (Math.abs(e.deltaY) > 6) gesture(e.deltaY > 0 ? 1 : -1); }
  }, { passive: false });

  let ty = 0;
  addEventListener('touchstart', (e) => { ty = e.touches[0].clientY; }, { passive: true });
  addEventListener('touchend', (e) => {
    const kind = scenes[current].dataset.kind; if (kind !== 'path' && kind !== 'chamber') return;
    const dy = (e.changedTouches[0].clientY - ty);
    if (dy < -40) gesture(1); else if (dy > 40) gesture(-1);
  }, { passive: true });

  addEventListener('keydown', (e) => {
    const kind = scenes[current].dataset.kind;
    if ((e.key === 'ArrowDown' || e.key === ' ' || e.key === 'Enter') && (kind === 'path' || kind === 'chamber')) { e.preventDefault(); gesture(1); }
    if (e.key === 'Escape' && kind === 'chamber') go('archive');
  });

  /* ---------- clicks ---------- */
  $$('[data-open]').forEach(b => b.addEventListener('click', openDoor));
  $$('[data-proceed]').forEach(b => b.addEventListener('click', () => { const nx = scenes[current].dataset.next; if (nx) go(nx); }));
  $$('[data-archive]').forEach(b => b.addEventListener('click', () => go('archive')));
  rtn.addEventListener('click', () => go('archive'));
  $$('[data-jump]').forEach(b => b.addEventListener('click', () => go(b.dataset.jump)));

  /* ---------- boot ---------- */
  onEnter(scenes['s-init']);
})();
