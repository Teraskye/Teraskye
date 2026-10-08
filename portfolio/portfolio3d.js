/* ============================================================
   TERASKYE — PORTFOLIO · immersive 3D walkthrough
   WHITE PENCIL-SKETCH theme · SCROLL-ON-RAILS navigation.
   Scroll to travel a WINDING route (turns left & right); asset
   DOORS sit along the walls with their details engraved on them;
   click a door → it opens and a clear sketch detail view appears;
   scroll back → the door closes and you continue. Original
   environment (reference = interaction only). Vanilla Three.js
   via CDN import-map, no build. Data illustrative — no fake $.
   ============================================================ */
import * as THREE from 'three';
const gsap = window.gsap;
const $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp = (v,a,b)=> v<a?a:v>b?b:v;

/* ---------------- portfolio data (modular) ---------------- */
const AP=['Acquire','Operate','Optimize','Scale'];
const atlStory=(n)=>[['01','The opportunity',`A Class-B Atlanta asset with real operating upside.`],['02','The acquisition','Acquired to a disciplined basis, illustrative of the target criteria.'],['03','The transformation','Renovation and repositioning against one operating standard.'],['04','The operation','Leasing, pricing and maintenance run on Teraskye Intelligence.'],['05','The current position','Operating — part of the Atlanta cluster.'],['06','The next opportunity','Stabilize, then evaluate refinance, sale or growth.']];
const pipeStory=(m)=>[['01','The opportunity',`Entry into ${m}.`],['02','The acquisition','In pipeline — illustrative of target criteria.'],['03','The transformation','Repositioning plan defined pre-close.'],['04','The operation','Onto the same intelligent standard at close.'],['05','The current position','Pipeline — under evaluation.'],['06','The next opportunity',`Anchor the ${m} market.`]];
const PORTFOLIO = {
  assets: [
    { id:'atl-1812', market:'Atlanta', name:'Altitude 1812', location:'Atlanta, Georgia', type:'Multifamily', config:'2 Bed / 2 Bath', status:'Operating', year:'2026', side:1,  at:0.09, approach:AP, story:atlStory('1812') },
    { id:'atl-1906', market:'Atlanta', name:'Altitude 1906', location:'Atlanta, Georgia', type:'Multifamily', config:'1 & 2 Bed',    status:'Operating', year:'2026', side:-1, at:0.21, approach:AP, story:atlStory('1906') },
    { id:'atl-1503', market:'Atlanta', name:'Altitude 1503', location:'Atlanta, Georgia', type:'Multifamily', config:'1 & 2 Bed',    status:'Operating', year:'2026', side:1,  at:0.33, approach:AP, story:atlStory('1503') },
    { id:'atl-1203', market:'Atlanta', name:'Altitude 1203', location:'Atlanta, Georgia', type:'Multifamily', config:'Studio – 2 Bed', status:'Operating', year:'2026', side:-1, at:0.45, approach:AP, story:atlStory('1203') },
    { id:'msp-loring', market:'Minneapolis', name:'Loring Nico', location:'Minneapolis, Minnesota', type:'Multifamily', config:'Studio – 2 Bed', status:'Pipeline', year:'—', side:1, at:0.57, approach:AP, story:pipeStory('Minneapolis') },
    { id:'market-03', market:'Market 03', name:'In Pipeline', location:'Target market', type:'Commercial real estate', config:'—', status:'Future market', year:'—', side:-1, at:0.69, approach:AP, story:pipeStory('a third market') },
    { id:'market-04', market:'Market 04', name:'In Pipeline', location:'Target market', type:'Commercial real estate', config:'—', status:'Future market', year:'—', side:1, at:0.80, approach:AP, story:pipeStory('a fourth market') },
  ]
};

/* ---------------- fallback ---------------- */
function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }
function showFallback(){
  $('load').classList.add('done'); $('enter').hidden=true; $('scene').style.display='none';
  $('fbGrid').innerHTML = PORTFOLIO.assets.map(a=>`<div class="fb__card"><div class="m">${a.market}</div><div class="n">${a.name}</div>
    <div class="g"><div><span class="l">Type</span><span class="v">${a.type}</span></div><div><span class="l">Config</span><span class="v">${a.config}</span></div>
    <div><span class="l">Status</span><span class="v">${a.status}</span></div><div><span class="l">Year</span><span class="v">${a.year}</span></div></div></div>`).join('');
  $('fallback').hidden=false;
}
if(!hasWebGL() || reduce){ showFallback(); throw new Error('fallback'); }

