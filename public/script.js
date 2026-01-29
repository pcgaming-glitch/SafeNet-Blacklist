// Shared client-side logic for public form and admin panel

// Report form submit
const reportForm = document.getElementById('reportForm');
if (reportForm) {
  reportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const fd = new FormData(form);
    const msg = document.getElementById('message');
    msg.classList.add('hidden');
    try {
      const res = await fetch('/report', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.ok) {
        msg.textContent = 'Bedankt — je melding is ontvangen.';
        msg.classList.remove('hidden');
        form.reset();
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

// Admin logic
const loginForm = document.getElementById('loginForm');
const loginSection = document.getElementById('loginSection');
const panel = document.getElementById('panel');
const reportsDiv = document.getElementById('reports');
const loginMsg = document.getElementById('loginMsg');

async function loadReports() {
  try {
    const res = await fetch('/api/reports');
    if (res.status === 401) {
      // not logged in
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

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    await fetch('/admin/logout', { method: 'POST' });
    panel.classList.add('hidden');
    loginSection.classList.remove('hidden');
  });
}

function escapeHtml(unsafe) {
  return String(unsafe)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
