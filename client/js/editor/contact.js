document.addEventListener("DOMContentLoaded", () => {
  const contactList = document.getElementById("contact-list");

  contactList.addEventListener("click", (e) => {
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

    // Save
    if (e.target.classList.contains("save-btn")) {
      console.log("Saved Contact:", {
        name: inputs[0].value,
        email: inputs[1].value,
        phone: inputs[2].value
      });
      inputs.forEach(i => i.setAttribute("readonly", true));
      editBtn.classList.remove("d-none");
      saveBtn.classList.add("d-none");
      cancelBtn.classList.add("d-none");
    }

    // Delete
    if (e.target.classList.contains("btn-outline-danger")) {
      if (confirm("Are you sure you want to delete this contact?")) {
        row.remove();
      }
    }
  });
});

function addContact() {
  const contactList = document.getElementById("contact-list");

  const row = document.createElement("div");
  row.className = "row g-2 contact-item align-items-start mb-3";
  row.innerHTML = `
    <div class="col-md-4">
      <input type="text" class="form-control" placeholder="Name" readonly>
    </div>
    <div class="col-md-3">
      <input type="email" class="form-control" placeholder="Email" readonly>
    </div>
    <div class="col-md-3">
      <input type="text" class="form-control" placeholder="Phone" readonly>
    </div>
    <div class="col-md-2 d-flex flex-wrap gap-1">
      <button class="btn btn-sm btn-outline-primary edit-btn">Edit</button>
      <button class="btn btn-sm btn-outline-success save-btn d-none">Save</button>
      <button class="btn btn-sm btn-outline-secondary cancel-btn d-none">Cancel</button>
      <button class="btn btn-sm btn-outline-danger">Delete</button>
    </div>
  `;
  contactList.appendChild(row);

  // Auto trigger edit mode
  row.querySelector(".edit-btn").click();
}

