AOS.init();

const backToTopBtn = document.querySelector('.back-to-top');
window.addEventListener('scroll', () => {
  backToTopBtn.classList.toggle('show', window.scrollY > 200);
});

// Load registrar contacts dynamically from backend
async function loadRegistrarContacts() {
  try {
    const res = await fetch('http://localhost:3000/contacts');
    const registrarContacts = await res.json();

    const container = document.getElementById("registrarContactsContainer");
    container.innerHTML = ""; // Clear existing

    registrarContacts.forEach(contact => {
      const card = document.createElement("div");
      card.className = "col-lg-6 col-md-12";
      card.innerHTML = `
        <div class="card p-4 h-100 shadow-sm border-0">
          <h4 class="mb-3 text-danger"><i class="bi bi-person-fill me-2"></i>${contact.name}</h4>
          <ul class="list-unstyled mb-4">
            <li class="mb-3">
              <i class="bi bi-telephone-fill me-2 text-danger"></i>${contact.contact}
            </li>
          </ul>
        </div>
      `;
      container.appendChild(card);
    });

  } catch (err) {
    console.error("❌ Failed to load registrar contacts:", err);
  }
}

loadRegistrarContacts();