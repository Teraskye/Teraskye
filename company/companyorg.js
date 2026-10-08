/* ============================================================
   TERASKYE — COMPANY
   · leadership constellation: click a person → their departments
     & experience open in a centered panel (data-driven)
   · bottom-right section index (like every other page)
   · Company nav dropdown → smooth-scroll to a section
   ============================================================ */
(function () {
  /* ---------- leadership constellation ---------- */
  const PEOPLE = {
    ceo: { nm: 'Vamsi Vemoori',  rl: 'Founder · Chief Executive Officer',
      depts: ['Vision & Strategy', 'Business Strategy', 'Corporate Development', 'Legal & Compliance', 'People & HR', 'Private Equity & Exit Relations'] },
    cto: { nm: 'Vamsi Vemoori',  rl: 'Chief Technology Officer',
      depts: ['Product', 'Engineering & Artificial Intelligence', 'Data & Intelligence Platform', 'Automation & Systems', 'Technology Strategy'] },
    cap: { nm: 'Anitha Ravala',  rl: 'Co-Founder · Chief Investment Officer',
      depts: ['Acquisitions & Underwriting', 'Investment Strategy', 'Investor & Equity Partner Relations', 'Fund Management', 'Capital Markets', 'Creative Financing'] },
    ops: { nm: 'Srinath Ambati', rl: 'Co-Founder · Chief Operating Officer & Chief Financial Officer',
      depts: ['Real Estate Operations', 'Execution & Asset Management', 'Leasing & Demand', 'Resident & Customer Relations', 'Accounting & Financial Reporting', 'Treasury & Tax'] },
    ea:  { nm: 'Pravalika',      rl: 'Executive Assistant to CEO',
      depts: ['Executive Assistant to CEO', 'Business Development and Growth', 'Market & Business Research', 'Marketing & Communications', 'Sales & Client Engagement', 'Executive Operations & Strategic Initiatives'] },
  };
  const stage = document.getElementById('orgStage');
  const detail = document.getElementById('orgDetail');
  if (stage && detail) {
    const pods = [...stage.querySelectorAll('.pod')];
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let hideT;

    function open(pod) {
      const p = PEOPLE[pod.dataset.person]; if (!p) return;
      clearTimeout(hideT);
      pods.forEach(x => { const on = x === pod; x.classList.toggle('is-open', on); x.setAttribute('aria-expanded', on ? 'true' : 'false'); });
      detail.innerHTML =
        '<button class="orgc__dx" aria-label="Close">&times;</button>' +
        '<div class="orgc__dnm">' + esc(p.nm) + '</div>' +
        '<div class="orgc__drl">' + esc(p.rl) + '</div>' +
        '<div class="orgc__dh">Departments &amp; experience</div>' +
        '<div class="orgc__dl">' + p.depts.map(d => '<span>' + esc(d) + '</span>').join('') + '</div>';
      detail.hidden = false;
      requestAnimationFrame(() => detail.classList.add('is-on'));
      detail.querySelector('.orgc__dx').addEventListener('click', e => { e.stopPropagation(); close(); });
    }
    function close() {
      detail.classList.remove('is-on');
      pods.forEach(x => { x.classList.remove('is-open'); x.setAttribute('aria-expanded', 'false'); });
      hideT = setTimeout(() => { if (!detail.classList.contains('is-on')) detail.hidden = true; }, 320);
    }
    pods.forEach(pod => {
      pod.addEventListener('click', e => { e.stopPropagation(); pod.classList.contains('is-open') ? close() : open(pod); });
      pod.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pod.classList.contains('is-open') ? close() : open(pod); }
        else if (e.key === 'Escape') close();
      });
    });
    document.addEventListener('click', e => { if (!e.target.closest('.pod') && !e.target.closest('.orgc__detail')) close(); });
  }

  /* ---------- section index (bottom-right) ---------- */
  const sections = [...document.querySelectorAll('main > .s')];
  const secName = document.getElementById('secName'), secNo = document.getElementById('secNo');
  if (secName && secNo && sections.length && 'IntersectionObserver' in window) {
    const sio = new IntersectionObserver((es) => {
      es.forEach(e => { if (e.isIntersecting) {
        const i = sections.indexOf(e.target);
        secName.textContent = e.target.getAttribute('data-name') || '';
        secNo.textContent = String(i + 1).padStart(2, '0');
      }});
    }, { threshold: 0.5 });
    sections.forEach(s => sio.observe(s));
  }

  /* ---------- nav dropdown → smooth-scroll to a section ---------- */
  document.querySelectorAll('.nav__mlink[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) { ev.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
})();
