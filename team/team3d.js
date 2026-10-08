/* ============================================================
   TERASKYE — TEAM · immersive 3D experience
   An ORIGINAL dark architectural WebGL space. The team's real
   portraits float in spatial depth; drag / swipe / arrows move
   between them with a cinematic spatial transition, mouse
   parallax gives depth, and the environment stays subtly alive.
   Vanilla Three.js via CDN import-map (no build). Photos are the
   team's own; the environment is original. Data-driven.
   ============================================================ */
import * as THREE from 'three';
const gsap = window.gsap;
const $ = id => document.getElementById(id);
const clamp = (v,a,b)=> v<a?a:v>b?b:v;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
/* embedded mode (?embed=1): chrome hidden + auto-plays; used inside the Company page */
const EMBED = new URLSearchParams(location.search).has('embed');
if (EMBED) document.documentElement.classList.add('embed');

/* ---------------- team data (swap names / bios here) ---------------- */
const TEAM = [
  { no:'01', name:'Vamsi Vemoori', title:'Founder · Chief Executive Officer\n& Chief Technology Officer',  bio:'As CEO he sets the vision and strategy; as CTO he builds the intelligence platform that turns real estate into a system.', img:'img/vamsi.jpg?v=3' },
  { no:'02', name:'Anitha Ravala',  title:'Co-Founder · Chief Investment Officer',                 bio:'Leads investment strategy, capital and fund management.',                          img:'img/anitha.jpg?v=2' },
  { no:'03', name:'Srinath Ambati', title:'Co-Founder · Chief Operating Officer\n& Chief Financial Officer',  bio:'As COO he turns strategy into disciplined execution; as CFO he runs the finances that keep every asset accountable.',          img:'img/srinath.jpg?v=2' },
];
const N = TEAM.length;

/* ---------------- fallback ---------------- */
function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }
function showFallback(){
  $('load').classList.add('done'); $('scene').style.display='none';
  ['watermark','info','nav','dots','swipehint'].forEach(id=>{ const e=$(id); if(e) e.style.display='none'; });
  $('fbGrid').innerHTML = TEAM.map(m=>`<div class="fb__card"><img src="${m.img}" alt=""><div class="no">${m.no}</div><div class="nm">${m.name}</div><div class="ti">${m.title}</div></div>`).join('');
  $('fallback').hidden=false;
}
if(!hasWebGL()){ showFallback(); throw new Error('fallback'); }

/* ======================================================================
   RENDERER + SCENE
   ====================================================================== */
const canvas=$('scene');
const renderer=new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;

const scene=new THREE.Scene(); scene.background=new THREE.Color(0x000000); scene.fog=new THREE.FogExp2(0x000000,0.055);
const camera=new THREE.PerspectiveCamera(46, innerWidth/innerHeight, 0.1, 100); camera.position.set(0,0,7);

/* parallax layer for the living background (pure black + blue) */
const bg=new THREE.Group(); scene.add(bg);

/* ---------------- SCANNING INTELLIGENCE FIELD (blue) ----------------
   A 3D lattice of faint blue points; a soft "scan" travels slowly
   through depth, brightening the points it passes — the system
   scanning through its network. Black background, blue signal. */
const scanU={ uScan:{value:-18}, uTime:{value:0}, uColor:{value:new THREE.Color(0x6ea8ff)}, uPix:{value:Math.min(devicePixelRatio,1.75)} };
(()=>{
  const nx=16, ny=9, nz=13, pos=[];
  for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
    const x=(ix/(nx-1)-0.5)*34 + (Math.random()-0.5)*0.6;
    const y=(iy/(ny-1)-0.5)*13 + (Math.random()-0.5)*0.5;
    const z=-24 + iz/(nz-1)*16 + (Math.random()-0.5)*0.6;         // pushed deep behind the faces
    if(Math.abs(x)<4.5 && Math.random()<0.72) continue;            // keep the central corridor black
    pos.push(x,y,z);
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
  const mat=new THREE.ShaderMaterial({
    uniforms:scanU, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
    vertexShader:`uniform float uScan; uniform float uTime; uniform float uPix; varying float vB;
      void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0);
        float d=abs(position.z-uScan); float scan=smoothstep(3.2,0.0,d);
        float tw=0.5+0.5*sin(uTime*0.5+position.x*0.6+position.y*0.9);
        vB=0.06 + scan*0.7 + tw*0.04;
        gl_PointSize=(0.8+scan*1.4)*uPix*(42.0/max(-mv.z,0.1));
        gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform vec3 uColor; varying float vB;
      void main(){ vec2 c=gl_PointCoord-0.5; float a=smoothstep(0.5,0.0,length(c));
        gl_FragColor=vec4(uColor, a*vB*0.32); }`
  });
  scene.add(new THREE.Points(g,mat));
})();

