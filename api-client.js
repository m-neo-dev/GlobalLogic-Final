/**
 * API Client for Facility Checklist Backend
 * Handles all communication with the Node.js/Express backend
 */

const API_BASE_URL = 'https://globallogic-final.onrender.com/api';

function getIndiaDateStringForChecklistClient() {
  if (typeof getIndiaToday === 'function') return getIndiaToday();

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date());

  const map = {};
  parts.forEach(part => {
    if (part.type !== 'literal') map[part.type] = part.value;
  });

  return `${map.year}-${map.month}-${map.day}`;
}

// ==================== HUB ROOM API ====================

const HubRoomAPI = {
  /**
   * Save Hub Room checklist data
   * @param {Object} data - Checklist data containing readings, signatures, etc.
   * @returns {Promise<Object>} Response from server
   */
  async save(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/hubroom/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('HubRoom API Error:', error);
      return {
        success: false,
        message: 'Error communicating with server',
        error: error.message
      };
    }
  },

  /**
   * Fetch all Hub Room records
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/hubroom/all`);
      return await response.json();
    } catch (error) {
      console.error('HubRoom API Error:', error);
      return {
        success: false,
        message: 'Error fetching records',
        error: error.message
      };
    }
  },

  /**
   * Fetch a specific Hub Room record
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/hubroom/${id}`);
      return await response.json();
    } catch (error) {
      console.error('HubRoom API Error:', error);
      return {
        success: false,
        message: 'Error fetching record',
        error: error.message
      };
    }
  },

  /**
   * Delete a Hub Room record
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/hubroom/${id}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('HubRoom API Error:', error);
      return {
        success: false,
        message: 'Error deleting record',
        error: error.message
      };
    }
  }
};

// ==================== SERVER ROOM API ====================

const ServerRoomAPI = {
  /**
   * Save Server Room checklist data
   */
  async save(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/serverroom/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('ServerRoom API Error:', error);
      return {
        success: false,
        message: 'Error communicating with server',
        error: error.message
      };
    }
  },

  /**
   * Fetch all Server Room records
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/serverroom/all`);
      return await response.json();
    } catch (error) {
      console.error('ServerRoom API Error:', error);
      return {
        success: false,
        message: 'Error fetching records',
        error: error.message
      };
    }
  },

  /**
   * Fetch a specific Server Room record
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/serverroom/${id}`);
      return await response.json();
    } catch (error) {
      console.error('ServerRoom API Error:', error);
      return {
        success: false,
        message: 'Error fetching record',
        error: error.message
      };
    }
  },

  /**
   * Delete a Server Room record
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/serverroom/${id}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('ServerRoom API Error:', error);
      return {
        success: false,
        message: 'Error deleting record',
        error: error.message
      };
    }
  }
};

// ==================== UPS API ====================

const UPSAPI = {
  /**
   * Save UPS checklist data
   */
  async save(data) {
    try {
      const response = await fetch(`${API_BASE_URL}/ups/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (error) {
      console.error('UPS API Error:', error);
      return {
        success: false,
        message: 'Error communicating with server',
        error: error.message
      };
    }
  },

  /**
   * Fetch all UPS records
   */
  async getAll() {
    try {
      const response = await fetch(`${API_BASE_URL}/ups/all`);
      return await response.json();
    } catch (error) {
      console.error('UPS API Error:', error);
      return {
        success: false,
        message: 'Error fetching records',
        error: error.message
      };
    }
  },

  /**
   * Fetch a specific UPS record
   */
  async getById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/ups/${id}`);
      return await response.json();
    } catch (error) {
      console.error('UPS API Error:', error);
      return {
        success: false,
        message: 'Error fetching record',
        error: error.message
      };
    }
  },

  /**
   * Delete a UPS record
   */
  async delete(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/ups/${id}`, {
        method: 'DELETE'
      });
      return await response.json();
    } catch (error) {
      console.error('UPS API Error:', error);
      return {
        success: false,
        message: 'Error deleting record',
        error: error.message
      };
    }
  }
};

// ==================== HELPER FUNCTIONS ====================

/**
 * Collect form data from a checklist page
 * This is a generic function that can be adapted for each checklist type
 */
function collectChecklistData(formType) {
  const data = {
    date: document.querySelector('input[type="date"]')?.value || getIndiaDateStringForChecklistClient(),
    readings: [],
    checkedBy: document.querySelector('input[name="checkedBy"]')?.value || '',
    supervisorName: document.querySelector('input[name="supervisorName"]')?.value || '',
    supervisorSignature: document.querySelector('input[name="supervisorSignature"]')?.value || ''
  };

  // Collect readings from table rows
  const tableRows = document.querySelectorAll('tbody tr');
  tableRows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    if (inputs.length > 0) {
      const reading = {
        time: inputs[0]?.value || ''
      };
      // Collect remaining input values as reading data
      for (let i = 1; i < inputs.length; i++) {
        reading[`value${i}`] = inputs[i]?.value || '';
      }
      if (reading.time) {
        data.readings.push(reading);
      }
    }
  });

  return data;
}

/**
 * Show notification to user
 */
function showNotification(message, type = 'success') {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#28a745' : '#dc3545'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    z-index: 10000;
    font-weight: 600;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);

  setTimeout(() => notif.remove(), 3000);
}

/**
 * Disable save button during submission
 */
function disableSaveButton(disable = true) {
  const saveBtn = document.querySelector('.btn-save');
  if (saveBtn) {
    saveBtn.disabled = disable;
    saveBtn.style.opacity = disable ? '0.6' : '1';
    saveBtn.textContent = disable ? 'Saving...' : 'Save Data';
  }
}
