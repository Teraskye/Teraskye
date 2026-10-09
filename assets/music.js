/* ============================================================
   TERAMERGE — site-wide background music with an on/off toggle
   · one looping track (assets/music.mp3) shared by every page
   · browsers block sound until the visitor interacts, so it starts
     on the first tap / click / key press (unless they turned it off)
   · the on/off choice is remembered; the playback position carries
     over from page to page so the track doesn't restart each time
   · if the track file is missing, the toggle stays hidden
   ============================================================ */
(function () {
  if (window.top !== window) return;               // embedded frames (e.g. the team scan) stay silent
  const base = (document.currentScript && document.currentScript.src) || location.href;
  const SRC = new URL('music.mp3?v=2', base).href;
  const KEY = 'tm-music', POS = 'tm-music-pos', VOL = 0.35;
  const store = {
    get(k, s) { try { return (s ? sessionStorage : localStorage).getItem(k); } catch (_) { return null; } },
    set(k, v, s) { try { (s ? sessionStorage : localStorage).setItem(k, v); } catch (_) {} }
  };
  let wantOn = store.get(KEY) !== 'off';

  const audio = new Audio();
  audio.loop = true; audio.preload = 'metadata'; audio.volume = 0;   // stream on play, don't pre-download the whole track
  const saved = parseFloat(store.get(POS, true));
  audio.addEventListener('loadedmetadata', () => { if (saved > 0 && saved < audio.duration) audio.currentTime = saved; });

  /* ---- toggle button ---- */
  const css = document.createElement('style');
  css.textContent = `
  .tm-music{ position:fixed; left:clamp(0.9rem,2.4vw,1.6rem); bottom:clamp(0.9rem,2.4vw,1.6rem); z-index:60;
    width:42px; height:42px; border-radius:50%; display:none; place-items:center; cursor:pointer; padding:0;
    border:1px solid rgba(226,180,110,0.6); background:rgba(12,10,8,0.62); color:#f1dcb4;
    -webkit-backdrop-filter:blur(8px); backdrop-filter:blur(8px); box-shadow:0 8px 22px rgba(0,0,0,0.45);
    transition:border-color .3s, background .3s, transform .2s; }
  .tm-music.is-ready{ display:grid; }
  .tm-music:hover{ transform:translateY(-2px); border-color:rgba(236,196,130,1); }
  .tm-music:focus-visible{ outline:2px solid rgba(236,196,130,1); outline-offset:3px; }
  .tm-music svg{ width:19px; height:19px; fill:none; stroke:currentColor; stroke-width:1.7; stroke-linecap:round; stroke-linejoin:round; }
  .tm-music .tm-bars{ display:flex; gap:2px; align-items:flex-end; height:14px; }
  .tm-music .tm-bars i{ width:2.5px; background:currentColor; border-radius:1px; height:30%; }
  .tm-music.is-on .tm-bars i{ animation:tmBar 1s ease-in-out infinite; }
  .tm-music.is-on .tm-bars i:nth-child(2){ animation-delay:.2s; } .tm-music.is-on .tm-bars i:nth-child(3){ animation-delay:.4s; }
  .tm-music.is-on .tm-bars i:nth-child(4){ animation-delay:.6s; }
  .tm-music.is-on .tm-off{ display:none; } .tm-music:not(.is-on) .tm-bars{ display:none; }
  @keyframes tmBar{ 0%,100%{ height:30%; } 50%{ height:100%; } }
  @media (prefers-reduced-motion:reduce){ .tm-music.is-on .tm-bars i{ animation:none; height:70%; } }`;
  document.head.appendChild(css);

  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'tm-music';
  btn.innerHTML = '<span class="tm-bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>' +
    '<svg class="tm-off" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>';

  let fadeT;
  function fade(to, done) {
    clearInterval(fadeT);
    fadeT = setInterval(() => {
      const v = audio.volume + (to > audio.volume ? 0.03 : -0.05);
      if ((to > audio.volume && v >= to) || (to <= audio.volume && v <= to)) {
        audio.volume = Math.max(0, Math.min(1, to)); clearInterval(fadeT); if (done) done();
      } else audio.volume = Math.max(0, Math.min(1, v));
    }, 50);
  }
  function paint() {
    const on = wantOn && !audio.paused;
    btn.classList.toggle('is-on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on');
    btn.title = on ? 'Music on — tap to turn off' : 'Music off — tap to turn on';
  }
  function play() {
    const p = audio.play();
    if (p && p.then) p.then(() => { fade(VOL); paint(); }).catch(paint); else { fade(VOL); paint(); }
  }
  function stop() { fade(0, () => { audio.pause(); paint(); }); }

  btn.addEventListener('click', e => {
    e.stopPropagation();
    wantOn = !(wantOn && !audio.paused);
    store.set(KEY, wantOn ? 'on' : 'off');
    wantOn ? play() : stop();
    paint();
  });

  // first interaction anywhere starts the music (if the visitor hasn't turned it off)
  const kick = e => {
    if (e && e.target && e.target.closest && e.target.closest('.tm-music')) return;
    if (wantOn && audio.paused) play();
    ['pointerdown', 'keydown', 'touchstart'].forEach(t => removeEventListener(t, kick, true));
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, kick, true));

  audio.addEventListener('loadedmetadata', () => { btn.classList.add('is-ready'); if (wantOn && audio.paused) play(); }, { once: true });
  audio.addEventListener('error', () => btn.remove());
  addEventListener('pagehide', () => store.set(POS, String(audio.currentTime || 0), true));

  const mount = () => { document.body.appendChild(btn); paint(); audio.src = SRC; };
  document.body ? mount() : addEventListener('DOMContentLoaded', mount);
})();
