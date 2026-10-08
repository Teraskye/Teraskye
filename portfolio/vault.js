/* ============================================================
   TERAMERGE — THE ASSET VAULT
   A cinematic institutional-vault portfolio experience.
   Loader → entrance vault → archive corridor → asset chambers
   → next-opportunity door. Data-driven; no fabricated metrics.
   Three.js r0.161 (module) + GSAP for camera choreography.
   ============================================================ */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* ---------------------------------------------------------------
   0 · PORTFOLIO DATA  (edit here — add verified numbers later)
   Only fields with a real value are shown; numeric/financial
   fields are intentionally left null and render as a locked,
   "Disclosed to qualified investors" state. NOTHING is invented.
--------------------------------------------------------------- */
const ASSETS = [
  {
    no:'01', name:'The Foundation', region:'The track record',
    regionList:['Maryland','New Jersey','Atlanta, Georgia','Miami, Florida','Dallas, Texas','Minneapolis, Minnesota','St. Louis, Missouri','Berkeley Hills, California','South Carolina','Florida'],
    type:'Portfolio',
    accHex:0x5A93C8, dotHex:0xAFD2EE, accCss:'199,154,91', status:'Assets Under Management',
    phase:'Proven track record', metric:'350+ Doors', metricSub:'10 markets · 72 acres · $28 Mil+',
    model:{ type:'estate' }, img:'assets/asset-foundation.png', vid:'assets/spin-foundation.mp4',   /* turntable spin; still is the fallback */
    tag:'Where the operating record was built.',
    diff:'Breadth — a decade across markets and asset classes.',
    overview:[
      ['Scale', { chips:[{t:'$28 Mil+',hi:1}, {t:'350+ Doors',hi:1}, '10 Markets', '72 Acres'] }],
      ['Holdings', { stack:['Multi-Unit Residential', 'Single-Family', 'Land & Commercial'] }],
      ['Operating record', { lines:['Student housing, residential care, luxury downtown residential and land.', 'Owned and operated across ten markets and four asset classes.'] }],
    ],
    stratLabel:'Types we followed',
    stratList:['Value-Add & Appreciate', 'Operate & Optimize', 'Income & Hold', 'Land & Position'],
    stratFlow:null,
  },
  {
    no:'02', name:'Multifamily', region:'North Carolina · Alabama', regionList:['North Carolina','Alabama'], type:'Multifamily',
    accHex:0x5AA8E8, dotHex:0xBFE0F7, accCss:'226,168,92', status:'Assets Under Management',
    phase:'Live in market', metric:'110+ Doors', metricSub:'North Carolina · Alabama · $11 Mil+',
    model:{ type:'single' }, img:'assets/asset-multifamily-blend.png?v=1', vid:'assets/spin-multifamily.mp4',
    tag:'The core strategy, in market.',
    diff:'Focus — one asset class, fully operated on our platform.',
    overview:[
      ['Scale', { chips:[{t:'$11 Mil+',hi:1}, {t:'110+ Doors',hi:1}] }],
      ['Entry', { lines:['Acquired below value.', 'Equity on day one.'] }],
      ['Execution', 'Underwritten, closed and operated on the Teramerge intelligence platform.'],
    ],
    stratLabel:'Value-creation path',
    stratList:['Value-Add & Appreciate'],
    stratFlow:['Acquire','Transform','Operate','Scale'],
  },
  {
    no:'03', name:'Under Contract', door:'Coming Soon', region:'Atlanta · Austin · Florida', regionList:['Atlanta, GA','Austin, TX','Florida'], type:'Multifamily',
    accHex:0x6EC8F0, dotHex:0xCDEEFB, accCss:'232,201,154', status:'Coming Soon',
    phase:'Scaling now', metric:'800+ Doors', metricSub:'3 markets · $70 Mil+',
    model:{ type:'cluster' }, img:'assets/asset-undercontract-blend.png?v=2', vid:'assets/spin-undercontract.mp4',
    tag:'The platform, scaling.',
    diff:'Scale — the same playbook, ten times the doors.',
    overview:[
      ['Asset', 'Multifamily'],
      ['Scale', { chips:[{t:'$70 Mil+',hi:1}, {t:'800+ Doors',hi:1}] }],
      ['Markets', { stack:['Atlanta, GA','Austin, TX','Florida'] }],
    ],
    stratLabel:'Value-creation path',
    stratList:['Value-Add & Appreciate'],
    stratFlow:['Acquire','Transform','Operate','Scale'],
  },
  {
    no:'04', name:'The Treasury', region:'Portfolio & pipeline', type:'—',
    accHex:0x8FD0F5, dotHex:0xDCF1FC, accCss:'232,201,154', isNext:true, status:'Targeted this year',
    phase:'Targeted this year', metric:'1,500+ Doors', metricSub:'12 markets · $100 Mil+',
    tag:'The platform, in full.',
  },
];

/* ---------------------------------------------------------------
   DOM
--------------------------------------------------------------- */
const $ = s => document.querySelector(s);
const stage = $('#stage'), fadeEl = $('#fade');
const loaderEl = $('#loader'), entryEl = $('#entry'), hudEl = $('#hud'), chamberEl = $('#chamber'), finaleEl = $('#finale');
const plaqueEl = $('#plaque'), plaqueNo = $('#plaqueNo'), plaqueName = $('#plaqueName'), plaqueRegion = $('#plaqueRegion');
const walkHint = $('#walkHint'), pindexList = $('#pindexList'), pindexProg = $('#pindexProg');
const chNo = $('#chNo'), chName = $('#chName'), chRegion = $('#chRegion'), chPanel = $('#chPanel'), chTabs = $('#chTabs');
const chPhase = $('#chPhase'), chMetric = $('#chMetric'), chMetricSub = $('#chMetricSub'), chDiff = $('#chDiff'), chSteps = $('#chSteps');
const chAssetWrap = $('#chAssetWrap'), chAsset = $('#chAsset'), chAssetVid = $('#chAssetVid');

/* ---------------------------------------------------------------
   RENDERER · SCENE · CAMERA · ENVIRONMENT
--------------------------------------------------------------- */
const renderer = new THREE.WebGLRenderer({ canvas:stage, antialias:true, powerPreference:'high-performance' });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.98;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x070605);
scene.fog = new THREE.Fog(0x070605, 18, 74);

const camera = new THREE.PerspectiveCamera(52, innerWidth/innerHeight, 0.1, 400);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;

/* ---- post-processing: subtle cinematic bloom (lit windows glow) ---- */
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloomPass = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.28, 0.5, 0.92);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());
composer.setSize(innerWidth, innerHeight);
composer.setPixelRatio(Math.min(devicePixelRatio, 2));
const renderScene = () => composer.render();

/* ---------------------------------------------------------------
   MATERIALS
--------------------------------------------------------------- */
const MAT = {
  bronze:  new THREE.MeshStandardMaterial({ color:0x6d5330, metalness:1.0, roughness:0.34, envMapIntensity:1.15 }),
  bronzeD: new THREE.MeshStandardMaterial({ color:0x4c3a22, metalness:1.0, roughness:0.46, envMapIntensity:0.95 }),
  bronzeL: new THREE.MeshStandardMaterial({ color:0x8a6a3c, metalness:1.0, roughness:0.26, envMapIntensity:1.3 }),
  steel:   new THREE.MeshStandardMaterial({ color:0x3a3630, metalness:0.9, roughness:0.4,  envMapIntensity:1.0 }),
  stone:   new THREE.MeshStandardMaterial({ color:0x14120f, metalness:0.0, roughness:0.92 }),
  stoneL:  new THREE.MeshStandardMaterial({ color:0x1d1a15, metalness:0.1, roughness:0.8 }),
  floor:   new THREE.MeshStandardMaterial({ color:0x0b0a09, metalness:0.5, roughness:0.18, envMapIntensity:0.7 }),
  glow:    new THREE.MeshStandardMaterial({ color:0x120d07, emissive:0xC79A5B, emissiveIntensity:1.6, metalness:0, roughness:1 }),
  glowSoft:new THREE.MeshBasicMaterial({ color:0xC79A5B }),
};
const brz = () => MAT.bronze.clone();

