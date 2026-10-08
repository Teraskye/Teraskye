/* ============================================================
   TERAMERGE — PORTFOLIO · "The Stone Archive"
   ONE continuous torch-lit cave, walked in real-time 3D.
   Scroll = step forward along the same cave. Near a stone door
   a CTA appears; click it and the door grinds open and you
   continue forward through the SAME tunnel into a chamber where
   the record is CARVED INTO STONE (tablets) beside the asset
   model on its plinth. No scene cuts. No video. No cards.
   ============================================================ */
import * as THREE from 'three';
const gsap = window.gsap;

/* ---- colour table (defined once; referenced by name everywhere) ---- */
const C = {
  bg: 0x070402, amb: 0x4a2e14, hemiTop: 0x23180c, hemiBot: 0x0a0603,
  tube: 0xb09274, floor: 0xa78c6a, door: 0xb09170, bracket: 0x120a04,
  flame: 0xffa64d, doorWash: 0xffb060, seam: 0xf6d67e,
  spotGold: 0xffd27a, spotWarm: 0xffbf84, beamGold: 0xffe0a0, beamWarm: 0xffd0a0,
  tabLight: 0xffce8a, plinth: 0x5a4636, treaLight: 0xffd27a, lantern: 0xffd2a4,
  day: 0xfff0d0, plinthDark: 0x14100a
};

/* ---------------- data (carved into the stone) ---------------- */
const CH = [
  { no:'I',  name:'The Foundation', tag:'Proven track record', model:'assets/asset-foundation.png?v=1',
    strat:'Where the operating record was built.',
    lines:['Status — Assets Under Management','Holdings — Multi-Unit · Single-Family · Land · Commercial','Execution — bought below value, run on the platform'],
    metrics:[['10','Markets'],['72','Acres'],['350+','Doors'],['$28M+','AUM']] },
  { no:'II', name:'Multifamily', tag:'Live in market', model:'assets/asset-multifamily-blend.png?v=1',
    strat:'The core strategy, in market.',
    lines:['Markets — North Carolina · Alabama','Entry — acquired below value, equity day one','Execution — underwritten, closed & operated'],
    metrics:[['110+','Doors'],['2','Markets'],['$11M+','Value'],['Day 1','Equity']] },
  { no:'III', name:'Under Contract', tag:'Scaling now · Coming soon', soon:true, model:'assets/asset-undercontract-blend.png?v=2',
    strat:'The platform, scaling.',
    lines:['Markets — Atlanta · Austin · Florida','Playbook — the same strategy, aggregated','Asset — multifamily at scale'],
    metrics:[['800+','Doors'],['3','Markets'],['$70M+','Pipeline'],['Soon','Coming']] },
  { no:'IV', name:'The Treasury', tag:'The platform, in full', gold:true, model:null,
    strat:'Total portfolio & pipeline — across 12 markets.',
    lines:['Assets Under Management — $39M+ · 460+ doors','Coming Soon — $75M+ · 800+ doors','Footprint — 12 markets nationwide'],
    metrics:[['$100M+','Portfolio'],['1,500+','Doors'],['12','Markets']] },
];

/* ---------------- journey geometry (forward = -Z) ---------------- */
const doorZ   = [-40, -86, -132, -178];
const plinthZ = [-59, -105, -151, -197];
const STOPS = [0,-22,-34,-50,-66,-80,-96,-112,-126,-142,-158,-172,-188];
const NEAR = { 2:0, 5:1, 8:2, 11:3 };            // stop -> chamber (CTA appears)
const CHAM = { 3:0, 6:1, 9:2, 12:3 };            // stop -> chamber (reached by opening door)
const CH_OF = {1:0,2:0,3:0, 4:1,5:1,6:1, 7:2,8:2,9:2, 10:3,11:3,12:3};
const CHAM_INDEX = [3,6,9,12];
const Z0 = 14, Z1 = -214, LEN = Z0 - Z1;
const EYE = -1.35;

/* ---------------- DOM ---------------- */
const $ = s => document.querySelector(s);
const canvas = $('#scene'), loadEl = $('#load'), loadBar = $('#loadBar');
const nav = $('#nav'), rail = $('#rail'), rtn = $('#rtn'), hud = $('#hud'), hudName = $('#hudName'), hudNo = $('#hudNo');
const cue = $('#cue'), cueText = $('#cueText'), cta = $('#cta'), ctaText = $('#ctaText'), begin = $('#begin');
const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------------- renderer / scene / camera ---------------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, powerPreference:'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.34;

