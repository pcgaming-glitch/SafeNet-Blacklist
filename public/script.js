// Shared client-side logic for public form and admin panel
// Adds: Anonymous/Identified toggle, Settings modal (theme + language), gallery-only upload, translations

// --- Translations (simple object) ---
const translations = {
  nl: {
    pageTitle: 'SafeNet Blacklist - Meld een gebruiker',
    reason: '⚠️ Reason:',
    proof: '✍️ Proof (foto):',
    submit: 'Verstuur melding',
    anonymous: 'anonymous',
    identified: 'identified',
    settingsTitle: 'Instellingen',
    theme: 'Theme',
    langLabel: 'Taal',
    close: 'Sluiten',
    thankYou: 'Bedankt — je melding is ontvangen.',
    uploadError: 'Geen foto geüpload.',
    fillError: 'Vul alle velden in.'
  },
  en: {
    pageTitle: 'SafeNet Blacklist - Report a user',
    reason: '⚠️ Reason:',
    proof: '✍️ Proof (photo):',
    submit: 'Submit report',
    anonymous: 'anonymous',
    identified: 'identified',
    settingsTitle: 'Settings',
    theme: 'Theme',
    langLabel: 'Language',
    close: 'Close',
    thankYou: 'Thanks — your report has been received.',
    uploadError: 'No photo uploaded.',
    fillError: 'Please fill all fields.'
  },
  es: {
    pageTitle: 'SafeNet Blacklist - Reportar un usuario',
    reason: '⚠️ Motivo:',
    proof: '✍️ Prueba (foto):',
    submit: 'Enviar reporte',
    anonymous: 'anónimo',
    identified: 'identificado',
    settingsTitle: 'Ajustes',
    theme: 'Tema',
    langLabel: 'Idioma',
    close: 'Cerrar',
    thankYou: 'Gracias — tu reporte ha sido recibido.',
    uploadError: 'No se cargó una foto.',
    fillError: 'Por favor completa todos los campos.'
  },
  fr: {
    pageTitle: 'SafeNet Blacklist - Signaler un utilisateur',
    reason: '⚠️ Raison:',
    proof: '✍️ Preuve (photo):',
    submit: 'Envoyer le rapport',
    anonymous: 'anonyme',
    identified: 'identifié',
    settingsTitle: 'Paramètres',
    theme: 'Thème',
    langLabel: 'Langue',
    close: 'Fermer',
    thankYou: 'Merci — votre rapport a été reçu.',
    uploadError: 'Aucune photo téléchargée.',
    fillError: 'Veuillez remplir tous les champs.'
  },
  de: {
    pageTitle: 'SafeNet Blacklist - Benutzer melden',
    reason: '⚠️ Grund:',
    proof: '✍️ Beweis (Foto):',
    submit: 'Bericht senden',
    anonymous: 'anonym',
    identified: 'identifiziert',
    settingsTitle: 'Einstellungen',
    theme: 'Thema',
    langLabel: 'Sprache',
    close: 'Schließen',
    thankYou: 'Danke — dein Bericht wurde erhalten.',
    uploadError: 'Kein Foto hochgeladen.',
    fillError: 'Bitte fülle alle Felder aus.'
  }
};

// --- Helpers ---
function $(id){ return document.getElementById(id); }
function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Settings: theme + language persisted in localStorage ---
const THEME_KEY = 'safenet_theme';
const LANG_KEY = 'safenet_lang';