/* per-door metals — each chamber door gets its own alloy (bronze → copper → brass → gold) */
function metalSet(body, bodyD, light, rough, env){
  rough = (rough==null?0.34:rough); env = (env==null?1.15:env);
  return {
    body:  new THREE.MeshStandardMaterial({ color:body,  metalness:1.0, roughness:rough,               envMapIntensity:env }),
    bodyD: new THREE.MeshStandardMaterial({ color:bodyD,  metalness:1.0, roughness:Math.min(0.9,rough+0.12), envMapIntensity:env*0.82 }),
    light: new THREE.MeshStandardMaterial({ color:light,  metalness:1.0, roughness:Math.max(0.14,rough-0.1),  envMapIntensity:env*1.2 }),
  };
}
const METALS = {
  bronze: metalSet(0x47321a, 0x2c1f10, 0x684b28, 0.56, 0.68),   // DARK matte brown — clearly not gold
  copper: metalSet(0x9c4a26, 0x5e2c15, 0xc86a3a, 0.38, 1.02),   // warm reddish copper
  brass:  metalSet(0x9a8330, 0x66531e, 0xc9ac50, 0.34, 1.1),    // muted yellow brass
  gold:   metalSet(0xcaa23c, 0x8a6a22, 0xf6d67e, 0.2,  1.45),   // bright shiny gold
};

/* small contact-shadow disc under objects (fake AO, cheap & reliable) */
function contactShadow(radius, opacity=0.5){
  const c = document.createElement('canvas'); c.width=c.height=128;
  const g = c.getContext('2d'); const grd = g.createRadialGradient(64,64,4,64,64,64);
  grd.addColorStop(0,`rgba(0,0,0,${opacity})`); grd.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=grd; g.fillRect(0,0,128,128);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(radius*2,radius*2), new THREE.MeshBasicMaterial({ map:tex, transparent:true, depthWrite:false }));
  m.rotation.x = -Math.PI/2; return m;
}

/* ---------------------------------------------------------------
   BUILD · VAULT DOOR  (procedural, reusable)
   Returns { group, pivot, lock } — pivot hinges the door open,
   lock is the spinning mechanism (rings + spokes).
--------------------------------------------------------------- */
function buildVaultDoor(radius, opts={}){
  const pivot = new THREE.Group();          // hinge pivot (rotates to open)
  const group = new THREE.Group();          // the door itself, offset from hinge
  pivot.add(group);
  const M = opts.metal || { body:MAT.bronze, bodyD:MAT.bronzeD, light:MAT.bronzeL };
  const bodyMat = opts.dark ? M.bodyD : M.body;

  // main disc
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, 0.5, 96), bodyMat);
  disc.rotation.x = Math.PI/2; group.add(disc);

  // outer bevel ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(radius*0.99, radius*0.06, 24, 96), M.light);
  ring.position.z = 0.12; group.add(ring);

  // concentric raised rings
  for (let i=0;i<3;i++){
    const rr = radius*(0.74 - i*0.16);
    const t = new THREE.Mesh(new THREE.TorusGeometry(rr, radius*0.018, 16, 80), i%2?M.light:MAT.steel);
    t.position.z = 0.2; group.add(t);
  }

  // perimeter bolts
  const boltGeo = new THREE.CylinderGeometry(radius*0.03, radius*0.03, 0.28, 12);
  const bolts = new THREE.InstancedMesh(boltGeo, M.light, 40);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2,0,0));
  for (let i=0;i<40;i++){ const a=(i/40)*Math.PI*2; const rr=radius*0.88;
    m4.compose(new THREE.Vector3(Math.cos(a)*rr, Math.sin(a)*rr, 0.24), q, new THREE.Vector3(1,1,1)); bolts.setMatrixAt(i,m4); }
  group.add(bolts);

  // engraved tick marks (dial)
  const tickGeo = new THREE.BoxGeometry(radius*0.015, radius*0.06, 0.02);
  for (let i=0;i<60;i++){ const a=(i/60)*Math.PI*2; const rr=radius*0.8;
    const tk = new THREE.Mesh(tickGeo, MAT.steel); tk.position.set(Math.cos(a)*rr, Math.sin(a)*rr, 0.26);
    tk.rotation.z = a - Math.PI/2; group.add(tk); }

  // ---- LOCK MECHANISM (spins on open) ----
  const lock = new THREE.Group(); lock.position.z = 0.22; group.add(lock);
  // central hub
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(radius*0.16, radius*0.2, 0.36, 40), M.light);
  hub.rotation.x = Math.PI/2; hub.position.z = 0.14; lock.add(hub);
  const hubRing = new THREE.Mesh(new THREE.TorusGeometry(radius*0.2, radius*0.03, 16, 48), MAT.steel);
  hubRing.position.z = 0.16; lock.add(hubRing);
  // spokes
  const spokeGeo = new THREE.BoxGeometry(radius*0.045, radius*0.62, 0.14);
  for (let i=0;i<6;i++){ const a=(i/6)*Math.PI*2;
    const sp = new THREE.Mesh(spokeGeo, M.body); sp.position.set(Math.cos(a)*radius*0.34, Math.sin(a)*radius*0.34, 0.06);
    sp.rotation.z = a; lock.add(sp);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(radius*0.05, 16, 12), M.light);
    cap.position.set(Math.cos(a)*radius*0.64, Math.sin(a)*radius*0.64, 0.08); lock.add(cap);
  }
  // center emblem (Teramerge pip)
  const pip = new THREE.Mesh(new THREE.CircleGeometry(radius*0.05, 24), MAT.glowSoft);
  pip.position.z = 0.33; lock.add(pip);

  // offset door so hinge sits at left edge
  group.position.x = radius*0.98;
  pivot.userData.doorRadius = radius;
  return { pivot, group, lock };
}

/* ---------------------------------------------------------------
   BUILD · ARCHIVE CORRIDOR
--------------------------------------------------------------- */
const HALFW = 5.0, CH = 6.4, Z0 = 4, ZEND = -70;
function buildCorridor(){
  const g = new THREE.Group();
  const len = Z0 - ZEND, midZ = (Z0+ZEND)/2;

  // floor
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(HALFW*2, len), MAT.floor);
  floor.rotation.x = -Math.PI/2; floor.position.set(0,0,midZ); g.add(floor);
  // ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(HALFW*2, len), MAT.stone);
  ceil.rotation.x = Math.PI/2; ceil.position.set(0,CH,midZ); g.add(ceil);
  // walls
  for (const s of [-1,1]){
    const w = new THREE.Mesh(new THREE.PlaneGeometry(len, CH), MAT.stoneL);
    w.rotation.y = -s*Math.PI/2; w.position.set(s*HALFW, CH/2, midZ); g.add(w);
  }
  // ceiling light slot (emissive) + soft point lights
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.5, len), MAT.glow);
  slot.rotation.x = Math.PI/2; slot.position.set(0, CH-0.02, midZ); g.add(slot);
  for (let z=Z0-4; z>ZEND; z-=12){
    const pl = new THREE.PointLight(0xffca77, 8, 16, 2.0); pl.position.set(0, CH-0.4, z); g.add(pl);
  }
  // wall pilasters (rhythm)
  for (let z=Z0-2; z>ZEND; z-=4){
    for (const s of [-1,1]){
      const col = new THREE.Mesh(new THREE.BoxGeometry(0.18, CH, 0.4), MAT.stone);
      col.position.set(s*(HALFW-0.02), CH/2, z); g.add(col);
      const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.05, CH*0.86), MAT.glow);
      strip.rotation.y = -s*Math.PI/2; strip.position.set(s*(HALFW-0.06), CH/2, z-0.001); g.add(strip);
    }
  }
  return g;
}

