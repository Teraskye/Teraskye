/* ============================================================
   TERASKYE — CANOPY (home) engine
   Ambient forest video (theme) + scroll reveals + section index
   + progress + a gentle continuous camera drift. No build.
   ============================================================ */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (v,a=0,b=1) => v<a?a:v>b?b:v;
  const MOTION = !matchMedia('(prefers-reduced-motion: reduce)').matches;

  const boot = $('boot'), video = $('forest'), envInner = $('envInner'), progress = $('progress');
  const endBoot = () => boot && boot.classList.add('done');

  /* ---------- forest video: SCROLL-SCRUBBED (moves only when you scroll) ----------
     Loaded as a Blob because the dev server has no HTTP Range support, so a normal
     <video> src is not seekable. video.currentTime is mapped to scroll progress. */
  let duration = 10, videoReady = false, seekPending = false;
  if (video) {
    video.removeAttribute('loop'); video.pause();
    video.addEventListener('loadedmetadata', () => { if (video.duration && isFinite(video.duration)) duration = video.duration; });
    video.addEventListener('seeked', () => { seekPending = false; });
    const ready = () => { videoReady = true; endBoot(); };
    video.addEventListener('loadeddata', ready);
    video.addEventListener('canplaythrough', ready);
    const src = video.dataset.src;
    fetch(src).then(r => r.blob()).then(b => { video.src = URL.createObjectURL(b); video.load(); })
      .catch(() => { video.src = src; video.load(); });
    setTimeout(endBoot, 2600);
  } else { endBoot(); }
  function scrub(pS){
    if (!video || !videoReady || seekPending) return;
    if (video.seekable.length && video.seekable.end(0) < 0.4) return;   // not seekable yet
    const target = clamp(pS, 0, 1) * (duration - 0.05);
    if (Math.abs(target - video.currentTime) > 0.03) { seekPending = true; try { video.currentTime = target; } catch(_) { seekPending = false; } }
  }

  /* ---------- scroll reveals ---------- */
  const revEls = [...document.querySelectorAll('.r')];
  if (!MOTION || !('IntersectionObserver' in window)) {
    revEls.forEach(el => el.classList.add('in'));
  } else {
    const io = new IntersectionObserver((es) => {
      for (const e of es) if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    revEls.forEach(el => io.observe(el));
  }

  /* ---------- section index ---------- */
  const sections = [...document.querySelectorAll('.hsec')];
  const secName = $('secName'), secNo = $('secNo');
  if (secName && secNo && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) {
        const i = sections.indexOf(e.target);
        secName.textContent = e.target.getAttribute('data-name') || '';
        secNo.textContent = String(i + 1).padStart(2, '0');
      }});
    }, { threshold: 0.5 });
    sections.forEach(s => sio.observe(s));
  }

  /* ---------- progress + gentle camera drift ---------- */
  let pT = 0, pS = 0, last = performance.now();
  const readScroll = () => { const max = document.body.scrollHeight - innerHeight; pT = clamp(max > 0 ? (scrollY / max) : 0); };
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);
  readScroll(); pS = pT;

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    pS += (pT - pS) * (1 - Math.exp(-dt * 8));
    if (progress) progress.style.transform = `scaleX(${pS.toFixed(4)})`;
    if (MOTION && envInner) {
      const scale = 1.04 + pS * 0.05;                 // gentle scroll-driven push-in (no idle motion)
      const rise = -pS * 2.5;                          // slight upward pan as you scroll
      envInner.style.transform = `scale(${scale.toFixed(4)}) translate3d(0, ${rise.toFixed(2)}%, 0)`;
    }
    scrub(pS);
  }
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) last = performance.now(); });
})();
