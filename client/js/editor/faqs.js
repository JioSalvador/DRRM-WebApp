const token = localStorage.getItem('token');
const faqList = document.getElementById('faqList');
const addFaqForm = document.getElementById('addFaqForm');

document.addEventListener('DOMContentLoaded', () => {
  if (!token) {
    alert('Not authorized');
    return;
  }
  loadFAQs();
});

async function loadFAQs() {
  try {
    const res = await fetch('http://localhost:3000/faq', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    faqList.innerHTML = '';
    data.forEach(renderFaqItem);
  } catch (err) {
    console.error('Failed to load FAQs:', err);
  }
}

function renderFaqItem(faq) {
  const item = document.createElement('div');
  item.className = 'editable-box mb-3';
  item.dataset.id = faq.id;

  item.innerHTML = `
    <label class="form-label"><strong>❓ ${faq.question}</strong></label>
    <textarea class="form-control mb-2 edit-answer" readonly>${faq.content}</textarea>
    <div class="d-flex gap-2 justify-content-end mt-2">
      <button class="btn btn-success btn-save" disabled>Save</button>
      <button class="btn btn-secondary btn-cancel" disabled>Cancel</button>
      <button class="btn btn-warning btn-edit">Edit</button>
      <button class="btn btn-danger btn-delete">Delete</button>
    </div>
  `;

  const textarea = item.querySelector('.edit-answer');
  const saveBtn = item.querySelector('.btn-save');
  const cancelBtn = item.querySelector('.btn-cancel');
  const editBtn = item.querySelector('.btn-edit');
  const deleteBtn = item.querySelector('.btn-delete');

  editBtn.onclick = () => {
    textarea.removeAttribute('readonly');
    saveBtn.disabled = false;
    cancelBtn.disabled = false;
    editBtn.disabled = true;
  };

  cancelBtn.onclick = () => {
    textarea.value = faq.content;
    textarea.setAttribute('readonly', true);
    saveBtn.disabled = true;
    cancelBtn.disabled = true;
    editBtn.disabled = false;
  };

  saveBtn.onclick = async () => {
    const updatedContent = textarea.value.trim();
    const updatedQuestion = faq.question;
    try {
      const res = await fetch(`http://localhost:3000/faq/${faq.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ content: updatedContent, question: updatedQuestion })
      });

      if (!res.ok) throw new Error('Update failed');
      const updated = await res.json();

      textarea.setAttribute('readonly', true);
      saveBtn.disabled = true;
      cancelBtn.disabled = true;
      editBtn.disabled = false;
      faq.content = updated.content;
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update FAQ.');
    }
  };

  deleteBtn.onclick = async () => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    try {
      const res = await fetch(`http://localhost:3000/faq/${faq.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Delete failed');
      item.remove();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete FAQ.');
    }
  };

  faqList.appendChild(item);
}

// Add New FAQ
addFaqForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const question = document.getElementById('faqQuestion').value.trim();
  const answer = document.getElementById('faqAnswer').value.trim();

  if (!question || !answer) return alert('Please fill out all fields.');

  try {
    const res = await fetch('http://localhost:3000/faq', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ question, content: answer })
    });

    if (!res.ok) throw new Error('Create failed');

    const newFaq = await res.json();
    renderFaqItem(newFaq);
    addFaqForm.reset();
  } catch (err) {
    console.error('Failed to create FAQ:', err);
    alert('Failed to create FAQ.');
  }
});

async function logout() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/client/index.html';
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
    window.location.href = '/client/index.html';
  }
}