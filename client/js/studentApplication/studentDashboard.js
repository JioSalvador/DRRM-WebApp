const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login.html';
}

const requestsTableBody = document.getElementById('requestsTableBody');

// Modal elements
const modalName = document.getElementById('modalName');
const modalBirthday = document.getElementById('modalBirthday');
const modalAddress = document.getElementById('modalAddress');
const modalSY = document.getElementById('modalSY');
const modalCourse = document.getElementById('modalCourse');
const modalSpecialRequest = document.getElementById('modalSpecialRequest');
const uploadedID = document.getElementById('uploadedID');
const paymentProof = document.getElementById('paymentProof');
const modalDocumentsTableBody = document.getElementById('modalDocumentsTableBody');
const modalTotalAmount = document.getElementById('modalTotalAmount');
const modalAlumniFee = document.getElementById('modalAlumniFee');
const alumniFeeRow = document.getElementById('alumniFeeRow');
const modalShippingFee = document.getElementById('modalShippingFee');
const shippingFeeRow = document.getElementById('shippingFeeRow');
const reasonGroup = document.getElementById('terminationReasonGroup');
const reasonField = document.getElementById('terminationReasonField');

const requestModal = new bootstrap.Modal(document.getElementById('requestModal'));

async function loadRequests() {
  try {
    const res = await fetch('http://localhost:3000/client/my-requests', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!data.success || !Array.isArray(data.requests)) {
      console.error('Failed to load requests');
      return;
    }

    requestsTableBody.innerHTML = '';

    data.requests.forEach(req => {
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';

      row.innerHTML = `
        <td class="text-start">${req.id}</td>
        <td><span class="badge ${
          req.status === 'payment_validated' ? 'bg-success'
          : req.status === 'out_for_delivery' ? 'bg-warning text-dark'
          : req.status === 'terminated' ? 'bg-danger'
          : 'bg-secondary'
        }">${req.status}</span></td>
        <td>
          <button class="btn btn-sm btn-receive" ${
            req.status !== 'out_for_delivery' ? 'disabled' : ''
          }>Receive</button>
        </td>
      `;

      // Handle row click to open modal
      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-receive')) return;
        openRequestModal(req);
      });

      const receiveBtn = row.querySelector('.btn-receive');
      if (req.status === 'out_for_delivery') {
        receiveBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const confirmReceive = confirm('Confirm that you have received your documents?');
          if (!confirmReceive) return;

          try {
            const res = await fetch(`http://localhost:3000/client/receive/${req.id}`, {
              method: 'PUT',
              headers: { Authorization: `Bearer ${token}` }
            });
            const result = await res.json();

            if (result.success) {
              alert('Request marked as received and alumni status updated!');
              loadRequests();
            } else {
              alert(result.message || 'Failed to update.');
            }
          } catch (err) {
            console.error('Error receiving:', err);
            alert('Server error.');
          }
        });
      }

      requestsTableBody.appendChild(row);
    });
  } catch (err) {
    console.error('Error fetching requests:', err);
  }
}