const scene = new THREE.Scene();
scene.background = new THREE.Color(C.bg);
scene.fog = new THREE.FogExp2(C.bg, 0.021);

const camera = new THREE.PerspectiveCamera(64, innerWidth/innerHeight, 0.1, 320);
camera.position.set(0, EYE, 0);

scene.add(new THREE.AmbientLight(C.amb, 0.85));
scene.add(new THREE.HemisphereLight(C.hemiTop, C.hemiBot, 0.5));
const lantern = new THREE.PointLight(C.lantern, 6, 18, 1.5); scene.add(lantern);

/* ---------------- textures ---------------- */
const manager = new THREE.LoadingManager();
manager.onProgress = (u,n,t) => { if(loadBar) loadBar.style.width = Math.round(n/t*100)+'%'; };
const texLoader = new THREE.TextureLoader(manager);
const loadTex = (url, rx, ry) => { const t = texLoader.load(url); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; return t; };
const T = {
  rock:  loadTex('assets/stone/rock-warm.jpg', 6, LEN/7),
  rockW: loadTex('assets/stone/rock-warm.jpg', 1.4, 2.4),
  floor: loadTex('assets/stone/stone-blocks.jpg', 4, LEN/9),
};
const dioTex = CH.map(c => c.model ? texLoader.load(c.model) : null);
const stoneImg = new Image(); stoneImg.src = 'assets/stone/rock-warm.jpg';

