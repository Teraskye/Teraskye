/* ============================================================
   TERAMERGE — THE WILD  ·  engine (isolated)
   SCROLL = camera (parallax) + story (reveals)
   TIME   = the living valley (video loop + mist + drifting motes)
   ============================================================ */
(() => {
  'use strict';
  const clamp=(v,a=0,b=1)=>v<a?a:v>b?b:v;
  const lerp=(a,b,t)=>a+(b-a)*t;
  const smoothstep=(e0,e1,x)=>{ if(e0===e1) return x<e0?0:1; const t=clamp((x-e0)/(e1-e0)); return t*t*(3-2*t); };
  const MOTION=!matchMedia('(prefers-reduced-motion: reduce)').matches;

  const root=document.documentElement;
  const boot=document.getElementById('boot');
  const video=document.getElementById('valley');
  const envInner=document.getElementById('envInner');
  const structure=document.getElementById('structure');
  const fx=document.getElementById('fx');
  const progress=document.getElementById('progress');

  /* ---------- scroll (camera) ---------- */
  let pTarget=0, pSmooth=0;
  let duration=10, seekPending=false, videoReady=false;   // scroll-scrubbed film
  function scrub(){ if(!video||!videoReady||seekPending) return;
    if(video.seekable.length && video.seekable.end(0)<0.5) return;
    const target=clamp(pSmooth)*(duration-0.05);
    if(Math.abs(target-video.currentTime)>0.03){ seekPending=true; try{ video.currentTime=target; }catch(_){ seekPending=false; } } }
  function readScroll(){ const max=(document.body.scrollHeight)-innerHeight;
    pTarget=clamp(max>0?(window.scrollY||root.scrollTop||0)/max:0); }
  addEventListener('scroll', readScroll, {passive:true});

  /* ---------- time canvas: mist + drifting motes ---------- */
  const ctx=fx.getContext('2d',{alpha:true});
  let W=0,H=0,DPR=1,motes=[],mist=[];
  const COL={ paper:[238,241,233], moss:[178,192,150] };
  function layout(){ DPR=Math.min(devicePixelRatio||1,2);
    W=innerWidth||root.clientWidth||1; H=innerHeight||root.clientHeight||1;
    fx.width=Math.floor(W*DPR); fx.height=Math.floor(H*DPR);
    fx.style.width=W+'px'; fx.style.height=H+'px'; ctx.setTransform(DPR,0,0,DPR,0,0); build(); }
  function build(){ const n=Math.round(clamp(W*H/48000,14,44));
    motes=new Array(n).fill(0).map(()=>({ x:Math.random()*W, y:Math.random()*H,
      r:lerp(0.6,2.1,Math.random()**2), a:lerp(0.05,0.2,Math.random()),
      vx:lerp(8,26,Math.random()), vy:lerp(-6,6,Math.random()),
      swayA:lerp(4,16,Math.random()), swayF:lerp(0.12,0.4,Math.random()),
      phase:Math.random()*6.28, moss:Math.random()<0.25 }));
    mist=new Array(3).fill(0).map((_,i)=>({ x:Math.random()*W, y:lerp(0.3,0.85,Math.random())*H,
      r:lerp(0.5,0.95,Math.random())*Math.max(W,H), a:lerp(0.02,0.045,Math.random()),
      dx:lerp(6,14,Math.random()), phase:i*2.1 })); }
  addEventListener('resize', ()=>{ readScroll(); layout(); });

  function draw(t){
    if(W<=0) return;
    ctx.clearRect(0,0,W,H);
    for(const m of mist){ const span=W+m.r;
      const drift=MOTION?(Math.sin(t*0.05+m.phase)*40 + t*m.dx*4):0;
      const cx=(((m.x+drift)%span)+span)%span; if(!Number.isFinite(cx)) continue;
      const g=ctx.createRadialGradient(cx,m.y,0,cx,m.y,Math.max(m.r,1));
      g.addColorStop(0,`rgba(${COL.paper[0]},${COL.paper[1]},${COL.paper[2]},${m.a})`);
      g.addColorStop(1,'rgba(238,241,233,0)'); ctx.fillStyle=g; ctx.fillRect(0,0,W,H); }
    for(const p of motes){ if(MOTION){ p.x+=p.vx*DT; p.y+=p.vy*DT;
        if(p.x>W+6)p.x=-6; if(p.x<-6)p.x=W+6; if(p.y>H+6)p.y=-6; if(p.y<-6)p.y=H+6; }
      const sway=MOTION?Math.sin(t*p.swayF+p.phase)*p.swayA:0, tw=MOTION?(0.7+0.3*Math.sin(t*0.8+p.phase)):1;
      const c=p.moss?COL.moss:COL.paper;
      ctx.beginPath(); ctx.arc(p.x+sway,p.y,p.r,0,6.2832);
      ctx.fillStyle=`rgba(${c[0]},${c[1]},${c[2]},${p.a*tw})`; ctx.fill(); }
  }

  /* ---------- reveals (story) ---------- */
  const io=new IntersectionObserver((entries)=>{ for(const e of entries){ if(e.isIntersecting){
    e.target.classList.add('in'); io.unobserve(e.target); } } }, { threshold:0.18, rootMargin:'0px 0px -8% 0px' });
  document.querySelectorAll('.r').forEach(el=> MOTION ? io.observe(el) : el.classList.add('in'));

  /* ---------- 3D tilt (hero name + buy cards) ---------- */
  function addTilt(el, max){
    el.addEventListener('pointermove',e=>{
      const r=el.getBoundingClientRect();
      const px=(e.clientX-r.left)/r.width-0.5, py=(e.clientY-r.top)/r.height-0.5;
      el.style.setProperty('--ry',( px*max*2).toFixed(2)+'deg');
      el.style.setProperty('--rx',(-py*max*2).toFixed(2)+'deg');
      el.style.setProperty('--gx',((px+0.5)*100).toFixed(1)+'%');
      el.style.setProperty('--gy',((py+0.5)*100).toFixed(1)+'%');
    });
    el.addEventListener('pointerleave',()=>{ el.style.setProperty('--rx','0deg'); el.style.setProperty('--ry','0deg'); });
  }
  if(MOTION && !matchMedia('(hover:none)').matches){
    const hero=document.getElementById('heroTilt'); if(hero) addTilt(hero,4);
    document.querySelectorAll('.buy').forEach(el=>addTilt(el,8));
  }

  /* ---------- main loop ---------- */
  let last=performance.now(), DT=0.016;
  function frame(now){ requestAnimationFrame(frame);
    DT=Math.min((now-last)/1000,0.05); last=now; const t=now/1000;
    const vw=innerWidth||root.clientWidth||0, vh=innerHeight||root.clientHeight||0;
    if(vw>0&&vh>0&&(Math.abs(vw-W)>1||Math.abs(vh-H)>1)) layout();
    // smooth scroll → camera
    pSmooth+=(pTarget-pSmooth)*(1-Math.exp(-DT*7));
    scrub();
    if(MOTION){
      const scale=lerp(1.06,1.2,pSmooth), ty=lerp(0,-5,pSmooth);
      envInner.style.transform=`scale(${scale.toFixed(4)}) translate3d(0,${ty.toFixed(2)}%,0)`;
    }
    // hidden structure: barely there, a touch clearer around the "certainty" beat
    if(structure) structure.style.opacity=(0.09 + 0.13*smoothstep(0.5,0.7,pSmooth)*(1-smoothstep(0.82,0.95,pSmooth))).toFixed(3);
    progress.style.transform=`scaleX(${pSmooth.toFixed(4)})`;
    if(W>0&&H>0){ try{ draw(t); }catch(_){} }
  }

  /* ---------- form ---------- */
  const form=document.getElementById('propertyForm');
  const drop=document.getElementById('drop');
  const filesInput=document.getElementById('files');
  const dropFiles=document.getElementById('dropFiles');
  let picked=[];
  function renderFiles(){ dropFiles.innerHTML=picked.map(f=>`<span>${f.name}</span>`).join(''); }
  function addFiles(list){ for(const f of list) picked.push(f); if(picked.length>12) picked=picked.slice(0,12); renderFiles(); }
  if(drop){
    ['dragenter','dragover'].forEach(ev=>drop.addEventListener(ev,e=>{ e.preventDefault(); drop.classList.add('drag'); }));
    ['dragleave','dragend'].forEach(ev=>drop.addEventListener(ev,()=>drop.classList.remove('drag')));
    drop.addEventListener('drop',e=>{ e.preventDefault(); drop.classList.remove('drag'); if(e.dataTransfer) addFiles(e.dataTransfer.files); });
    filesInput.addEventListener('change',()=>addFiles(filesInput.files));
  }
  if(form){
    const req=['addr','name','email'];
    req.forEach(id=>{ const el=document.getElementById(id);
      el.addEventListener('input',()=>{ el.style.borderBottomColor=''; }); });
    form.addEventListener('submit',e=>{
      e.preventDefault();
      let firstBad=null;
      for(const id of req){ const el=document.getElementById(id); const ok=el.value.trim().length>1 &&
        (id!=='email' || /.+@.+\..+/.test(el.value));
        if(!ok){ el.style.borderBottomColor='rgba(224,150,120,0.95)'; if(!firstBad) firstBad=el; } }
      if(firstBad){ firstBad.focus(); return; }
      form.classList.add('is-done');
      document.getElementById('submit').scrollIntoView({behavior: MOTION?'smooth':'auto', block:'center'});
    });
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