/* ---------------------------------------------------------------
   BUILD · ASSET MASSING MODEL  (abstract architectural hero)
--------------------------------------------------------------- */
function buildAssetModel(asset){
  const g = new THREE.Group();
  const BASE = 0.31;                                         // pedestal top
  let seed = 0; for (const c of asset.name) seed += c.charCodeAt(0);
  const rnd = () => { seed = (seed*9301 + 49297) % 233280; return seed/233280; };

  // ---- shared realistic materials (warm architectural miniature) ----
  const ROOF_FLAT = new THREE.MeshStandardMaterial({ color:0x35332f, roughness:0.72, metalness:0.28 });
  const ROOF_PITCH= new THREE.MeshStandardMaterial({ color:0x4a3627, roughness:0.82, metalness:0.05 });
  const UNDER     = new THREE.MeshStandardMaterial({ color:0x24211b, roughness:0.95 });
  const TRUNK     = new THREE.MeshStandardMaterial({ color:0x2c1f14, roughness:1 });
  const FOLIAGE   = new THREE.MeshStandardMaterial({ color:0x30401f, roughness:1 });
  const GRASS     = new THREE.MeshStandardMaterial({ color:0x2b3a1e, roughness:1 });
  const GROUNDM   = new THREE.MeshStandardMaterial({ color:0x100e0a, roughness:1 });
  const ROADM     = new THREE.MeshStandardMaterial({ color:0x0b0a08, roughness:1 });
  const BALC      = new THREE.MeshStandardMaterial({ color:0x2a2824, roughness:0.7, metalness:0.3 });
  const CARB      = new THREE.MeshStandardMaterial({ color:0x9aa0a6, roughness:0.42, metalness:0.5 });
  const LAMP      = new THREE.MeshStandardMaterial({ color:0x1a1610, emissive:0xffcf8a, emissiveIntensity:1.5, roughness:1 });
  const POLE      = new THREE.MeshStandardMaterial({ color:0x1c1a15, roughness:0.9 });

  // ---- facade texture: light concrete wall + warm-lit window grid (albedo + emissive) ----
  function facadeMat(cols, rows){
    seed = (seed*2 + cols*7 + rows*13) % 233280 + 5;
    let s = seed; const rr = () => { s = (s*9301 + 49297) % 233280; return s/233280; };
    const cw=18, ch=20, pad=7, gut=4, W=pad*2+cols*cw, H=pad*2+rows*ch;
    const ca=document.createElement('canvas'); ca.width=W; ca.height=H; const a=ca.getContext('2d');
    const ce=document.createElement('canvas'); ce.width=W; ce.height=H; const e=ce.getContext('2d');
    const wall = 96 + Math.floor(rr()*30);                   // darker warm concrete (moody night)
    a.fillStyle = `rgb(${wall},${wall-8},${wall-18})`; a.fillRect(0,0,W,H);
    e.fillStyle = '#000'; e.fillRect(0,0,W,H);
    for (let r=0;r<rows;r++) for (let cc=0;cc<cols;cc++){
      const wx=pad+cc*cw+gut, wy=pad+r*ch+gut, ww=cw-gut*2, wh=ch-gut*2;
      const lit = rr() > 0.44;
      a.fillStyle = lit ? '#ffd694' : '#22242b';             // warm-lit or dark glass
      a.fillRect(wx,wy,ww,wh);
      if (lit){ e.fillStyle = '#ffca82'; e.fillRect(wx,wy,ww,wh); }
    }
    a.strokeStyle='rgba(90,82,70,0.5)'; a.lineWidth=1;       // floor slabs
    for (let r=0;r<=rows;r++){ const yy=pad+r*ch; a.beginPath(); a.moveTo(0,yy); a.lineTo(W,yy); a.stroke(); }
    const map=new THREE.CanvasTexture(ca), emap=new THREE.CanvasTexture(ce);
    map.anisotropy=4; emap.anisotropy=4;
    return new THREE.MeshStandardMaterial({ map, emissive:0xffb066, emissiveMap:emap, emissiveIntensity:0.85, roughness:0.74, metalness:0.05 });
  }
  const sideMats = (w,h) => { const m = facadeMat(Math.max(2,Math.round(w/0.12)), Math.max(2,Math.round(h/0.15))); return [m,m,ROOF_FLAT,UNDER,m,m]; };

  // ---- building types ----
  function tower(w,h,d){                                     // multi-unit residential
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d), sideMats(w,h)));
    const cap=new THREE.Mesh(new THREE.BoxGeometry(w*0.94,0.05,d*0.94), ROOF_FLAT); cap.position.y=h/2+0.02; grp.add(cap);
    const box=new THREE.Mesh(new THREE.BoxGeometry(0.1,0.08,0.1), ROOF_FLAT); box.position.set((rnd()-0.5)*w*0.4,h/2+0.06,(rnd()-0.5)*d*0.4); grp.add(box);
    // balcony ledges on front & back faces (reads as an apartment building)
    const floors=Math.max(2,Math.round(h/0.34));
    const ledgeGeo=new THREE.BoxGeometry(w*0.99,0.018,0.045);
    for(let f=1;f<floors;f++){ const y=-h/2+(h/floors)*f;
      const lf=new THREE.Mesh(ledgeGeo,BALC); lf.position.set(0,y,d/2+0.022); grp.add(lf);
      const lb=new THREE.Mesh(ledgeGeo,BALC); lb.position.set(0,y,-d/2-0.022); grp.add(lb); }
    return grp;
  }
  function house(w,h,d){                                     // single-family residential
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d), sideMats(w,h)));
    const roof=new THREE.Mesh(new THREE.ConeGeometry(Math.max(w,d)*0.8, h*0.85, 4), ROOF_PITCH);
    roof.rotation.y=Math.PI/4; roof.position.y=h/2 + h*0.42; grp.add(roof);
    return grp;
  }
  function commercial(w,h,d){                                // land & commercial (low, flat)
    const grp=new THREE.Group();
    grp.add(new THREE.Mesh(new THREE.BoxGeometry(w,h,d), sideMats(w,h)));
    for (let i=0;i<2;i++){ const u=new THREE.Mesh(new THREE.BoxGeometry(0.13,0.05,0.13), ROOF_FLAT); u.position.set((rnd()-0.5)*w*0.5,h/2+0.03,(rnd()-0.5)*d*0.5); grp.add(u); }
    return grp;
  }
  const place = (b,x,h,z,ry)=>{ b.position.set(x, BASE+h/2, z); if(ry!=null) b.rotation.y=ry; g.add(b); };
  function tree(x,z,s=1){
    const t=new THREE.Group();
    const tr=new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.016,0.07,6), TRUNK); tr.position.y=0.035; t.add(tr);
    const f=new THREE.Mesh(new THREE.ConeGeometry(0.06*s,0.15*s,7), FOLIAGE); f.position.y=0.035+0.085*s; t.add(f);
    t.position.set(x,BASE,z); g.add(t);
  }
  function grassPatch(x,z,r){ const m=new THREE.Mesh(new THREE.CircleGeometry(r,20), GRASS); m.rotation.x=-Math.PI/2; m.position.set(x,BASE+0.004,z); g.add(m); }
  function car(x,z,rot){
    const c=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(0.07,0.028,0.14), CARB); body.position.set(0,0.018,0); c.add(body);
    const cab=new THREE.Mesh(new THREE.BoxGeometry(0.06,0.024,0.07), CARB); cab.position.set(0,0.04,-0.01); c.add(cab);
    const hl=new THREE.Mesh(new THREE.BoxGeometry(0.05,0.008,0.01), LAMP); hl.position.set(0,0.02,0.072); c.add(hl);
    c.position.set(x,BASE+0.004,z); c.rotation.y=rot||0; g.add(c);
  }
  function streetLight(x,z){
    const p=new THREE.Group();
    const pole=new THREE.Mesh(new THREE.CylinderGeometry(0.006,0.008,0.2,6), POLE); pole.position.y=0.1; p.add(pole);
    const lamp=new THREE.Mesh(new THREE.SphereGeometry(0.018,8,6), LAMP); lamp.position.y=0.2; p.add(lamp);
    p.position.set(x,BASE,z); g.add(p);
  }

  // ---- ground: dark disc + a ring road + grass ----
  const disc=new THREE.Mesh(new THREE.CircleGeometry(1.95,64), GROUNDM); disc.rotation.x=-Math.PI/2; disc.position.y=BASE+0.002; g.add(disc);
  const road=new THREE.Mesh(new THREE.RingGeometry(1.28,1.42,64), ROADM); road.rotation.x=-Math.PI/2; road.position.y=BASE+0.006; g.add(road);

  // warm cinematic key + cool fill so the solid volumes read
  const key=new THREE.PointLight(0xffdca0, 0.7, 16, 2); key.position.set(1.7,4.4,2.2); g.add(key);
  const fill=new THREE.PointLight(0x8fa6c4, 0.25, 14, 2); fill.position.set(-2.2,2.6,-1.6); g.add(fill);

  const type = asset.isNext ? 'aggregate' : (asset.model && asset.model.type) || 'cluster';

  if (type === 'estate'){                 // FOUNDATION — the diversified holdings (like the reference)
    // multi-unit towers (centre-back)
    [[0,-0.15,2.1],[0.5,0.2,1.7],[-0.5,-0.1,1.6]].forEach(([x,z,h],i)=> place(tower(0.5,h,0.5), x, h, z, (rnd()-0.5)*0.4));
    // single-family houses (left)
    for (let i=0;i<6;i++){ const hh=0.28+rnd()*0.14; place(house(0.34,hh,0.34), -1.25+rnd()*0.7, hh, -0.4+ (i-3)*0.28 + rnd()*0.2, rnd()*0.8); }
    // land & commercial (right) + green land
    grassPatch(1.15,0.25,0.55);
    [[1.15,0.5],[1.35,-0.35],[0.95,-0.55]].forEach(([x,z])=> place(commercial(0.5+rnd()*0.2,0.24+rnd()*0.1,0.4+rnd()*0.15), x, 0.28, z, (rnd()-0.5)*0.3));
    for (let i=0;i<12;i++){ tree((rnd()-0.5)*3.2, (rnd()-0.5)*3.0, 0.8+rnd()*0.5); }
  } else if (type === 'single'){          // MULTIFAMILY — one focused community
    place(tower(0.6,2.4,0.6), -0.1, 2.4, 0.15, 0.1);
    place(tower(0.5,1.9,0.5), 0.55, 1.9, -0.2, -0.2);
    place(commercial(0.5,0.3,0.4), -0.7, 0.3, -0.6, 0.3);   // amenity
    grassPatch(0.2,-0.6,0.5);
    for (let i=0;i<8;i++){ tree((rnd()-0.5)*2.4, (rnd()-0.5)*2.2, 0.8+rnd()*0.4); }
  } else if (type === 'cluster'){         // UNDER CONTRACT — a growing multifamily cluster
    const n=6;
    for (let i=0;i<n;i++){ const h=1.7+rnd()*1.7, ang=(i*2.399)+rnd()*0.3, rad=0.3+(i/n)*0.95;
      place(tower(0.5+rnd()*0.14,h,0.5+rnd()*0.12), Math.cos(ang)*rad, h, Math.sin(ang)*rad, rnd()*0.5); }
    for (let i=0;i<9;i++){ tree((rnd()-0.5)*3.0, (rnd()-0.5)*3.0, 0.8+rnd()*0.4); }
  } else {                                // TREASURY — the full portfolio
    place(tower(0.8,3.2,0.8), 0, 3.2, 0, 0);
    const n=6;
    for (let i=0;i<n;i++){ const h=1.1+rnd()*1.5, ang=(i/n)*6.283+0.3;
      place(tower(0.42+rnd()*0.2,h,0.42+rnd()*0.16), Math.cos(ang)*1.25, h, Math.sin(ang)*1.25, rnd()*0.5); }
    for (let i=0;i<10;i++){ tree((rnd()-0.5)*3.2, (rnd()-0.5)*3.0, 0.8+rnd()*0.4); }
    const halo=new THREE.PointLight(0xffdca0,3,12,2); halo.position.set(0,3.9,0); g.add(halo);
  }
  // shared life: a few cars on the ring road + street lamps around the edge
  for (let i=0;i<8;i++){ const a2=(i/8)*6.283 + 0.2 + rnd()*0.1; car(Math.cos(a2)*1.35, Math.sin(a2)*1.35, a2+Math.PI/2); }
  for (let i=0;i<6;i++){ const a2=(i/6)*6.283 + 0.5; streetLight(Math.cos(a2)*1.6, Math.sin(a2)*1.6); }
  g.userData.spin = 0.05;
  return g;
}

