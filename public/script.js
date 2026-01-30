// Frontend logic: anonymous/identified toggle, settings (theme/lang), form submit
// Dutch comments for clarity

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

function setTheme(theme){
  if(theme === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
  localStorage.setItem(THEME_KEY, theme);
}
function getTheme(){ return localStorage.getItem(THEME_KEY) || 'light'; }
function setLang(lang){ localStorage.setItem(LANG_KEY, lang); applyLang(); }
function getLang(){ return localStorage.getItem(LANG_KEY) || (navigator.language||'en').slice(0,2); }

function applyLang(){
  const lang = (getLang() in translations) ? getLang() : 'en';
  const t = translations[lang];
  const submitBtn = $('submitBtn');
  const idBtn = $('idToggleBtn');
  if(submitBtn) submitBtn.textContent = t.submit;
  if(idBtn){
    // keep current mode label
    const mode = idBtn.dataset.mode || 'anonymous';
    idBtn.textContent = (mode === 'identified') ? t.identified : t.anonymous;
  }
}

// Initialize UI
document.addEventListener('DOMContentLoaded', () => {
  // theme/lang
  setTheme(getTheme());
  const langSelect = $('langSelect');
  if(langSelect) langSelect.value = getLang();
  applyLang();

  // ********** Robust settings modal handlers **********
  // bind all open-settings buttons (header/footer/admin)
  const settingsButtons = document.querySelectorAll('#settingsBtn, #settingsBtnFooter, #settingsBtnAdmin');
  // support multiple modals if present (index + admin), select them all
  const settingsModals = document.querySelectorAll('#settingsModal');
  // bind all close buttons (if duplicate IDs exist, querySelectorAll will still find them)
  const closeButtons = document.querySelectorAll('#closeSettings');

  // function to open all modals (keeps behaviour consistent)
  function openSettings() {
    settingsModals.forEach(modal => modal.classList.remove('hidden'));
  }
  // function to close all modals
  function closeSettings() {
    settingsModals.forEach(modal => modal.classList.add('hidden'));
  }

  settingsButtons.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openSettings();
    });
  });

  closeButtons.forEach(btn => {
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      closeSettings();
    });
  });

  // close when clicking on overlay (outside modal-content)
  settingsModals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeSettings();
    });
    // prevent clicks inside modal-content from bubbling to overlay
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.addEventListener('click', (e) => e.stopPropagation());
    }
  });
  // ********** end settings modal handlers **********

  // settings button actions (also for non-open buttons)
  $('lightModeBtn')?.addEventListener('click', ()=> setTheme('light'));
  $('darkModeBtn')?.addEventListener('click', ()=> setTheme('dark'));
  $('langSelect')?.addEventListener('change', (e)=> setLang(e.target.value));

  // anonymous / identified toggle
  const idToggleBtn = $('idToggleBtn');
  const inputPerson = $('inputPerson');
  const inputUserId = $('inputUserId');
  // default anonymous
  if (idToggleBtn) {
    idToggleBtn.dataset.mode = 'anonymous';
    idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
    idToggleBtn.addEventListener('click', ()=>{
      const current = idToggleBtn.dataset.mode === 'identified' ? 'identified' : 'anonymous';
      if(current === 'anonymous'){
        idToggleBtn.dataset.mode = 'identified';
        idToggleBtn.textContent = translations[getLang()]?.identified || 'identified';
        inputPerson?.setAttribute('required','required');
        inputUserId?.setAttribute('required','required');
      } else {
        idToggleBtn.dataset.mode = 'anonymous';
        idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
        inputPerson?.removeAttribute('required');
        inputUserId?.removeAttribute('required');
        // clear values to avoid accidental sending
        if (inputPerson) inputPerson.value = '';
        if (inputUserId) inputUserId.value = '';
      }
    });
  }

  // form submit
  const reportForm = $('reportForm');
  const msg = $('message');
  reportForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.classList.add('hidden');
    const fd = new FormData();
    const mode = idToggleBtn?.dataset.mode || 'anonymous';
    const reason = $('inputReason').value.trim();
    if(!reason){
      msg.textContent = translations[getLang()]?.fillError || 'Vul alle velden in.';
      msg.classList.remove('hidden');
      return;
    }
    if(mode === 'identified'){
      const person = inputPerson.value.trim();
      const userId = inputUserId.value.trim();
      if(!person || !userId){
        msg.textContent = translations[getLang()]?.fillError || 'Vul alle velden in.';
        msg.classList.remove('hidden');
        return;
      }
      fd.append('person', person);
      fd.append('userId', userId);
    } else {
      fd.append('person', 'Anonymous');
      fd.append('userId', 'anonymous');
    }

    const proofInput = $('inputProof');
    if(!proofInput || !proofInput.files || proofInput.files.length === 0){
      msg.textContent = translations[getLang()]?.uploadError || 'Geen foto geüpload.';
      msg.classList.remove('hidden');
      return;
    }
    fd.append('reason', reason);
    fd.append('proof', proofInput.files[0], proofInput.files[0].name);

    try {
      const res = await fetch('/report', { method: 'POST', body: fd });
      const data = await res.json();
      if(data.ok){
        msg.textContent = translations[getLang()]?.thankYou || 'Bedankt — je melding is ontvangen.';
        msg.classList.remove('hidden');
        reportForm.reset();
        if (idToggleBtn) {
          idToggleBtn.dataset.mode = 'anonymous';
          idToggleBtn.textContent = translations[getLang()]?.anonymous || 'anonymous';
        }
      } else {
        msg.textContent = data.message || 'Fout bij verzenden.';
        msg.classList.remove('hidden');
      }
    } catch(err){
      msg.textContent = 'Netwerkfout.';
      msg.classList.remove('hidden');
    }
  });
});
