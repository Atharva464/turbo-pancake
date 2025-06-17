const registrationCharges = 30000;
const miscCharges = 20000;
const parkingCharges = 1000000;

let flats = [];
let selectedFlat = null;

let lastDiscountInput = 'percent';

const flatListDiv = document.getElementById('flatList');
const resultsTable = document.getElementById('resultsTable');
const calcSection = document.getElementById('calcSection');
const discountPercentInput = document.getElementById('discountPercent');
const discountValueInput = document.getElementById('discountValue');
const discountRateInput = document.getElementById('discountRate');
const mgmtWaiverPercentInput = document.getElementById('mgmtWaiverPercent');
const mgmtWaiverValueInput = document.getElementById('mgmtWaiverValue');
const mgmtWaiverRateInput = document.getElementById('mgmtWaiverRate');
const errorBox = document.getElementById('errorBox');
let parkingToggle = document.getElementById('toggleParking');

const formatCurrency = val => `₹${Math.round(val).toLocaleString()}`;

if (!parkingToggle) {
  parkingToggle = document.createElement('input');
  parkingToggle.type = 'checkbox';
  parkingToggle.id = 'toggleParking';
  parkingToggle.style.margin = '10px 0';
  const label = document.createElement('label');
  label.textContent = ' Include Parking Charges (₹10,00,000)';
  label.style.fontWeight = '600';
  label.prepend(parkingToggle);
  calcSection.prepend(label);
}

let addParkingToDiscountCheckbox = document.getElementById('addParkingToDiscount');
if (!addParkingToDiscountCheckbox) {
  addParkingToDiscountCheckbox = document.createElement('input');
  addParkingToDiscountCheckbox.type = 'checkbox';
  addParkingToDiscountCheckbox.id = 'addParkingToDiscount';
  addParkingToDiscountCheckbox.style.marginLeft = '10px';

  const discountLabel = document.createElement('label');
  discountLabel.textContent = ' Add Parking to Discount';
  discountLabel.style.fontWeight = '500';
  discountLabel.prepend(addParkingToDiscountCheckbox);

  parkingToggle.parentElement.appendChild(discountLabel);
}

addParkingToDiscountCheckbox.onchange = () => selectedFlat && calculate(selectedFlat);

const filters = {
  wing: document.getElementById('filterWing'),
  band: document.getElementById('filterBand'),
  floor: document.getElementById('filterFloor'),
  config: document.getElementById('filterConfig'),
  status: document.getElementById('filterStatus'),
};

fetch('http://localhost:5000/api/flats')
  .then(res => res.json())
  .then(data => {
    flats = data;
    populateFilters();
    renderFlatList(flats);
  })
  .catch(err => {
    console.error('Failed to fetch flats:', err);
    flatListDiv.innerHTML = '<p style="color:red;">Could not load flat data</p>';
  });

discountPercentInput.oninput = () => {
  if (selectedFlat) {
    lastDiscountInput = 'percent';
    discountValueInput.value = '';
    discountRateInput.value = '';
    calculate(selectedFlat);
  }
};

discountValueInput.oninput = () => {
  if (selectedFlat) {
    lastDiscountInput = 'value';
    discountPercentInput.value = '';
    discountRateInput.value = '';
    calculate(selectedFlat);
  }
};

discountRateInput.oninput = () => {
  if (selectedFlat) {
    lastDiscountInput = 'rate';
    discountPercentInput.value = '';
    discountValueInput.value = '';
    calculate(selectedFlat);
  }
};

mgmtWaiverRateInput.oninput = () => {
  if (selectedFlat) {
    mgmtWaiverValueInput.value = '';
    mgmtWaiverPercentInput.value = '';
    calculate(selectedFlat);
  }
};

mgmtWaiverValueInput.oninput = () => {
  if (selectedFlat) {
    mgmtWaiverRateInput.value = '';
    mgmtWaiverPercentInput.value = '';
    calculate(selectedFlat);
  }
};

mgmtWaiverPercentInput.oninput = () => {
  if (selectedFlat) {
    mgmtWaiverRateInput.value = '';
    mgmtWaiverValueInput.value = '';
    calculate(selectedFlat);
  }
};

parkingToggle.onchange = () => {
  if (selectedFlat) calculate(selectedFlat);
  addParkingToDiscountCheckbox.disabled = !parkingToggle.checked;
  if (!parkingToggle.checked) addParkingToDiscountCheckbox.checked = false;
};