/* ======================================================================
   RENDERER (flat sketch)
   ====================================================================== */
const canvas=$('scene');
const renderer=new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.NoToneMapping;

const PAPER=0xF3F0E8, PAPER2=0xEBE7DB, PAPER3=0xE3DFD0, INK=0x2B2B2B, INK2=0x565247, BRIGHT=0xFCFBF6;
const scene=new THREE.Scene(); scene.background=new THREE.Color(PAPER);
scene.fog=new THREE.Fog(BRIGHT, 12, 40);
const camera=new THREE.PerspectiveCamera(62, innerWidth/innerHeight, 0.1, 200);
camera.rotation.order='YXZ';

const M=c=>new THREE.MeshBasicMaterial({ color:c, side:THREE.DoubleSide });
const inkMat=new THREE.LineBasicMaterial({ color:INK });
const inkSoft=new THREE.LineBasicMaterial({ color:INK2, transparent:true, opacity:0.5 });
const world=new THREE.Group(); scene.add(world);

/* ======================================================================
   THE ROUTE — a winding path (forward → left → right)
   ====================================================================== */
const HW=3, H=3.5, EYE=1.62;
const WP=[[0,6],[0,-13],[16,-13],[16,-34],[0,-34],[0,-55],[16,-55]].map(([x,z])=>new THREE.Vector3(x,EYE,z));
const path=new THREE.CatmullRomCurve3(WP,false,'catmullrom',0.5);

function ptXZ(t){ const p=path.getPointAt(clamp(t,0,1)); return new THREE.Vector3(p.x,0,p.z); }
function tangent(t){ const g=path.getTangentAt(clamp(t,0,1)); g.y=0; return g.normalize(); }
function normal(t){ const g=tangent(t); return new THREE.Vector3(g.z,0,-g.x); }   // left-hand perpendicular

/* ---------------- procedural corridor along the path ---------------- */
const S=200; const L={top:[],bot:[]}, R={top:[],bot:[]};
const fPos=[], cPos=[], lwPos=[], rwPos=[];
function quad(arr,a,b,c,d){ arr.push(a.x,a.y,a.z, b.x,b.y,b.z, c.x,c.y,c.z, a.x,a.y,a.z, c.x,c.y,c.z, d.x,d.y,d.z); }
let prevL0,prevL1,prevR0,prevR1;
for(let i=0;i<=S;i++){
  const t=i/S, p=path.getPointAt(t), n=normal(t);
  const l0=new THREE.Vector3(p.x+n.x*HW,0,p.z+n.z*HW), l1=l0.clone().setY(H);
  const r0=new THREE.Vector3(p.x-n.x*HW,0,p.z-n.z*HW), r1=r0.clone().setY(H);
  L.top.push(l1.clone()); L.bot.push(l0.clone()); R.top.push(r1.clone()); R.bot.push(r0.clone());
  if(i>0){
    quad(fPos, prevL0, prevR0, r0, l0);                 // floor
    quad(cPos, prevL1, l1, r1, prevR1);                 // ceiling
    quad(lwPos, prevL0, prevL1, l1, l0);                // left wall
    quad(rwPos, prevR0, r0, r1, prevR1);                // right wall
  }
  prevL0=l0; prevL1=l1; prevR0=r0; prevR1=r1;
}
function meshFrom(arr,mat){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3)); const m=new THREE.Mesh(g,mat); world.add(m); return m; }
meshFrom(fPos, M(PAPER2)); meshFrom(cPos, M(0xF6F3EB)); meshFrom(lwPos, M(PAPER)); meshFrom(rwPos, M(PAPER));
function polyline(pts,mat){ world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),mat)); }
polyline(L.top,inkMat); polyline(L.bot,inkSoft); polyline(R.top,inkMat); polyline(R.bot,inkSoft);
// vertical rungs + floor seams every few samples (sketch detail)
for(let i=0;i<=S;i+=7){ polyline([L.bot[i],L.top[i]],inkSoft); polyline([R.bot[i],R.top[i]],inkSoft); polyline([L.bot[i],R.bot[i]],inkSoft); }
// framed "pictures" sprinkled on walls (skip where doors are)
const doorTs=PORTFOLIO.assets.map(a=>a.at);
for(let i=12;i<S-6;i+=16){ const t=i/S; if(doorTs.some(dt=>Math.abs(dt-t)<0.06)) continue;
  const side=(i%32===12)?1:-1; const p=path.getPointAt(t), n=normal(t).multiplyScalar(side);
  const c=new THREE.Vector3(p.x+n.x*(HW-0.02),2.0,p.z+n.z*(HW-0.02));
  const fr=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.7), M(PAPER)); fr.position.copy(c); fr.lookAt(p.x,2.0,p.z); world.add(fr);
  fr.add(new THREE.LineSegments(new THREE.EdgesGeometry(fr.geometry,1),inkSoft));
}

