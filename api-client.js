/**
 * API Client for Facility Checklist Backend
 * Handles all communication with the Node.js/Express backend
 */

const API_BASE_URL = 'https://globallogic-final.onrender.com/api';
let apiLoadingCount = 0;

function showLoading(message = 'Loading...') {
  let loader = document.getElementById('loading-indicator');

  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'loading-indicator';
    loader.setAttribute('role', 'status');
    loader.setAttribute('aria-live', 'polite');
    loader.style.cssText = `
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(15, 23, 42, 0.35);
      z-index: 10000;
      backdrop-filter: blur(2px);
    `;
    loader.innerHTML = `
      <div style="
        min-width: 220px;
        padding: 22px 26px;
        border-radius: 8px;
        background: #ffffff;
        color: #1f2937;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.28);
        text-align: center;
        font-family: Calibri, Segoe UI, Arial, sans-serif;
        font-size: 13px;
        font-weight: 700;
      ">
        <div style="
          width: 34px;
          height: 34px;
          margin: 0 auto 12px;
          border: 4px solid #dbeafe;
          border-top-color: #1a5276;
          border-radius: 50%;
          animation: api-loader-spin 0.8s linear infinite;
        "></div>
        <div id="loading-message"></div>
      </div>
    `;
    document.body.appendChild(loader);

    if (!document.getElementById('api-loader-style')) {
      const style = document.createElement('style');
      style.id = 'api-loader-style';
      style.textContent = '@keyframes api-loader-spin { to { transform: rotate(360deg); } }';
      document.head.appendChild(style);
    }
  }

  const messageEl = document.getElementById('loading-message');
  if (messageEl) messageEl.textContent = message;
}

function hideLoading() {
  const loader = document.getElementById('loading-indicator');
  if (loader) loader.remove();
}

async function apiRequest(url, options = {}, loadingMessage = 'Loading...', requestOptions = {}) {
  const showLoader = requestOptions.silent !== true;
  if (showLoader) {
    apiLoadingCount += 1;
    showLoading(loadingMessage);
  }

  try {
    const response = await fetch(url, options);
    return await response.json();
  } finally {
    if (showLoader) {
      apiLoadingCount = Math.max(0, apiLoadingCount - 1);
      if (apiLoadingCount === 0) hideLoading();
    }
  }
}

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
  async save(data, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/hubroom/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }, 'Saving Hub Room checklist...', options);
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
  async getAll(options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/hubroom/all`, {}, 'Loading Hub Room records...', options);
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
  async getById(id, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/hubroom/${id}`, {}, 'Loading Hub Room record...', options);
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
  async delete(id, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/hubroom/${id}`, {
        method: 'DELETE'
      }, 'Deleting Hub Room record...', options);
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
  async save(data, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/serverroom/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }, 'Saving Server Room checklist...', options);
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
  async getAll(options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/serverroom/all`, {}, 'Loading Server Room records...', options);
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
  async getById(id, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/serverroom/${id}`, {}, 'Loading Server Room record...', options);
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
  async delete(id, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/serverroom/${id}`, {
        method: 'DELETE'
      }, 'Deleting Server Room record...', options);
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
  async save(data, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/ups/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data)
      }, 'Saving UPS checklist...', options);
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
  async getAll(options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/ups/all`, {}, 'Loading UPS records...', options);
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
  async getById(id, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/ups/${id}`, {}, 'Loading UPS record...', options);
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
  async delete(id, options = {}) {
    try {
      return await apiRequest(`${API_BASE_URL}/ups/${id}`, {
        method: 'DELETE'
      }, 'Deleting UPS record...', options);
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