/* ---------------------------------------------------------------
   SCENE ASSEMBLY
--------------------------------------------------------------- */
// ---- bulkhead wall with a circular portal (occludes the view beyond,
//      so only the door in the current segment is ever seen) ----
function makeBulkhead(z, R){
  const g = new THREE.Group();
  const lintelH = CH - 2*R;
  if (lintelH > 0.05){
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(HALFW*2, lintelH, 0.5), MAT.stoneL);
    lintel.position.set(0, 2*R + lintelH/2, z); g.add(lintel);
  }
  for (const s of [-1,1]){
    const side = new THREE.Mesh(new THREE.BoxGeometry(HALFW - R, 2*R, 0.5), MAT.stoneL);
    side.position.set(s*(R + (HALFW-R)/2), R, z); g.add(side);
  }
  const frame = new THREE.Mesh(new THREE.TorusGeometry(R+0.06, 0.14, 20, 90), MAT.bronzeL);
  frame.position.set(0, R, z); g.add(frame);
  scene.add(g); return g;
}

// ---- ENTRANCE · front bulkhead + monumental centered vault door ----
const ENT_R = 2.85;
makeBulkhead(Z0, ENT_R);
const entrance = buildVaultDoor(2.8);   // entrance = the original warm bronze (not the bright gold)
entrance.pivot.position.set(-2.8*0.98, ENT_R, Z0 - 0.06);   // centred, hinge on the left edge
scene.add(entrance.pivot);