/* ======================================================================
   ASSET DOORS along the route (details engraved on the plaque)
   ====================================================================== */
function plaqueTex(a){
  const c=document.createElement('canvas'); c.width=560; c.height=760; const x=c.getContext('2d');
  x.fillStyle='#F3F0E8'; x.fillRect(0,0,560,760);
  x.strokeStyle='#2B2B2B'; x.lineWidth=5; x.strokeRect(16,16,528,728);
  x.strokeStyle='#7C927D'; x.lineWidth=2; x.strokeRect(30,30,500,700);
  x.fillStyle='#565247'; x.font='600 32px Manrope, sans-serif'; x.fillText(a.market.toUpperCase(),52,110);
  x.fillStyle='#2B2B2B'; x.font='700 74px Caveat, cursive'; a.name.split(' ').forEach((w,i)=>x.fillText(w,52,210+i*74));
  x.fillStyle='#565247'; x.font='400 30px Manrope, sans-serif'; x.fillText(a.config.toUpperCase(),52,430);
  x.fillText(a.type.toUpperCase(),52,478);
  x.fillStyle='#526B5A'; x.font='700 34px Caveat, cursive'; x.fillText(a.status,52,560);
  x.strokeStyle='#2B2B2B'; x.lineWidth=2; x.beginPath(); x.moveTo(52,600); x.lineTo(330,600); x.stroke();
  x.fillStyle='#2B2B2B'; x.font='700 46px Caveat, cursive'; x.fillText('Open asset  →',52,690);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=4; return t;
}
const DOORS=[];
PORTFOLIO.assets.forEach(a=>{
  const p=path.getPointAt(a.at), n=normal(a.at).multiplyScalar(a.side);
  const g=new THREE.Group(); g.position.set(p.x+n.x*(HW-0.03),0,p.z+n.z*(HW-0.03));
  g.lookAt(p.x,0,p.z);                                    // face the path
  const doorW=1.3, doorHt=2.6;
  // bright doorway opening behind the door
  const open=new THREE.Mesh(new THREE.PlaneGeometry(doorW+0.1,doorHt+0.05), M(BRIGHT)); open.position.set(0,doorHt/2,-0.02); g.add(open);
  // door frame outline
  const frame=new THREE.Mesh(new THREE.PlaneGeometry(doorW+0.28,doorHt+0.2), M(PAPER3)); frame.position.set(0,doorHt/2+0.05,-0.05); g.add(frame);
  frame.add(new THREE.LineSegments(new THREE.EdgesGeometry(frame.geometry,1),inkMat));
  // the door leaf (hinged on left edge)
  const hinge=new THREE.Group(); hinge.position.set(-doorW/2,0,0.02); g.add(hinge);
  const leaf=new THREE.Mesh(new THREE.BoxGeometry(doorW,doorHt,0.05), M(PAPER3)); leaf.position.set(doorW/2,doorHt/2,0); hinge.add(leaf);
  leaf.add(new THREE.LineSegments(new THREE.EdgesGeometry(leaf.geometry,1),inkMat));
  // inset panels + handle
  [[-0.55],[0.55]].forEach(([dy])=>{ const pn=new THREE.Mesh(new THREE.BoxGeometry(doorW*0.66,0.85,0.06), M(PAPER2)); pn.position.set(doorW/2,doorHt/2+dy,0); hinge.add(pn); pn.add(new THREE.LineSegments(new THREE.EdgesGeometry(pn.geometry,1),inkSoft)); });
  const handle=new THREE.Mesh(new THREE.CylinderGeometry(0.02,0.02,0.16,8),M(INK)); handle.rotation.x=Math.PI/2; handle.position.set(doorW*0.92,doorHt/2,0.04); hinge.add(handle);
  // engraved plaque beside the door
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(0.66,0.9), new THREE.MeshBasicMaterial({ map:plaqueTex(a) })); plaque.position.set(doorW/2+0.7,1.5,0.02); g.add(plaque);
  plaque.add(new THREE.LineSegments(new THREE.EdgesGeometry(plaque.geometry,1),inkMat));
  world.add(g);
  DOORS.push({ a, group:g, hinge, leaf, plaque, at:a.at, open:false });
});

