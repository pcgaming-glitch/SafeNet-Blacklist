const CORRECT_CODE = 'gKY5u7y62013';

const loginContainer = document.getElementById('loginContainer');
const adminContainer = document.getElementById('adminContainer');
const reportsList = document.getElementById('reportsList');

document.getElementById('loginBtn').onclick = () => {
  const code = document.getElementById('adminCode').value;

  if (code === CORRECT_CODE) {
    loginContainer.style.display = 'none';
    adminContainer.style.display = 'block';
    loadReports();
  } else {
    alert('Incorrect admin code');
  }
};

document.getElementById('logoutBtn').onclick = () => {
  adminContainer.style.display = 'none';
  loginContainer.style.display = 'block';
  reportsList.innerHTML = '';
};

async function loadReports() {
  const res = await fetch('/api/reports');
  const data = await res.json();

  reportsList.innerHTML = '';

  data.forEach(r => {
    reportsList.innerHTML += `
      <div class="report-card">
        <strong>#${r.id}</strong><br>
        <strong>Person:</strong> ${r.person}<br>
        <strong>User ID:</strong> ${r.userId}<br>
        <strong>Reason:</strong> ${r.reason}<br>
        <img src="${r.proofUrl}">
      </div>
    `;
  });
}