function setTheme(theme) {
  if (theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  localStorage.setItem(THEME_KEY, theme);
}
function getTheme(){ return localStorage.getItem(THEME_KEY) || 'light'; }

function setLang(lang) {
  localStorage.setItem(LANG_KEY, lang);
  applyTranslations();
}
function getLang(){ return localStorage.getItem(LANG_KEY) || (navigator.language||'en').slice(0,2); }

function applyTranslations(){
  const lang = getLang();
  const t = translations[lang] || translations['en'];
  const title = $('pageTitle');
  if (title) title.textContent = t.pageTitle;
  const submitBtn = $('submitBtn');
  if (submitBtn) submitBtn.textContent = t.submit;
  // labels
  const labelReason = document.querySelector('label[for="inputReason"]') || null;
  // we simpler update a few things by ID where present
  const reasonLabel = document.querySelector('#inputReason')?.closest('label');
  if (reasonLabel) reasonLabel.childNodes[0].nodeValue = t.reason + '\n';
  const proofLabel = document.querySelector('#inputProof')?.closest('label');
  if (proofLabel) proofLabel.childNodes[0].nodeValue = t.proof + '\n';
  // toggle text
  const idToggleBtn = $('idToggleBtn');
  if (idToggleBtn) {
    const mode = idToggleBtn.dataset.mode || 'anonymous';
    idToggleBtn.textContent = (mode === 'identified') ? t.identified : t.anonymous;
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
  // apply theme/lang from storage
  setTheme(getTheme());
  const lang = getLang();
  $('langSelect')?.value && ($('langSelect').value = lang);
  applyTranslations();

  // Settings modal bindings (index and admin share IDs)
  const settingsBtn = $('settingsBtn') || $('settingsBtnAdmin');
  const settingsModal = $('settingsModal');
  const closeSettings = $('closeSettings');
  settingsBtn?.addEventListener('click', () => {
    settingsModal.classList.remove('hidden');
  });
  closeSettings?.addEventListener('click', () => settingsModal.classList.add('hidden'));
  // theme buttons
  $('lightModeBtn')?.addEventListener('click', () => setTheme('light'));
  $('darkModeBtn')?.addEventListener('click', () => setTheme('dark'));
  // language select
  $('langSelect')?.addEventListener('change', (e) => setLang(e.target.value));

  // Anonymous / Identified toggle behavior
  const idToggleBtn = $('idToggleBtn');
  const identifiedFields = $('identifiedFields');
  // default: anonymous
  idToggleBtn.dataset.mode = 'anonymous';
  idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
  idToggleBtn.addEventListener('click', () => {
    const current = idToggleBtn.dataset.mode === 'identified' ? 'identified' : 'anonymous';
    if (current === 'anonymous') {
      // switch to identified
      idToggleBtn.dataset.mode = 'identified';
      idToggleBtn.textContent = translations[getLang()]?.identified || 'identified';
      identifiedFields.classList.remove('hidden');
      // make inputs required
      $('inputPerson').setAttribute('required','required');
      $('inputUserId').setAttribute('required','required');
    } else {
      // switch to anonymous
      idToggleBtn.dataset.mode = 'anonymous';
      idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
      identifiedFields.classList.add('hidden');
      // remove required
      $('inputPerson').removeAttribute('required');
      $('inputUserId').removeAttribute('required');
    }
  });

  // Report form submit logic (sends person/userId even if anonymous)
  const reportForm = $('reportForm');
  const msg = $('message');
  if (reportForm) {
    reportForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      msg.classList.add('hidden');
      const form = e.target;
      const fd = new FormData();

      // mode: anonymous or identified
      const mode = $('idToggleBtn').dataset.mode || 'anonymous';
      if (mode === 'identified') {
        const person = $('inputPerson').value.trim();
        const userId = $('inputUserId').value.trim();
        const reason = $('inputReason').value.trim();
        if (!person || !userId || !reason) {
          msg.textContent = translations[getLang()]?.fillError || 'Please fill all fields.';
          msg.classList.remove('hidden');
          return;
        }
        fd.append('person', person);
        fd.append('userId', userId);
      } else {
        // anonymous: send placeholder values so server validation passes
        const reason = $('inputReason').value.trim();
        if (!reason) {
          msg.textContent = translations[getLang()]?.fillError || 'Please fill all fields.';
          msg.classList.remove('hidden');
          return;
        }
        fd.append('person', 'Anonymous');
        fd.append('userId', 'anonymous');
      }

      const proofInput = $('inputProof');
      if (!proofInput || !proofInput.files || proofInput.files.length === 0) {
        msg.textContent = translations[getLang()]?.uploadError || 'No photo uploaded.';
        msg.classList.remove('hidden');
        return;
      }
      // append reason and file
      fd.append('reason', $('inputReason').value.trim());
      fd.append('proof', proofInput.files[0], proofInput.files[0].name);

      try {
        const res = await fetch('/report', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.ok) {
          msg.textContent = translations[getLang()]?.thankYou || 'Thanks — your report has been received.';
          msg.classList.remove('hidden');
          form.reset();
          // reset to anonymous default
          $('idToggleBtn').dataset.mode = 'anonymous';
          $('idToggleBtn').textContent = translations[getLang()]?.anonymous || 'anonymous';
          $('identifiedFields').classList.add('hidden');
        } else {
          msg.textContent = data.message || 'Fout bij verzenden.';
          msg.classList.remove('hidden');
        }
      } catch (err) {
        msg.textContent = 'Netwerkfout.';
        msg.classList.remove('hidden');
      }
    });
  }

  // --- Admin page existing handlers (login, logout, reporting) ---
  const loginForm = $('loginForm');
  const loginSection = $('loginSection');
  const panel = $('panel');
  const reportsDiv = $('reports');
  const loginMsg = $('loginMsg');

  async function loadReports() {
    try {
      const res = await fetch('/api/reports');
      if (res.status === 401) {
        panel.classList.add('hidden');
        loginSection.classList.remove('hidden');
        return;
      }
      const data = await res.json();
      if (!data.ok) return;
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
    } catch (err) {
      reportsDiv.textContent = 'Kon rapporten niet laden.';
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginMsg.textContent = '';
      const form = e.target;
      const fd = new FormData(form);
      try {
        const res = await fetch('/admin/login', { method: 'POST', body: JSON.stringify({ code: fd.get('code') }), headers: { 'Content-Type': 'application/json' }});
        if (res.ok) {
          loginSection.classList.add('hidden');
          panel.classList.remove('hidden');
          await loadReports();
        } else {
          const d = await res.json();
          loginMsg.textContent = d.message || 'Login failed';
        }
      } catch (err) {
        loginMsg.textContent = 'Netwerkfout';
      }
    });
  }

  const logoutBtn = $('logoutBtn');
  logoutBtn?.addEventListener('click', async () => {
    await fetch('/admin/logout', { method: 'POST' });
    panel.classList.add('hidden');
    loginSection.classList.remove('hidden');
  });

  // If admin page present, try to load reports (if already logged in)
  if (reportsDiv) loadReports();
});