/* ---------------- small canvas textures ---------------- */
function flameTexture(){
  const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d');
  const g = x.createRadialGradient(64,80,2,64,66,60);
  g.addColorStop(0,'rgba(255,248,214,1)'); g.addColorStop(0.24,'rgba(255,196,96,0.95)');
  g.addColorStop(0.55,'rgba(226,120,40,0.55)'); g.addColorStop(1,'rgba(120,40,8,0)');
  x.fillStyle = g; x.beginPath(); x.ellipse(64,66,30,46,0,0,7); x.fill();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
const FLAME = flameTexture();
function radialAlpha(){
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  const g = x.createRadialGradient(128,118,18,128,128,135);
  g.addColorStop(0,'#ffffff'); g.addColorStop(0.6,'#ffffff'); g.addColorStop(1,'#000000');
  x.fillStyle = g; x.fillRect(0,0,256,256);
  return new THREE.CanvasTexture(c);
}
const DIO_ALPHA = radialAlpha();

/* ---------------- carved stone tablets ---------------- */
const GOLD = '#f6d67e', BONE = '#e4d3ab';
function engrave(x, txt, cx, cy, font, color){
  x.save(); x.font = font; x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillStyle = 'rgba(0,0,0,0.85)'; x.fillText(txt, cx+2, cy+3);
  x.fillStyle = 'rgba(255,244,214,0.12)'; x.fillText(txt, cx-1.2, cy-1.5);
  x.fillStyle = color; x.fillText(txt, cx, cy); x.restore();
}
function stoneBase(x, w, h, gold){
  if(stoneImg.complete && stoneImg.naturalWidth){
    const ar = stoneImg.naturalWidth/stoneImg.naturalHeight, tr = w/h; let dw, dh;
    if(ar>tr){ dh = h; dw = h*ar; } else { dw = w; dh = w/ar; }
    x.drawImage(stoneImg, (w-dw)/2, (h-dh)/2, dw, dh);
  } else { x.fillStyle = '#2a1d10'; x.fillRect(0,0,w,h); }
  const o = x.createLinearGradient(0,0,0,h);
  o.addColorStop(0,'rgba(8,5,2,0.56)'); o.addColorStop(0.5,'rgba(8,5,2,0.76)'); o.addColorStop(1,'rgba(8,5,2,0.9)');
  x.fillStyle = o; x.fillRect(0,0,w,h);
  x.strokeStyle = 'rgba(0,0,0,0.7)'; x.lineWidth = 10; x.strokeRect(22,22,w-44,h-44);
  x.strokeStyle = gold ? 'rgba(246,214,126,0.55)' : 'rgba(226,168,92,0.34)'; x.lineWidth = 2; x.strokeRect(30,30,w-60,h-60);
}
function tabletTexture(draw, w, h){
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function leftTabletTex(c){
  return tabletTexture((x,w,h)=>{
    stoneBase(x,w,h,c.gold);
    engrave(x, 'CHAMBER '+c.no, w/2, 92, "600 34px 'Cinzel'", c.gold ? GOLD : '#e2a85c');
    const nm = c.name.toUpperCase(), words = nm.split(' ');
    if(nm.length > 11 && words.length > 1){ const half = Math.ceil(words.length/2);
      engrave(x, words.slice(0,half).join(' '), w/2, 190, "700 88px 'Cinzel'", c.gold ? GOLD : BONE);
      engrave(x, words.slice(half).join(' '), w/2, 288, "700 88px 'Cinzel'", c.gold ? GOLD : BONE);
    } else engrave(x, nm, w/2, 212, "700 100px 'Cinzel'", c.gold ? GOLD : BONE);
    engrave(x, c.tag, w/2, 372, "italic 46px 'Cormorant Garamond'", c.soon ? GOLD : '#b9c9ad');
    x.strokeStyle = 'rgba(226,168,92,0.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(w*0.2,432); x.lineTo(w*0.8,432); x.stroke();
    engrave(x, c.strat, w/2, 502, "italic 52px 'Cormorant Garamond'", '#efe6d4');
    x.textAlign = 'left'; x.textBaseline = 'middle';
    c.lines.forEach((ln,i)=>{ const y = 608 + i*94; x.font = "400 38px 'Cormorant Garamond'";
      x.fillStyle = 'rgba(0,0,0,0.8)'; x.fillText(ln, 92, y+2);
      x.fillStyle = '#d8cba6'; x.fillText(ln, 90, y); });
  }, 760, 1060);
}
function metricTabletTex(c){
  const n = c.metrics.length;
  return tabletTexture((x,w,h)=>{
    stoneBase(x,w,h,c.gold);
    const cw = (w-80)/n;
    c.metrics.forEach((m,i)=>{ const cx = 40 + cw*(i+0.5);
      if(i>0){ x.strokeStyle = 'rgba(226,168,92,0.35)'; x.lineWidth = 2; x.beginPath(); x.moveTo(40+cw*i, h*0.24); x.lineTo(40+cw*i, h*0.76); x.stroke(); }
      engrave(x, m[0], cx, h*0.42, "700 84px 'Cinzel'", GOLD);
      engrave(x, m[1].toUpperCase(), cx, h*0.72, "500 28px 'Cinzel'", '#c9b88f'); });
  }, 300*n, 300);
}
function lintelTex(c){
  return tabletTexture((x,w,h)=>{
    stoneBase(x,w,h,c.gold);
    engrave(x, c.no, w*0.11, h/2, "700 120px 'Cinzel'", c.gold ? GOLD : '#e2a85c');
    x.strokeStyle = 'rgba(226,168,92,0.4)'; x.lineWidth = 2; x.beginPath(); x.moveTo(w*0.2, h*0.22); x.lineTo(w*0.2, h*0.78); x.stroke();
    x.textAlign = 'left'; x.textBaseline = 'middle';
    x.font = "700 92px 'Cinzel'"; x.fillStyle = 'rgba(0,0,0,0.85)'; x.fillText(c.name.toUpperCase(), w*0.25+2, h*0.46+3);
    x.fillStyle = c.gold ? GOLD : BONE; x.fillText(c.name.toUpperCase(), w*0.25, h*0.46);
    x.font = "italic 46px 'Cormorant Garamond'"; x.fillStyle = c.soon ? GOLD : '#b9c9ad'; x.fillText(c.tag, w*0.25, h*0.72);
  }, 1400, 320);
}

/* ---------------- the cave tube + floor ---------------- */
function noise(a,y){ return 0.5*Math.sin(a*3+y*0.3) + 0.3*Math.sin(a*7-y*0.55) + 0.28*Math.sin(y*0.9+a*2) + 0.2*Math.sin(a*11+y*0.2); }
function buildTube(){
  const R = 6.6;
  const geo = new THREE.CylinderGeometry(R, R, LEN, 30, 160, true);
  const pos = geo.attributes.position;
  for(let i=0;i<pos.count;i++){
    const vx = pos.getX(i), vy = pos.getY(i), vz = pos.getZ(i);
    const a = Math.atan2(vz, vx), r = Math.sqrt(vx*vx+vz*vz);
    const nr = r + noise(a, vy)*0.8;
    pos.setX(i, Math.cos(a)*nr); pos.setZ(i, Math.sin(a)*nr);
  }
  geo.computeVertexNormals();
  const tube = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map:T.rock, bumpMap:T.rock, bumpScale:0.14, side:THREE.BackSide, roughness:1, metalness:0, color:C.tube }));
  tube.rotation.x = Math.PI/2; tube.position.z = (Z0+Z1)/2; scene.add(tube);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, LEN, 1, 60),
    new THREE.MeshStandardMaterial({ map:T.floor, bumpMap:T.floor, bumpScale:0.08, roughness:0.85, metalness:0.05, color:C.floor }));
  floor.rotation.x = -Math.PI/2; floor.position.set(0, -4.5, (Z0+Z1)/2); scene.add(floor);
}

