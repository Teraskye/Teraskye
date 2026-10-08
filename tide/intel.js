/* ============================================================
   TERASKYE — TIDE · Specialist Network explorer (section 06)
   Builds all 18 agents (grouped by domain) as a one-screen
   selector from window.PLATFORM; selecting an agent reveals its
   specialist processes in the detail panel. Defaults to
   Underwriting (agent 03), the worked example in the copy.
   ============================================================ */
(() => {
  'use strict';
  const P = window.PLATFORM;
  const net = document.getElementById('agnet');
  const det = document.getElementById('agdetail');
  if (!P || !net || !det) return;

  const all = [];
  P.domains.forEach(d => {
    const col = document.createElement('div'); col.className = 'agcol';
    const h = document.createElement('div'); h.className = 'agcol__h'; h.textContent = d.short; col.appendChild(h);
    d.agents.forEach(a => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'agchip'; b.dataset.no = a.no;
      b.innerHTML = `<span class="agchip__no">${a.no}</span><span class="agchip__nm">${a.name}</span>`;
      b.addEventListener('click', () => select(a.no));
      b.addEventListener('mouseenter', () => select(a.no));
      col.appendChild(b);
      all.push(a);
    });
    net.appendChild(col);
  });

  const chips = [...net.querySelectorAll('.agchip')];
  let current = null;

  function select(no){
    if (no === current) return;
    const a = all.find(x => x.no === no); if (!a) return;
    current = no;
    chips.forEach(c => c.classList.toggle('on', c.dataset.no === no));
    det.classList.add('sw');
    setTimeout(() => {
      det.innerHTML =
        `<div class="agdetail__no">Agent ${a.no}</div>` +
        `<div class="agdetail__nm">${a.name}</div>` +
        `<p class="agdetail__fn">${a.fn}</p>` +
        `<div class="agdetail__c">${a.subs.length} Specialist Processes</div>` +
        `<div class="agprocs">${a.subs.map(s => `<span>${s}</span>`).join('')}</div>`;
      det.classList.remove('sw');
    }, 200);
  }

  select('03');   // Underwriting — the example named in the copy
})();
