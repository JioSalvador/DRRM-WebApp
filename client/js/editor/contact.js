document.addEventListener("DOMContentLoaded", async () => {
  const contactList = document.getElementById("contact-list");
  const token = localStorage.getItem("token");
  if (!token) return alert("Unauthorized - Please login again");

  try {
    const res = await fetch("http://localhost:3000/contacts", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    const data = await res.json();
    data.forEach(contact => renderContactRow(contact));
  } catch (err) {
    console.error("❌ Failed to load contacts:", err);
  }

  contactList.addEventListener("click", async (e) => {
    const row = e.target.closest(".contact-item");
    if (!row) return;

    const inputs = row.querySelectorAll("input");
    const editBtn = row.querySelector(".edit-btn");
    const saveBtn = row.querySelector(".save-btn");
    const cancelBtn = row.querySelector(".cancel-btn");

    // Edit
    if (e.target.classList.contains("edit-btn")) {
      row.dataset.original = JSON.stringify(Array.from(inputs).map(i => i.value));
      inputs.forEach(i => i.removeAttribute("readonly"));
      editBtn.classList.add("d-none");
      saveBtn.classList.remove("d-none");
      cancelBtn.classList.remove("d-none");
    }

    // Cancel
    if (e.target.classList.contains("cancel-btn")) {
      const oldValues = JSON.parse(row.dataset.original || "[]");
      inputs.forEach((input, i) => input.value = oldValues[i] || "");
      inputs.forEach(i => i.setAttribute("readonly", true));
      editBtn.classList.remove("d-none");
      saveBtn.classList.add("d-none");
      cancelBtn.classList.add("d-none");
    }

    // Save (only for existing contacts)
    if (e.target.classList.contains("save-btn")) {
      const contactId = row.dataset.id;
      const name = inputs[0].value.trim();
      const contact = inputs[1].value.trim();

      if (!name || !contact) {
        alert("Both name and contact are required.");
        return;
      }

      if (!contactId) {
        console.warn("⚠️ Skipping update: no contact ID (likely a new row not yet saved)");
        return;
      }

      try {
        await updateContact(contactId, name, contact);
        inputs.forEach(i => i.setAttribute("readonly", true));
        editBtn.classList.remove("d-none");
        saveBtn.classList.add("d-none");
        cancelBtn.classList.add("d-none");
      } catch (err) {
        console.error("❌ Error saving contact:", err);
        alert("Failed to save contact.");
      }
    }

    // Delete
    if (e.target.classList.contains("btn-outline-danger")) {
      if (confirm("Are you sure you want to delete this contact?")) {
        const contactId = row.dataset.id;
        try {
          await deleteContact(contactId);
          row.remove();
        } catch (err) {
          console.error("❌ Error deleting contact:", err);
          alert("Failed to delete contact.");
        }
      }
    }
  });
});

async function addContact() {
  const contactList = document.getElementById("contact-list");

  const row = document.createElement("div");
  row.className = "row g-2 contact-item align-items-start mb-3";

  row.innerHTML = `
    <div class="col-md-6">
      <input type="text" class="form-control" placeholder="Name">
    </div>
    <div class="col-md-4">
      <input type="text" class="form-control" placeholder="Contact Info">
    </div>
    <div class="col-md-2 d-flex flex-wrap gap-1">
      <button class="btn btn-sm btn-outline-success create-btn">Save</button>
      <button class="btn btn-sm btn-outline-secondary cancel-btn">Cancel</button>
    </div>
  `;

  contactList.appendChild(row);

  const saveBtn = row.querySelector(".create-btn");
  const cancelBtn = row.querySelector(".cancel-btn");

  saveBtn.addEventListener("click", async () => {
    const inputs = row.querySelectorAll("input");
    const name = inputs[0].value.trim();
    const contact = inputs[1].value.trim();

    if (!name || !contact) {
      alert("Both name and contact are required.");
      return;
    }

    try {
      const newContact = await postContact(name, contact);
      row.remove();
      renderContactRow(newContact);
    } catch (err) {
      console.error("❌ Error saving contact:", err);
      alert(err.message || "Failed to add contact.");
    }
  });

  cancelBtn.addEventListener("click", () => {
    row.remove();
  });
}

function renderContactRow(contact) {
  const contactList = document.getElementById("contact-list");

  const row = document.createElement("div");
  row.className = "row g-2 contact-item align-items-start mb-3";
  row.dataset.id = contact.id;

  row.innerHTML = `
    <div class="col-md-6">
      <input type="text" class="form-control" value="${contact.name}" readonly>
    </div>
    <div class="col-md-4">
      <input type="text" class="form-control" value="${contact.contact}" readonly>
    </div>
    <div class="col-md-2 d-flex flex-wrap gap-1">
      <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
      <button class="btn btn-sm btn-outline-success save-btn d-none">Save</button>
      <button class="btn btn-sm btn-outline-secondary cancel-btn d-none">Cancel</button>
      <button class="btn btn-sm btn-outline-danger">Delete</button>
    </div>
  `;

  contactList.appendChild(row);
}

// --- API Calls ---

async function postContact(name, contact) {
  const token = localStorage.getItem("token");

  const res = await fetch("http://localhost:3000/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, contact })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to add contact");
  }

  return await res.json();
}

async function updateContact(id, name, contact) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:3000/contacts/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, contact })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update contact");
  }

  return await res.json();
}

async function deleteContact(id) {
  const token = localStorage.getItem("token");

  const res = await fetch(`http://localhost:3000/contacts/${id}`, {
    method: "DELETE",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to delete contact");
  }

  return await res.json();
}