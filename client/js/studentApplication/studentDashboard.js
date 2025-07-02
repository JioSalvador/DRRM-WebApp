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
const requestModal = new bootstrap.Modal(document.getElementById('requestModal'));

// =====================
// REQUESTS
// =====================
async function loadRequests() {
  try {
    const res = await fetch('http://localhost:3000/client/my-requests', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!data.success || !Array.isArray(data.requests)) {
      console.error('Failed to load real document requests');
      return;
    }

    requestsTableBody.innerHTML = '';

    data.requests.forEach(req => {
      const row = document.createElement('tr');
      row.style.cursor = 'pointer';

      row.innerHTML = `
        <td class="text-start">${req.id}</td>
        <td><span class="badge ${
          req.status === 'Validated' ? 'bg-success'
          : req.status === 'For Delivery' ? 'bg-warning text-dark'
          : 'bg-danger'
        }">${req.status}</span></td>
        <td>
          <button class="btn btn-sm btn-receive" ${
            req.status !== 'For Delivery' ? 'disabled' : ''
          }>Receive</button>
        </td>
      `;

      row.addEventListener('click', (e) => {
        if (e.target.closest('.btn-receive')) return;
        openRequestModal(req);
      });

      requestsTableBody.appendChild(row);
    });

  } catch (err) {
    console.error('❌ Error fetching requests:', err);
  }
}

// =====================
// DRAFTS
// =====================
async function loadDrafts() {
  const tbody = document.getElementById('draftsTableBody');
  tbody.innerHTML = '';

  try {
    const res = await fetch('http://localhost:3000/client/my-drafts', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!data.success || !Array.isArray(data.drafts)) throw new Error('Invalid draft response');

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
    console.error('❌ Error loading drafts:', err);
  }
}

async function deleteDraft(id) {
  if (!confirm('Are you sure you want to delete this draft?')) return;

  try {
    const res = await fetch(`http://localhost:3000/client/draft/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to delete draft');

    loadDrafts();
  } catch (err) {
    console.error('❌ Error deleting draft:', err);
    alert('Failed to delete draft. Please try again.');
  }
}

// =====================
// MODAL POPULATION
// =====================
function openRequestModal(req) {
  modalName.textContent = req.full_name;
  modalBirthday.textContent = req.birthdate;
  modalAddress.textContent = req.address;
  modalSY.textContent = req.last_sy_attended || req.last_sy;
  modalCourse.textContent = req.course;
  modalSpecialRequest.textContent = req.special_request || 'None';
  uploadedID.src = req.id_document_path;
  paymentProof.src = req.proof_of_payment;

  // Documents
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

  // Fees
  const shippingFee = 300;
  const isAlumni = req.is_alumni_member === false ? false : true;
  const alumniFee = isAlumni ? 0 : 500;

  document.getElementById('shippingFeeRow').style.display = '';
  document.getElementById('modalShippingFee').textContent = `₱${shippingFee.toLocaleString()}`;

  if (alumniFee > 0) {
    alumniFeeRow.style.display = '';
    modalAlumniFee.textContent = `₱${alumniFee.toLocaleString()}`;
  } else {
    alumniFeeRow.style.display = 'none';
  }

  const total = docTotal + shippingFee + alumniFee;
  modalTotalAmount.textContent = `₱${total.toLocaleString()}`;

  // Hide admin-only buttons
  document.getElementById('togglePayment').style.display = 'none';
  document.getElementById('toggleDelivery').style.display = 'none';
  document.querySelector('.modal-footer button.btn-outline-primary').style.display = 'none';

  // Show reason if terminated
  const reasonDiv = document.getElementById('terminationReason');
  if (req.status === 'Terminated' && req.termination_reason) {
    reasonDiv.innerHTML = `
      <div class="alert alert-danger mt-3">
        <strong>Terminated Reason:</strong> ${req.termination_reason}
      </div>
    `;
  } else {
    reasonDiv.innerHTML = '';
  }

  requestModal.show();
}

// =====================
// UI Controls
// =====================
function switchTab(tabName) {
  const requests = document.getElementById('requestsSection');
  const drafts = document.getElementById('draftsSection');
  const btnReq = document.getElementById('tabRequestsBtn');
  const btnDrf = document.getElementById('tabDraftsBtn');

  if (tabName === 'requests') {
    requests.classList.remove('d-none');
    drafts.classList.add('d-none');
    btnReq.classList.add('active');
    btnDrf.classList.remove('active');
  } else {
    requests.classList.add('d-none');
    drafts.classList.remove('d-none');
    btnDrf.classList.add('active');
    btnReq.classList.remove('active');
  }

  if (window.innerWidth < 768) {
    document.getElementById('sidebar').classList.remove('show');
  }
}

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('sidebarToggle');
  const toggleIcon = document.getElementById('toggleIcon');

  sidebar.classList.toggle('show');
  const isVisible = sidebar.classList.contains('show');
  toggleButton.setAttribute('aria-expanded', isVisible);
  toggleIcon.className = isVisible ? 'bi bi-x-lg' : 'bi bi-list';
}

function logoutUser() {
  alert("Logging out...");
  // Optional: remove token here
}

// =====================
// INIT
// =====================
document.addEventListener('DOMContentLoaded', () => {
  loadRequests();
  loadDrafts();
});

function loadThisDraft(draft) {
  console.log("🔁 Loading draft ID into localStorage:", draft.id);
  localStorage.setItem('draftIdToLoad', draft.id);
  window.location.href = '../studentApplication/studentApplication.html';
}