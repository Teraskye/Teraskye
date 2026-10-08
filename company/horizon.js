/* ============================================================
   TERAMERGE — THE HORIZON  ·  engine (isolated)
   SCROLL = video time (scrubbed) + camera rise + story reveals
   TIME   = warm atmospheric haze + a faint sun shimmer, kept alive
   ============================================================ */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const MOTION=!matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root=document.documentElement;
  const boot=document.getElementById('boot');
  const video=document.getElementById('sky');
  const envInner=document.getElementById('envInner');
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
  const finishBoot=()=> boot&&boot.classList.add('is-done');
  if(video){
    video.addEventListener('loadedmetadata',()=>{ if(video.duration&&isFinite(video.duration)) duration=video.duration; });
    video.addEventListener('seeked',()=>{ seekPending=false; });
    const ready=()=>{ videoReady=true; finishBoot();
      if(!MOTION){ try{ video.currentTime=0.6; }catch(_){} } };
    video.addEventListener('loadeddata',ready); video.addEventListener('canplaythrough',ready);
    const src=video.dataset.src;
    fetch(src).then(r=>r.blob()).then(b=>{ video.src=URL.createObjectURL(b); video.load(); })
      .catch(()=>{ video.src=src; video.load(); });   // fallback (non-seekable, but visible)
    setTimeout(finishBoot,2600);
  }
  function scrub(){
    if(!MOTION||!videoReady||seekPending) return;
    if(video.seekable.length && video.seekable.end(0) < 0.5) return;   // not seekable yet
    const target=clamp(pSmooth,0,1)*(duration-0.05);
    if(Math.abs(target-video.currentTime)>0.03){ seekPending=true; try{ video.currentTime=target; }catch(_){ seekPending=false; } }
  }

  /* ---------- living TIME layer: warm haze + faint sun shimmer ---------- */
  const ctx=fx.getContext('2d',{alpha:true});
  let W=0,H=0,DPR=1,haze=[],stars=[];
  function layout(){ DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth||root.clientWidth||1; H=innerHeight||root.clientHeight||1;
    fx.width=Math.floor(W*DPR); fx.height=Math.floor(H*DPR);
    fx.style.width=W+'px'; fx.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
  function build(){
    haze=new Array(4).fill(0).map((_,i)=>({
      x:Math.random()*W, y:lerp(0.42,0.82,Math.random())*H,
      r:lerp(0.42,0.78,Math.random())*Math.max(W,H),
      a:lerp(0.014,0.036,Math.random()), dx:lerp(5,12,Math.random()), phase:i*1.9 }));
    // twinkling stars — kept alive every frame so they blink even when the scroll-scrubbed video is paused
    const n=Math.round(clamp((W*H)/16000,70,150));
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
    // warm atmospheric haze drifting low across the horizon
    for(const m of haze){ const span=W+m.r;
      const drift=MOTION?(Math.sin(t*0.045+m.phase)*32 + t*m.dx*3.4):0;
      const cx=(((m.x+drift)%span)+span)%span; if(!Number.isFinite(cx)) continue;
      const g=ctx.createRadialGradient(cx,m.y,0,cx,m.y,Math.max(m.r,1));
      g.addColorStop(0,`rgba(244,214,168,${m.a})`); g.addColorStop(1,'rgba(244,214,168,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
    // faint sun shimmer — a soft warm bloom that breathes as light expands with scroll
    if(MOTION){
      const grow=clamp(pSmooth*1.2,0,1);
      const sx=W*0.5, sy=lerp(0.62,0.5,pSmooth)*H;
      const rr=lerp(0.14,0.34,grow)*Math.max(W,H)*(1+0.03*Math.sin(t*0.6));
      const a=lerp(0.022,0.072,grow)*(0.9+0.1*Math.sin(t*0.8));
      const g=ctx.createRadialGradient(sx,sy,0,sx,sy,Math.max(rr,1));
      g.addColorStop(0,`rgba(255,236,196,${a})`); g.addColorStop(0.6,`rgba(255,226,170,${a*0.35})`); g.addColorStop(1,'rgba(255,226,170,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    }
  }

  /* ---------- reveals ---------- */
  const io=new IntersectionObserver((entries)=>{ for(const e of entries){ if(e.isIntersecting){
    e.target.classList.add('in'); io.unobserve(e.target); } } }, { threshold:0.16, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.r').forEach(el=> MOTION ? io.observe(el) : el.classList.add('in'));

  /* ---------- main loop ---------- */
  let last=performance.now(), DT=0.016;
  function frame(now){ requestAnimationFrame(frame);
    DT=Math.min((now-last)/1000,0.05); last=now; const t=now/1000;
    const vw=innerWidth||root.clientWidth||0, vh=innerHeight||root.clientHeight||0;
    if(vw>0&&vh>0&&(Math.abs(vw-W)>1||Math.abs(vh-H)>1)) layout();
    pSmooth+=(pTarget-pSmooth)*(1-Math.exp(-DT*8));
    if(MOTION){
      // camera rises: gentle scale + a subtle upward pan as you ascend
      const scale=lerp(1.06,1.14,pSmooth);
      const rise=lerp(2.2,-3.4,pSmooth);          // % — pan up as the camera climbs
      envInner.style.transform=`scale(${scale.toFixed(4)}) translateY(${rise.toFixed(2)}%)`;
    }
    scrub();
    progress.style.transform=`scaleX(${pSmooth.toFixed(4)})`;
    if(W>0&&H>0){ try{ draw(t); }catch(_){} }
  }

  /* ---------- init ---------- */
  layout(); readScroll(); pSmooth=pTarget; last=performance.now(); requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden) last=performance.now(); });
})();
