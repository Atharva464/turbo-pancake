document.addEventListener("DOMContentLoaded", () => {
  let allFlats = [];
  let saleRequests = [];

  const flatSection = document.getElementById("manageFlats");
  const saleSection = document.getElementById("saleRequests");

  const adminTableBody = document.querySelector("#adminTable tbody");
  if (adminTableBody) adminTableBody.innerHTML = '<tr><td colspan="10">Loading flats...</td></tr>';

  fetch("/api/flats")
    .then((res) => res.json())
    .then((data) => {
      allFlats = data;
      populateFilters(data);
      populateBandDropdown(data);
      renderAdminTable(data);
    })
    .catch((err) => {
      console.error("Error fetching flats:", err);
      showMessage("Failed to load flats", "error");
    });

  fetch("/admin/sale-requests")
    .then((res) => res.json())
    .then((data) => {
      saleRequests = data;
      renderSaleRequestsTable(data);
    })
    .catch((err) => {
      console.error("Error loading sale requests:", err);
      showMessage("Failed to load sale requests", "error");
    });

  function renderSaleRequestsTable(requests) {
    const tbody = document.querySelector("#saleRequestTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!requests.length) {
      tbody.innerHTML = '<tr><td colspan="7">No pending requests</td></tr>';
      return;
    }

    requests.forEach((req) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${req.flat_no}</td>
        <td>${req.wing}</td>
        <td>${req.data.area}</td>
        <td>${req.data.configuration}</td>
        <td>${req.data.pass}</td>
        <td>${req.data.request_type}</td>
        <td>
          <button onclick="approveRequest(${req.id})">Approve</button>
          <button onclick="rejectRequest(${req.id})">Reject</button>
        </td>
      `;
      tbody.appendChild(row);
    });
  }

  window.approveRequest = function (requestId) {
    fetch("/admin/sale-requests/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId })
    })
      .then(res => res.json())
      .then(data => {
        showMessage(data.message || "Request approved", "success");
        return Promise.all([
          fetch("/admin/sale-requests").then(res => res.json()),
          fetch("/api/flats").then(res => res.json())
        ]);
      })
      .then(([requests, flats]) => {
        saleRequests = requests;
        allFlats = flats;
        renderSaleRequestsTable(requests);
        renderAdminTable(flats);
      })
      .catch(() => showMessage("Failed to approve request", "error"));
  };

  window.rejectRequest = function (requestId) {
    fetch("/admin/sale-requests/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId })
    })
      .then(res => res.json())
      .then(data => {
        showMessage(data.message || "Request rejected", "info");
        return fetch("/admin/sale-requests");
      })
      .then(res => res.json())
      .then(data => {
        saleRequests = data;
        renderSaleRequestsTable(data);
      })
      .catch(() => showMessage("Failed to reject request", "error"));
  };

  function populateFilters(data) {
    const wings = [...new Set(data.map((f) => f.wing))];
    const configs = [...new Set(data.map((f) => f.configuration))];
    const bands = [...new Set(data.map((f) => f.band))];
    const floors = [...new Set(data.map((f) => f.floor))];
    const statuses = [...new Set(data.map((f) => f.status))];

    const wingSelect = document.getElementById("filterWing");
    const configSelect = document.getElementById("filterConfig");
    const bandSelect = document.getElementById("filterBand");
    const floorSelect = document.getElementById("filterFloor");
    const statusSelect = document.getElementById("filterStatus");
    const bulkBandSelect = document.getElementById("bulkBandSelect");

    if (wingSelect) wingSelect.innerHTML = '<option value="">All</option>';
    if (configSelect) configSelect.innerHTML = '<option value="">All</option>';
    if (bandSelect) bandSelect.innerHTML = '<option value="">All</option>';
    if (floorSelect) floorSelect.innerHTML = '<option value="">All</option>';
    if (statusSelect) statusSelect.innerHTML = '<option value="">All</option>';
    if (bulkBandSelect) bulkBandSelect.innerHTML = '<option value="">Select Band</option>';

    wings.forEach((w) => {
      const opt = document.createElement("option");
      opt.value = w;
      opt.textContent = w;
      wingSelect?.appendChild(opt);
    });

    configs.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      configSelect?.appendChild(opt);
    });

    bands.forEach((b) => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      bandSelect?.appendChild(opt);
      bulkBandSelect?.appendChild(opt.cloneNode(true));
    });

    floors.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f;
      opt.textContent = f;
      floorSelect?.appendChild(opt);
    });

    statuses.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s;
      opt.textContent = s;
      statusSelect?.appendChild(opt);
    });
  }

  function populateBandDropdown(data) {
    const uniqueBands = [...new Set(data.map(f => f.band))];
    const select = document.getElementById("bulkBandSelect");
    if (!select) return;

    select.innerHTML = '<option value="">Select Band</option>';
    uniqueBands.forEach(b => {
      const opt = document.createElement("option");
      opt.value = b;
      opt.textContent = b;
      select.appendChild(opt);
    });
  }

  window.applyFilters = function () {
    const wing = document.getElementById("filterWing").value;
    const config = document.getElementById("filterConfig").value;
    const band = document.getElementById("filterBand").value;
    const floor = document.getElementById("filterFloor").value;
    const status = document.getElementById("filterStatus").value;

    const filtered = allFlats.filter((f) => {
      return (!wing || f.wing === wing)
        && (!config || f.configuration === config)
        && (!band || f.band === band)
        && (!floor || String(f.floor) === floor)
        && (!status || f.status === status);
    });

    renderAdminTable(filtered);
  };

  window.clearFilters = function () {
    document.getElementById("filterWing").value = "";
    document.getElementById("filterConfig").value = "";
    document.getElementById("filterBand").value = "";
    document.getElementById("filterFloor").value = "";
    document.getElementById("filterStatus").value = "";
    renderAdminTable(allFlats);
  };

  function renderAdminTable(flats) {
    const tbody = document.querySelector("#adminTable tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    if (!flats.length) {
      tbody.innerHTML = '<tr><td colspan="11">No flats found</td></tr>';
      return;
    }

    flats.forEach((flat) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${flat.flat_no}</td>
        <td>${flat.configuration || "—"}</td>
        <td>${flat.wing}</td>
        <td>${flat.floor}</td>
        <td>${flat.area}</td>
        <td>${flat.reckoner || "—"}</td>
        <td>${flat.psf_rate || "—"}</td>
        <td>
          <select id="statusSelect-${flat.id}">
            <option value="available" ${flat.status === "available" ? "selected" : ""}>Available</option>
            <option value="hold" ${flat.status === "hold" ? "selected" : ""}>Hold</option>
            <option value="sold" ${flat.status === "sold" ? "selected" : ""}>Sold</option>
            <option value="blocked" ${flat.status === "blocked" ? "selected" : ""}>Blocked</option>
            <option value="member" ${flat.status === "member" ? "selected" : ""}>Member</option>
          </select>
        </td>
        <td>${flat.band || "—"}</td>
        <td>${flat.sale_pass && flat.sale_pass.trim() ? flat.sale_pass : "—"}</td>
        <td><button onclick="updateFlatStatus(${flat.id})">Update</button></td>
      `;
      tbody.appendChild(row);
    });
  }

  window.updateFlatStatus = function (flatId) {
    const select = document.getElementById(`statusSelect-${flatId}`);
    const newStatus = select.value;

    let body = { flatId, status: newStatus };

    if (["sold", "hold"].includes(newStatus)) {
      const pass = prompt("Enter 6-digit alphanumeric Pass (e.g. A1B2C3):");
      const isValid = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/.test(pass);
      if (!isValid) {
        showMessage("❗ Invalid Pass format. Must be 6 alphanumeric characters", "error");
        return;
      }
      body.pass = pass;
    }

    if (["available", "blocked", "member"].includes(newStatus)) {
      body.pass = null;
    }

    fetch(`/admin/update-status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then((data) => {
        showMessage(data.message || "Status updated", "success");
        return fetch("/api/flats");
      })
      .then((res) => res.json())
      .then((data) => {
        allFlats = data;
        populateFilters(data);
        renderAdminTable(data);
      })
      .catch(() => showMessage("Failed to update status", "error"));
  };

  function showMessage(msg, type = "info") {
    const box = document.getElementById("messageBox");
    if (!box) return;
    box.textContent = msg;
    box.className = type;
    setTimeout(() => (box.textContent = ""), 4000);
  }

  window.createBand = function () {
    const name = document.getElementById("newBandName").value.trim();
    const rate = document.getElementById("newBandRate").value;

    if (!name || !rate) {
      showMessage("❗ Enter both band name and rate", "error");
      return;
    }

    fetch("/admin/bands", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, rate }),
    })
      .then((res) => res.json())
      .then(() => fetch("/api/flats"))
      .then((res) => res.json())
      .then((data) => {
        allFlats = data;
        populateFilters(data);
        renderAdminTable(data);
        showMessage("Band created", "success");
      })
      .catch(() => showMessage("Failed to create band", "error"));
  };

  window.updateBandRate = function () {
    const band = document.getElementById("bulkBandSelect").value;
    const rate = document.getElementById("bulkBandRate").value;

    if (!band || !rate) {
      showMessage("❗ Select band and enter rate", "error");
      return;
    }

    fetch("/admin/bands/update-rate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ band, rate }),
    })
      .then((res) => res.json())
      .then(() => fetch("/api/flats"))
      .then((res) => res.json())
      .then((data) => {
        allFlats = data;
        populateFilters(data);
        renderAdminTable(data);
        showMessage("Band rate updated", "success");
      })
      .catch(() => showMessage("Failed to update rate", "error"));
  };
});