/* ---------------- torches ---------------- */
const torches = [];
function addTorch(z, side, withLight){
  const g = new THREE.Group(); g.position.set(side*4.2, 0.4, z);
  const br = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6), new THREE.MeshStandardMaterial({ color:C.bracket, roughness:0.9 }));
  br.rotation.z = side*0.5; br.position.set(-side*0.25, -0.3, 0); g.add(br);
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map:FLAME, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true }));
  sp.scale.set(1.1, 1.7, 1); sp.position.y = 0.2; g.add(sp);
  scene.add(g);
  let light = null;
  if(withLight){ light = new THREE.PointLight(C.flame, 17, 24, 1.6); light.position.set(side*4.2-side*0.3, 0.7, z); scene.add(light); }
  torches.push({ sp, light, base:17, ph:Math.random()*6.28 });
}

/* ---------------- stone doors ---------------- */
const doors = [];
function buildDoor(i){
  const g = new THREE.Group(); g.position.z = doorZ[i];
  const rockMat = new THREE.MeshStandardMaterial({ map:T.rockW, roughness:1, metalness:0, color:C.door });
  const leafGeo = new THREE.BoxGeometry(4.3, 9.2, 0.7);
  const L = new THREE.Mesh(leafGeo, rockMat); L.position.set(-2.12, 0.1, 0);
  const Rm = new THREE.Mesh(leafGeo, rockMat); Rm.position.set(2.12, 0.1, 0);
  g.add(L, Rm);
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 9),
    new THREE.MeshBasicMaterial({ color:C.seam, transparent:true, opacity:0.0, blending:THREE.AdditiveBlending, depthWrite:false }));
  seam.position.set(0, 0.1, 0.4); g.add(seam);
  const lintel = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.6),
    new THREE.MeshStandardMaterial({ map:lintelTex(CH[i]), roughness:0.95, transparent:true }));
  lintel.position.set(0, 5.4, 0.45); g.add(lintel);
  const dl = new THREE.PointLight(C.doorWash, 10, 26, 1.6); dl.position.set(0, 1.6, doorZ[i]+7); scene.add(dl);
  scene.add(g);
  doors.push({ g, L, Rm, seam, lintel, dl, open:false });
}