// corridor shell
scene.add(buildCorridor());

// entrance key light
const entryKey = new THREE.SpotLight(0xffd39a, 90, 34, 0.6, 0.5, 1.2);
entryKey.position.set(2.5, 7, 12); entryKey.target.position.set(0, ENT_R, Z0);
scene.add(entryKey, entryKey.target);
const entryFill = new THREE.PointLight(0xffb266, 8, 24, 2); entryFill.position.set(-3, 4, 9); scene.add(entryFill);

// ---- ASSET DOORS · one centred vault door per station, down the axis ----
const DOOR_R = 2.5, DOOR_Y = 2.55;
const DOOR_Z = [-10, -24, -38, -52];
const STOP = 7.0;                       // camera stops this far in front of a door
const doors = [];
const DOOR_METALS = [METALS.bronze, METALS.copper, METALS.brass, METALS.gold];  // Foundation→Multifamily→Under Contract→Treasury
DOOR_Z.forEach((z, i) => {
  const isNext = ASSETS[i].isNext;
  makeBulkhead(z, DOOR_R + 0.05);
  const d = buildVaultDoor(DOOR_R, { dark: isNext, metal: DOOR_METALS[i] || METALS.bronze });
  d.pivot.position.set(-DOOR_R*0.98, DOOR_Y, z - 0.06);     // centred, faces +Z (toward camera)
  scene.add(d.pivot);
  const dl = new THREE.PointLight(0xffb877, 6, 16, 2); dl.position.set(0, CH-0.8, z + 3); scene.add(dl);
  const openAngle = -Math.PI*0.64;                          // swings inward, away from the camera
  d.pivot.traverse(o => { if (o.isMesh) o.userData.doorIndex = i; });
  doors.push({ ...d, z, openAngle, asset: ASSETS[i] });
});

// ---- CHAMBER (single, reusable, far from corridor) ----
const CHAMBER_C = new THREE.Vector3(0, 0, 200);
const chamber = new THREE.Group(); chamber.position.copy(CHAMBER_C); scene.add(chamber);
{
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), MAT.floor);
  floor.rotation.x = -Math.PI/2; chamber.add(floor);
  const backW = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, CH+2, 64, 1, true, -Math.PI*0.62, Math.PI*1.24), MAT.stoneL);
  backW.position.y = (CH+2)/2; backW.material.side = THREE.BackSide; chamber.add(backW);
  const ceilRing = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.08, 16, 80), MAT.bronzeL);
  ceilRing.position.y = CH; ceilRing.rotation.x = Math.PI/2; chamber.add(ceilRing);
  // pedestal
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(2.7, 3.0, 0.7, 64), MAT.bronzeD);
  ped.position.y = 0.35; chamber.add(ped);
  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(2.72, 2.72, 0.06, 64), MAT.bronzeL);
  pedTop.position.y = 0.71; chamber.add(pedTop);
  // lighting
  const key = new THREE.SpotLight(0xffd8a0, 34, 24, 0.5, 0.6, 1.4); key.position.set(3, 9, 6);
  key.target.position.set(0,2,0); chamber.add(key, key.target);
  const rim = new THREE.PointLight(0xffb877, 9, 20, 2); rim.position.set(-6, 3, -3); chamber.add(rim);
  const fillp = new THREE.PointLight(0x6b8199, 3.5, 20, 2); fillp.position.set(5, 2, 6); chamber.add(fillp);
  const cs = contactShadow(4, 0.55); cs.position.y = 0.73; chamber.add(cs);
}
const modelPivot = new THREE.Group(); modelPivot.position.set(0, 0.75, 0); chamber.add(modelPivot);
let activeModel = null;

/* ---------------------------------------------------------------
   CAMERA RIG  (rig object → camera every frame; GSAP tweens rig)
--------------------------------------------------------------- */
const rig = { px:0, py:2.85, pz:12, lx:0, ly:2.85, lz:Z0 };
const POSE = { entry:{ px:0, py:2.85, pz:12, lx:0, ly:2.85, lz:Z0 } };
let chamberDist = 7.6;
let chImgSpin = 0, chImgAuto = 0;   // chamber diorama rotation: scroll-driven offset + gentle auto sway

let mode = 'load';                 // load · entry · transition · corridor · chamber · finale
let openedCount = 0;               // doors opened so far — gates how far forward you can walk
const START_Z = 2;
let targetZ = START_Z, camZ = START_Z;      // corridor camera z (target vs smoothed)
function forwardZ(){                         // furthest-forward z the camera may reach
  if (openedCount >= DOOR_Z.length) return ZEND + 5;
  return DOOR_Z[openedCount] + STOP;         // stop just before the next unopened door
}
function corridorPose(z){ return { px:0, py:1.9, pz:z, lx:0, ly:2.15, lz:z-8 }; }
function applyRig(){ camera.position.set(rig.px,rig.py,rig.pz); camera.lookAt(rig.lx,rig.ly,rig.lz); }

/* ---------------------------------------------------------------
   PORTFOLIO INDEX (HTML tool)
--------------------------------------------------------------- */
ASSETS.forEach((a,i)=>{
  const li = document.createElement('li'); li.dataset.i = i;
  li.innerHTML = `<i>${a.no}</i><span>${a.door || a.name}</span>`;
  li.addEventListener('click', ()=> gotoDoor(i, true));
  pindexList.appendChild(li);
});
const pindexItems = [...pindexList.children];
function setActiveIndex(i){
  pindexItems.forEach((li,k)=> li.classList.toggle('on', k===i));
  pindexProg.textContent = String(i+1).padStart(2,'0') + ' / ' + String(ASSETS.length).padStart(2,'0');
}

/* ---------------------------------------------------------------
   FOCUS / PLAQUE  (nearest door while walking)
--------------------------------------------------------------- */
let focusIdx = -1;
function updateFocus(){
  // focus the NEAREST reachable door (so scrolling back to an already-opened door
  // re-shows its plaque and lets you open it again)
  const maxK = Math.min(openedCount, DOOR_Z.length - 1);
  let i = -1, best = STOP + 4.5;
  for (let k = 0; k <= maxK; k++){
    const dist = Math.abs(rig.pz - (DOOR_Z[k] + STOP));
    if (dist < best){ best = dist; i = k; }
  }
  if (i < 0){ plaqueEl.classList.remove('is-on'); focusIdx = -1; return; }
  if (focusIdx !== i){ focusIdx = i; const a = ASSETS[i];
    plaqueNo.textContent = a.no; plaqueName.textContent = a.door || a.name; plaqueRegion.textContent = a.region;
    setActiveIndex(i); }
  plaqueEl.classList.add('is-on');
}

/* ---------------------------------------------------------------
   TRANSITIONS
--------------------------------------------------------------- */
function fadeTo(v, dur){ return gsap.to(fadeEl, { opacity:v, duration:dur, ease:'power1.inOut' }); }

function enterCorridor(){
  mode = 'transition';
  entryEl.classList.remove('is-on');
  const tl = gsap.timeline({ onComplete:()=>{ mode='corridor'; targetZ=camZ=rig.pz; hudEl.classList.add('is-on'); updateFocus(); } });
  tl.to(entrance.lock.rotation, { z:'+=' + Math.PI*1.3, duration:1.8, ease:'power2.inOut' }, 0);
  tl.to(entrance.pivot.rotation, { y:-Math.PI*0.62, duration:2.0, ease:'power3.inOut' }, 0.7);
  tl.to(rig, { px:0, py:1.9, pz:START_Z, lx:0, ly:1.8, lz:START_Z-8, duration:2.6, ease:'power2.inOut' }, 0.9);
}

