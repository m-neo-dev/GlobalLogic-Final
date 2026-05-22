/**
 * UPS Checklist - Save Functionality
 * This version maps data to the 'colX' format expected by the backend schema.
 */

// UPS specific save handler
async function saveUPSChecklist() {
  try {
    disableSaveButton(true);

    // Get date
    const dateInput = document.querySelector('input[type="date"]');
    const date = dateInput?.value || getIndiaDateStringForChecklistClient();

    // Get UPS unit
    const upsUnitSelect = document.getElementById('ups-unit');
    const upsUnit = upsUnitSelect?.value || '1';

    // Collect readings from table
    const readings = [];
    const tableRows = document.querySelectorAll('#data-body tr');

    tableRows.forEach((row, index) => {
      const inputs = row.querySelectorAll('input');
      const timeLabel = row.querySelector('.time-label')?.textContent || "";

      // Check if any input in this row has data
      let hasData = false;
      inputs.forEach(inp => { if (inp.value) hasData = true; });

      if (hasData) {
        // Create reading object matching the 'colX' schema in server.js
        const reading = { time: timeLabel };

        inputs.forEach((input, i) => {
          const val = input.value;
          // col19 is usually the signature (text), others are numeric
          reading[`col${i}`] = (i === 19) ? val : (parseFloat(val) || null);
        });
        readings.push(reading);
      }
    });

    // Get signature fields
    const supervisorName = document.getElementById("sig-supervisor")?.value || '';
    const checkedBy = document.getElementById("sig-employee")?.value || '';

    // Prepare data matching UPS Schema in server.js
    const data = {
      date: date,
      upsUnit: upsUnit,
      readings: readings,
      checkedBy: checkedBy,
      supervisorName: supervisorName,
      supervisorSignature: supervisorName // Mapping to schema field
    };

    console.log('Sending UPS data:', data);

    // Save to backend using the API client
    const response = await UPSAPI.save(data);

    if (response.success) {
      if (typeof showNotification === 'function') {
        showNotification(`✓ UPS checklist saved successfully! ID: ${response.id}`, 'success');
      }
      console.log('Saved with ID:', response.id);
    } else {
      if (typeof showNotification === 'function') {
        showNotification(`✗ Error: ${response.message}`, 'error');
      }
      console.error('Save failed:', response.message);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    if (typeof showNotification === 'function') {
      showNotification('✗ Unexpected error occurred', 'error');
    }
  } finally {
    disableSaveButton(false);
  }
}

// Attach event listener when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  const saveBtn = document.querySelector('.navbar-btn[onclick="saveData()"]') ||
    document.querySelector('.btn-save');

  // Override the inline onclick if necessary or link the button
  if (saveBtn) {
    saveBtn.onclick = saveUPSChecklist;
    console.log('✓ UPS save logic linked');
  }
});

// Load previously saved data and populate the 'colX' fields
async function loadUPSData(id) {
  const response = await UPSAPI.getById(id);
  if (response.success) {
    populateUPSForm(response.data);
  }
}

function populateUPSForm(data) {
  // Set date
  const dateInput = document.getElementById('check-date');
  if (dateInput && data.date) {
    dateInput.value = data.date.split('T')[0];
  }

  // Set UPS unit
  const upsUnitSelect = document.getElementById('ups-unit');
  if (upsUnitSelect) upsUnitSelect.value = data.upsUnit || '1';

  // Set signature fields
  const supervisorInput = document.getElementById('sig-supervisor');
  if (supervisorInput) supervisorInput.value = data.supervisorName || '';

  const employeeInput = document.getElementById('sig-employee');
  if (employeeInput) employeeInput.value = data.checkedBy || '';

  // Populate readings from the col0-col19 format
  const tableRows = document.querySelectorAll('#data-body tr');
  if (data.readings) {
    data.readings.forEach((reading, index) => {
      if (tableRows[index]) {
        const inputs = tableRows[index].querySelectorAll('input');
        inputs.forEach((inp, i) => {
          inp.value = reading[`col${i}`] !== null ? reading[`col${i}`] : '';
        });
      }
    });
  }

  // Trigger threshold checks if function exists in UPS.html
  if (typeof applyAllThresholds === 'function') {
    applyAllThresholds();
  }

  console.log('✓ Form data loaded');
}