/* ---------------- chambers ---------------- */
function buildChamber(i){
  const c = CH[i], pz = plinthZ[i], gold = !!c.gold;
  const grp = new THREE.Group(); grp.position.z = pz; scene.add(grp);

  // daylight raking in from a cave opening above (as in the reference)
  const sun = new THREE.SpotLight(gold ? C.spotGold : C.day, gold ? 150 : 95, 48, 0.7, 0.6, 1.2);
  sun.position.set(7, 9, pz - 3); sun.target.position.set(1.6, -3, pz); scene.add(sun); scene.add(sun.target);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 3.0, 12, 24, 1, true),
    new THREE.MeshBasicMaterial({ color:gold ? C.beamGold : C.day, transparent:true, opacity:0.08, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
  shaft.position.set(4.4, 2.6, -2.2); shaft.rotation.z = 0.52; shaft.rotation.x = 0.12; grp.add(shaft);
  const DN = 46, dp = new Float32Array(DN*3);
  for(let k=0;k<DN;k++){ dp[k*3]=3+Math.random()*3.2; dp[k*3+1]=-3+Math.random()*7.5; dp[k*3+2]=-4.5+Math.random()*4.5; }
  const dgeo = new THREE.BufferGeometry(); dgeo.setAttribute('position', new THREE.BufferAttribute(dp,3));
  grp.add(new THREE.Points(dgeo, new THREE.PointsMaterial({ color:C.day, size:0.05, transparent:true, opacity:0.5, blending:THREE.AdditiveBlending, depthWrite:false })));

  // left carved inscription panel  — child z is LOCAL (group is already at pz)
  const lt = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 6.0),
    new THREE.MeshStandardMaterial({ map:leftTabletTex(c), roughness:0.95, metalness:0.02 }));
  lt.position.set(-3.4, -0.4, 2.6); lt.rotation.y = 0.5; grp.add(lt);
  const ltl = new THREE.PointLight(C.tabLight, 7, 16, 1.6); ltl.position.set(-2.2, 0.6, pz + 5.4); scene.add(ltl);

  if(c.model){
    // dark polished stone plinth (the reference's marble base)
    const base = new THREE.Mesh(new THREE.BoxGeometry(7.4, 1.7, 3.2),
      new THREE.MeshStandardMaterial({ color:C.plinthDark, roughness:0.3, metalness:0.5 }));
    base.position.set(1.8, -3.55, 0); grp.add(base);
    // stats CARVED into the front face of the plinth
    const face = new THREE.Mesh(new THREE.PlaneGeometry(7.1, 1.5),
      new THREE.MeshBasicMaterial({ map:metricTabletTex(c), transparent:true }));
    face.position.set(1.8, -3.5, 1.63); grp.add(face);
    // the asset model standing on the plinth
    const dio = new THREE.Mesh(new THREE.PlaneGeometry(7, 3.95),
      new THREE.MeshBasicMaterial({ map:dioTex[i], transparent:true, alphaMap:DIO_ALPHA, depthWrite:false }));
    dio.position.set(1.8, -0.72, 0); grp.add(dio);
  } else {
    // Treasury finale: dark plinth + grand gold slab + sparkle
    const base = new THREE.Mesh(new THREE.BoxGeometry(9, 1.7, 3),
      new THREE.MeshStandardMaterial({ color:C.plinthDark, roughness:0.3, metalness:0.55 }));
    base.position.set(0.9, -3.55, 0); grp.add(base);
    const mt = new THREE.Mesh(new THREE.PlaneGeometry(8.6, 3.0),
      new THREE.MeshBasicMaterial({ map:metricTabletTex(c), transparent:true }));
    mt.position.set(0.9, -1.0, 0.3); grp.add(mt);
    const gl = new THREE.PointLight(C.treaLight, 7, 22, 1.8); gl.position.set(0.9, 1.2, pz + 6); scene.add(gl);
    const N = 70, pts = new Float32Array(N*3);
    for(let k=0;k<N;k++){ pts[k*3]=(Math.random()-0.5)*12; pts[k*3+1]=(Math.random()-0.5)*8; pts[k*3+2]=(Math.random()-0.5)*8; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pts,3));
    grp.add(new THREE.Points(pg, new THREE.PointsMaterial({ color:C.treaLight, size:0.08, transparent:true, opacity:0.85, blending:THREE.AdditiveBlending, depthWrite:false })));
  }
}

/* ---------------- organic rock detail (stalactites + rubble) ---------------- */
function scatterRock(){
  const rockMat = new THREE.MeshStandardMaterial({ map:T.rockW, bumpMap:T.rockW, bumpScale:0.1, roughness:1, color:C.tube });
  for(let z=-2; z>Z1+6; z-=6.5){
    const h = 1 + Math.random()*2.4;
    const st = new THREE.Mesh(new THREE.ConeGeometry(0.28 + Math.random()*0.32, h, 6), rockMat);
    st.position.set((Math.random()-0.5)*7, 5.6 - h/2, z + (Math.random()-0.5)*4); st.rotation.y = Math.random()*3.1; scene.add(st);
    const r = new THREE.Mesh(new THREE.IcosahedronGeometry(0.3 + Math.random()*0.55, 0), rockMat);
    r.position.set((Math.random()-0.5)*6.2, -4.3, z + (Math.random()-0.5)*4);
    r.rotation.set(Math.random()*3, Math.random()*3, Math.random()*3); r.scale.y = 0.6; scene.add(r);
  }
}