let current = -1;
// jump straight to a door (index tool) — clears the path by opening the ones before it
function gotoDoor(i, autoOpen){
  if (mode==='chamber' || mode==='finale'){ returnToCorridor(()=> gotoDoor(i, autoOpen)); return; }
  for (let k=0;k<i;k++) doors[k].pivot.rotation.y = doors[k].openAngle;
  openedCount = Math.max(openedCount, i);
  mode = 'transition';
  gsap.to(rig, { px:0, py:1.9, pz:DOOR_Z[i]+STOP, lx:0, ly:1.8, lz:DOOR_Z[i]+STOP-8, duration:1.0, ease:'power2.inOut',
    onComplete:()=>{ targetZ=camZ=rig.pz; mode='corridor'; focusIdx=-1; updateFocus(); if(autoOpen) openChamber(i); } });
}

function openChamber(i){
  const d = doors[i]; current = i; mode='transition';
  plaqueEl.classList.remove('is-on'); walkHint.style.opacity = 0;
  const a = d.asset;
  const tl = gsap.timeline();
  tl.to(d.lock.rotation, { z:'+=' + Math.PI*1.15, duration:1.3, ease:'power2.inOut' }, 0);
  tl.to(d.pivot.rotation, { y:d.openAngle, duration:1.5, ease:'power3.inOut' }, 0.5);
  // dolly straight in toward the centred door
  tl.to(rig, { px:0, py:1.9, pz:d.z + STOP*0.45, lx:0, ly:DOOR_Y, lz:d.z, duration:1.7, ease:'power2.in' }, 0.4);
  tl.add(fadeTo(1, 0.55), 1.7);
  tl.add(()=>{
    if (a.isNext){ enterFinale(); return; }
    buildChamber(a);
    hudEl.classList.remove('is-on');
    chamberDist = 7.6;
    Object.assign(rig, { px:CHAMBER_C.x, py:2.7, pz:CHAMBER_C.z+chamberDist, lx:CHAMBER_C.x, ly:1.45, lz:CHAMBER_C.z });
    mode='chamber';
    chamberEl.classList.add('is-on'); showTab('overview');
  });
  tl.add(fadeTo(0, 0.8), '+=0.05');
}

function buildChamber(a){
  chImgSpin = 0; chImgAuto = 0; if (chAsset) chAsset.style.transform = '';   // each diorama starts front-facing
  if (activeModel){ modelPivot.remove(activeModel); disposeTree(activeModel); }
  activeModel = buildAssetModel(a); modelPivot.add(activeModel); modelPivot.rotation.y = 0;
  chNo.textContent = a.no; chName.textContent = a.name;
  // left side: markets stacked one-below-one (chambers 2 & 3), otherwise the plain label
  if (a.regionList){ chRegion.classList.add('is-list'); chRegion.innerHTML = a.regionList.map(m=>`<span>${m}</span>`).join(''); }
  else { chRegion.classList.remove('is-list'); chRegion.textContent = a.region; }
  const acc = 'rgb(' + (a.accCss || '96,178,240') + ')';
  chNo.style.color = acc;
  if (chamberEl) chamberEl.style.setProperty('--acc', a.accCss || '96,178,240');
  // phase + hero metric + the one-line difference
  if (chPhase) chPhase.textContent = a.phase || '';
  if (chMetric) chMetric.textContent = a.metric || '';
  if (chMetricSub) chMetricSub.textContent = a.metricSub || '';
  if (chDiff) chDiff.textContent = a.diff || '';
  // 4-step progression — shows where THIS chamber sits in the journey
  if (chSteps){
    const idx = ASSETS.indexOf(a);
    chSteps.innerHTML = ASSETS.map((x,i) =>
      `<span class="cstep ${i===idx?'is-on':''} ${i<idx?'is-done':''}"><i></i>${x.name.replace(/^The /,'')}</span>`
    ).join('<span class="cstep__link"></span>');
  }
  // Asset display, best → fallback: (1) turntable SPIN VIDEO, (2) realistic STILL, (3) 3D model.
  // Each layer only takes over once it actually loads, so a missing video falls back to the
  // still, and a missing still falls back to the stylized model — no broken media, ever.
  modelPivot.visible = true;
  if (chAssetWrap) chAssetWrap.classList.remove('is-on');
  if (chamberEl) chamberEl.classList.remove('has-img','has-vid');
  if (chAsset){ chAsset.onload = chAsset.onerror = null; chAsset.removeAttribute('src'); }
  if (chAssetVid){ chAssetVid.onloadeddata = chAssetVid.onerror = null; try{ chAssetVid.pause(); }catch(_){} chAssetVid.classList.remove('is-on'); chAssetVid.removeAttribute('src'); try{ chAssetVid.load(); }catch(_){} }

  const showModel = () => { if(chAssetWrap) chAssetWrap.classList.remove('is-on'); modelPivot.visible = true; if(chamberEl) chamberEl.classList.remove('has-img','has-vid'); };
  const showStill = () => {
    if (!(a.img && chAsset && chAssetWrap)) { showModel(); return; }
    const want = a.img;
    chAsset.onload = () => {
      if (chAsset.getAttribute('src') !== want) return;       // stale load guard
      chAssetWrap.classList.add('is-on'); modelPivot.visible = false;
      if (chamberEl) chamberEl.classList.add('has-img');
    };
    chAsset.onerror = showModel;                               // no still yet → keep the model
    chAsset.src = want;
  };
  if (a.vid && chAssetVid && chAssetWrap){
    const wantV = a.vid;
    // preload the still underneath so the turntable fades in over a real frame, never a black gap
    showStill();
    chAssetVid.onloadeddata = () => {
      if (chAssetVid.getAttribute('src') !== wantV) return;    // stale load guard
      chAssetWrap.classList.add('is-on'); modelPivot.visible = false;
      chAssetVid.classList.add('is-on');
      if (chamberEl) chamberEl.classList.add('has-img','has-vid');
      const p = chAssetVid.play(); if (p && p.catch) p.catch(()=>{});
    };
    chAssetVid.onerror = () => { chAssetVid.classList.remove('is-on'); if(chamberEl) chamberEl.classList.remove('has-vid'); }; // no spin video yet → still stays
    chAssetVid.src = wantV; try{ chAssetVid.load(); }catch(_){}
  } else {
    showStill();
  }
}

function returnToCorridor(after){
  const d = doors[current];
  mode='transition';
  const tl = gsap.timeline();
  tl.add(fadeTo(1, 0.5), 0);
  tl.add(()=>{
    chamberEl.classList.remove('is-on'); finaleEl.classList.remove('is-on');
    if (activeModel){ modelPivot.remove(activeModel); disposeTree(activeModel); activeModel=null; }
    if (d){ d.pivot.rotation.y = d.openAngle;            // you step back out through the open door…
            openedCount = Math.max(openedCount, current+1);
            targetZ = camZ = d.z + STOP; }                // …then scrolling back closes it (render loop) so it can be reopened
    Object.assign(rig, corridorPose(camZ));
    mode='corridor'; hudEl.classList.add('is-on'); walkHint.style.opacity=''; focusIdx=-1; updateFocus();
  });
  tl.add(fadeTo(0, 0.7), '+=0.05');
  if (after) tl.add(after, '+=0.1');
}

