AOS.init();

let isAlumni = false;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const token = localStorage.getItem('token');
    const draftId = localStorage.getItem('draftIdToLoad');
    const res = await fetch('http://localhost:3000/auth/me', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (draftId) {
      loadDraftData(draftId);
      localStorage.removeItem('draftIdToLoad'); // ✅ clear it after use
    }
    if (!res.ok) throw new Error('User not authenticated');

    const { user } = await res.json();
    const { full_name, birthdate, is_alumni_member } = user;

    isAlumni = !!is_alumni_member;

    document.getElementById('fullName').value = full_name || '';
    document.getElementById('birthDate').value = birthdate?.split('T')[0] || '';

    const alumniCheckbox = document.querySelector('input[type="checkbox"]');
    if (alumniCheckbox) alumniCheckbox.checked = isAlumni;

    const alumniLabel = alumniCheckbox?.nextElementSibling;
    if (alumniLabel) {
      alumniLabel.textContent = isAlumni
        ? "I am an alumnus/alumna of the University of the East Caloocan"
        : "I am not marked as an alumnus/alumna of the University of the East Caloocan";
    }

    await loadDocumentTypes();
  } catch (error) {
    console.error('❌ Failed to fetch user data:', error);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const draft = localStorage.getItem('draftData');
  if (!draft) return;

  const data = JSON.parse(draft);

  document.getElementById('fullNameInput').value = data.full_name || '';
  document.getElementById('birthdateInput').value = data.birthdate || '';
  document.getElementById('contactNumberInput').value = data.contact_number || '';
  document.getElementById('addressInput').value = data.address || '';
  document.getElementById('lastSYInput').value = data.last_sy || '';
  document.getElementById('courseInput').value = data.course || '';
  document.getElementById('specialRequestInput').value = data.special_request || '';

  // You can loop through the documents here to render them if needed
});


document.getElementById('validIdUpload')?.addEventListener('change', (e) =>
  previewFile(e.target, 'validIdUpload')
);
document.getElementById('paymentProofUpload')?.addEventListener('change', (e) =>
  previewFile(e.target, 'paymentProofUpload')
);

const otpForm = document.getElementById('otpForm');
if (otpForm) {
  otpForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = localStorage.getItem('otpEmail');
    const otp = document.getElementById('otpInput')?.value;

    if (!email || !otp) return alert('Missing OTP or email');

    try {
      const res = await fetch('http://localhost:3000/auth/verify-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, otp })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.removeItem('otpEmail');
        window.location.href = '/pages/studentApplication.html';
      } else {
        alert(data.message || 'OTP verification failed');
      }
    } catch (err) {
      console.error('OTP error:', err);
      alert('An error occurred during OTP verification.');
    }
  });
}

function toggleOtherCourse() {
  const courseSelect = document.getElementById("courseSelect");
  const otherGroup = document.getElementById("otherCourseGroup");
  otherGroup.style.display = courseSelect.value === "other" ? "block" : "none";
}

function nextStep(step) {
  const steps = document.querySelectorAll('.form-step');
  steps.forEach((s, i) => s.classList.toggle('active', i === step - 1));
  updateStepper(step);
  updateSummary();
}

function goToStep(step) {
  nextStep(step);
}

function updateStepper(currentStep) {
  const stepElems = document.querySelectorAll('.step');
  stepElems.forEach((step, index) => {
    step.classList.toggle('active', index === currentStep - 1);
  });
}

