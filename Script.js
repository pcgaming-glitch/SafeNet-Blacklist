const form = document.getElementById('reportForm');

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form);

  try {
    const res = await fetch('/api/report', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Something went wrong.');
      return;
    }

    alert('Report submitted successfully!');
    form.reset();
  } catch (err) {
    alert('Server not reachable.');
  }
});
