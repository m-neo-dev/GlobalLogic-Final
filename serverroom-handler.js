// ServerRoom specific save handler
async function saveServerRoomChecklist() {
  try {
    disableSaveButton(true);

    // Get date
    const dateInput = document.querySelector('input[type="date"]');
    const date = dateInput?.value || getIndiaDateStringForChecklistClient();

    // Collect readings from table
    const readings = [];
    const tableRows = document.querySelectorAll('table tbody tr');

    tableRows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length > 0) {
        const timeInput = cells[0]?.querySelector('input');
        const tempInput = cells[1]?.querySelector('input');
        const humidInput = cells[2]?.querySelector('input');
        const airFlowInput = cells[3]?.querySelector('input');
        const cableInput = cells[4]?.querySelector('input');
        const notesInput = cells[5]?.querySelector('input');

        if (timeInput?.value) {
          readings.push({
            time: timeInput.value,
            temperature: parseFloat(tempInput?.value) || null,
            humidity: parseFloat(humidInput?.value) || null,
            airFlow: airFlowInput?.value || '',
            cableManagement: cableInput?.value || '',
            notes: notesInput?.value || ''
          });
        }
      }
    });

    // Get signature fields
    const checkedBy = document.querySelector('input[name="checkedBy"]')?.value || '';
    const supervisorName = document.querySelector('input[name="supervisorName"]')?.value || '';
    const supervisorSignature = document.querySelector('input[name="supervisorSignature"]')?.value || '';

    // Prepare data
    const data = {
      date,
      readings,
      checkedBy,
      supervisorName,
      supervisorSignature
    };

    console.log('Sending Server Room data:', data);

    // Save to backend
    const response = await ServerRoomAPI.save(data);

    if (response.success) {
      showNotification(`✓ Server Room checklist saved successfully! ID: ${response.id}`, 'success');
      console.log('Saved with ID:', response.id);
      sessionStorage.setItem('serverroom_id', response.id);
    } else {
      showNotification(`✗ Error: ${response.message}`, 'error');
      console.error('Save failed:', response.error);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    showNotification('✗ Unexpected error occurred', 'error');
  } finally {
    disableSaveButton(false);
  }
}

// Attach event listener when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.querySelector('.btn-save');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveServerRoomChecklist);
    console.log('✓ Server Room save button initialized');
  }
});

// Optional: Auto-save every 5 minutes
let autoSaveInterval = null;

function enableAutoSave(intervalMinutes = 5) {
  autoSaveInterval = setInterval(() => {
    console.log('Auto-saving Server Room checklist...');
    saveServerRoomChecklist();
  }, intervalMinutes * 60 * 1000);
}

function disableAutoSave() {
  if (autoSaveInterval) {
    clearInterval(autoSaveInterval);
    autoSaveInterval = null;
  }
}

// Load previously saved data
async function loadServerRoomData(id) {
  const response = await ServerRoomAPI.getById(id);
  if (response.success) {
    populateServerRoomForm(response.data);
  }
}

function populateServerRoomForm(data) {
  // Set date
  const dateInput = document.querySelector('input[type="date"]');
  if (dateInput && data.date) {
    dateInput.value = data.date.split('T')[0];
  }

  // Set signature fields
  const checkedByInput = document.querySelector('input[name="checkedBy"]');
  if (checkedByInput) checkedByInput.value = data.checkedBy || '';

  const supervisorNameInput = document.querySelector('input[name="supervisorName"]');
  if (supervisorNameInput) supervisorNameInput.value = data.supervisorName || '';

  const supervisorSignatureInput = document.querySelector('input[name="supervisorSignature"]');
  if (supervisorSignatureInput) supervisorSignatureInput.value = data.supervisorSignature || '';

  // Populate readings
  const tableRows = document.querySelectorAll('table tbody tr');
  data.readings.forEach((reading, index) => {
    if (tableRows[index]) {
      const cells = tableRows[index].querySelectorAll('td');
      const timeInput = cells[0]?.querySelector('input');
      const tempInput = cells[1]?.querySelector('input');
      const humidInput = cells[2]?.querySelector('input');
      const airFlowInput = cells[3]?.querySelector('input');
      const cableInput = cells[4]?.querySelector('input');
      const notesInput = cells[5]?.querySelector('input');

      if (timeInput) timeInput.value = reading.time || '';
      if (tempInput) tempInput.value = reading.temperature || '';
      if (humidInput) humidInput.value = reading.humidity || '';
      if (airFlowInput) airFlowInput.value = reading.airFlow || '';
      if (cableInput) cableInput.value = reading.cableManagement || '';
      if (notesInput) notesInput.value = reading.notes || '';
    }
  });

  console.log('✓ Form data loaded');
}