function updateSummary() {
  document.getElementById("summaryFullName").innerText = document.getElementById("fullName").value;
  document.getElementById("summaryBirthdate").innerText = document.getElementById("birthDate").value;
  document.getElementById("summaryAddress").innerText = document.getElementById("shippingAddress").value;
  document.getElementById("summaryMobile").innerText = document.getElementById("mobile").value;
  document.getElementById("summarySY").innerText = document.getElementById("schoolYear").value;

  const course = document.getElementById("courseSelect").value;
  const other = document.getElementById("otherCourseInput").value;
  document.getElementById("summaryCourse").innerText =
    course === "other" ? other : document.querySelector("#courseSelect option:checked").text;

  document.getElementById("summaryShippingAddress").innerText = document.getElementById("shippingAddress").value;
  document.getElementById("summarySpecialRequest").innerText = document.getElementById("specialRequest").value;

  const rows = document.querySelectorAll("#documentTableBody tr");
  const summaryDocs = document.getElementById("summaryDocs");
  summaryDocs.innerHTML = "";
  let docTotal = 0;

  rows.forEach(row => {
    const name = row.cells[0].innerText;
    const fee = parseFloat(row.querySelector("input").dataset.fee);
    const copies = parseInt(row.querySelector("input").value || "0");
    const amount = copies * fee;

    if (copies > 0) {
      summaryDocs.innerHTML += `<tr><td>${name}</td><td>${copies}</td><td>₱${amount.toLocaleString()}</td></tr>`;
      docTotal += amount;
    }

    row.querySelector(".row-total").innerText = `₱${amount.toLocaleString()}`;
  });

  const shippingFee = 300;
  const alumniFee = isAlumni ? 0 : 500;
  const grandTotal = docTotal + shippingFee + alumniFee;

  document.getElementById("alumniFeeDisplay").innerText = alumniFee.toLocaleString();
  document.getElementById("shippingFeeDisplay").innerText = shippingFee.toLocaleString();
  document.getElementById("totalFee").innerText = grandTotal.toLocaleString();
  document.getElementById("summaryTotalFee").innerText = `₱${grandTotal.toLocaleString()}`;
}

function previewFile(input, inputId) {
  const summaryId = inputId === "validIdUpload" ? "summaryValidId" : "summaryPaymentProof";
  const summaryContainer = document.getElementById(summaryId);
  summaryContainer.innerHTML = "";

  if (input.files && input.files[0]) {
    const file = input.files[0];
    const previewURL = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = previewURL;
      img.className = "summary-image";
      summaryContainer.appendChild(img);
    } else {
      summaryContainer.textContent = file.name;
    }
  } else {
    summaryContainer.textContent = "No file uploaded";
  }
}

function validateUploadsAndNext() {
  const validIdInput = document.getElementById('validIdUpload');
  const paymentProofInput = document.getElementById('paymentProofUpload');

  // If both are empty, allow skipping (user may be saving as draft)
  const isValidIdMissing = !validIdInput.files.length;
  const isPaymentMissing = !paymentProofInput.files.length;

  // Only warn if BOTH are missing AND the user is trying to submit
  if (isValidIdMissing && isPaymentMissing) {
    const confirmSkip = confirm("You haven't uploaded a Valid ID or Proof of Payment. Are you still waiting for payment confirmation and wish to continue for now?");
    if (!confirmSkip) return; // user chose not to skip
  }

  nextStep(5);
  updateSummary();
}

document.getElementById('studentForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = document.getElementById('studentForm');
  const responseBox = document.getElementById('responseBox');
  const submitBtn = form.querySelector('button[type="submit"]');

  responseBox.innerHTML = `<div class="alert alert-info">Submitting request...</div>`;
  submitBtn.disabled = true;

  const formData = new FormData(); // ✅ start fresh

  // Append text fields
  formData.append('delivery_address', document.getElementById('shippingAddress').value.trim());
  formData.append('last_sy_attended', document.getElementById('schoolYear').value.trim());
  formData.append('special_request', document.getElementById('specialRequest').value.trim());
  formData.append('contact_number', document.getElementById('mobile').value.trim());

  const course = document.getElementById('courseSelect').value;
  const otherCourse = document.getElementById('otherCourseInput').value.trim();
  formData.append('course', course === 'other' ? otherCourse : course);

  // Append required files
  const idDoc = document.getElementById('validIdUpload')?.files[0];
  const proof = document.getElementById('paymentProofUpload')?.files[0];

  if (!idDoc || !proof) {
    alert('Please upload both Valid ID and Proof of Payment.');
    submitBtn.disabled = false;
    return;
  }

  formData.append('id_document', idDoc);           // ✅ field name must match multer
  formData.append('proof_of_payment', proof);      // ✅ field name must match multer

  // Prepare documents array
  const rows = document.querySelectorAll("#documentTableBody tr");
  const documents = [];

  rows.forEach(row => {
    const name = row.cells[0].innerText;
    const copies = parseInt(row.querySelector("input").value || "0");
    if (copies > 0) {
      documents.push({ type: name, quantity: copies });
    }
  });

  if (documents.length === 0) {
    alert("Please select at least one document.");
    submitBtn.disabled = false;
    return;
  }

  formData.append('documents', JSON.stringify(documents));

  // 🔍 Optional: log for debugging
  for (const [key, value] of formData.entries()) {
    console.log('🧾 Submitting field:', key, value);
  }

  try {
    const token = localStorage.getItem('token');

    const res = await fetch('http://localhost:3000/client/request-document', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok && data.success) {
      responseBox.innerHTML = `
        <div class="alert alert-success">
          ✅ Document request submitted successfully!<br/>
          <strong>Request ID:</strong> ${data.request_id}<br/>
          <strong>Total Cost:</strong> ₱${data.total_cost.toLocaleString()}<br/>
          ${data.alumni_fee_applied ? '<div><em>Note: An alumni fee of ₱500 has been applied.</em></div>' : ''}
        </div>
      `;
      form.reset();
      updateSummary();
    } else {
      responseBox.innerHTML = `<div class="alert alert-danger">❌ ${data.message || 'Submission failed.'}</div>`;
    }
  } catch (error) {
    console.error('Submission error:', error);
    responseBox.innerHTML = `<div class="alert alert-danger">❌ An error occurred. Please try again later.</div>`;
  } finally {
    submitBtn.disabled = false;
  }
});