/* faint vertical "data-rain" columns far on the sides (deep blue) */
(()=>{
  const segs=[]; for(let i=0;i<26;i++){
    const x=(Math.random()<0.5?-1:1)*(6+Math.random()*9);
    const y=(Math.random()-0.5)*10, z=-9-Math.random()*7, len=1.2+Math.random()*3.2;
    segs.push(x,y+len/2,z, x,y-len/2,z);
  }
  const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(segs,3));
  const m=new THREE.LineBasicMaterial({ color:0x2f5da0, transparent:true, opacity:0.22, blending:THREE.AdditiveBlending, depthWrite:false });
  bg.add(new THREE.LineSegments(g,m));
})();

/* slow drifting deep-blue depth glow */
function glowTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
  const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(90,150,255,0.5)'); g.addColorStop(1,'rgba(90,150,255,0)');
  x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
const glow=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(), transparent:true, opacity:0.05, depthWrite:false, blending:THREE.AdditiveBlending }));
glow.scale.set(9,9,1); glow.position.set(-5,1,-12); bg.add(glow);
const glow2=glow.clone(); glow2.material=glow.material.clone(); glow2.material.opacity=0.035; glow2.scale.set(12,12,1); glow2.position.set(6,-1,-14); bg.add(glow2);

/* ======================================================================
   PORTRAITS — each real headshot rebuilt as a BLUE FACE-SCAN point cloud
   The photo's luminance drives a field of dots on pure black: the face
   only half-emerges from the dark (never a flat colour photo), an
   elliptical mask drops the photo's own background, and a scan line
   sweeps down each face. Blue signal, black void — like the reference.
   ====================================================================== */
const PWv=2.7;                                                   // face width in world units
const portraits=new THREE.Group(); scene.add(portraits);
const items=[];
let built=0;
function setLoad(p){ $('loadBar').style.width=p+'%'; $('loadPct').textContent=p+'%'; }
function doneLoad(){ if(built>=N) setTimeout(()=>$('load').classList.add('done'), 350); }

