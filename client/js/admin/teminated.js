document.addEventListener('DOMContentLoaded', function () {
  renderTerminatedTable();

  document.getElementById('searchInput').addEventListener('input', function () {
    const query = this.value.trim().toLowerCase();
    renderTerminatedTable(query);
  });
});

function renderTerminatedTable(filter = '') {
  const terminatedTable = document.getElementById('terminatedTable');
  terminatedTable.innerHTML = '';

  const terminatedList = JSON.parse(localStorage.getItem('terminatedRequests')) || [];

  terminatedList.forEach(request => {
    const name = request.name.toLowerCase();

    if (name.includes(filter)) {
      const highlightedName = highlightMatch(request.name, filter);

      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${highlightedName}</td>
        <td>${new Date().toISOString().split('T')[0]}</td>
        <td><span class="badge bg-danger">Terminated</span></td>
        <td>
          <button class="btn btn-warning btn-sm" onclick="undoTermination('${request.id}')">Undo Termination</button>
        </td>
      `;
      terminatedTable.appendChild(row);
    }
  });
}

function highlightMatch(text, query) {
  if (!query) return text;

  const pattern = new RegExp(`(${query})`, 'gi');
  return text.replace(pattern, '<span class="custom-highlight">$1</span>');
}

function undoTermination(id) {
  let terminatedList = JSON.parse(localStorage.getItem('terminatedRequests')) || [];
  let clientList = JSON.parse(localStorage.getItem('clientRequests')) || [];

  const target = terminatedList.find(req => req.id === id);
  if (!target) return;

  const confirmed = confirm(`Are you sure you want to restore ${target.name} to Client Requests?`);
  if (!confirmed) return;

  // Remove from terminated and add to client
  terminatedList = terminatedList.filter(req => req.id !== id);
  target.terminated = false;
  clientList.push(target);

  localStorage.setItem('terminatedRequests', JSON.stringify(terminatedList));
  localStorage.setItem('clientRequests', JSON.stringify(clientList));

  alert(`${target.name} has been restored.`);
  renderTerminatedTable();
}

