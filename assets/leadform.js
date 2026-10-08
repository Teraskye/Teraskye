/* shared lead-capture form → Web3Forms (async, so the page never navigates away).
   Wires any <form class="leadform"> on the page. Buyers · Investors. */
(function () {
  document.querySelectorAll('form.leadform').forEach(function (f) {
    var note = f.querySelector('.lf__note'), btn = f.querySelector('.lf__submit');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var keyEl = f.querySelector('[name=access_key]'), key = keyEl ? keyEl.value : '';
      if (key.indexOf('YOUR_WEB3FORMS') === 0) {
        if (note) { note.className = 'lf__note is-err'; note.textContent = 'Form not configured yet — add your Web3Forms access key.'; }
        return;
      }
      if (note) { note.className = 'lf__note'; note.textContent = 'Sending…'; }
      if (btn) btn.disabled = true;
      fetch(f.action, { method: 'POST', body: new FormData(f) })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d.success) { f.reset(); if (note) { note.className = 'lf__note is-ok'; note.textContent = 'Thank you — we’ve received your details and will be in touch.'; } }
          else { if (note) { note.className = 'lf__note is-err'; note.textContent = 'Something went wrong. Please email support@teraskye.com.'; } }
        })
        .catch(function () { if (note) { note.className = 'lf__note is-err'; note.textContent = 'Network error. Please email support@teraskye.com.'; } })
        .finally(function () { if (btn) btn.disabled = false; });
    });
  });
})();