/* ---------------- entrance sign ---------------- */
function buildEntranceSign(){
  const tex = tabletTexture((x,w,h)=>{
    stoneBase(x,w,h,false);
    engrave(x, 'THE TERAMERGE', w/2, h*0.36, "600 64px 'Cinzel'", '#e2a85c');
    engrave(x, 'PORTFOLIO', w/2, h*0.62, "700 110px 'Cinzel'", BONE);
  }, 1200, 640);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.7),
    new THREE.MeshStandardMaterial({ map:tex, roughness:0.95, transparent:true }));
  sign.position.set(-3.6, 0.4, -10); sign.rotation.y = 0.5; scene.add(sign);
  const sl = new THREE.PointLight(C.tabLight, 3, 14, 2); sl.position.set(-2, 1, -7); scene.add(sl);
}

/* ---------------- dust / flash on door open ---------------- */
function doorFlash(d){
  if(!gsap){ return; }
  gsap.fromTo(d.dl, { intensity:2.6 }, { intensity:7, duration:0.5, yoyo:true, repeat:1, ease:'power2.out' });
}

/* ---------------- build everything ---------------- */
function buildScene(){
  buildTube();
  let k = 0;
  for(let z=-4; z>Z1+10; z-=12){ addTorch(z, (k%2 ? 1 : -1), (k%2===0)); k++; }
  doorZ.forEach(dz => { addTorch(dz+2.5, -1, false); addTorch(dz+2.5, 1, false); });
  doorZ.forEach((_,i) => buildDoor(i));
  CH.forEach((_,i) => buildChamber(i));
  buildEntranceSign();
  scatterRock();
}

/* ---------------- walk controller ---------------- */
let si = 0, busy = false, cool = false, built = false, started = false;
const cam = { z: 0 };
const opened = [false,false,false,false];

function showCTA(nc){ ctaText.textContent = CH[nc].gold ? 'Break the seal' : 'Open the door'; cta.classList.toggle('cta--gold', !!CH[nc].gold); cta.classList.add('is-on'); }
function updateUI(){
  begin.classList.toggle('is-on', si === 0);
  nav.classList.toggle('is-dim', si > 0);
  rail.classList.toggle('is-on', si > 0);
  rtn.hidden = !(si > 0);
  hud.classList.add('is-on');
  const ch = (si === 0) ? -1 : CH_OF[si];
  [...rail.children].forEach((b,bi) => b.classList.toggle('is-on', bi === ch));
  if(si === 0){ hudName.textContent = 'The Entrance'; hudNo.textContent = '00'; }
  else { hudName.textContent = CH[ch].name; hudNo.textContent = '0' + (ch+1); }
  const nc = NEAR[si];
  if(nc !== undefined && !opened[nc]){ showCTA(nc); cue.classList.remove('is-on'); }
  else {
    cta.classList.remove('is-on');
    if(si < STOPS.length-1){ cue.classList.add('is-on'); cueText.textContent = si === 0 ? 'Scroll to walk the path' : (CHAM[si] !== undefined ? 'Scroll to walk on' : 'Scroll to approach the door'); }
    else cue.classList.remove('is-on');
  }
}
function glide(dur){
  const to = STOPS[si];
  const d = dur || Math.min(2.6, Math.max(1.0, Math.abs(to - cam.z) * 0.085));
  if(gsap) gsap.to(cam, { z:to, duration:d, ease:'power2.inOut', overwrite:true });
  else cam.z = to;
}
function forward(){
  if(busy) return;
  const nc = NEAR[si];
  if(nc !== undefined && !opened[nc]) return;     // door closed → need CTA
  if(si < STOPS.length-1){ si++; glide(); updateUI(); }
}
function back(){ if(busy) return; if(si > 0){ si--; glide(); updateUI(); } }
function openDoor(){
  const nc = NEAR[si];
  if(nc === undefined || opened[nc] || busy) return;
  busy = true; cta.classList.remove('is-on');
  const d = doors[nc];
  if(gsap){
    gsap.to(d.L.position,  { x:-8.6, duration:2.0, ease:'power3.inOut' });
    gsap.to(d.Rm.position, { x: 8.6, duration:2.0, ease:'power3.inOut' });
    gsap.to(d.seam.material, { opacity:0.95, duration:0.5, yoyo:true, repeat:1 });
    gsap.to(d.lintel.material, { opacity:0.0, duration:0.9, delay:0.8, onComplete:()=>{ d.lintel.visible = false; } });
  } else { d.L.position.x = -8.6; d.Rm.position.x = 8.6; d.lintel.visible = false; }
  opened[nc] = true; d.open = true; doorFlash(d);
  if(si < STOPS.length-1){ si++; }
  updateUI();
  // the camera walks forward THROUGH the opening door — one continuous motion
  if(gsap) gsap.to(cam, { z:STOPS[si], duration:2.4, ease:'power2.inOut', delay:0.5, overwrite:true, onComplete:()=>{ busy = false; } });
  else { cam.z = STOPS[si]; busy = false; }
}
function jump(kk){
  for(let i=0;i<=kk;i++){ if(!opened[i]){ opened[i]=true; doors[i].L.position.x=-8.6; doors[i].Rm.position.x=8.6; doors[i].lintel.visible=false; doors[i].open=true; } }
  si = CHAM_INDEX[kk]; glide(2.3); updateUI();
}

