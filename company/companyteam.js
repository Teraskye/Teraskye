/* ============================================================
   TERASKYE — COMPANY · embedded TEAM scan (scroll-reveal)
   As the #team track scrolls in, the world dissolves from the
   dawn horizon into a black-and-blue data-point space where the
   team's portraits appear as volumetric 3D face-scans. Scroll
   moves through the people; scroll past and the horizon returns.
   Original environment; the photos are the team's own. No build.
   ============================================================ */
import * as THREE from 'three';
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const smooth=(e0,e1,x)=>{ const t=clamp((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------------- team data (roles are the headline; add names when ready) ---------------- */
const TEAM=[
  { no:'01', role:'Chief Executive Officer',        bio:"Sets the vision and leads Teraskye's growth.",                                   img:'../team/img/p1.jpg' },
  { no:'02', role:'Chief Technology Officer',       bio:'Builds the systems that turn real-estate data into intelligence.',               img:'../team/img/p2.jpg' },
  { no:'03', role:'Chief Investment Officer',       bio:'Leads opportunity evaluation, investment strategy, and capital decisions.',      img:'../team/img/p3.jpg' },
  { no:'04', role:'Chief Operating Officer',        bio:'Turns strategy into disciplined execution across assets and operations.',        img:'../team/img/p4.jpg' },
  { no:'05', role:'Head of Growth & Partnerships',  bio:'Builds relationships with owners, operators, investors, and strategic partners.', img:'../team/img/p5.jpg' },
];
const N=TEAM.length;

const sec=$('team'), stage=$('teamstage'), canvas=$('teamscene');
function hasWebGL(){ try{ const c=document.createElement('canvas'); return !!(window.WebGLRenderingContext&&(c.getContext('webgl2')||c.getContext('webgl'))); }catch(e){ return false; } }
if(!sec||!stage||!canvas||!hasWebGL()){ /* fallback list stays visible; horizon theme keeps its dawn */ }
else{
  sec.classList.add('teamsec--immersive');           // makes the track tall + hides the text fallback

  /* ---------------- renderer + scene ---------------- */
  const renderer=new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true, powerPreference:'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.75)); renderer.setSize(innerWidth,innerHeight);
  renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=1.05;
  renderer.setClearColor(0x000000, 1);

  const scene=new THREE.Scene(); scene.fog=new THREE.FogExp2(0x000000,0.055);
  const camera=new THREE.PerspectiveCamera(46, innerWidth/innerHeight, 0.1, 100); camera.position.set(0,0,7);
  const bg=new THREE.Group(); scene.add(bg);

  /* ---- scanning data-point field (blue) ---- */
  const scanU={ uScan:{value:-18}, uTime:{value:0}, uColor:{value:new THREE.Color(0x6ea8ff)}, uPix:{value:Math.min(devicePixelRatio,1.75)} };
  (()=>{
    const nx=16, ny=9, nz=13, pos=[];
    for(let ix=0;ix<nx;ix++)for(let iy=0;iy<ny;iy++)for(let iz=0;iz<nz;iz++){
      const x=(ix/(nx-1)-0.5)*34 + (Math.random()-0.5)*0.6;
      const y=(iy/(ny-1)-0.5)*13 + (Math.random()-0.5)*0.5;
      const z=-24 + iz/(nz-1)*16 + (Math.random()-0.5)*0.6;
      if(Math.abs(x)<4.5 && Math.random()<0.72) continue;             // keep central corridor black
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

  /* ---- faint vertical data-rain columns ---- */
  (()=>{
    const segs=[]; for(let i=0;i<24;i++){
      const x=(Math.random()<0.5?-1:1)*(6+Math.random()*9), y=(Math.random()-0.5)*10, z=-9-Math.random()*7, len=1.2+Math.random()*3.2;
      segs.push(x,y+len/2,z, x,y-len/2,z);
    }
    const g=new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(segs,3));
    bg.add(new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color:0x2f5da0, transparent:true, opacity:0.2, blending:THREE.AdditiveBlending, depthWrite:false })));
  })();

  /* ---- deep-blue depth glow ---- */
  function glowTex(){ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d');
    const g=x.createRadialGradient(64,64,0,64,64,64); g.addColorStop(0,'rgba(90,150,255,0.5)'); g.addColorStop(1,'rgba(90,150,255,0)');
    x.fillStyle=g; x.fillRect(0,0,128,128); return new THREE.CanvasTexture(c); }
  const glow=new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTex(), transparent:true, opacity:0.05, depthWrite:false, blending:THREE.AdditiveBlending }));
  glow.scale.set(9,9,1); glow.position.set(-5,1,-12); bg.add(glow);
  const glow2=glow.clone(); glow2.material=glow.material.clone(); glow2.material.opacity=0.035; glow2.scale.set(12,12,1); glow2.position.set(6,-1,-14); bg.add(glow2);

  /* ---------------- portraits — volumetric blue face-scans ---------------- */
  const PWv=2.7, portraits=new THREE.Group(); scene.add(portraits);
  const items=[]; let built=0;
  function buildFace(item,url){
    const img=new Image(); img.decoding='async';
    img.onload=()=>{
      const W=150, H=Math.round(W*img.naturalHeight/img.naturalWidth);
      const cv=document.createElement('canvas'); cv.width=W; cv.height=H;
      const cx=cv.getContext('2d',{willReadFrequently:true}); cx.drawImage(img,0,0,W,H);
      let data=null; try{ data=cx.getImageData(0,0,W,H).data; }catch(e){}
      const PHv=PWv*H/W, pos=[], bri=[];
      if(data){
        for(let y=0;y<H;y++)for(let x=0;x<W;x++){
          const ex=(x/W-0.5)/0.47, ey=(y/H-0.44)/0.53, rr=ex*ex+ey*ey;
          if(rr>1) continue;
          const i=(y*W+x)*4, lum=(0.299*data[i]+0.587*data[i+1]+0.114*data[i+2])/255;
          if(lum<0.17) continue;
          const vig=Math.pow(1-rr,0.55);
          const bulge=Math.sqrt(Math.max(0,1-rr))*1.35;              // rounded 3D head volume
          const relief=(lum-0.44)*0.85;                             // lit features push forward
          pos.push((x/W-0.5)*PWv, (0.5-y/H)*PHv, bulge+relief+(Math.random()-0.5)*0.04);
          bri.push(Math.min(1, lum*vig*1.2));
        }
      }
      const g=new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos,3));
      g.setAttribute('aBright', new THREE.Float32BufferAttribute(bri,1));
      const uni={ uDim:{value:1}, uScanY:{value:PHv}, uPix:{value:Math.min(devicePixelRatio,1.75)},
                  uLo:{value:new THREE.Color(0x0a2c66)}, uHi:{value:new THREE.Color(0xaecff5)} };
      const mat=new THREE.ShaderMaterial({ uniforms:uni, transparent:true, depthWrite:false, blending:THREE.AdditiveBlending,
        vertexShader:`attribute float aBright; varying float vB; uniform float uScanY,uDim,uPix;
          void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0);
            float scan=smoothstep(0.30,0.0,abs(position.y-uScanY));
            vB=aBright*(0.52+scan*0.6)*uDim;
            gl_PointSize=(aBright*0.4+0.45+scan*0.55)*uPix*(30.0/max(-mv.z,0.1));
            gl_Position=projectionMatrix*mv; }`,
        fragmentShader:`varying float vB; uniform vec3 uLo,uHi;
          void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c); if(d>0.5) discard;
            float a=smoothstep(0.5,0.08,d); float b=clamp(vB,0.0,1.0);
            gl_FragColor=vec4(mix(uLo,uHi,b), a*b*0.85); }`
      });
      item.g.add(new THREE.Points(g,mat)); item.uni=uni; item.ph=PHv; built++;
    };
    img.src=url;
  }
  TEAM.forEach(m=>{ const g=new THREE.Group(); portraits.add(g); const item={g,uni:null,ph:PWv*4/3}; items.push(item); buildFace(item,m.img); });

  /* ---- ambient dust ---- */
  const DN=reduce?60:180, dg=new THREE.BufferGeometry(), dp=new Float32Array(DN*3), dv=new Float32Array(DN);
  for(let i=0;i<DN;i++){ dp[i*3]=(Math.random()-0.5)*24; dp[i*3+1]=(Math.random()-0.5)*10; dp[i*3+2]=(Math.random()-0.5)*16-2; dv[i]=0.05+Math.random()*0.12; }
  dg.setAttribute('position',new THREE.BufferAttribute(dp,3));
  const dust=new THREE.Points(dg, new THREE.PointsMaterial({ color:0x7fb0ff, size:0.018, transparent:true, opacity:0.22, depthWrite:false }));
  scene.add(dust);

  /* ---------------- carousel layout (scroll-driven) ---------------- */
  let progress=0, mx=0, my=0, mxT=0, myT=0, tNow=0;
  const SP=3.6;
  function layout(){
    items.forEach((it,i)=>{
      const off=i-progress, a=Math.abs(off), act=Math.max(0,1-a);
      it.g.position.x = off*SP + mx*0.22*(1-Math.min(a,1));
      it.g.position.z = -a*2.0 + act*0.9;                            // active toward camera, others recede
      it.g.position.y = my*0.16*(1-Math.min(a,1));
      const s=1-Math.min(a,1.4)*0.26; it.g.scale.setScalar(s);
      it.g.rotation.y = -off*0.16 + mx*0.45*act + Math.sin(tNow*0.0004)*0.06*act;
      it.g.rotation.x = -my*0.30*act + Math.sin(tNow*0.0006+1.3)*0.03*act;
      if(it.uni) it.uni.uDim.value = 1-Math.min(a*0.55,0.8);
      it.g.visible = a<2.6;
    });
  }
  addEventListener('pointermove', e=>{ mxT=(e.clientX/innerWidth-0.5); myT=(e.clientY/innerHeight-0.5); }, {passive:true});

  /* ---------------- HUD (dots + per-member text) ---------------- */
  const dotsEl=$('tmDots'); if(dotsEl){ dotsEl.innerHTML=TEAM.map(()=>'<span></span>').join(''); }
  const dotEls=dotsEl?[...dotsEl.children]:[];
  let shown=-1;
  function setActive(i){
    if(i===shown) return; shown=i; const m=TEAM[i];
    const info=$('tmInfo'); if(info) info.classList.add('sw');
    setTimeout(()=>{
      const R=$('tmRole'), B=$('tmBio'), I=$('tmIdx'), BR=$('tmBar');
      if(R) R.textContent=m.role; if(B) B.textContent=m.bio;
      if(I) I.textContent='[[ '+m.no+' / 0'+N+' ]]';
      if(BR) BR.style.width=((i+1)/N*100)+'%';
      if(info) info.classList.remove('sw');
    }, 150);
    dotEls.forEach((d,di)=>d.classList.toggle('on', di===i));
  }
  setActive(0);

  /* ---------------- scroll controller ---------------- */
  let op=0;
  function controller(){
    const vh=innerHeight, r=sec.getBoundingClientRect();
    const span=Math.max(1, sec.offsetHeight - vh);
    const raw=-r.top/span;                                            // 0 entering → 1 leaving
    // stage opacity: fade the world into black-blue, hold, fade back to horizon
    op = (raw<=0||raw>=1) ? 0 : Math.min(smooth(0,0.09,raw), smooth(1,0.9,raw));
    stage.style.opacity=op.toFixed(3);
    stage.style.visibility = op>0.003 ? 'visible' : 'hidden';
    // which member (window 0.16 → 0.9)
    const mf = clamp((raw-0.16)/(0.9-0.16),0,1)*(N-1);
    progress += (mf-progress)*0.14;
    // title (entry) vs member info (body) cross-fade
    const titleOp = clamp(1-Math.abs(raw-0.08)/0.08,0,1);
    const infoOp  = smooth(0.15,0.2,raw)*smooth(0.95,0.9,raw);
    const T=$('tmTitle'), IN=$('tmInfo'), C=$('tmCue');
    if(T)  T.style.opacity=titleOp.toFixed(3);
    if(IN) IN.style.opacity=infoOp.toFixed(3);
    if(C)  C.style.opacity=(infoOp*clamp((0.8-raw)/0.1,0,1)).toFixed(3);
    setActive(clamp(Math.round(progress),0,N-1));
  }

  /* ---------------- loop ---------------- */
  let last=performance.now();
  function loop(now){
    requestAnimationFrame(loop);
    const dt=Math.min(0.05,(now-last)/1000); last=now; tNow=now;
    controller();
    if(op<=0.003) return;                                            // asleep while horizon shows
    mx+=(mxT-mx)*Math.min(1,dt*4); my+=(myT-my)*Math.min(1,dt*4);
    layout();
    camera.position.x += (mx*0.55 - camera.position.x)*Math.min(1,dt*3);
    camera.position.y += (-my*0.36 - camera.position.y)*Math.min(1,dt*3);
    camera.lookAt(mx*0.3, my*0.15, 0);
    bg.position.x=-mx*1.0; bg.position.y=my*0.55;
    scanU.uTime.value=now*0.001; scanU.uScan.value=-18+((now*0.0009)%24);
    glow.position.x=-4+Math.sin(now*0.00013)*3.2; glow2.position.x=6+Math.cos(now*0.00009)*3.2;
    for(const it of items){ if(it.uni){ const rng=it.ph; it.uni.uScanY.value=rng*0.55-((now*0.0016)%(rng*1.2)); } }
    const pa=dust.geometry.attributes.position;
    for(let i=0;i<DN;i++){ let y=pa.getY(i)+dv[i]*dt*0.15; if(y>5) y=-5; pa.setY(i,y); }
    pa.needsUpdate=true;
    renderer.render(scene,camera);
  }
  requestAnimationFrame(loop);
  addEventListener('resize', ()=>{ const pr=Math.min(devicePixelRatio,1.75);
    camera.aspect=innerWidth/innerHeight; camera.updateProjectionMatrix(); renderer.setPixelRatio(pr); renderer.setSize(innerWidth,innerHeight); scanU.uPix.value=pr; });

  window.__companyTeam={ get op(){return op;}, get p(){return progress;}, count:N };
}