/* pencil dust */
const N=140, pg=new THREE.BufferGeometry(), pp=new Float32Array(N*3), pv=new Float32Array(N);
for(let i=0;i<N;i++){ const t=Math.random(), p=path.getPointAt(t), n=normal(t).multiplyScalar((Math.random()-0.5)*2*HW); pp[i*3]=p.x+n.x; pp[i*3+1]=Math.random()*H; pp[i*3+2]=p.z+n.z; pv[i]=0.08+Math.random()*0.2; }
pg.setAttribute('position',new THREE.BufferAttribute(pp,3));
world.add(new THREE.Points(pg,new THREE.PointsMaterial({ color:INK2, size:0.02, transparent:true, opacity:0.25, depthWrite:false })));

/* ======================================================================
   SCROLL-ON-RAILS NAVIGATION
   ====================================================================== */
let t=0, tTarget=0, started=false, detail=null, savedScroll=0;
let mx=0, my=0;                                            // subtle mouse parallax
function maxScroll(){ return document.body.scrollHeight - innerHeight; }
function readScroll(){ if(detail) return; const m=maxScroll(); tTarget = m>0 ? clamp(scrollY/m,0,1) : 0; }
addEventListener('scroll', readScroll, {passive:true});
addEventListener('pointermove', e=>{ mx=(e.clientX/innerWidth-0.5); my=(e.clientY/innerHeight-0.5); });

/* place the camera on the rail */
const lookTmp=new THREE.Vector3();
function placeCamera(tt){
  const p=path.getPointAt(clamp(tt,0,1)); camera.position.set(p.x,EYE,p.z);
  lookTmp.copy(path.getPointAt(clamp(tt+0.02,0,1))); lookTmp.y=EYE; camera.lookAt(lookTmp);
  camera.rotateY(-mx*0.14); camera.rotateX(-my*0.08);     // gentle parallax
}

/* ---------------- door proximity + click ---------------- */
const ray=new THREE.Raycaster(), centre=new THREE.Vector2(0,0);
let active=null;
function updateActive(){
  if(detail){ setActive(null); return; }
  let best=null, bd=0.06;
  DOORS.forEach(d=>{ const dd=Math.abs(t-d.at); if(dd<bd){ bd=dd; best=d; } });
  setActive(best);
}
function setActive(d){
  if(d===active) return; active=d;
  const pr=$('prompt');
  if(d){ $('promptName').textContent=d.a.name; $('promptMeta').textContent=`${d.a.market} · ${d.a.config} · ${d.a.status}`; pr.classList.add('show'); }
  else pr.classList.remove('show');
}
canvas.addEventListener('click', ()=>{ if(active && !detail) openDetail(active); });

