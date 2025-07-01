document.addEventListener("DOMContentLoaded", async function () {
  const textareas = document.querySelectorAll('.editable-text');
  const saveButtons = document.querySelectorAll('.save-btn');
  const token = localStorage.getItem('token');

  if (!token) {
    alert("Unauthorized. Please log in again.");
    window.location.href = "/client/index.html";
    return;
  }

  // 🔽 Fetch about content from backend
  try {
    const res = await fetch('http://localhost:3000/about', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to load content');
    }

    // Populate each textarea
    data.forEach((entry, i) => {
      if (textareas[i]) {
        textareas[i].value = entry.content;
        textareas[i].dataset.id = entry.id; // Store id for later use
      }
    });
  } catch (err) {
    console.error("Error loading about content:", err);
    alert("Failed to load content. Please refresh or contact support.");
  }

  // 🔼 Set up edit and save functionality
  textareas.forEach((textarea, index) => {
    const saveBtn = saveButtons[index];

    textarea.addEventListener('click', () => {
      if (textarea.hasAttribute('readonly')) {
        textarea.removeAttribute('readonly');
        textarea.focus();
        saveBtn.disabled = false;
      }
    });

    saveBtn.addEventListener('click', async () => {
      const id = textarea.dataset.id;
      const content = textarea.value.trim();

      try {
        const res = await fetch(`http://localhost:3000/about/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ content })
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || 'Failed to update section');
        }

        textarea.setAttribute('readonly', true);
        saveBtn.disabled = true;
        console.log(`✅ Updated section ${id}:`, result);
        alert("Section saved successfully!");
      } catch (err) {
        console.error(`❌ Error updating section ${id}:`, err);
        alert("Failed to save changes.");
      }
    });
  });
});

async function logout() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/client/index.html'; // fallback
    return;
  }

  try {
    await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('token');
    window.location.href = '/client/index.html'; // redirect to login
  }
}