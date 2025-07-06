let currentRequest = {};

function highlightText(text) {
  const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
  if (!term) return text;
  const regex = new RegExp(`(${term})`, 'gi');
  return text.replace(regex, '<span class="custom-highlight">$1</span>');
}

async function refreshClientTable() {
  const token = localStorage.getItem('token');
  console.log("📦 Sending token in header:", token);

  if (!token) {
    return alert("No token found. Please login again.");
  }

  try {
    const res = await fetch('http://localhost:3000/admin/view-all', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (res.status === 403 && data.message === 'Token expired. Please log in again.') {
      alert('Your session has expired. Redirecting to login...');
      localStorage.removeItem('token');
      window.location.href = '/client/index.html';
      return;
    }

    if (!res.ok) {
      console.error('❌ Error fetching requests:', data.message);
      return alert('Failed to load requests.');
    }

    const clientTable = document.getElementById("requestTable");
    clientTable.innerHTML = '';

    const searchValue = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const filterValue = document.getElementById('filterStatus')?.value || 'all';

    data.requests.forEach(request => {
      const nameMatch =
        request.full_name.toLowerCase().includes(searchValue) ||
        request.email.toLowerCase().includes(searchValue);

      let statusMatch = true;
      switch (filterValue) {
        case 'paid':
          statusMatch = request.status === 'payment_validated' || request.status === 'out_for_delivery';
          break;
        case 'unpaid':
          statusMatch = request.status !== 'payment_validated' && request.status !== 'out_for_delivery' && request.status !== 'terminated';
          break;
        case 'delivery':
          statusMatch = request.status === 'out_for_delivery';
          break;
        case 'pending':
          statusMatch = request.status !== 'out_for_delivery' && request.status !== 'terminated';
          break;
        case 'active':
          statusMatch = request.status !== 'terminated';
          break;
        case 'terminated':
          statusMatch = request.status === 'terminated';
          break;
        default:
          statusMatch = true;
      }

      if (nameMatch && statusMatch) {
        const row = document.createElement("tr");
        row.setAttribute("data-id", request.id);
        row.innerHTML = `
          <td>${highlightText(request.full_name)}</td>
          <td>${new Date(request.created_at).toISOString().split('T')[0]}</td>
          <td>
            <span class="badge ${request.status === 'payment_validated' ? 'bg-success' : 'bg-secondary'}">
              ${request.status === 'payment_validated' ? 'Paid' : 'Unpaid'}
            </span>
            <span class="badge ${request.status === 'out_for_delivery' ? 'bg-info' : 'bg-warning text-dark'}">
              ${request.status === 'out_for_delivery' ? 'For Delivery' : 'Pending Delivery'}
            </span>
            <span class="badge bg-light text-dark">${request.status === 'terminated' ? 'Terminated' : 'Active'}</span>
          </td>
          <td>
            <button class="btn btn-primary btn-sm me-1" data-bs-toggle="modal" data-bs-target="#requestModal"
              onclick='openRequestModal(${JSON.stringify(request)})'>
              View
            </button>
            <button class="btn btn-danger btn-sm" onclick="openTerminateModal('${request.id}')">
              Delete
            </button>
          </td>
        `;
        clientTable.appendChild(row);
      }
    });
  } catch (err) {
    console.error("Network error while fetching requests:", err);
    alert("Server or network error.");
  }
}

document.getElementById('filterStatus')?.addEventListener('change', refreshClientTable);

function openRequestModal(request) {
  currentRequest = request;

  document.getElementById('modalName').textContent = request.full_name || '—';
  document.getElementById('modalBirthday').textContent = request.birthdate
    ? new Date(request.birthdate).toLocaleDateString()
    : '—';
  document.getElementById('modalAddress').textContent = request.delivery_address || '—';
  document.getElementById('modalSY').textContent = request.last_sy_attended || '—';
  document.getElementById('modalCourse').textContent = request.course || '—';
  document.getElementById('modalSpecialRequest').textContent = request.special_request || 'None';

  document.getElementById('paymentProof').src = request.proof_of_payment
    ? `http://localhost:3000/${request.proof_of_payment}`
    : 'https://via.placeholder.com/300x200?text=Payment+Proof';

  document.getElementById('uploadedID').src = request.id_document_path
    ? `http://localhost:3000/${request.id_document_path}`
    : 'https://via.placeholder.com/300x200?text=Uploaded+ID';

  const tbody = document.getElementById('modalDocumentsTableBody');
  tbody.innerHTML = '';
  let total = 0;

  (request.document_items || []).forEach(item => {
    const subtotal = item.quantity * item.price;
    total += subtotal;
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.document_type}</td>
      <td class="text-center">${item.quantity}</td>
      <td class="text-end">₱${subtotal.toLocaleString()}</td>
    `;
    tbody.appendChild(row);
  });

  const alumniFee = Number(request.alumni_fee || 0);
  const shippingFee = 300;
  const totalNum = Number(total || 0);
  const grandTotal = totalNum + alumniFee + shippingFee;

  // Alumni Fee Row
  const alumniRow = document.getElementById('alumniFeeRow');
  const alumniFeeDisplay = document.getElementById('modalAlumniFee');
  if (alumniFee > 0) {
    alumniFeeDisplay.textContent = `₱${alumniFee.toLocaleString()}`;
    alumniRow.style.display = 'table-row';
  } else {
    alumniRow.style.display = 'none';
  }

  // Shipping Fee Row
  const shippingRow = document.getElementById('shippingFeeRow');
  const shippingFeeDisplay = document.getElementById('modalShippingFee');
  shippingFeeDisplay.textContent = `₱${shippingFee.toLocaleString()}`;
  shippingRow.style.display = 'table-row';

  // Grand Total
  document.getElementById('modalTotalAmount').textContent = `₱${grandTotal.toLocaleString()}`;

  // Dynamic payment button
  const paymentBtn = document.getElementById('togglePayment');
  if (request.status === 'payment_validated' || request.status === 'out_for_delivery') {
    paymentBtn.textContent = 'Revert Payment';
    paymentBtn.classList.remove('btn-success');
    paymentBtn.classList.add('btn-warning');
    paymentBtn.onclick = () => revertPayment(request.id);
  } else {
    paymentBtn.textContent = 'Mark as Paid';
    paymentBtn.classList.remove('btn-warning');
    paymentBtn.classList.add('btn-success');
    paymentBtn.onclick = () => markAsPaid(request.id);
  }

  // Dynamic delivery button
  const deliveryBtn = document.getElementById('toggleDelivery');
  if (request.status === 'out_for_delivery') {
    deliveryBtn.textContent = 'Revert Delivery';
    deliveryBtn.classList.remove('btn-info');
    deliveryBtn.classList.add('btn-warning');
    deliveryBtn.onclick = () => revertDelivery(request.id);
  } else {
    deliveryBtn.textContent = 'Mark for Delivery';
    deliveryBtn.classList.remove('btn-warning');
    deliveryBtn.classList.add('btn-info');
    deliveryBtn.onclick = () => markForDelivery(request.id);
  }
}

async function markAsPaid(requestId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:3000/admin/${requestId}/mark-payment-validated`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    alert(data.message);
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    refreshClientTable();
  } catch (err) {
    alert("Failed to mark as paid.");
  }
}

async function revertPayment(requestId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:3000/admin/${requestId}/revert-validation`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    alert(data.message);
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    refreshClientTable();
  } catch (err) {
    alert("Failed to revert payment.");
  }
}

async function markForDelivery(requestId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:3000/admin/${requestId}/mark-for-delivery`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    alert(data.message);
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    refreshClientTable();
  } catch (err) {
    alert("Failed to mark for delivery.");
  }
}

