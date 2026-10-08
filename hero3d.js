/* ============================================================
   TERAMERGE — CANOPY hero · "digital operating system" (WebGL)
   A real 3D object for the sentence "plug assets into our digital
   operating system": a central intelligence CORE, slim asset-
   TOWERS orbiting it on tilted rings, thin data-LINES connecting
   them to the core. Real depth, slow rotation, mouse parallax.
   Transparent over the forest; sage + bone palette (no neon).
   ============================================================ */
import * as THREE from 'three';

const canvas = document.getElementById('hero3d');
function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }

if (canvas && hasWebGL()) {
  // hide the CSS fallback orbit — WebGL takes over
  document.querySelectorAll('.orbit__ring,.orbit__core,.orbit__spin').forEach(e => e.style.display = 'none');

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const SAGE = 0xC9D4B5, BONE = 0xF1ECE2, SAGEc = new THREE.Color(SAGE);

  const renderer = new THREE.WebGLRenderer({ canvas, alpha:true, antialias:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0a0d09, 6.5, 13);
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0.5, 6.4);

  scene.add(new THREE.HemisphereLight(0x404a37, 0x0a0d08, 0.9));
  const key = new THREE.DirectionalLight(0xf3efe2, 1.1); key.position.set(2.5, 3.5, 4); scene.add(key);
  const rim = new THREE.DirectionalLight(SAGE, 0.5); rim.position.set(-3, -1, -2); scene.add(rim);

  const group = new THREE.Group(); scene.add(group);

  /* ---- central intelligence core ---- */
  const coreGeo = new THREE.IcosahedronGeometry(0.62, 1);
  const core = new THREE.Mesh(coreGeo, new THREE.MeshStandardMaterial({
    color:0x28301f, emissive:SAGE, emissiveIntensity:0.42, metalness:0.35, roughness:0.45, flatShading:true }));
  group.add(core);
  core.add(new THREE.LineSegments(new THREE.EdgesGeometry(coreGeo),
    new THREE.LineBasicMaterial({ color:SAGE, transparent:true, opacity:0.55 })));
  // soft glow behind the core
  const gc = document.createElement('canvas'); gc.width = gc.height = 128;
  const gx = gc.getContext('2d'); const gg = gx.createRadialGradient(64,64,0,64,64,64);
  gg.addColorStop(0,'rgba(201,212,181,0.55)'); gg.addColorStop(1,'rgba(201,212,181,0)');
  gx.fillStyle = gg; gx.fillRect(0,0,128,128);
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map:new THREE.CanvasTexture(gc), transparent:true, opacity:0.5, depthWrite:false, blending:THREE.AdditiveBlending }));
  glow.scale.set(3.4,3.4,1); group.add(glow);

  /* ---- tilted orbital rings + asset towers ---- */
  const ringDefs = [
    { r:1.5, tilt:[0.62, 0.15, 0.05], n:2, sp:0.28 },
    { r:2.1, tilt:[-0.5, 0.55, 0.2],  n:3, sp:-0.2 },
    { r:2.75,tilt:[0.34,-0.5, 0.12],  n:2, sp:0.15 },
  ];
  const towerMat = new THREE.MeshStandardMaterial({ color:0xe3e6d6, emissive:SAGE, emissiveIntensity:0.12, metalness:0.25, roughness:0.55 });
  const towers = [];   // {mesh, holder, r, ang, sp}
  ringDefs.forEach(d => {
    const holder = new THREE.Group(); holder.rotation.set(d.tilt[0], d.tilt[1], d.tilt[2]); group.add(holder);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(d.r, 0.006, 8, 96),
      new THREE.MeshBasicMaterial({ color:SAGE, transparent:true, opacity:0.26 }));
    holder.add(ring);
    for (let i=0;i<d.n;i++){
      const h = 0.24 + Math.random()*0.26;
      const t = new THREE.Mesh(new THREE.BoxGeometry(0.13, h, 0.13), towerMat);
      t.add(new THREE.LineSegments(new THREE.EdgesGeometry(t.geometry), new THREE.LineBasicMaterial({ color:BONE, transparent:true, opacity:0.35 })));
      holder.add(t);
      towers.push({ mesh:t, holder, r:d.r, ang:Math.random()*Math.PI*2, sp:d.sp*(0.8+Math.random()*0.5) });
    }
  });

  /* ---- data lines: core → each tower (updated per frame) ---- */
  const linePos = new Float32Array(towers.length * 2 * 3);
  const lineGeo = new THREE.BufferGeometry(); lineGeo.setAttribute('position', new THREE.BufferAttribute(linePos, 3));
  const lines = new THREE.LineSegments(lineGeo, new THREE.LineBasicMaterial({ color:SAGE, transparent:true, opacity:0.16 }));
  group.add(lines);
  // a pulse of light that travels the line occasionally
  const pulseGeo = new THREE.BufferGeometry(); const pulsePos = new Float32Array(towers.length*3);
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos,3));
  const pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({ color:BONE, size:0.07, transparent:true, opacity:0.9, depthWrite:false, blending:THREE.AdditiveBlending }));
  group.add(pulses);

  /* ---- sizing ---- */
  function resize(){
    const r = canvas.getBoundingClientRect();
    if (r.width < 2) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height; camera.updateProjectionMatrix();
  }
  resize(); addEventListener('resize', resize);

  /* ---- mouse parallax + visibility gating ---- */
  let tmx=0, tmy=0, mx=0, my=0;
  addEventListener('pointermove', e => { tmx = e.clientX/innerWidth - 0.5; tmy = e.clientY/innerHeight - 0.5; }, { passive:true });
  let onScreen = true;
  new IntersectionObserver(es => { onScreen = es[0].isIntersecting; }, { threshold:0.02 }).observe(canvas);

  const tmp = new THREE.Vector3();
  let t = 0, last = performance.now();
  function loop(now){
    requestAnimationFrame(loop);
    if (!onScreen || document.hidden) { last = now; return; }
    const dt = Math.min((now - last)/1000, 0.05); last = now; t += dt;
    mx += (tmx - mx) * 0.05; my += (tmy - my) * 0.05;

    if (!reduce){
      group.rotation.y = t * 0.12 + mx * 0.6;
      group.rotation.x = -0.06 + my * 0.32;
      core.rotation.y += dt * 0.25; core.rotation.x += dt * 0.12;
    } else { group.rotation.set(-0.06, 0.5, 0); }

    // orbit towers + rebuild lines/pulses in group space
    for (let i=0;i<towers.length;i++){
      const tw = towers[i];
      if (!reduce) tw.ang += tw.sp * dt;
      tw.mesh.position.set(Math.cos(tw.ang)*tw.r, 0, Math.sin(tw.ang)*tw.r);
      // towers stand upright on their tilted ring (like buildings on a disc)
      // tower position in GROUP space (holder has rotation only)
      tmp.copy(tw.mesh.position).applyEuler(tw.holder.rotation);
      linePos[i*6+0]=0; linePos[i*6+1]=0; linePos[i*6+2]=0;
      linePos[i*6+3]=tmp.x; linePos[i*6+4]=tmp.y; linePos[i*6+5]=tmp.z;
      const k = (Math.sin(t*0.8 + i*1.7)*0.5 + 0.5);   // 0..1 travel toward core
      pulsePos[i*3+0]=tmp.x*k; pulsePos[i*3+1]=tmp.y*k; pulsePos[i*3+2]=tmp.z*k;
    }
    lineGeo.attributes.position.needsUpdate = true;
    pulseGeo.attributes.position.needsUpdate = true;

    camera.position.x += (mx*1.1 - camera.position.x) * 0.05;
    camera.position.y += (0.5 - my*0.7 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(loop);
}
