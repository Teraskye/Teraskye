/* ============================================================
   TERASKYE — TIDE · page interactions
   Everything is derived from window.PLATFORM (single source of
   truth). No count is hard-coded in the markup.
   ============================================================ */
(function () {
  const P = window.PLATFORM;
  if (!P) return;
  const c = P.counts;

  /* ---- live counts everywhere [data-count-*] ---- */
  const setAll = (sel, val) => document.querySelectorAll(sel).forEach(el => { el.textContent = val; });
  setAll('[data-c="domains"]', c.domains);
  setAll('[data-c="agents"]', c.agents);
  setAll('[data-c="procs"]', c.subs);

  /* ---- domain cards ---- */
  const dwrap = document.getElementById('domainCards');
  if (dwrap) {
    dwrap.innerHTML = P.domains.map(d => {
      const procs = d.agents.reduce((m, a) => m + a.subs.length, 0);
      return `<div class="dcard">
        <div class="dcard__no">${d.no}</div>
        <div class="dcard__name">${d.short}</div>
        <div class="dcard__line">${d.line}</div>
        <div class="dcard__meta"><b>${d.agents.length}</b><span>agents</span><b>${procs}</b><span>processes</span></div>
      </div>`;
    }).join('');
  }

  /* ---- operator map: the Master AI Operator connecting down to the
         three domain tables (fits one frame, no scroll) ---- */
  const mapEl = document.getElementById('opMap');
  if (mapEl) {
    const doms = P.domains.map((d) => {
      const procs = d.agents.reduce((m, a) => m + a.subs.length, 0);
      const agents = d.agents.map(a => `
        <div class="nag">
          <button class="nag__btn" aria-expanded="false">
            <span class="nag__no">${a.no}</span>
            <span class="nag__name">${a.name}</span>
            <span class="nag__badge">${a.subs.length}</span>
            <span class="nag__chev">&rsaquo;</span>
          </button>
          <div class="nag__wrap"><div class="nag__in">
            <div class="nag__fn">${a.fn}</div>
            <div class="nag__procs">${a.subs.map(s => `<span class="npchip">${s}</span>`).join('')}</div>
          </div></div>
        </div>`).join('');
      return `<div class="opdom" style="--acc:${d.accent}">
        <div class="opdom__no">Domain ${d.no}</div>
        <div class="opdom__name">${d.name}</div>
        <div class="opdom__line">${d.line}</div>
        <div class="ndom__agents">${agents}</div>
        <div class="opdom__meta"><b>${d.agents.length}</b> agents · <b>${procs}</b> processes · <span class="opdom__hint">click an agent for its processes</span></div>
      </div>`;
    }).join('');

    mapEl.innerHTML = `
      <div class="opmap__orb">
        <span class="opmap__ball"></span>
        <span class="opmap__olabel">Master AI Operator</span>
        <span class="opmap__osub">One intelligence coordinating the entire asset lifecycle</span>
      </div>
      <div class="opmap__fan" aria-hidden="true">
        <svg viewBox="0 0 1000 88" preserveAspectRatio="none">
          <path d="M500,2 C320,34 210,44 167,86"/>
          <path d="M500,2 L500,86"/>
          <path d="M500,2 C680,34 790,44 833,86"/>
        </svg>
      </div>
      <div class="opmap__doms">${doms}</div>`;

    // click an agent → expand it inline to reveal the processes it runs
    mapEl.querySelectorAll('.nag__btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const nag = btn.closest('.nag');
        const open = nag.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
    });
  }
})();
