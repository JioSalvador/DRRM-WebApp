const logs = []; // Will be filled from backend

document.addEventListener('DOMContentLoaded', () => {
  fetchLogsFromBackend();
});

const fetchLogsFromBackend = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('❌ No token found in localStorage.');
    return;
  }

  document.getElementById('logList').innerHTML = '<div class="text-light">Loading logs...</div>';

  try {
    const res = await fetch('http://localhost:3000/logsRoutes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`❌ Failed to fetch logs. Status ${res.status}:`, data);
      return;
    }

    console.log("✅ Logs fetched:", data);

    logs.length = 0;
    logs.push(...data);

    displayLogs();
  } catch (err) {
    console.error("❌ Network error while fetching logs:", err);
  }
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function groupLogsByDate(logs) {
  return logs.reduce((acc, log) => {
    const day = formatDate(log.created_at);
    acc[day] = acc[day] || [];
    acc[day].push(log);
    return acc;
  }, {});
}

function displayLogs(filter = '') {
  const logList = document.getElementById("logList");
  logList.innerHTML = "";
  const groupedLogs = groupLogsByDate(logs);
  const range = document.getElementById("timeRange").value;
  let hasResults = false;

  for (const [date, logGroup] of Object.entries(groupedLogs)) {
    const groupContainer = document.createElement("div");
    const dateHeading = document.createElement("div");
    dateHeading.className = "log-date-group";
    dateHeading.innerHTML = `<i class='bi bi-calendar-event me-2'></i>${date}`;
    let count = 0;

    logGroup.forEach(log => {
      const logDate = new Date(log.created_at);
      const today = new Date();
      const daysAgo = parseInt(range);
      const matchRange = !range || (today - logDate <= daysAgo * 24 * 60 * 60 * 1000);

      const searchLower = filter.toLowerCase();
      const matchSearch = !filter || (
        (log.name || '').toLowerCase().includes(searchLower) ||
        (log.role || '').toLowerCase().includes(searchLower) ||
        (log.action || '').toLowerCase().includes(searchLower)
      );

      if (matchSearch && matchRange) {
        const row = document.createElement("div");
        row.className = "log-row";
        row.setAttribute("data-bs-toggle", "modal");
        row.setAttribute("data-bs-target", "#logModal");
        row.onclick = () => showLogDetails(log);
        if (filter) row.classList.add("highlight");

        const timestamp = log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown Date';

        row.innerHTML = `
          <div><i class="bi bi-person me-2"></i>${log.name || 'N/A'}</div>
          <div><i class="bi bi-person-badge me-2"></i>${log.role}</div>
          <div><i class="bi bi-pencil-square me-2"></i>${log.action}</div>
          <div><i class="bi bi-clock me-2"></i>${timestamp}</div>
        `;
        groupContainer.appendChild(row);
        count++;
      }
    });

    if (count > 0) {
      hasResults = true;
      logList.appendChild(dateHeading);
      logList.appendChild(groupContainer);
    }
  }

  if (!hasResults) {
    logList.innerHTML = '<div class="no-results">No logs found for the selected filters.</div>';
  }
}

function showLogDetails(detail) {
  const modalBody = document.getElementById("modalBody");
  const timestamp = detail.created_at ? new Date(detail.created_at).toLocaleString() : 'Unknown';

  modalBody.innerHTML = `
    <div class="row"><div class="col-sm-4 fw-bold">User ID:</div><div class="col-sm-8">${detail.user_id}</div></div>
    <div class="row"><div class="col-sm-4 fw-bold">Role:</div><div class="col-sm-8">${detail.role}</div></div>
    <div class="row"><div class="col-sm-4 fw-bold">Username:</div><div class="col-sm-8">${detail.name || 'N/A'}</div></div>
    <div class="row"><div class="col-sm-4 fw-bold">Action:</div><div class="col-sm-8">${detail.action}</div></div>
    <div class="row"><div class="col-sm-4 fw-bold">Description:</div><div class="col-sm-8">${detail.description}</div></div>
    <div class="row"><div class="col-sm-4 fw-bold">Action Performed At:</div><div class="col-sm-8">${timestamp}</div></div>
  `;
}

function searchLogs() {
  const value = document.getElementById("searchInput").value.trim();
  displayLogs(value);
}

function logout() {
  fetch('http://localhost:3000/auth/logout', {
    method: 'POST',
    credentials: 'include'
  })
    .then(res => {
      if (res.ok) {
        window.location.href = '/index.html';
      } else {
        alert('Logout failed.');
      }
    })
    .catch(err => {
      console.error('Logout error:', err);
      alert('Logout error.');
    });
}