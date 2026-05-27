/**
 * Hub Room Checklist - Save Functionality
 * Add this script before closing </body> tag in HubRoom.html
 */

// HubRoom specific save handler
async function saveHubRoomChecklist() {
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
          const notesInput = cells[3]?.querySelector('input');

          if (timeInput?.value) {
            readings.push({
              time: timeInput.value,
              temperature: parseFloat(tempInput?.value) || null,
              humidity: parseFloat(humidInput?.value) || null,
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

      console.log('Sending Hub Room data:', data);

      // Save to backend
      const response = await HubRoomAPI.save(data);

      if (response.success) {
        showNotification(`✓ Hub Room checklist saved successfully! ID: ${response.id}`, 'success');
        console.log('Saved with ID:', response.id);
        // Optional: Store ID for reference
        sessionStorage.setItem('hubroom_id', response.id);
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
      saveBtn.addEventListener('click', saveHubRoomChecklist);
      console.log('✓ Hub Room save button initialized');
    }
  });

  // Optional: Auto-save every 5 minutes
  let autoSaveInterval = null;

  function enableAutoSave(intervalMinutes = 5) {
    autoSaveInterval = setInterval(() => {
      console.log('Auto-saving Hub Room checklist...');
      saveHubRoomChecklist();
    }, intervalMinutes * 60 * 1000);
  }

  function disableAutoSave() {
    if (autoSaveInterval) {
      clearInterval(autoSaveInterval);
      autoSaveInterval = null;
    }
  }

  // Optional: Load previously saved data
  async function loadHubRoomData(id) {
    const response = await HubRoomAPI.getById(id);
    if (response.success) {
      // Populate form with saved data
      populateHubRoomForm(response.data);
    }
  }

  function populateHubRoomForm(data) {
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
        const notesInput = cells[3]?.querySelector('input');

        if (timeInput) timeInput.value = reading.time || '';
        if (tempInput) tempInput.value = reading.temperature || '';
        if (humidInput) humidInput.value = reading.humidity || '';
        if (notesInput) notesInput.value = reading.notes || '';
      }
    });

    console.log('✓ Form data loaded');
}