async function revertDelivery(requestId) {
  const token = localStorage.getItem('token');
  try {
    const res = await fetch(`http://localhost:3000/admin/${requestId}/revert-delivery`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    alert(data.message);
    bootstrap.Modal.getInstance(document.getElementById('requestModal')).hide();
    refreshClientTable();
  } catch (err) {
    alert("Failed to revert delivery.");
  }
}

// Terminate modal logic
let terminateRequestId = null;
function openTerminateModal(requestId) {
  terminateRequestId = requestId;
  document.getElementById('terminationReason').value = '';
  const modal = new bootstrap.Modal(document.getElementById('terminateModal'));
  modal.show();
}

document.getElementById('confirmTerminateBtn')?.addEventListener('click', async () => {
  const reason = document.getElementById('terminationReason').value.trim();
  const token = localStorage.getItem('token');

  if (!reason) {
    return alert("Please provide a reason for termination.");
  }

  try {
    const res = await fetch(`http://localhost:3000/admin/${terminateRequestId}/terminate-request`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ reason })
    });

    const data = await res.json();
    if (res.ok) {
      alert(data.message);
      bootstrap.Modal.getInstance(document.getElementById('terminateModal')).hide();
      refreshClientTable();
    } else {
      alert(data.message || 'Failed to terminate request.');
    }
  } catch (err) {
    alert("Server error during termination.");
  }
});

// On page load
document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("No token found. Please log in again.");
    return;
  }

  refreshClientTable();
  document.getElementById('searchInput')?.addEventListener('input', refreshClientTable);
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

async function generateAndDownloadPDF() {
  const token = localStorage.getItem('token');
  if (!token) return alert('Session expired. Please log in again.');

  const requestId = currentRequest?.id;
  if (!requestId) return alert('Invalid request selected.');

  try {
    const res = await fetch(`http://localhost:3000/admin/${requestId}/generate-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.error('Failed to generate PDF:', data.message);
      return alert('Error generating PDF.');
    }

    const filePath = data.path;
    const fileName = filePath.split('/').pop();

    // Create a temporary anchor to download the file
    const link = document.createElement('a');
    link.href = `http://localhost:3000/generated-pdfs/${fileName}`;
    link.download = fileName;
    link.target = '_blank';
    link.click();

  } catch (err) {
    console.error("Error during PDF generation:", err);
    alert("An error occurred while generating the PDF.");
  }
}