function populateFilters() {
  const unique = key => [...new Set(flats.map(f => f[key]).filter(Boolean))];
  const setOptions = (select, options) => {
    options.forEach(val => {
      const opt = document.createElement('option');
      opt.value = val;
      opt.textContent = val;
      select.appendChild(opt);
    });
  };

  setOptions(filters.wing, unique('wing'));
  setOptions(filters.band, unique('band'));
  setOptions(filters.floor, unique('floor'));
  setOptions(filters.config, unique('configuration'));
  setOptions(filters.status, unique('status'));
}

function applyFilters() {
  const filtered = flats.filter(flat =>
    (!filters.wing.value || flat.wing === filters.wing.value) &&
    (!filters.band.value || flat.band === filters.band.value) &&
    (!filters.floor.value || flat.floor.toString() === filters.floor.value) &&
    (!filters.config.value || flat.configuration === filters.config.value) &&
    (!filters.status.value || flat.status === filters.status.value)
  );
  renderFlatList(filtered);
}

document.getElementById('btnApplyFilters').onclick = applyFilters;
document.getElementById('btnClearFilters').onclick = () => {
  Object.values(filters).forEach(f => f.value = '');
  renderFlatList(flats);
};

document.getElementById('btnClearCalc').onclick = () => {
  discountPercentInput.value = '';
  discountValueInput.value = '';
  discountRateInput.value = '';
  mgmtWaiverPercentInput.value = '';
  mgmtWaiverValueInput.value = '';
  mgmtWaiverRateInput.value = '';
  addParkingToDiscountCheckbox.checked = false;
  parkingToggle.checked = false;
  errorBox.innerText = '';
  resultsTable.innerHTML = '';
  if (selectedFlat) calculate(selectedFlat);
};

document.getElementById('btnDeselectFlat').onclick = () => {
  selectedFlat = null;
  calcSection.style.display = 'none';
  errorBox.innerText = '';
  resultsTable.innerHTML = '';
  document.querySelectorAll('.flat-box').forEach(b => b.classList.remove('selected'));
};

function renderFlatList(data) {
  flatListDiv.innerHTML = '';
  data.forEach(flat => {
    const box = document.createElement('div');
    box.className = 'flat-box';
    box.innerText = `Flat ${flat.flat_no} | ${flat.area} sq.ft | ${flat.configuration} | Wing ${flat.wing}`;
    if (['sold', 'blocked', 'member', 'hold'].includes(flat.status)) {
      box.style.backgroundColor =
  flat.status === 'sold' ? '#edb9be' :
  flat.status === 'blocked' ? '#fff3cd' :
  flat.status === 'member' ? '#deb99b' :
  flat.status === 'hold' ? '#90EE90' : '';
      box.style.cursor = 'not-allowed';
      box.title = flat.status.charAt(0).toUpperCase() + flat.status.slice(1);
      box.innerText += `\n(${box.title})`;
    } else {
      box.onclick = () => {
        document.querySelectorAll('.flat-box').forEach(b => b.classList.remove('selected'));
        box.classList.add('selected');
        selectFlat(flat);
      };
    }
    flatListDiv.appendChild(box);
  });
}

function selectFlat(flat) {
  selectedFlat = flat;
  calcSection.style.display = 'block';

  document.getElementById('selectedFlatInfo').innerText =
    `Flat ${flat.flat_no} | ${flat.area} sq.ft | ${flat.configuration} | Wing ${flat.wing}`;

  calculate(flat);
}