function openRequestModal(req) {
  modalName.textContent = req.full_name;
  modalBirthday.textContent = req.birthdate;
  modalAddress.textContent = req.address;
  modalSY.textContent = req.last_sy_attended || req.last_sy;
  modalCourse.textContent = req.course;
  modalSpecialRequest.textContent = req.special_request || 'None';

  const cleanedProofPath = req.proof_of_payment?.split('\\').pop().split('/').pop();
  const cleanedIDPath = req.id_document_path?.split('\\').pop().split('/').pop();
  console.log(`[DEBUG] status: ${req.status}, reason: ${req.termination_reason}`);

  paymentProof.src = cleanedProofPath
    ? `http://localhost:3000/uploads/${cleanedProofPath}`
    : 'https://via.placeholder.com/300x200?text=Payment+Proof';

  uploadedID.src = cleanedIDPath
    ? `http://localhost:3000/uploads/${cleanedIDPath}`
    : 'https://via.placeholder.com/300x200?text=Uploaded+ID';

  // Populate documents
  modalDocumentsTableBody.innerHTML = '';
  let docTotal = 0;
  (req.document_items || req.documents || []).forEach(doc => {
    modalDocumentsTableBody.innerHTML += `
      <tr>
        <td>${doc.name}</td>
        <td class="text-center">${doc.quantity}</td>
        <td class="text-end">₱${doc.amount.toLocaleString()}</td>
      </tr>
    `;
    docTotal += doc.amount;
  });

  // Compute fees
  const shippingFee = 300;
  const isAlumni = req.is_alumni_member === true;
  const alumniFee = isAlumni ? 0 : 500;

  shippingFeeRow.style.display = '';
  modalShippingFee.textContent = `₱${shippingFee.toLocaleString()}`;

  if (alumniFee > 0) {
    alumniFeeRow.style.display = '';
    modalAlumniFee.textContent = `₱${alumniFee.toLocaleString()}`;
  } else {
    alumniFeeRow.style.display = 'none';
  }

  const total = docTotal + shippingFee + alumniFee;
  modalTotalAmount.textContent = `₱${total.toLocaleString()}`;

  document.getElementById('togglePayment').style.display = 'none';
  document.getElementById('toggleDelivery').style.display = 'none';
  document.querySelector('.modal-footer .btn-outline-primary').style.display = 'none';

  if (req.status === 'terminated' && req.termination_reason) {
    reasonGroup.classList.remove('d-none');
    reasonField.value = req.termination_reason;
  } else {
    reasonGroup.classList.add('d-none');
    reasonField.value = '';
  }
  requestModal.show();
}

async function loadDrafts() {
  const tbody = document.getElementById('draftsTableBody');
  tbody.innerHTML = '';

  try {
    const res = await fetch('http://localhost:3000/client/my-drafts', {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();
    if (!data.success || !Array.isArray(data.drafts)) return;

    data.drafts.forEach(draft => {
      const row = document.createElement('tr');
      const formattedDate = new Date(draft.created_at).toLocaleDateString();

      row.innerHTML = `
        <td class="text-start">${draft.id}</td>
        <td>${formattedDate}</td>
        <td>
          <button class="btn btn-sm btn-draft" onclick='loadThisDraft(${JSON.stringify(draft)})'>Load Draft</button>
          <button class="btn btn-sm btn-danger ms-2" onclick="deleteDraft('${draft.id}')">Delete</button>
        </td>
      `;
      tbody.appendChild(row);
    });

  } catch (err) {
    console.error('Error loading drafts:', err);
  }
}

async function deleteDraft(id) {
  if (!confirm('Delete this draft?')) return;

  try {
    const res = await fetch(`http://localhost:3000/client/draft/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });

    const result = await res.json();
    if (result.success) loadDrafts();
    else alert(result.message || 'Failed to delete');
  } catch (err) {
    console.error('Error deleting draft:', err);
  }
}

function loadThisDraft(draft) {
  localStorage.setItem('draftIdToLoad', draft.id);
  window.location.href = '../studentApplication/studentApplication.html';
}

function switchTab(tab) {
  const reqSection = document.getElementById('requestsSection');
  const drfSection = document.getElementById('draftsSection');
  const btnReq = document.getElementById('tabRequestsBtn');
  const btnDrf = document.getElementById('tabDraftsBtn');

  if (tab === 'requests') {
    reqSection.classList.remove('d-none');
    drfSection.classList.add('d-none');
    btnReq.classList.add('active');
    btnDrf.classList.remove('active');
  } else {
    reqSection.classList.add('d-none');
    drfSection.classList.remove('d-none');
    btnReq.classList.remove('active');
    btnDrf.classList.add('active');
  }

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('show');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('sidebarToggle');
  const toggleIcon = document.getElementById('toggleIcon');

  sidebar.classList.toggle('show');
  toggleBtn.setAttribute('aria-expanded', sidebar.classList.contains('show'));
  toggleIcon.className = sidebar.classList.contains('show') ? 'bi bi-x-lg' : 'bi bi-list';
}

async function logout() {
  try {
    await fetch('http://localhost:3000/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
  } catch (err) {
    console.error('Logout error:', err);
  } finally {
    localStorage.removeItem('token');
    window.location.href = '/client/index.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  loadRequests();
  loadDrafts();
});