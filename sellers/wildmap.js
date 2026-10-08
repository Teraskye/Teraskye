/* ============================================================
   TERASKYE — THE WILD · glowing US market map
   Renders the 50-state map (from usa-map.js) and lights markets
   up as active / expanding / future. Implies a widening national
   footprint — never claims it outright.
   ============================================================ */
(function () {
  const M = window.USA_MAP;
  const host = document.getElementById('usmap');
  if (!M || !host) return;
  const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const NS = 'http://www.w3.org/2000/svg';

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', M.viewBox);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  svg.setAttribute('class', 'usmap__svg');

  // states
  const gStates = document.createElementNS(NS, 'g');
  gStates.setAttribute('class', 'usmap__states');
  M.states.forEach(st => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', st.d);
    p.setAttribute('data-id', st.id);
    gStates.appendChild(p);
  });
  svg.appendChild(gStates);
  host.appendChild(svg);

  // seeded RNG so the pattern is stable between loads
  let seed = 20260922;
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };

  // place a market light on (most) states — active/expanding/future.
  // NOTE: distribution is ambiguous on purpose (no claim about specific states).
  const gArcs = document.createElementNS(NS, 'g'); gArcs.setAttribute('class', 'usmap__arcs');
  const gDots = document.createElementNS(NS, 'g'); gDots.setAttribute('class', 'usmap__dots');
  const centers = [];

  [...gStates.children].forEach(p => {
    let b; try { b = p.getBBox(); } catch (_) { return; }
    if (!b || !b.width) return;
    const n = (b.width * b.height > 5200) ? 2 : 1;   // a couple of lights in big states
    for (let k = 0; k < n; k++) {
      const cx = b.x + b.width * (0.28 + rnd() * 0.44);
      const cy = b.y + b.height * (0.28 + rnd() * 0.44);
      const t = rnd();
      const type = t < 0.62 ? 'active' : (t < 0.85 ? 'expand' : 'future');
      const c = document.createElementNS(NS, 'circle');
      c.setAttribute('cx', cx.toFixed(1)); c.setAttribute('cy', cy.toFixed(1));
      c.setAttribute('r', type === 'active' ? 5 : (type === 'expand' ? 4.2 : 4.8));
      c.setAttribute('class', 'dot dot--' + type);
      if (!RM) c.style.animationDelay = (rnd() * 3.4).toFixed(2) + 's';
      gDots.appendChild(c);
      if (type === 'active') centers.push([cx, cy]);
    }
  });

  // a few thin connecting arcs between active markets (a living network)
  if (centers.length > 4) {
    for (let i = 0; i < 7; i++) {
      const a = centers[Math.floor(rnd() * centers.length)];
      const b = centers[Math.floor(rnd() * centers.length)];
      if (a === b) continue;
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2 - Math.abs(a[0] - b[0]) * 0.18;
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', `M${a[0].toFixed(1)},${a[1].toFixed(1)} Q${mx.toFixed(1)},${my.toFixed(1)} ${b[0].toFixed(1)},${b[1].toFixed(1)}`);
      path.setAttribute('class', 'arc');
      gArcs.appendChild(path);
    }
  }

  svg.appendChild(gArcs);
  svg.appendChild(gDots);
})();
