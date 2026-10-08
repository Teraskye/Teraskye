/* ============================================================
   TERAMERGE — THE CLEARING  ·  engine (isolated)
   SCROLL = video time (scrubbed) + camera + story reveals
   TIME   = rain, mist and lightning that keep living when you stop
   ============================================================ */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smoothstep=(e0,e1,x)=>{ if(e0===e1) return x<e0?0:1; const t=clamp((x-e0)/(e1-e0)); return t*t*(3-2*t); };
  const MOTION=!matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root=document.documentElement;
  const boot=document.getElementById('boot');
  const video=document.getElementById('storm');
  const envInner=document.getElementById('envInner');
  const fx=document.getElementById('fx');
  const flash=document.getElementById('flash');
  const progress=document.getElementById('progress');

  /* ---------- scroll ---------- */
  let pTarget=0, pSmooth=0;
  function readScroll(){ const max=document.body.scrollHeight-innerHeight;
    pTarget=clamp(max>0?(window.scrollY||root.scrollTop||0)/max:0); }
  addEventListener('scroll', readScroll, {passive:true});

  /* ---------- scroll-scrubbed video ----------
     The dev server doesn't serve HTTP Range requests, so a normal <video>
     src is NOT seekable (seekable=[0,0]) and can't be scrubbed. We fetch the
     file as a Blob and play it from an object URL — fully seekable in memory. */
  let duration=10, videoReady=false, seekPending=false;
  const finishBoot=()=> boot&&boot.classList.add('is-done');
  if(video){
    video.addEventListener('loadedmetadata',()=>{ if(video.duration&&isFinite(video.duration)) duration=video.duration; });
    video.addEventListener('seeked',()=>{ seekPending=false; });
    const ready=()=>{ videoReady=true; finishBoot();
      if(!MOTION){ try{ video.currentTime=Math.min(9.4,(video.duration||10)-0.1); }catch(_){} } };
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

  /* ---------- live rain / mist / lightning (TIME) ---------- */
  const ctx=fx.getContext('2d',{alpha:true});
  let W=0,H=0,DPR=1,rain=[],mist=[];
  function layout(){ DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth||root.clientWidth||1; H=innerHeight||root.clientHeight||1;
    fx.width=Math.floor(W*DPR); fx.height=Math.floor(H*DPR);
    fx.style.width=W+'px'; fx.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
  function build(){ const n=Math.round(clamp(W*H/9000,60,180));
    rain=new Array(n).fill(0).map(()=>({ x:Math.random()*W*1.2-W*0.1, y:Math.random()*H,
      len:lerp(12,34,Math.random()), sp:lerp(700,1250,Math.random()), a:lerp(0.06,0.22,Math.random()) }));
    mist=new Array(3).fill(0).map((_,i)=>({ x:Math.random()*W, y:lerp(0.35,0.9,Math.random())*H,
      r:lerp(0.5,0.95,Math.random())*Math.max(W,H), a:lerp(0.02,0.05,Math.random()), dx:lerp(10,20,Math.random()), phase:i*2.2 })); }
  addEventListener('resize', ()=>{ readScroll(); layout(); });

  const WIND=0.28;
  let flashT=0, nextFlash=1.2+Math.random()*2.5;
  function draw(t){
    if(W<=0) return;
    ctx.clearRect(0,0,W,H);
    const clearAmt=smoothstep(0.6,0.95,pSmooth);       // storm gives way to the clearing
    const stormAmt=1-clearAmt;
    // mist (always drifting)
    for(const m of mist){ const span=W+m.r;
      const drift=MOTION?(Math.sin(t*0.05+m.phase)*40 + t*m.dx*4):0;
      const cx=(((m.x+drift)%span)+span)%span; if(!Number.isFinite(cx)) continue;
      const g=ctx.createRadialGradient(cx,m.y,0,cx,m.y,Math.max(m.r,1));
      g.addColorStop(0,`rgba(210,220,232,${m.a*(0.5+0.5*stormAmt)})`); g.addColorStop(1,'rgba(210,220,232,0)');
      ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
    // rain (thins out as it clears)
    if(MOTION){
      ctx.lineCap='round';
      for(const d of rain){ d.y+=d.sp*DT; d.x+=d.sp*WIND*DT;
        if(d.y>H+20||d.x>W+20){ d.y=-20; d.x=Math.random()*W*1.2-W*0.1; }
        const a=d.a*(0.25+0.75*stormAmt); if(a<=0.01) continue;
        ctx.beginPath(); ctx.moveTo(d.x,d.y); ctx.lineTo(d.x-d.len*WIND, d.y-d.len);
        ctx.strokeStyle=`rgba(214,224,236,${a})`; ctx.lineWidth=1; ctx.stroke(); }
    }
    // lightning — occasional, only while the storm still holds
    if(MOTION){
      flashT-=DT;
      if(flashT<=0){ flashT=nextFlash; nextFlash=lerp(1.0,4.2,Math.random());
        if(Math.random()<stormAmt*0.9){ flashLevel=lerp(0.28,0.6,Math.random()); } }
      if(flashLevel>0){ flashLevel=Math.max(0, flashLevel-DT*2.2);
        flash.style.opacity=(flashLevel*(0.5+0.5*Math.random())).toFixed(3); }
      else if(flash.style.opacity!=='0') flash.style.opacity='0';
    }
  }
  let flashLevel=0;

  /* ---------- reveals ---------- */
  const io=new IntersectionObserver((entries)=>{ for(const e of entries){ if(e.isIntersecting){
    e.target.classList.add('in'); io.unobserve(e.target); } } }, { threshold:0.18, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.r').forEach(el=> MOTION ? io.observe(el) : el.classList.add('in'));

  /* ---------- numbered section index (Montfort one-sequence) ---------- */
  (()=>{
    const noEl=document.getElementById('secNo'), nameEl=document.getElementById('secName'), totEl=document.getElementById('secTotal');
    const secs=[...document.querySelectorAll('main > .s')];
    if(!noEl||!secs.length) return;
    const NAMES={ hero:'The Storm', financial:'Financial', operational:'Operational', data:'Data & Reporting',
      legal:'Legal & Structure', timing:'Timing', pipeline:'Pipeline', final:'The Clearing' };
    if(totEl) totEl.textContent='/ '+String(secs.length).padStart(2,'0');
    let cur=-1;
    function upd(){ const mid=innerHeight/2; let best=0, bestD=1e9;
      secs.forEach((s,i)=>{ const r=s.getBoundingClientRect(); const d=Math.abs((r.top+r.height/2)-mid);
        if(d<bestD){ bestD=d; best=i; } });
      if(best!==cur){ cur=best; noEl.textContent=String(best+1).padStart(2,'0'); nameEl.textContent=NAMES[secs[best].id]||''; }
    }
    addEventListener('scroll',()=>requestAnimationFrame(upd),{passive:true});
    upd();
  })();

  /* ---------- 3D tilt (hero + glass cards) ---------- */
  if(MOTION && !matchMedia('(hover:none)').matches){
    const addTilt=(el,max)=>{
      el.addEventListener('pointermove',e=>{ const r=el.getBoundingClientRect();
        const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
        el.style.setProperty('--ry',( px*max*2).toFixed(2)+'deg');
        el.style.setProperty('--rx',(-py*max*2).toFixed(2)+'deg');
        el.style.setProperty('--gx',((px+0.5)*100).toFixed(1)+'%');
        el.style.setProperty('--gy',((py+0.5)*100).toFixed(1)+'%'); });
      el.addEventListener('pointerleave',()=>{ el.style.setProperty('--rx','0deg'); el.style.setProperty('--ry','0deg'); });
    };
    const hero=document.getElementById('heroTilt'); if(hero) addTilt(hero,4);
    document.querySelectorAll('.card').forEach(el=>addTilt(el,8));
  }

  /* ---------- scroll-driven 3D section pivot ---------- */
  if(MOTION){
    const secs=[...document.querySelectorAll('main > .s:not(#hero)')];
    secs.forEach(s=>{ s.style.perspective='1700px'; const w=s.querySelector('.s__wrap'); if(w) w.style.transformStyle='preserve-3d'; });
    function pivot(){ const vh=innerHeight, mid=vh/2;
      secs.forEach(s=>{ const w=s.querySelector('.s__wrap'); if(!w) return;
        const r=s.getBoundingClientRect(), c=r.top+r.height/2;
        const t=Math.max(-1,Math.min(1,(c-mid)/(vh*0.95)));
        w.style.transform='rotateX('+(t*3.4).toFixed(2)+'deg) translateZ(0)';
      });
    }
    addEventListener('scroll',()=>requestAnimationFrame(pivot),{passive:true});
    addEventListener('resize',()=>requestAnimationFrame(pivot),{passive:true});
    pivot();
  }

  /* ---------- main loop ---------- */
  let last=performance.now(), DT=0.016;
  function frame(now){ requestAnimationFrame(frame);
    DT=Math.min((now-last)/1000,0.05); last=now; const t=now/1000;
    const vw=innerWidth||root.clientWidth||0, vh=innerHeight||root.clientHeight||0;
    if(vw>0&&vh>0&&(Math.abs(vw-W)>1||Math.abs(vh-H)>1)) layout();
    pSmooth+=(pTarget-pSmooth)*(1-Math.exp(-DT*8));
    if(MOTION){ const scale=lerp(1.04,1.12,pSmooth); envInner.style.transform=`scale(${scale.toFixed(4)})`; }
    scrub();
    progress.style.transform=`scaleX(${pSmooth.toFixed(4)})`;
    if(W>0&&H>0){ try{ draw(t); }catch(_){} }
  }

  /* ---------- init ---------- */
  layout(); readScroll(); pSmooth=pTarget; last=performance.now(); requestAnimationFrame(frame);
  document.addEventListener('visibilitychange',()=>{ if(document.hidden){} else last=performance.now(); });
})();