let trFxRAF = 0, trFxOn = false;
function startTreasuryFx(){
  // twinkling starfield behind the scene — fills any letterbox bars when the image is zoomed out
  var starHost = document.getElementById('trxStars');
  if (starHost && !starHost.childElementCount){
    var frag = document.createDocumentFragment();
    for (var si=0; si<130; si++){
      var s = document.createElement('i');
      var sz = (Math.random()*1.7+0.6).toFixed(1);
      s.style.left = (Math.random()*100).toFixed(2)+'%';
      s.style.top  = (Math.random()*100).toFixed(2)+'%';
      s.style.width = sz+'px'; s.style.height = sz+'px';
      s.style.setProperty('--tw', (2.4+Math.random()*3.8).toFixed(2)+'s');
      s.style.setProperty('--dl', (Math.random()*4).toFixed(2)+'s');
      frag.appendChild(s);
    }
    starHost.appendChild(frag);
  }
  // rising gold-dust particles
  const cv = document.getElementById('finaleFx');
  if (cv && !trFxOn){
    trFxOn = true;
    const ctx = cv.getContext('2d'); const DPR = Math.min(window.devicePixelRatio||1, 2);
    const resize = ()=>{ cv.width = innerWidth*DPR; cv.height = innerHeight*DPR; };
    resize(); addEventListener('resize', resize);
    const N = 96, P = [];
    for (let i=0;i<N;i++) P.push({ x:Math.random()*cv.width, y:Math.random()*cv.height,
      r:(Math.random()*1.6+0.5)*DPR, s:(Math.random()*0.55+0.12)*DPR, tw:Math.random()*6.28 });
    const loop = ()=>{
      ctx.clearRect(0,0,cv.width,cv.height);
      for (const p of P){
        p.y -= p.s; p.tw += 0.03; p.x += Math.sin(p.tw)*0.12*DPR;
        if (p.y < -6){ p.y = cv.height+6; p.x = Math.random()*cv.width; }
        const a = Math.max(0, 0.34 + Math.sin(p.tw)*0.3);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.2832);
        ctx.shadowColor = 'rgba(244,206,120,0.9)'; ctx.shadowBlur = 6*DPR;
        ctx.fillStyle = 'rgba(245,216,142,'+a.toFixed(2)+')'; ctx.fill();
      }
      trFxRAF = requestAnimationFrame(loop);
    };
    cancelAnimationFrame(trFxRAF); loop();
  }
  // count-up every number ($1$100 Mil, 1,500 Doors, 12, 39, 460, 75, 800) — reset to 0, then
  // animate AFTER the finale has faded in, over a clearly-visible ~2.2s, so the count actually shows.
    document.querySelectorAll('#finale [data-count]').forEach(function(el, idx){
    var target = +el.getAttribute('data-count');
    var pre = el.getAttribute('data-pre') || '';
    var suf = el.getAttribute('data-suf') || '';
    // reserve the FINAL width first so the number never reflows/jitters while counting (smooth, no glitch)
    el.textContent = pre + target.toLocaleString() + suf;
    el.style.display = 'inline-block';
    el.style.minWidth = Math.ceil(el.getBoundingClientRect().width) + 'px';
    el.style.textAlign = 'center';
    el.textContent = pre + '0' + suf;
    setTimeout(function(){
      var t0 = performance.now(), dur = 2400;
      function tick(t){
        var k = Math.min(1, (t - t0) / dur);
        var e = 1 - Math.pow(1 - k, 3);
        var val = k < 1 ? Math.round(target * e) : target;
        el.textContent = pre + val.toLocaleString() + suf;
        if(k < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 900 + idx * 55);
  });
  }
function enterFinale(){
  mode='finale';
  chamberEl.classList.remove('is-on'); hudEl.classList.remove('is-on');
  startTreasuryFx();
  openedCount = DOOR_Z.length;
  const lastDoor = doors[DOOR_Z.length-1];
  Object.assign(rig, { px:0, py:1.9, pz:lastDoor.z + STOP*0.5, lx:0, ly:DOOR_Y, lz:lastDoor.z });
  finaleEl.classList.add('is-on');
  fadeTo(0, 1.0);
}

function disposeTree(root){ root.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose && m.dispose()); } }); }

/* ---------------------------------------------------------------
   CHAMBER TABS / PANEL
--------------------------------------------------------------- */
const LOCK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="1.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
function lockedRow(){ return `<span class="pfield__v locked">${LOCK_SVG} Disclosed to qualified investors</span>`; }
function fieldVal(v){
  if (v && typeof v === 'object'){
    if (v.chips) return `<div class="pchips">${v.chips.map(c=>{ const t=(typeof c==='object')?c.t:c; const hi=(typeof c==='object'&&c.hi)?' is-hi':''; return `<span class="pchip${hi}">${t}</span>`; }).join('')}</div>`;
    if (v.stack) return `<div class="pstack">${v.stack.map(x=> `<span>${x}</span>`).join('')}</div>`;
    if (v.lines) return `<div class="plines">${v.lines.map(l=> `<span>${l}</span>`).join('')}</div>`;
  }
  return `<div class="pfield__v">${v}</div>`;
}
function field(k, v, locked){ return `<div class="pfield"><div class="pfield__k">${k}</div>${ locked ? lockedRow() : fieldVal(v) }</div>`; }

function panelHTML(a, tab){
  switch(tab){
    case 'overview':
      return `<div class="panel__tag">${a.tag || ''}</div>`
        + field('Status', a.status)
        + (a.overview ? a.overview.map(([k,v])=> field(k, v)).join('') : '');
    case 'strategy': {
      let s = `<div class="pfield"><div class="pfield__k">${a.stratLabel || 'Strategy'}</div>`;
      if (a.stratFlow) s += `<div class="pflowline">${a.stratFlow.map((x,i)=> `<b>${x}</b>${i<a.stratFlow.length-1?'<i>&rarr;</i>':''}`).join('')}</div>`;
      if (a.stratList) s += `<div class="pstratlist">${a.stratList.map(x=> `<span>${x}</span>`).join('')}</div>`;
      s += `</div>`;
      return s;
    }
    case 'performance':
      return field('Occupancy', null, true) + field('Revenue', null, true) + field('NOI', null, true)
        + `<p class="panel__note">Disclosed to qualified investors and buyers · released under NDA.</p>`;
    case 'asset':
      return field('Model', 'Abstract massing') + field('Unit-level detail', null, true)
        + `<p class="panel__note">The model to the left is an abstract massing — not a survey drawing.</p>`;
  }
  return '';
}
let curTab='overview';
function showTab(tab){
  curTab = tab;
  [...chTabs.children].forEach(b=> b.classList.toggle('is-on', b.dataset.tab===tab));
  chPanel.innerHTML = panelHTML(ASSETS[current], tab);
  if (chamberEl){ ['overview','strategy','performance','asset'].forEach(t=> chamberEl.classList.toggle('tab-'+t, t===tab)); }
}
chTabs.addEventListener('click', e=>{ const b=e.target.closest('.ctab'); if(!b) return; showTab(b.dataset.tab);
  // on mobile the chamber scrolls — jump down to the freshly-changed data so the user sees it change
  if (innerWidth <= 760 && chamberEl){ setTimeout(()=>{ const pr=chPanel.getBoundingClientRect();
    chamberEl.scrollBy({ top: pr.top - 96, behavior:'smooth' }); }, 70); }
});