function buildFace(item, url){
  const img=new Image(); img.decoding='async';
  img.onload=()=>{
    const W=248, H=Math.round(W*img.naturalHeight/img.naturalWidth);   // denser sampling → finer, clearer face
    const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    const cx=cv.getContext('2d',{willReadFrequently:true}); cx.drawImage(img,0,0,W,H);
    let data=null; try{ data=cx.getImageData(0,0,W,H).data; }catch(e){}
    const PHv=PWv*H/W, pos=[], bri=[];
    if(data){
      for(let y=0;y<H;y++)for(let x=0;x<W;x++){
        // elliptical head mask → drops the photo's own background/corners
        const ex=(x/W-0.5)/0.47, ey=(y/H-0.44)/0.53, rr=ex*ex+ey*ey;
        if(rr>1) continue;
        const i=(y*W+x)*4, lum=(0.299*data[i]+0.587*data[i+1]+0.114*data[i+2])/255;
        if(lum<0.12) continue;                                   // face emerges from black (lower floor → more of the face shows)
        const vig=Math.pow(1-rr,0.42);                           // softer edge falloff → face reads fuller
        // REAL 3D VOLUME (gentler): rounded head dome + brightness micro-relief.
        // Flatter than before so the face stays SHARP from the front (less depth blur).
        const bulge=Math.sqrt(Math.max(0,1-rr))*0.72;            // head curves toward camera
        const relief=(lum-0.44)*0.5;                             // lit features push forward
        pos.push((x/W-0.5)*PWv, (0.5-y/H)*PHv, bulge+relief+(Math.random()-0.5)*0.03);
        bri.push(Math.min(1, (0.2 + lum*1.35)*vig));             // brighter overall, mid-tones lifted
      }
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
    g.setAttribute('aBright', new THREE.Float32BufferAttribute(bri,1));
    const uni={ uDim:{value:1}, uScanY:{value:PHv}, uPix:{value:Math.min(devicePixelRatio,1.75)},
                uLo:{value:new THREE.Color(0x1a4488)}, uHi:{value:new THREE.Color(0xdcecff)} };
    const mat=new THREE.ShaderMaterial({ uniforms:uni, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
      vertexShader:`attribute float aBright; varying float vB; uniform float uScanY,uDim,uPix;
        void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0);
          float scan=smoothstep(0.30,0.0,abs(position.y-uScanY));
          vB=aBright*(0.82+scan*0.5)*uDim;                       // higher resting brightness → face clearly visible between sweeps
          gl_PointSize=(aBright*0.35+0.42+scan*0.5)*uPix*(27.0/max(-mv.z,0.1));
          gl_Position=projectionMatrix*mv; }`,
      fragmentShader:`varying float vB; uniform vec3 uLo,uHi;
        void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard;
          float a=smoothstep(0.5,0.08,d); float b=clamp(vB,0.0,1.0);
          gl_FragColor=vec4(mix(uLo,uHi,b), a*b*1.0); }`
    });
    item.g.add(new THREE.Points(g,mat)); item.uni=uni; item.ph=PHv;
    built++; setLoad(Math.round(built/N*100)); doneLoad();
  };
  img.onerror=()=>{ built++; setLoad(Math.round(built/N*100)); doneLoad(); };
  img.src=url;
}

TEAM.forEach((m)=>{
  const g=new THREE.Group(); portraits.add(g);
  const item={ g, uni:null, ph:PWv*4/3 };
  items.push(item);
  buildFace(item, m.img);
});

/* ---------------- environmental particles (dust) ---------------- */
const DN=reduce?60:200, dg=new THREE.BufferGeometry(), dp=new Float32Array(DN*3), dv=new Float32Array(DN);
for(let i=0;i<DN;i++){ dp[i*3]=(Math.random()-0.5)*24; dp[i*3+1]=(Math.random()-0.5)*10; dp[i*3+2]=(Math.random()-0.5)*16-2; dv[i]=0.05+Math.random()*0.12; }
dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
const dust=new THREE.Points(dg, new THREE.PointsMaterial({ color:0x7fb0ff, size:0.018, transparent:true, opacity:0.22, depthWrite:false }));
scene.add(dust);

/* ======================================================================
   FLOWING LIGHT TENDRILS — glowing streams cascade from the active
   face's shoulders and wander downward (the reference's signature).
   ====================================================================== */
const tendrils=new THREE.Group(); tendrils.position.set(0,-1.5,0.6); scene.add(tendrils);
const T_SEG=reduce?14:26, T_N=reduce?14:30, tStreams=[];
for(let s=0;s<T_N;s++){
  const g=new THREE.BufferGeometry();
  const p=new Float32Array(T_SEG*3), col=new Float32Array(T_SEG*3);
  for(let j=0;j<T_SEG;j++){ const f=j/(T_SEG-1), b=(1-f)*0.9;    // brightest near the shoulders, fade down
    col[j*3]=b*0.45; col[j*3+1]=b*0.7; col[j*3+2]=b*1.0; }
  g.setAttribute('position', new THREE.BufferAttribute(p,3));
  g.setAttribute('color', new THREE.BufferAttribute(col,3));
  const m=new THREE.LineBasicMaterial({ vertexColors:true, transparent:true, opacity:0, blending:THREE.AdditiveBlending, depthWrite:false });
  tendrils.add(new THREE.Line(g,m));
  tStreams.push({ g, m, seed:Math.random()*99, side:(s/(T_N-1)-0.5)*2, sp:0.55+Math.random()*0.6, br:0.6+Math.random()*0.6 });
}
function updateTendrils(now){
  const settled=1-Math.min(Math.abs(progress-Math.round(progress))*3,1);   // fade out mid-transition
  const cx=(Math.round(progress)-progress)*SP;                             // follow the centred face
  tendrils.position.x = cx*0.0 + mx*0.25;
  for(const t of tStreams){
    const arr=t.g.attributes.position.array, x0=t.side*1.1;
    for(let j=0;j<T_SEG;j++){
      const f=j/(T_SEG-1);
      const wob=Math.sin(now*0.001*t.sp + t.seed + f*4.2)*(0.2+f*1.05)
              + Math.sin(now*0.0016 + t.seed*1.7 + f*8.0)*0.16*f;
      arr[j*3]   = x0 + wob + t.side*f*1.5;
      arr[j*3+1] = -f*3.3;
      arr[j*3+2] = Math.cos(now*0.0009 + t.seed + f*3.0)*0.5*f;
    }
    t.g.attributes.position.needsUpdate=true;
    t.m.opacity = settled*0.5*t.br;
  }
}

/* ======================================================================
   NAVIGATION STATE — drag / swipe / arrows / dots (spatial carousel)
   ====================================================================== */
let progress=0, target=0, vel=0;                                  // fractional index + snap target + momentum
let dragging=false, downX=0, lastX=0, downT=0, moved=false;
let mx=0, my=0, mxT=0, myT=0;                                     // mouse parallax
let tNow=0;                                                       // shared clock for idle motion
const SP=3.5;                                                     // spacing between portraits

function layout(){
  items.forEach((it,i)=>{
    const off=i-progress, a=Math.abs(off);
    it.g.position.x = off*SP + mx*0.25*(1-Math.min(a,1));
    it.g.position.z = -a*2.0 + (1-Math.min(a,1))*0.9;              // active travels toward camera, others recede deeper
    it.g.position.y = my*0.18*(1-Math.min(a,1));
    const s=1-Math.min(a,1.4)*0.26; it.g.scale.setScalar(s);
    const act=Math.max(0,1-a);                                    // 1 at centre → 0 off-screen
    // 3D head turns to the mouse + a slow idle drift (shows the volume)
    it.g.rotation.y = -off*0.16;   // stable — only the carousel offset, no mouse/idle sway
    it.g.rotation.x = 0;
    if(it.uni) it.uni.uDim.value = 1-Math.min(a*0.55,0.8);         // active bright, others fade into black
    it.g.visible = a<2.6;
  });
}

/* input */
canvas.addEventListener('pointerdown', e=>{ dragging=true; moved=false; downX=lastX=e.clientX; downT=performance.now(); vel=0; hideHint(); });
addEventListener('pointermove', e=>{
  /* faces stay STABLE — no mouse parallax (mxT/myT are left at 0); only drag navigates */
  if(dragging){ const dx=e.clientX-lastX; lastX=e.clientX; if(Math.abs(e.clientX-downX)>4) moved=true;
    progress = clamp(progress - dx/220, -0.4, N-0.6); vel = -dx/220; }
});
addEventListener('pointerup', ()=>{
  if(!dragging) return; dragging=false;
  target = clamp(Math.round(progress + vel*8), 0, N-1);          // momentum-assisted snap
  vel=0;
});
addEventListener('keydown', e=>{ if(e.key==='ArrowRight') go(target+1); else if(e.key==='ArrowLeft') go(target-1); });
$('next').addEventListener('click', ()=>go(target+1));
$('prev').addEventListener('click', ()=>go(target-1));
function go(i){ target=clamp(i,0,N-1); hideHint(); }

/* dots */
const dotsEl=$('dots');
TEAM.forEach((m,i)=>{ const b=document.createElement('button'); b.setAttribute('aria-label','Member '+m.no); b.addEventListener('click',()=>go(i)); dotsEl.appendChild(b); });
const dotEls=[...dotsEl.children];

/* ---------------- active member → info text ---------------- */
let activeShown=-1;
function setActive(i){
  if(i===activeShown) return; activeShown=i; const m=TEAM[i];
  const info=$('info'), bio=$('infoBio'); info.classList.add('out'); bio.classList.add('out');
  setTimeout(()=>{
    $('infoName').textContent=m.name; $('infoTitle').textContent=m.title; bio.textContent=m.bio;
    $('curNo').textContent=m.no; const idx=$('idx'); if(idx) idx.textContent='[[ '+m.no+' ]]';
    const bar=$('infoBar'); if(bar) bar.style.width=((i+1)/N*100)+'%';
    info.classList.remove('out'); bio.classList.remove('out');
  }, 260);
  $('totNo').textContent=String(N).padStart(2,'0');
  dotEls.forEach((d,di)=>d.classList.toggle('on', di===i));
}
setActive(0);

/* scroll wheel navigates between members (disabled when embedded so the host page scrolls) */
let lastWheel=0;
if(!EMBED) addEventListener('wheel', e=>{ const t=performance.now(); if(Math.abs(e.deltaY)<8) return; if(t-lastWheel<430) return; lastWheel=t; go(target+(e.deltaY>0?1:-1)); }, {passive:true});

let hintTimer; function hideHint(){ const h=$('swipehint'); if(h) h.classList.add('hide'); }
hintTimer=setTimeout(hideHint, 6000);

/* embedded: cinematic auto-play that ping-pongs through the faces (no input needed) */
if(EMBED){
  let dir=1;
  setInterval(()=>{
    let n=Math.round(target)+dir;
    if(n>=N){ n=N-2; dir=-1; } else if(n<0){ n=1; dir=1; }
    go(clamp(n,0,N-1));
  }, 3800);
}

/* ======================================================================
   LOOP
   ====================================================================== */
let last=performance.now();
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now; tNow=now;
  // snap progress toward target when not dragging (spring w/ damping)
  if(!dragging){ progress += (target-progress)*Math.min(1,dt*6); }
  // smooth mouse parallax
  mx += (mxT-mx)*Math.min(1,dt*4); my += (myT-my)*Math.min(1,dt*4);
  layout();
  // camera parallax (look into the space)
  camera.position.x += (mx*0.6 - camera.position.x)*Math.min(1,dt*3);
  camera.position.y += (-my*0.4 - camera.position.y)*Math.min(1,dt*3);
  camera.lookAt(mx*0.3, my*0.15, 0);
  bg.position.x = -mx*1.1; bg.position.y = my*0.6;                // background parallax (moves more)
  // watermark parallax (right-anchored)
  $('watermark').style.transform = `translate(${(-mx*26).toFixed(0)}px, ${(-my*14).toFixed(0)}px)`;
  // active member
  setActive(clamp(Math.round(progress),0,N-1));
  // scanning field sweep (slow cinematic) + drifting light
  scanU.uTime.value = now*0.001;
  scanU.uScan.value = -18 + ((now*0.0009) % 24);
  glow.position.x = -4 + Math.sin(now*0.00013)*3.2; glow.position.y = 1 + Math.cos(now*0.0001)*1.4;
  glow2.position.x = 6 + Math.cos(now*0.00009)*3.2; glow2.position.y = -1 + Math.sin(now*0.00011)*1.2;
  // scan line sweeps down each face
  for(const it of items){ if(it.uni){ const rng=it.ph; it.uni.uScanY.value = rng*0.55 - ((now*0.0016)%(rng*1.2)); } }
  // dust drift
  const pa=dust.geometry.attributes.position;
  for(let i=0;i<DN;i++){ let y=pa.getY(i)+dv[i]*dt*0.15; if(y>5) y=-5; pa.setY(i,y); pa.setX(i, pa.getX(i)+Math.sin(now*0.0002+i)*0.0008); }
  pa.needsUpdate=true;
  renderer.render(scene,camera); requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); const pr=Math.min(devicePixelRatio,1.75); renderer.setPixelRatio(pr); renderer.setSize(innerWidth,innerHeight); scanU.uPix.value=pr; });

/* debug hook */
window.__team = { get p(){return progress;}, go, count:N };