async function loadDocumentTypes() {
  try {
    const res = await fetch('http://localhost:3000/itemRoutes/get-all-items');
    const items = await res.json();

    const tbody = document.getElementById('documentTableBody');
    tbody.innerHTML = '';

    items.forEach(item => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${item.name}</td>
        <td>${item.unit_price}</td>
        <td><input type="number" min="0" class="form-control copy-input" data-fee="${item.unit_price}" value="0"></td>
        <td class="row-total">₱0</td>
      `;
      tbody.appendChild(row);
    });

    document.querySelectorAll(".copy-input").forEach(input => {
      input.addEventListener("input", updateSummary);
    });

    updateSummary();
  } catch (err) {
    console.error("⚠️ Failed to load document types:", err);
    alert("Failed to load available document types.");
  }
}

async function saveDraft() {
  const saveBtn = document.getElementById('saveDraftBtn');
  const responseBox = document.getElementById('responseBox');
  responseBox.innerHTML = `<div class="alert alert-info">Saving draft...</div>`;
  saveBtn.disabled = true;

  const formData = new FormData();

  const contactNumber = document.getElementById('mobile')?.value.trim();
  const address = document.getElementById('shippingAddress')?.value.trim();
  const schoolYear = document.getElementById('schoolYear')?.value.trim();
  const specialRequest = document.getElementById('specialRequest')?.value.trim();

  const course = document.getElementById('courseSelect')?.value;
  const otherCourse = document.getElementById('otherCourseInput')?.value.trim();
  const finalCourse = course === 'other' ? otherCourse : course;

  if (contactNumber) formData.append('contact_number', contactNumber);
  if (address) formData.append('delivery_address', address);
  if (schoolYear) formData.append('last_sy_attended', schoolYear);
  if (specialRequest) formData.append('special_request', specialRequest);
  if (finalCourse) formData.append('course', finalCourse);

  const idFile = document.getElementById('validIdUpload')?.files[0];
  const paymentFile = document.getElementById('paymentProofUpload')?.files[0];

  if (idFile) formData.append('id_document', idFile);
  if (paymentFile) formData.append('proof_of_payment', paymentFile);

  const rows = document.querySelectorAll("#documentTableBody tr");
  const documents = [];

  rows.forEach(row => {
    const name = row.cells[0].innerText;
    const copies = parseInt(row.querySelector("input").value || "0");
    if (copies > 0) {
      documents.push({ type: name, quantity: copies });
    }
  });

  formData.append('documents', JSON.stringify(documents));

  // ✅ Optional: Debug log FormData contents
  for (const pair of formData.entries()) {
    console.log('🧾 FormData field:', pair[0], pair[1]);
  }

  try {
    const token = localStorage.getItem('token');
    const res = await fetch('http://localhost:3000/client/save-draft', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
        // ❗ Do NOT set 'Content-Type' when using FormData
      },
      body: formData
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Server error: ${res.status} - ${errorText}`);
    }

    const data = await res.json();
    if (data.success || res.ok) {
      responseBox.innerHTML = `<div class="alert alert-success">✅ Draft saved successfully!</div>`;
    } else {
      responseBox.innerHTML = `<div class="alert alert-danger">❌ ${data.message || "Failed to save draft."}</div>`;
    }

  } catch (err) {
    console.error("❌ Error saving draft:", err);
    responseBox.innerHTML = `<div class="alert alert-danger">❌ Error saving draft.</div>`;
  } finally {
    saveBtn.disabled = false;
  }
}