function calculate(flat) {
  const area = flat.area;
  const baseRate = flat.psf_rate;

  let waiverRate = 0, waiverValue = 0, waiverPercent = 0;
  if (mgmtWaiverRateInput.value) {
    waiverRate = parseFloat(mgmtWaiverRateInput.value) || 0;
    waiverValue = waiverRate * area;
    waiverPercent = (waiverRate / baseRate) * 100;
    if (!mgmtWaiverValueInput.value) mgmtWaiverValueInput.value = Math.round(waiverValue);
    if (!mgmtWaiverPercentInput.value) mgmtWaiverPercentInput.value = waiverPercent.toFixed(2);
  } else if (mgmtWaiverValueInput.value) {
    waiverValue = parseFloat(mgmtWaiverValueInput.value) || 0;
    waiverRate = waiverValue / area;
    waiverPercent = (waiverRate / baseRate) * 100;
    if (!mgmtWaiverRateInput.value) mgmtWaiverRateInput.value = waiverRate.toFixed(2);
    if (!mgmtWaiverPercentInput.value) mgmtWaiverPercentInput.value = waiverPercent.toFixed(2);
  } else if (mgmtWaiverPercentInput.value) {
    waiverPercent = parseFloat(mgmtWaiverPercentInput.value) || 0;
    waiverRate = (waiverPercent / 100) * baseRate;
    waiverValue = waiverRate * area;
    if (!mgmtWaiverRateInput.value) mgmtWaiverRateInput.value = waiverRate.toFixed(2);
    if (!mgmtWaiverValueInput.value) mgmtWaiverValueInput.value = Math.round(waiverValue);
  }
  
  const adjustedBaseRate = baseRate - waiverRate;
  let grossAgreementValue = adjustedBaseRate * area;
  if (parkingToggle.checked) grossAgreementValue += parkingCharges;

let discountRate = 0, discountPercent = 0, discountAmount = 0;

if (lastDiscountInput === 'rate' && discountRateInput.value) {
  discountRate = parseFloat(discountRateInput.value);
  discountAmount = discountRate * area;
  discountPercent = (discountRate / adjustedBaseRate) * 100;

  discountValueInput.value = Math.round(discountAmount);
  discountPercentInput.value = discountPercent.toFixed(2);
} else if (lastDiscountInput === 'value' && discountValueInput.value) {
  discountAmount = parseFloat(discountValueInput.value);
  discountRate = discountAmount / area;
  discountPercent = (discountRate / adjustedBaseRate) * 100;

  discountRateInput.value = discountRate.toFixed(2);
  discountPercentInput.value = discountPercent.toFixed(2);
} else if (discountPercentInput.value) {
  discountPercent = parseFloat(discountPercentInput.value);
  discountRate = (discountPercent / 100) * adjustedBaseRate;
  discountAmount = discountRate * area;

  discountRateInput.value = discountRate.toFixed(2);
  discountValueInput.value = Math.round(discountAmount);
}

const discountAmountWithParking = addParkingToDiscountCheckbox.checked
  ? discountAmount + parkingCharges
  : discountAmount;

const finalDiscountRate = discountAmountWithParking / area;

const agreementValue = grossAgreementValue - discountAmountWithParking;
const netRate = adjustedBaseRate - finalDiscountRate;

  const newRate = agreementValue / area;
  const netRateWithParking = netRate + (parkingToggle.checked ? (parkingCharges / area) : 0);
  const finalPsfRate = netRateWithParking + discountRate;


  errorBox.innerText = newRate < flat.reckoner
    ? '⚠️ Discount too high. Rate falls below reckoner limit. Please reduce discount.'
    : '';

  const gstOnAV = agreementValue * 0.05;
  const stampDutyDynamic = Math.ceil((agreementValue * 0.06) / 500) * 500;
  const shareApp = 650;
  const adhocFund = 25000;
  const adhocGST = 4500;
  const idcRaw = Math.ceil(420 * area / 1000) * 1000;
  const idcBase = Math.round(idcRaw);
  const idcGST = Math.round(idcBase * 0.18);
  const camRaw = Math.ceil(10 * area * 18 / 1000) * 1000;
  const camBase = Math.round(camRaw);
  const camGST = Math.round(camBase * 0.18);
  const otherCharges = shareApp + adhocFund + adhocGST + idcBase + idcGST + camBase + camGST;
  const total = agreementValue + gstOnAV + registrationCharges + miscCharges + stampDutyDynamic + otherCharges;

  resultsTable.innerHTML = `
    <tr><td class="highlight">Gross Agreement Value${parkingToggle.checked ? ' (Incl. Parking)' : ''}</td><td class="highlight">${formatCurrency(grossAgreementValue)}</td></tr>
    <tr><td>Discount Amount</td><td>${formatCurrency(discountAmountWithParking)}</td></tr>
    <tr><td>Net Agreement Value</td><td>${formatCurrency(agreementValue)}</td></tr>
    <tr><td>GST on Net Agreement Value (5%)</td><td>${formatCurrency(gstOnAV)}</td></tr>
    <tr><td>Stamp Duty (6% of Net AV)</td><td>${formatCurrency(stampDutyDynamic)}</td></tr>
    <tr><td>Registration</td><td>${formatCurrency(registrationCharges)}</td></tr>
    <tr><td>Miscellaneous Agency Charges</td><td>${formatCurrency(miscCharges)}</td></tr>
    <tr><td>Other Charges</td><td>${formatCurrency(otherCharges)}</td></tr>
    <tr><td class="subtle">─ Share Application Money</td><td class="subtle">${formatCurrency(shareApp)}</td></tr>
    <tr><td class="subtle">─ Ad-Hoc Fund + GST</td><td class="subtle">${formatCurrency(adhocFund + adhocGST)}</td></tr>
    <tr><td class="subtle">─ IDC + GST</td><td class="subtle">${formatCurrency(idcBase + idcGST)}</td></tr>
    <tr><td class="subtle">─ CAM + GST</td><td class="subtle">${formatCurrency(camBase + camGST)}</td></tr>
    <tr><td><strong>Grand Total (Incl. GST)</strong></td><td><strong>${formatCurrency(total)}</strong></td></tr>
    <tr><td class="subtle">Original PSF Rate</td><td class="subtle">₹${baseRate.toLocaleString()}</td></tr>
    <tr><td class="subtle">Effective PSF (After Waiver)</td><td class="subtle">₹${Math.round(adjustedBaseRate).toLocaleString()}</td></tr>
    <tr><td class="subtle">Discount PSF Rate</td><td class="subtle">₹${Math.round(finalDiscountRate).toLocaleString()}</td></tr>
    <tr><td class="subtle">Net PSF Rate${parkingToggle.checked ? ' (Incl. Parking)' : ''}</td><td class="subtle">₹${Math.round(netRateWithParking).toLocaleString()}</td></tr>
    <tr><td class="subtle">Final PSF Rate${parkingToggle.checked ? ' (Incl. Parking)' : ''}</td><td class="${finalPsfRate < flat.reckoner ? 'danger' : 'subtle'}">₹${Math.round(finalPsfRate).toLocaleString()}</td></tr>
    <tr><td class="subtle">Ready Reckoner Rate</td><td class="subtle">₹${flat.reckoner?.toLocaleString() || '—'}</td></tr>`;

document.getElementById("btnMarkSold").onclick = () => {
  if (!selectedFlat) return alert("Please select a flat.");
  const pass = prompt("Enter Pass (6 characters, mix of letters & numbers):");
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/.test(pass)) {
    return alert("Invalid Pass. It must be 6 characters long and include both letters and numbers.");
  }

  const snapshot = buildSnapshot("sold", pass);
  submitSaleRequest(snapshot);
};

