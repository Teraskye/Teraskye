/* ============================================================
   TERASKYE — THE GROWTH  ·  engine (isolated)
   SCROLL = camera (parallax) + story (reveals)
   TIME   = the living land (video loop + drifting haze + motes)
   ============================================================ */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const MOTION=!matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root=document.documentElement;
  const boot=document.getElementById('boot');
  const video=document.getElementById('growth');
  const envInner=document.getElementById('envInner');
  const fx=document.getElementById('fx');
  const progress=document.getElementById('progress');

  /* ---------- scroll (camera) ---------- */
  let pTarget=0, pSmooth=0;
  let duration=10, seekPending=false, videoReady=false;   // scroll-scrubbed film
  function scrub(){ if(!video||!videoReady||seekPending) return;
    if(video.seekable.length && video.seekable.end(0)<0.5) return;
    const target=clamp(pSmooth)*(duration-0.05);
    if(Math.abs(target-video.currentTime)>0.03){ seekPending=true; try{ video.currentTime=target; }catch(_){ seekPending=false; } } }
  function readScroll(){ const max=document.body.scrollHeight-innerHeight;
    pTarget=clamp(max>0?(window.scrollY||root.scrollTop||0)/max:0); }
  addEventListener('scroll', readScroll, {passive:true});

  /* ---------- time canvas: haze + drifting motes ---------- */
  const ctx=fx.getContext('2d',{alpha:true});
  let W=0,H=0,DPR=1,motes=[],haze=[];
  const COL={ paper:[242,239,230], wheat:[202,172,116], field:[158,168,120] };
  function layout(){ DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth||root.clientWidth||1; H=innerHeight||root.clientHeight||1;
    fx.width=Math.floor(W*DPR); fx.height=Math.floor(H*DPR);
    fx.style.width=W+'px'; fx.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
  function build(){ const n=Math.round(clamp(W*H/52000,12,40));
    motes=new Array(n).fill(0).map(()=>({ x:Math.random()*W, y:Math.random()*H,
      r:lerp(0.5,1.9,Math.random()**2), a:lerp(0.04,0.16,Math.random()),
      vx:lerp(10,30,Math.random()), vy:lerp(-4,4,Math.random()),
      swayA:lerp(3,12,Math.random()), swayF:lerp(0.1,0.34,Math.random()),
      phase:Math.random()*6.28, warm:Math.random()<0.3 }));
    haze=new Array(3).fill(0).map((_,i)=>({ x:Math.random()*W, y:lerp(0.25,0.85,Math.random())*H,
      r:lerp(0.55,1.0,Math.random())*Math.max(W,H), a:lerp(0.018,0.04,Math.random()),
      dx:lerp(8,18,Math.random()), phase:i*2.2 })); }
  addEventListener('resize', ()=>{ readScroll(); layout(); });

  function draw(t){
    if(W<=0) return;
    ctx.clearRect(0,0,W,H);
    for(const m of haze){ const span=W+m.r;
      const drift=MOTION?(Math.sin(t*0.045+m.phase)*44 + t*m.dx*4):0;
      const cx=(((m.x+drift)%span)+span)%span; if(!Number.isFinite(cx)) continue;
      const g=ctx.createRadialGradient(cx,m.y,0,cx,m.y,Math.max(m.r,1));
      g.addColorStop(0,`rgba(${COL.paper[0]},${COL.paper[1]},${COL.paper[2]},${m.a})`);
      g.addColorStop(1,'rgba(242,239,230,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
    for(const p of motes){ if(MOTION){ p.x+=p.vx*DT; p.y+=p.vy*DT;
        if(p.x>W+6)p.x=-6; if(p.x<-6)p.x=W+6; if(p.y>H+6)p.y=-6; if(p.y<-6)p.y=H+6; }
      const sway=MOTION?Math.sin(t*p.swayF+p.phase)*p.swayA:0, tw=MOTION?(0.7+0.3*Math.sin(t*0.8+p.phase)):1;
      const c=p.warm?COL.wheat:COL.paper;
      ctx.beginPath(); ctx.arc(p.x+sway,p.y,p.r,0,6.2832);
      ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${p.a*tw})`; ctx.fill(); }
  }

  /* ---------- reveals (story) ---------- */
  const io=new IntersectionObserver((entries)=>{ for(const e of entries){ if(e.isIntersecting){
    e.target.classList.add('in'); io.unobserve(e.target); } } }, { threshold:0.18, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.r').forEach(el=> MOTION ? io.observe(el) : el.classList.add('in'));

  /* ---------- THE FLYWHEEL — capital compounds through the technology ---------- */
  (()=>{
    const fw=document.getElementById('flywheel'); if(!fw) return;
    const nodes=['Acquire','Operate','Improve NOI','Scale','Reinvest','Return'];
    const R=33;                                   // ring radius (% of box)
    let h=`<div class="fw__glow"></div>
      <svg class="fw__svg" viewBox="0 0 100 100" aria-hidden="true">
        <circle class="fw__track" cx="50" cy="50" r="${R}"/>
        <circle class="fw__flow" cx="50" cy="50" r="${R}" pathLength="100"/>
      </svg>
      <div class="fw__core"><span class="fw__coretag">The technology</span><span class="fw__corename">Teraskye</span></div>`;
    nodes.forEach((n,i)=>{
      const a=(-90 + i*60)*Math.PI/180, dx=Math.cos(a), dy=Math.sin(a);
      const nx=50+R*dx, ny=50+R*dy, lx=50+(R+14)*dx, ly=50+(R+14)*dy;
      h+=`<span class="fw__dot" style="left:${nx.toFixed(2)}%;top:${ny.toFixed(2)}%" data-i="${i}"></span>
        <span class="fw__label" style="left:${lx.toFixed(2)}%;top:${ly.toFixed(2)}%" data-i="${i}">
          <b>${String(i+1).padStart(2,'0')}</b> ${n}</span>`;
    });
    fw.innerHTML=h;
    // hover a node/label → highlight the pair
    const dots=[...fw.querySelectorAll('.fw__dot')], labels=[...fw.querySelectorAll('.fw__label')];
    const set=(i,on)=>{ dots[i]&&dots[i].classList.toggle('hot',on); labels[i]&&labels[i].classList.toggle('hot',on); };
    dots.concat(labels).forEach(el=>{
      const i=+el.dataset.i;
      el.addEventListener('pointerenter',()=>set(i,true));
      el.addEventListener('pointerleave',()=>set(i,false));
    });
  })();

  /* ---------- numbered section index (Montfort one-sequence) ---------- */
  (()=>{
    const noEl=document.getElementById('secNo'), nameEl=document.getElementById('secName'), totEl=document.getElementById('secTotal');
    const secs=[...document.querySelectorAll('main > .s')];
    if(!noEl||!secs.length) return;
    const NAMES={ hero:'The Calendar', window:'The Window', opportunity:'The Opportunity', partners:'What You Get',
      whynow:'Why Now', whyus:'Why Us', 'flywheel-sec':'The Flywheel', phase1:'Phase 1', structure:'Structure',
      access:'Access', final:"Let's Talk" };
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

  /* ---------- 3D tilt toward the cursor (hero + glass cards) ---------- */
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
    document.querySelectorAll('.principle').forEach(el=>addTilt(el,9));
    document.querySelectorAll('.shift__block').forEach(el=>addTilt(el,7));
    const fwEl=document.getElementById('flywheel'); if(fwEl) addTilt(fwEl,16);   // rotate the 3D flywheel
  }

  /* ---------- scroll-driven 3D section pivot (a new kind of depth) ---------- */
  if(MOTION){
    const secs=[...document.querySelectorAll('main > .s:not(#hero):not(#flywheel-sec)')];
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
    pSmooth+=(pTarget-pSmooth)*(1-Math.exp(-DT*7));
    scrub();
    if(MOTION){ const scale=lerp(1.06,1.2,pSmooth), ty=lerp(0,-5,pSmooth);
      envInner.style.transform=`scale(${scale.toFixed(4)}) translate3d(0,${ty.toFixed(2)}%,0)`; }
    progress.style.transform=`scaleX(${pSmooth.toFixed(4)})`;
    if(W>0&&H>0){ try{ draw(t); }catch(_){} }
  }

  /* ---------- boot + lifecycle ---------- */
  const endBoot=()=>boot&&boot.classList.add('is-done');
  layout(); readScroll(); pSmooth=pTarget; last=performance.now(); requestAnimationFrame(frame);
  if(video){
    const ready=()=>{ videoReady=true; endBoot(); };
    video.addEventListener('loadedmetadata',()=>{ if(video.duration&&isFinite(video.duration)) duration=video.duration; });
    video.addEventListener('seeked',()=>{ seekPending=false; });
    video.addEventListener('loadeddata',ready,{once:true}); video.addEventListener('canplaythrough',ready,{once:true});
    const src=video.dataset.src;   // Blob → seekable under a Range-less dev server
    fetch(src).then(r=>r.blob()).then(b=>{ video.src=URL.createObjectURL(b); video.load(); }).catch(()=>{ video.src=src; video.load(); });
    setTimeout(()=>{ videoReady=videoReady||video.readyState>=2; endBoot(); },2600);
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) last=performance.now(); });
  } else endBoot();
})();