/* ---------------------------------------------------------------
   INPUT
--------------------------------------------------------------- */
$('#enterBtn').addEventListener('click', enterCorridor);
$('#openBtn').addEventListener('click', ()=>{ if(focusIdx>=0) openChamber(focusIdx); });
$('#returnBtn').addEventListener('click', ()=> returnToCorridor());
$('#finaleBack').addEventListener('click', ()=> returnToCorridor());

  // Treasury cinematic view toggle
  const trViewToggle = document.getElementById('trViewToggle');
  const trViewText = document.getElementById('trViewText');
  if (trViewToggle){
    trViewToggle.addEventListener('click', ()=>{
      const isCinematic = finaleEl.classList.toggle('is-cinematic');
      if (trViewText) trViewText.textContent = isCinematic ? 'Show Details' : 'Cinematic View';
    });
  }


// scroll to walk (corridor) / zoom (chamber)
const MB = () => innerWidth <= 760;   // on phones the chamber scrolls its content instead of rotating the diorama
addEventListener('wheel', e=>{
  if (mode==='corridor'){ targetZ = THREE.MathUtils.clamp(targetZ - e.deltaY*0.01, forwardZ(), START_Z); }
  else if (mode==='chamber' && !MB()){
    if (chamberEl.classList.contains('has-img')) chImgSpin = THREE.MathUtils.clamp(chImgSpin + e.deltaY*0.06, -34, 34);
    else chamberDist = THREE.MathUtils.clamp(chamberDist + e.deltaY*0.004, 4.5, 11);
  }
}, { passive:true });

// touch to walk
let ty=0;
addEventListener('touchstart', e=>{ ty=e.touches[0].clientY; }, {passive:true});
addEventListener('touchmove', e=>{ const dy=ty-e.touches[0].clientY; ty=e.touches[0].clientY;
  if (mode==='corridor') targetZ=THREE.MathUtils.clamp(targetZ - dy*0.03, forwardZ(), START_Z);
  else if (mode==='chamber' && !MB()){
    if (chamberEl.classList.contains('has-img')) chImgSpin=THREE.MathUtils.clamp(chImgSpin - dy*0.2, -34, 34);
    else chamberDist=THREE.MathUtils.clamp(chamberDist-dy*0.01,4.5,11);
  } }, {passive:true});

// raycast: click a door to enter · drag to rotate model
const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
let down=false, moved=false, sx=0, sy=0;
addEventListener('pointerdown', e=>{ down=true; moved=false; sx=e.clientX; sy=e.clientY; });
addEventListener('pointermove', e=>{
  if (!down) return; const dx=e.clientX-sx, dy=e.clientY-sy;
  if (Math.abs(dx)+Math.abs(dy) > 4) moved=true;
  if (mode==='chamber' && activeModel){ modelPivot.rotation.y += dx*0.008; modelPivot.rotation.x = THREE.MathUtils.clamp(modelPivot.rotation.x + dy*0.004, -0.4, 0.5); sx=e.clientX; sy=e.clientY; }
});
addEventListener('pointerup', e=>{
  down=false;
  if (moved) return;
  if (mode==='corridor'){
    ptr.set((e.clientX/innerWidth)*2-1, -(e.clientY/innerHeight)*2+1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(doors.map(d=>d.pivot), true)[0];
    if (hit){ let o=hit.object; while(o && o.userData.doorIndex===undefined) o=o.parent;
      if (o){ const i=o.userData.doorIndex;
        const near = Math.abs(rig.pz - (DOOR_Z[i]+STOP)) < (STOP+3);
        if (near && i<=openedCount) openChamber(i);   // open (or re-open) the door you're standing at
        else gotoDoor(i, true); } }
  }
});

addEventListener('resize', ()=>{ camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth,innerHeight); composer.setSize(innerWidth,innerHeight); bloomPass.setSize(innerWidth,innerHeight); });

/* ---------------------------------------------------------------
   LOADER  → reveal entrance
--------------------------------------------------------------- */
const loaderFill = $('#loaderFill'), seqLis = [...document.querySelectorAll('.loader__seq li')];
let lp = 0;
const loadTimer = setInterval(()=>{
  lp += 0.6 + Math.random()*3.4; if (lp>100) lp=100;
  loaderFill.style.width = lp+'%';
  seqLis.forEach((li,i)=> li.classList.toggle('on', lp > (i*30+8)));
  if (lp>=100){ clearInterval(loadTimer);
    setTimeout(()=>{ loaderEl.classList.remove('is-on'); entryEl.classList.add('is-on'); mode='entry';
      Object.assign(rig, POSE.entry); }, 500);
  }
}, 90);

/* ---------------------------------------------------------------
   RENDER LOOP
--------------------------------------------------------------- */
const clock = new THREE.Clock();
function frame(){
  const dt = Math.min(clock.getDelta(), 0.05);
  if (mode==='corridor'){
    camZ += (targetZ - camZ)*0.09;
    const p = corridorPose(camZ);
    rig.px += (p.px-rig.px)*0.12; rig.py += (p.py-rig.py)*0.12; rig.pz += (p.pz-rig.pz)*0.12;
    rig.lx += (p.lx-rig.lx)*0.12; rig.ly += (p.ly-rig.ly)*0.12; rig.lz += (p.lz-rig.lz)*0.12;
    // scroll back away from an open door → it swings shut, ready to open again
    for (const d of doors){
      if (d.pivot.rotation.y < -0.01 && camZ > d.z + STOP + 2.0){
        d.pivot.rotation.y += (0 - d.pivot.rotation.y) * 0.1;
        if (d.pivot.rotation.y > -0.01) d.pivot.rotation.y = 0;
      }
    }
    updateFocus();
  } else if (mode==='chamber'){
    rig.pz += (CHAMBER_C.z+chamberDist - rig.pz)*0.1;
    if (activeModel){ activeModel.rotation.y += dt*(activeModel.userData.spin||0.14); }
    else if (chAsset && chamberEl.classList.contains('has-img') && !chamberEl.classList.contains('has-vid')){
      chImgAuto += dt;
      const rot = Math.sin(chImgAuto*0.75)*18 + chImgSpin;   // medium-speed 3D turntable sway + scroll-driven turn
      chAsset.style.transform = 'perspective(2000px) rotateY(' + rot.toFixed(2) + 'deg)';
    }
  } else if (mode==='entry'){
    rig.pz += (10.5 - rig.pz)*0.01;   // slow breathing push toward the entrance door
  }
  // gentle lock idle shimmer on entrance while waiting
  applyRig();
  renderScene();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---- debug hook (deterministic render for verification; harmless) ---- */
window.__V = {
  toDoor(i=0){ loaderEl.classList.remove('is-on'); entryEl.classList.remove('is-on');
    for(let k=0;k<i;k++) doors[k].pivot.rotation.y = doors[k].openAngle;
    openedCount=i; targetZ=camZ=DOOR_Z[i]+STOP; mode='corridor'; hudEl.classList.add('is-on');
    Object.assign(rig, corridorPose(camZ)); updateFocus(); applyRig(); renderScene(); },
  toEntry(){ loaderEl.classList.remove('is-on'); entryEl.classList.remove('is-on'); mode='entry';
    Object.assign(rig, POSE.entry); applyRig(); renderScene(); },
  toChamber(i=0){ current=i; buildChamber(ASSETS[i]); chamberDist=6.4;
    Object.assign(rig,{px:CHAMBER_C.x,py:2.7,pz:CHAMBER_C.z+7.6,lx:CHAMBER_C.x,ly:1.45,lz:CHAMBER_C.z});
    mode='chamber'; hudEl.classList.remove('is-on'); chamberEl.classList.add('is-on'); showTab('overview');
    applyRig(); renderScene(); },
  render(){ applyRig(); renderScene(); },
  get mode(){ return mode; }
};
