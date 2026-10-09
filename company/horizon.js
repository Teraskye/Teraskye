/* ============================================================
   TERAMERGE — THE HORIZON  ·  engine (isolated)
   SCROLL = video time (scrubbed) + story reveals
   TIME   = twinkling stars, kept alive
   ============================================================ */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const MOTION=!matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root=document.documentElement;
  const boot=document.getElementById('boot');
  const video=document.getElementById('sky');
  const fx=document.getElementById('fx');
  const progress=document.getElementById('progress');

  /* ---------- scroll ---------- */
  let pTarget=0, pSmooth=0;
  function readScroll(){ const max=document.body.scrollHeight-innerHeight;
    pTarget=clamp(max>0?(window.scrollY||root.scrollTop||0)/max:0); }
  addEventListener('scroll', readScroll, {passive:true});

  /* ---------- scroll-scrubbed video ----------
     The dev server doesn't serve HTTP Range requests, so a normal <video>
     src is NOT seekable and can't be scrubbed. We fetch the file as a Blob
     and play it from an object URL — fully seekable in memory. */
  let duration=10, videoReady=false, seekPending=false;
  const PORTRAIT=matchMedia('(max-aspect-ratio:1/1)').matches;
  const finishBoot=()=> boot&&boot.classList.add('is-done');
  if(video){
    video.addEventListener('loadedmetadata',()=>{ if(video.duration&&isFinite(video.duration)) duration=video.duration; });
    video.addEventListener('seeked',()=>{ seekPending=false; });
    const ready=()=>{ videoReady=true; finishBoot();
      if(!MOTION){ try{ video.currentTime=0.6; }catch(_){} } };
    video.addEventListener('loadeddata',ready); video.addEventListener('canplaythrough',ready);
    // portrait phones get a vertical, all-keyframe cut that fills the screen and follows the nebula
    // (every frame decodes on its own → instant, smooth scrubbing); desktop gets the 2560×1440 master
    const portrait=PORTRAIT;
    const src=(portrait&&video.dataset.srcM)||video.dataset.src;
    if(portrait&&video.dataset.posterM) video.poster=video.dataset.posterM;
    fetch(src).then(r=>r.blob()).then(b=>{ video.src=URL.createObjectURL(b); video.load(); })
      .catch(()=>{ video.src=src; video.load(); });   // fallback (non-seekable, but visible)
    setTimeout(finishBoot,2600);
  }
  function scrub(){
    if(!MOTION||!videoReady||seekPending) return;
    if(video.seekable.length && video.seekable.end(0) < 0.5) return;   // not seekable yet
    // snap to whole frames (24 fps) so we never ask for the same picture twice
    // desktop: ease-out so the nebula visibly moves in over the first few screens of scrolling
    // (phones keep the straight 1:1 mapping)
    const p=clamp(pSmooth,0,1), q=PORTRAIT?p:1-Math.pow(1-p,2.2);
    const target=Math.round(q*(duration-0.05)*24)/24;
    if(Math.abs(target-video.currentTime)>=0.02){ seekPending=true; try{ video.currentTime=target; }catch(_){ seekPending=false; } }
  }

  /* ---------- living TIME layer: twinkling stars ---------- */
  const ctx=fx.getContext('2d',{alpha:true});
  let W=0,H=0,DPR=1,stars=[];
  // sized from the fixed backdrop (100lvh), not the window — so the phone's address bar
  // sliding in/out doesn't resize it or re-scatter the stars while you scroll
  const envEl=document.querySelector('.env');
  const envW=()=>(envEl&&envEl.clientWidth)||innerWidth||1, envH=()=>(envEl&&envEl.clientHeight)||innerHeight||1;
  function layout(){ DPR=Math.min(devicePixelRatio||1,2);
    W=envW(); H=envH();
    fx.width=Math.floor(W*DPR); fx.height=Math.floor(H*DPR);
    fx.style.width=W+'px'; fx.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
  function build(){
    // twinkling stars — kept alive every frame so they blink even when the scroll-scrubbed video is paused
    const n=Math.round(clamp((W*H)/16000, H>W?120:70, 150));   // portrait: a fuller star field around the video band
    stars=new Array(n).fill(0).map(()=>({
      x:Math.random()*W, y:Math.random()*H,
      r:lerp(0.4,1.5,Math.random()*Math.random()),      // mostly small, a few bigger
      sp:lerp(0.5,2.4,Math.random()), ph:Math.random()*6.2832,
      base:lerp(0.22,0.85,Math.random()), glint:Math.random()<0.16 }));
  }
  addEventListener('resize', ()=>{ readScroll(); layout(); });

  function draw(t){
    if(W<=0) return;
    ctx.clearRect(0,0,W,H);
    // twinkling stars — animate on their own clock, independent of scroll
    if(MOTION){
      for(const s of stars){
        const tw=0.3+0.7*Math.abs(Math.sin(t*s.sp+s.ph));
        const a=s.base*tw;
        ctx.beginPath(); ctx.fillStyle=`rgba(255,248,232,${a.toFixed(3)})`;
        ctx.arc(s.x,s.y,s.r,0,6.2832); ctx.fill();
        if(s.glint && tw>0.8){                              // a brief 4-point sparkle at peak brightness
          const g=s.r*3.4; ctx.strokeStyle=`rgba(255,250,236,${(a*0.45).toFixed(3)})`; ctx.lineWidth=0.7;
          ctx.beginPath(); ctx.moveTo(s.x-g,s.y); ctx.lineTo(s.x+g,s.y);
          ctx.moveTo(s.x,s.y-g); ctx.lineTo(s.x,s.y+g); ctx.stroke();
        }
      }
    }
  }

  /* ---------- team scan (WebGL iframe): only alive while near the screen ----------
     a 3D scene rendering off-screen steals frames from the scroll on phones */
  const teamFrame=document.querySelector('.teamembed__frame');
  if(teamFrame && 'IntersectionObserver' in window){
    const teamSrc=teamFrame.getAttribute('src');
    new IntersectionObserver(es=>{ for(const e of es){
      if(e.isIntersecting){ if(teamFrame.getAttribute('src')!==teamSrc) teamFrame.setAttribute('src',teamSrc); }
      else if(teamFrame.getAttribute('src')===teamSrc) teamFrame.setAttribute('src','about:blank');
    } }, { rootMargin:'60% 0px' }).observe(teamFrame);
  }

  /* ---------- reveals ---------- */
  const io=new IntersectionObserver((entries)=>{ for(const e of entries){ if(e.isIntersecting){
    e.target.classList.add('in'); io.unobserve(e.target); } } }, { threshold:0.16, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.r').forEach(el=> MOTION ? io.observe(el) : el.classList.add('in'));

  /* ---------- main loop ---------- */
  let last=performance.now(), DT=0.016;
  function frame(now){ requestAnimationFrame(frame);
    DT=Math.min((now-last)/1000,0.05); last=now; const t=now/1000;
    const vw=envW(), vh=envH();
    if(vw>0&&vh>0&&(Math.abs(vw-W)>1||Math.abs(vh-H)>1)) layout();
    pSmooth+=(pTarget-pSmooth)*(1-Math.exp(-DT*8));
    // no camera zoom/pan: the video sits exactly in the frame; only its playhead follows the scroll
    scrub();
    progress.style.transform=`scaleX(${pSmooth.toFixed(4)})`;
    if(W>0&&H>0){ try{ draw(t); }catch(_){} }
  }

  /* ---------- init ---------- */
  layout(); readScroll(); pSmooth=pTarget; last=performance.now(); requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) last=performance.now(); });
})();