document.getElementById("btnMarkHold").onclick = () => {
  if (!selectedFlat) return alert("Please select a flat.");
  const pass = prompt("Enter Pass (6 characters, mix of letters & numbers):");
  if (!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6}$/.test(pass)) {
    return alert("Invalid Pass. It must be 6 characters long and include both letters and numbers.");
  }

  const snapshot = buildSnapshot("hold", pass);
  submitSaleRequest(snapshot);
};


function buildSnapshot(requestType, passNumber) {
  const area = selectedFlat.area;
  const baseRate = selectedFlat.psf_rate;
  const waiverRate = parseFloat(mgmtWaiverRateInput.value) || 0;
  const waiverValue = waiverRate * area;
  const waiverPercent = (waiverRate / baseRate) * 100;
  const discountRate = parseFloat(discountRateInput.value) || 0;
  const discountAmount = discountRate * area;
  const discountPercent = (discountRate / (baseRate - waiverRate)) * 100;
  const adjustedRate = baseRate - waiverRate;
  const netRate = adjustedRate - discountRate;
  const grossAgreementValue = adjustedRate * area + (parkingToggle.checked ? parkingCharges : 0);
  const agreementValue = grossAgreementValue - discountAmount;
  const finalRate = netRate + (parkingToggle.checked ? (parkingCharges / area) : 0);

  return {
    flat_no: selectedFlat.flat_no,
    wing: selectedFlat.wing,
    area: selectedFlat.area,
    configuration: selectedFlat.configuration,
    psf_rate: baseRate,
    waiver_rate: waiverRate,
    waiver_value: waiverValue,
    waiver_percent: waiverPercent,
    discount_rate: discountRate,
    discount: discountAmount,
    discount_percent: discountPercent,
    net_psf_rate: netRate,
    final_psf_rate: finalRate,
    reckoner: selectedFlat.reckoner,
    gross_agreement_value: grossAgreementValue,
    net_agreement_value: agreementValue,
    gst: agreementValue * 0.05,
    stamp_duty: Math.ceil((agreementValue * 0.06) / 500) * 500,
    registration: registrationCharges,
    misc_charges: miscCharges,
    other_charges: 20000,
    grand_total: agreementValue + (agreementValue * 0.05) + registrationCharges + miscCharges + 20000,
    parking_charges: parkingToggle.checked ? parkingCharges : 0,
    sold_at: new Date().toISOString(),
    pass: passNumber,
    request_type: requestType
  };
}

function submitSaleRequest(snapshot) {
  fetch("http://localhost:5000/api/flats/sale-request", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      flatNo: snapshot.flat_no,
      wing: snapshot.wing,
      snapshot
    })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) return alert("❌" + data.error);
      alert("✅ " + data.message);
    })
    .catch(() => alert("Failed to submit request"));
}
}