// Vereenvoudigde frontend script (modal/settings verwijderd)
// Bevat: anonymous/identified toggle, formulier submit, admin login/load reports
// Fallbacks en validatie blijven aanwezig.

const translations = {
  nl: {
    submit: 'Verstuur melding',
    anonymous: 'anonymous',
    identified: 'identified',
    thankYou: 'Bedankt — je melding is ontvangen.',
    uploadError: 'Geen foto geüpload.',
    fillError: 'Vul alle velden in.'
  },
  en: {
    submit: 'Submit report',
    anonymous: 'anonymous',
    identified: 'identified',
    thankYou: 'Thanks — your report has been received.',
    uploadError: 'No photo uploaded.',
    fillError: 'Please fill all fields.'
  }
};

function $(id){ return document.getElementById(id); }

// apply language label for the toggle & submit button
function applyLang() {
  const lang = (navigator.language||'en').slice(0,2);
  const t = translations[lang] || translations['en'];
  const submitBtn = $('submitBtn');
  const idBtn = $('idToggleBtn');
  if (submitBtn) submitBtn.textContent = t.submit;
  if (idBtn) idBtn.textContent = t.anonymous;
}

document.addEventListener('DOMContentLoaded', () => {
  applyLang();

  // Anonymous / Identified toggle
  const idToggleBtn = $('idToggleBtn');
  const inputPerson = $('inputPerson');
  const inputUserId = $('inputUserId');

  if (idToggleBtn) {
    idToggleBtn.dataset.mode = 'anonymous';
    idToggleBtn.addEventListener('click', () => {
      const currentIsIdentified = idToggleBtn.dataset.mode === 'identified';
      if (!currentIsIdentified) {
        idToggleBtn.dataset.mode = 'identified';
        idToggleBtn.textContent = translations.nl.identified;
        inputPerson?.setAttribute('required', 'required');
        inputUserId?.setAttribute('required', 'required');
      } else {
        idToggleBtn.dataset.mode = 'anonymous';
        idToggleBtn.textContent = translations.nl.anonymous;
        inputPerson?.removeAttribute('required');
        inputUserId?.removeAttribute('required');
        if (inputPerson) inputPerson.value = '';
        if (inputUserId) inputUserId.value = '';
      }
    });
  }

  // Report form submit
  const reportForm = $('reportForm');
  const msgEl = $('message');

  reportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) { msgEl.classList.add('hidden'); msgEl.textContent = ''; }

    const fd = new FormData();
    const mode = idToggleBtn?.dataset.mode || 'anonymous';
    const reason = $('inputReason')?.value?.trim() || '';

    if (!reason) {
      if (msgEl) { msgEl.textContent = translations.nl.fillError; msgEl.classList.remove('hidden'); }
      return;
    }

    if (mode === 'identified') {
      const person = inputPerson?.value?.trim() || '';
      const userId = inputUserId?.value?.trim() || '';
      if (!person || !userId) {
        if (msgEl) { msgEl.textContent = translations.nl.fillError; msgEl.classList.remove('hidden'); }
        return;
      }
      fd.append('person', person);
      fd.append('userId', userId);
    } else {
      fd.append('person', 'Anonymous');
      fd.append('userId', 'anonymous');
    }

    const proofInput = $('inputProof');
    if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
      if (msgEl) { msgEl.textContent = translations.nl.uploadError; msgEl.classList.remove('hidden'); }
      return;
    }

    fd.append('reason', reason);
    fd.append('proof', proofInput.files[0], proofInput.files[0].name);

    try {
      const res = await fetch('/report', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        if (msgEl) { msgEl.textContent = translations.nl.thankYou; msgEl.classList.remove('hidden'); }
        reportForm.reset();
        if (idToggleBtn) {
          idToggleBtn.dataset.mode = 'anonymous';
          idToggleBtn.textContent = translations.nl.anonymous;
        }
      } else {
        if (msgEl) { msgEl.textContent = data.message || 'Fout bij verzenden.'; msgEl.classList.remove('hidden'); }
      }
    } catch (err) {
      if (msgEl) { msgEl.textContent = 'Netwerkfout.'; msgEl.classList.remove('hidden'); }
    }
  });

  // Admin login + load reports (zelfde als eerder)
  const loginForm = $('loginForm');
  const loginSection = $('loginSection');
  const panel = $('panel');
  const reportsDiv = $('reports');
  const loginMsg = $('loginMsg');

  async function loadReports() {
    try {
      const res = await fetch('/api/reports');
      if (res.status === 401) {
        panel?.classList.add('hidden');
        loginSection?.classList.remove('hidden');
        return;
      }
      const data = await res.json();
      if (!data.ok) return;
      if (reportsDiv) {
        reportsDiv.innerHTML = '';
        data.reports.forEach(r => {
          const el = document.createElement('div');
          el.className = 'report-card';
          el.innerHTML = `
            <img src="/uploads/${r.proofFilename}" alt="proof" />
            <div class="meta">
              <p><strong>Person:</strong> ${escapeHtml(r.person)}</p>
              <p><strong>User ID:</strong> ${escapeHtml(r.userId)}</p>
              <p><strong>Reason:</strong> ${escapeHtml(r.reason)}</p>
              <p class="small"><strong>Uploaded:</strong> ${new Date(r.createdAt).toLocaleString()}</p>
            </div>
          `;
          reportsDiv.appendChild(el);
        });
      }
    } catch (err) {
      if (reportsDiv) reportsDiv.textContent = 'Kon rapporten niet laden.';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (loginMsg) loginMsg.textContent = '';
      const fd = new FormData(loginForm);
      try {
        const res = await fetch('/admin/login', { method: 'POST', body: JSON.stringify({ code: fd.get('code') }), headers: { 'Content-Type': 'application/json' }});
        if (res.ok) {
          loginSection?.classList.add('hidden');
          panel?.classList.remove('hidden');
          await loadReports();
        } else {
          const d = await res.json();
          if (loginMsg) loginMsg.textContent = d.message || 'Login failed';
        }
      } catch (err) {
        if (loginMsg) loginMsg.textContent = 'Netwerkfout';
      }
    });
  }

  $('logoutBtn')?.addEventListener('click', async () => {
    await fetch('/admin/logout', { method: 'POST' });
    panel?.classList.add('hidden');
    loginSection?.classList.remove('hidden');
  });

  function escapeHtml(unsafe) {
    return String(unsafe || '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  if (reportsDiv) loadReports();
});