/* ---------------- input ---------------- */
function gesture(dir){ if(cool || busy) return; cool = true; setTimeout(()=>cool=false, 600); if(dir > 0) forward(); else back(); }
addEventListener('wheel', (e)=>{ if(!started) return; e.preventDefault(); if(Math.abs(e.deltaY) > 6) gesture(e.deltaY > 0 ? 1 : -1); }, { passive:false });
let ty = 0;
addEventListener('touchstart', (e)=>{ ty = e.touches[0].clientY; }, { passive:true });
addEventListener('touchend', (e)=>{ if(!started) return; const dy = e.changedTouches[0].clientY - ty; if(dy < -40) gesture(1); else if(dy > 40) gesture(-1); }, { passive:true });
addEventListener('keydown', (e)=>{ if(!started) return;
  if(e.key === 'ArrowDown' || e.key === ' '){ e.preventDefault(); gesture(1); }
  else if(e.key === 'ArrowUp'){ e.preventDefault(); gesture(-1); }
  else if(e.key === 'Enter'){ openDoor(); }
});
cta.addEventListener('click', openDoor);
[...rail.children].forEach(b => b.addEventListener('click', ()=> jump(+b.dataset.go)));
rtn.addEventListener('click', ()=>{ if(busy) return; si = 0; glide(2.4); updateUI(); });

/* ---------------- render loop ---------------- */
function tick(now){
  requestAnimationFrame(tick);
  camera.position.z = cam.z;
  camera.position.x = Math.sin(now*0.0004) * 0.13;
  camera.position.y = EYE + Math.sin(now*0.0006) * 0.06;
  camera.lookAt(camera.position.x*0.4, EYE-0.35, cam.z-12);
  lantern.position.set(camera.position.x, EYE+1.2, cam.z-1);
  for(const t of torches){
    const f = 0.76 + 0.24*Math.sin(now*0.012 + t.ph) + (Math.random()-0.5)*0.12;
    if(t.light) t.light.intensity = t.base * f;
    t.sp.scale.set(1.0 + 0.12*f, 1.55 + 0.35*f, 1);
  }
  renderer.render(scene, camera);
}

/* ---------------- boot ---------------- */
let texDone = false, imgDone = false;
manager.onLoad = () => { texDone = true; maybeBuild(); };
stoneImg.onload = () => { imgDone = true; maybeBuild(); };
stoneImg.onerror = () => { imgDone = true; maybeBuild(); };
async function maybeBuild(){
  if(built || !texDone || !imgDone) return; built = true;
  try { await Promise.all([
    document.fonts.load("700 90px 'Cinzel'"), document.fonts.load("600 34px 'Cinzel'"),
    document.fonts.load("500 28px 'Cinzel'"), document.fonts.load("italic 46px 'Cormorant Garamond'"),
    document.fonts.load("400 38px 'Cormorant Garamond'")
  ]); } catch(e) {}
  buildScene();
  updateUI();
  requestAnimationFrame(tick);
  if(loadEl) loadEl.classList.add('is-done');
  setTimeout(()=>{ started = true; }, 400);
}

addEventListener('resize', ()=>{ camera.aspect = innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

/* safety: if textures stall, build anyway after 6s */
setTimeout(()=>{ if(!built){ texDone = true; imgDone = true; maybeBuild(); } }, 6000);