/* ---------------- open / close detail ---------------- */
function openDetail(d){
  detail=d; setActive(null); d.open=true;
  savedScroll=scrollY; document.documentElement.style.overflow='hidden'; document.body.style.overflow='hidden';
  if(gsap){ gsap.to(d.hinge.rotation,{ y:-Math.PI*0.7, duration:1.0, ease:'power3.inOut' }); } else d.hinge.rotation.y=-Math.PI*0.7;
  const a=d.a;
  $('assetInner').innerHTML = `
    <div class="a__market">${a.market}</div><h2 class="a__name">${a.name}</h2><div class="a__loc">${a.location}</div>
    <div class="a__status"><span class="dot"></span>${a.status}${a.year!=='—'?' · Acquired '+a.year:''}</div>
    <div class="a__grid">
      <div class="a__k"><span class="l">Property type</span><span class="v">${a.type}</span></div>
      <div class="a__k"><span class="l">Configuration</span><span class="v">${a.config}</span></div>
      <div class="a__k"><span class="l">Status</span><span class="v">${a.status}</span></div>
      <div class="a__k"><span class="l">Market</span><span class="v">${a.market}</span></div></div>
    <div class="a__sec"><h4>Teraskye approach</h4><div class="a__approach">${a.approach.map(s=>`<span>${s}</span>`).join('')}</div></div>
    <div class="a__sec"><h4>The story</h4><div class="a__story">${a.story.map(([n,tt,dd])=>`<div class="a__step"><span class="no">${n}</span><span class="t"><b>${tt}</b><span class="d">${dd}</span></span></div>`).join('')}</div></div>
    <p class="a__note">Illustrative of the target acquisition criteria — not an owned position or a statement of results.</p>`;
  $('asset').hidden=false; setTimeout(()=>$('asset').classList.add('show'),16);
  $('closehint').classList.add('show');
}
function closeDetail(){
  if(!detail) return; const d=detail; detail=null;
  $('asset').classList.remove('show'); $('closehint').classList.remove('show'); setTimeout(()=>$('asset').hidden=true,600);
  if(gsap){ gsap.to(d.hinge.rotation,{ y:0, duration:1.0, ease:'power3.inOut', onComplete:()=>{ d.open=false; } }); } else { d.hinge.rotation.y=0; d.open=false; }
  document.documentElement.style.overflow=''; document.body.style.overflow=''; scrollTo(0,savedScroll);
}
$('assetReturn').addEventListener('click', closeDetail);
addEventListener('keydown', e=>{ if(e.key==='Escape' && detail) closeDetail(); });
// scroll BACK to come out (wheel up while a detail is open)
addEventListener('wheel', e=>{ if(detail && e.deltaY<0) closeDetail(); }, {passive:true});
let tStart=0; addEventListener('touchstart', e=>{ tStart=e.touches[0].clientY; }, {passive:true});
addEventListener('touchmove', e=>{ if(detail && e.touches[0].clientY - tStart > 40) closeDetail(); }, {passive:true});

/* ======================================================================
   LOOP
   ====================================================================== */
let last=performance.now();
function loop(now){
  const dt=Math.min(0.05,(now-last)/1000); last=now;
  t += (tTarget-t)*Math.min(1,dt*5.5);
  placeCamera(t);
  updateActive();
  DOORS.forEach(d=>{ const glow=(active===d)?1:0; d.leaf.material.color.lerp(new THREE.Color(active===d?0xFBF6E4:PAPER3), Math.min(1,dt*6)); });
  // end card near the end of the route
  const ec=$('endcard'); if(ec){ const show = t>0.9 && !detail; ec.classList.toggle('show', show); }
  const pa=world.children.find(o=>o.isPoints)?.geometry.attributes.position;
  if(pa){ for(let i=0;i<N;i++){ let y=pa.getY(i)+pv[i]*dt*0.12; if(y>H)y=0; pa.setY(i,y);} pa.needsUpdate=true; }
  renderer.render(scene,camera); requestAnimationFrame(loop);
}

/* ======================================================================
   ENTRY + BOOT
   ====================================================================== */
function startEntry(){
  $('enter').classList.add('hide'); started=true;
  $('controls').hidden=false;
  setTimeout(()=>$('controls').classList.add('fade'), 9000);
  readScroll();
}
$('enterBtn').addEventListener('click', startEntry);
addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); });

window.__p3d = { get t(){return t;}, get detail(){return !!detail;}, open(i){ openDetail(DOORS[i||0]); }, close(){ closeDetail(); }, setT(v){ tTarget=clamp(v,0,1); } };

let pr=0; const bar=$('loadBar'), pct=$('loadPct');
const li=setInterval(()=>{ pr=Math.min(100,pr+9+Math.random()*10); bar.style.width=pr+'%'; if(pr>=100){ clearInterval(li); pct.textContent='Ready';
  setTimeout(()=>{ $('load').classList.add('done'); $('enter').hidden=false; },300); placeCamera(0); requestAnimationFrame(loop);
} }, 110);
