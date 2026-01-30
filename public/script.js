// Robust frontend script for SafeNet Blacklist
// - Handles settings modal open/close (multiple buttons/modals supported)
// - Overlay click and Escape key close
// - Ensures close buttons are type="button" to avoid accidental form submit
// - Anonymous/Identified toggle, theme/lang, form submit, admin login
// - Includes defensive fallbacks if DOM has duplicates or JS loads late

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

const THEME_KEY = 'safenet_theme';
const LANG_KEY = 'safenet_lang';
function $(id){ return document.getElementById(id); }

// Theme / Lang helpers
function setTheme(theme){
  if(theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  try { localStorage.setItem(THEME_KEY, theme); } catch(e){}
}
function getTheme(){ try { return localStorage.getItem(THEME_KEY) || 'light'; } catch(e){ return 'light'; } }
function setLang(lang){ try { localStorage.setItem(LANG_KEY, lang); } catch(e){} applyLang(); }
function getLang(){ try { return localStorage.getItem(LANG_KEY) || (navigator.language||'en').slice(0,2); } catch(e){ return 'en'; } }

function applyLang(){
  const lang = (getLang() in translations) ? getLang() : 'en';
  const t = translations[lang];
  const submitBtn = $('submitBtn');
  const idBtn = $('idToggleBtn');
  if(submitBtn) submitBtn.textContent = t.submit;
  if(idBtn){
    const mode = idBtn.dataset.mode || 'anonymous';
    idBtn.textContent = (mode === 'identified') ? t.identified : t.anonymous;
  }
}

// Settings modal helpers (support multiple modals/buttons)
function openAllSettings() {
  const modals = document.querySelectorAll('#settingsModal');
  modals.forEach(m => {
    m.classList.remove('hidden');
    m.setAttribute('aria-hidden', 'false');
  });
}
function closeAllSettings() {
  const modals = document.querySelectorAll('#settingsModal');
  modals.forEach(m => {
    m.classList.add('hidden');
    m.setAttribute('aria-hidden', 'true');
  });
}

// Defensive: ensure close buttons are type="button" to avoid form submit
function ensureButtonType(selector) {
  document.querySelectorAll(selector).forEach(btn => {
    if (btn.tagName && btn.tagName.toLowerCase() === 'button') {
      try { btn.type = 'button'; } catch(e){}
    }
  });
}

// Main initialization
document.addEventListener('DOMContentLoaded', () => {
  // apply saved theme/lang
  setTheme(getTheme());
  const langSelect = $('langSelect');
  if (langSelect) langSelect.value = getLang();
  applyLang();

  // Bind settings open buttons (header, footer, admin, or any with data attribute)
  const settingsSelectors = [
    '#settingsBtn',
    '#settingsBtnFooter',
    '#settingsBtnAdmin',
    '[data-open-settings]',
    '.open-settings'
  ];
  const settingsButtons = document.querySelectorAll(settingsSelectors.join(','));
  settingsButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openAllSettings();
    });
  });

  // Ensure close buttons have type="button" and bind them
  ensureButtonType('#closeSettings');
  ensureButtonType('[data-close-settings]');

  const closeButtons = document.querySelectorAll('#closeSettings, [data-close-settings]');
  closeButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeAllSettings();
    });
  });

  // Overlay click: clicking outside modal-content closes modal
  const modals = document.querySelectorAll('#settingsModal');
  modals.forEach(modal => {
    // if modal itself clicked (overlay), close
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeAllSettings();
    });
    // prevent clicks inside modal content from bubbling to overlay
    const content = modal.querySelector('.modal-content');
    if (content) content.addEventListener('click', (e) => e.stopPropagation());
  });

  // Escape key closes modals
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      // only close if any modal is open
      const anyOpen = Array.from(document.querySelectorAll('#settingsModal')).some(m => !m.classList.contains('hidden'));
      if (anyOpen) closeAllSettings();
    }
  });

  // Fallback: document-level click handler that closes on close button hit
  // (handles cases where buttons are added late or have accidental nesting)
  document.addEventListener('click', (e) => {
    const target = e.target;
    if (!target) return;
    // data attribute or id check
    if (target.id === 'closeSettings' || target.closest && target.closest('#closeSettings') || target.dataset?.closeSettings !== undefined || target.closest && target.closest('[data-close-settings]')) {
      closeAllSettings();
    }
  });

  // Theme / Lang buttons
  $('lightModeBtn')?.addEventListener('click', ()=> setTheme('light'));
  $('darkModeBtn')?.addEventListener('click', ()=> setTheme('dark'));
  $('langSelect')?.addEventListener('change', (e)=> setLang(e.target.value));

  // Anonymous / Identified toggle behavior
  const idToggleBtn = $('idToggleBtn');
  const inputPerson = $('inputPerson');
  const inputUserId = $('inputUserId');

  if (idToggleBtn) {
    idToggleBtn.dataset.mode = 'anonymous';
    idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
    idToggleBtn.addEventListener('click', () => {
      const currentIsIdentified = idToggleBtn.dataset.mode === 'identified';
      if (!currentIsIdentified) {
        idToggleBtn.dataset.mode = 'identified';
        idToggleBtn.textContent = translations[getLang()]?.identified || 'identified';
        inputPerson?.setAttribute('required', 'required');
        inputUserId?.setAttribute('required', 'required');
      } else {
        idToggleBtn.dataset.mode = 'anonymous';
        idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
        inputPerson?.removeAttribute('required');
        inputUserId?.removeAttribute('required');
        if (inputPerson) inputPerson.value = '';
        if (inputUserId) inputUserId.value = '';
      }
    });
  }

  // Form submit logic (public report)
  const reportForm = $('reportForm');
  const msgEl = $('message');

  reportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) { msgEl.classList.add('hidden'); msgEl.textContent = ''; }

    const fd = new FormData();
    const mode = idToggleBtn?.dataset.mode || 'anonymous';
    const reason = $('inputReason')?.value?.trim() || '';

    if (!reason) {
      if (msgEl) { msgEl.textContent = translations[getLang()]?.fillError || 'Vul alle velden in.'; msgEl.classList.remove('hidden'); }
      return;
    }

    if (mode === 'identified') {
      const person = inputPerson?.value?.trim() || '';
      const userId = inputUserId?.value?.trim() || '';
      if (!person || !userId) {
        if (msgEl) { msgEl.textContent = translations[getLang()]?.fillError || 'Vul alle velden in.'; msgEl.classList.remove('hidden'); }
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
      if (msgEl) { msgEl.textContent = translations[getLang()]?.uploadError || 'Geen foto geüpload.'; msgEl.classList.remove('hidden'); }
      return;
    }

    fd.append('reason', reason);
    fd.append('proof', proofInput.files[0], proofInput.files[0].name);

    try {
      const res = await fetch('/report', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        if (msgEl) { msgEl.textContent = translations[getLang()]?.thankYou || 'Bedankt — je melding is ontvangen.'; msgEl.classList.remove('hidden'); }
        reportForm.reset();
        if (idToggleBtn) {
          idToggleBtn.dataset.mode = 'anonymous';
          idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
        }
      } else {
        if (msgEl) { msgEl.textContent = data.message || 'Fout bij verzenden.'; msgEl.classList.remove('hidden'); }
      }
    } catch (err) {
      if (msgEl) { msgEl.textContent = 'Netwerkfout.'; msgEl.classList.remove('hidden'); }
    }
  });

  // Admin login/logout/report loading (if admin page present)
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

  // Utility: escapeHtml
  function escapeHtml(unsafe) {
    return String(unsafe || '')
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  // If admin reports container present, attempt load (in case already logged in)
  if (reportsDiv) loadReports();
});
