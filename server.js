const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const INDIA_TIME_ZONE = 'Asia/Kolkata';

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://192.168.1.100:5000',
    'https://global-logic-final.vercel.app',
    'https://globallogic-final.onrender.com'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(__dirname));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✓ MongoDB Connected Successfully');
  })
  .catch(err => {
    console.error('✗ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// ==================== DATABASE SCHEMAS ====================

// Hub Room Checklist Schema
const hubRoomSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  readings: [{
    time: String,
    temperature: Number,
    humidity: Number,
    signature: String,
    notes: String
  }],
  checkedBy: String,
  supervisorName: String,
  supervisorSignature: String,
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});

// Server Room Checklist Schema
const serverRoomSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  readings: [{
    time: String,
    temperature: Number,
    humidity: Number,
    airFlow: String,
    cableManagement: String,
    signature: String,
    notes: String
  }],
  checkedBy: String,
  supervisorName: String,
  supervisorSignature: String,
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});

// UPS Checklist Schema
const upsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  upsUnit: String,
  readings: [{
    time: String,
    col0: mongoose.Schema.Types.Mixed,
    col1: mongoose.Schema.Types.Mixed,
    col2: mongoose.Schema.Types.Mixed,
    col3: mongoose.Schema.Types.Mixed,
    col4: mongoose.Schema.Types.Mixed,
    col5: mongoose.Schema.Types.Mixed,
    col6: mongoose.Schema.Types.Mixed,
    col7: mongoose.Schema.Types.Mixed,
    col8: mongoose.Schema.Types.Mixed,
    col9: mongoose.Schema.Types.Mixed,
    col10: mongoose.Schema.Types.Mixed,
    col11: mongoose.Schema.Types.Mixed,
    col12: mongoose.Schema.Types.Mixed,
    col13: mongoose.Schema.Types.Mixed,
    col14: mongoose.Schema.Types.Mixed,
    col15: mongoose.Schema.Types.Mixed,
    col16: mongoose.Schema.Types.Mixed,
    col17: mongoose.Schema.Types.Mixed,
    col18: mongoose.Schema.Types.Mixed,
    col19: mongoose.Schema.Types.Mixed
  }],
  checkedBy: String,
  supervisorName: String,
  supervisorSignature: String,
  createdAt: { type: Date, default: () => new Date() },
  updatedAt: { type: Date, default: () => new Date() }
});

// Models
const HubRoom = mongoose.model('HubRoom', hubRoomSchema);
const ServerRoom = mongoose.model('ServerRoom', serverRoomSchema);
const UPS = mongoose.model('UPS', upsSchema);
const TWO_HOUR_TIMES_24H = ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
const TWO_HOUR_TIMES_SHORT = ['0:00', '2:00', '4:00', '6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

// ==================== CHECKLIST EDIT RULES ====================

function getIndiaNowParts(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: INDIA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(now);

  const map = {};
  parts.forEach(part => {
    if (part.type !== 'literal') map[part.type] = part.value;
  });

  const hour = map.hour === '24' ? '00' : map.hour;
  return {
    date: `${map.year}-${map.month}-${map.day}`,
    minutes: Number(hour) * 60 + Number(map.minute)
  };
}

function getDateRangeForRequestDate(dateString) {
  const start = new Date(`${dateString}T00:00:00.000Z`);
  const end = new Date(`${dateString}T23:59:59.999Z`);
  return { start, end };
}

function timeToMinutes(timeText) {
  const [hour, minute] = String(timeText).trim().split(':').map(Number);
  if (!Number.isFinite(hour)) return null;
  return hour * 60 + (Number.isFinite(minute) ? minute : 0);
}

function isFilled(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function sameCellValue(a, b) {
  if (!isFilled(a) && !isFilled(b)) return true;
  return String(a).trim() === String(b).trim();
}

function getActiveTimeWindowError(dateString, time, allTimes) {
  const now = getIndiaNowParts();
  if (dateString !== now.date) {
    return `This checklist date is not editable now. Current India date is ${now.date}.`;
  }

  const rowIndex = allTimes.indexOf(time);
  const start = timeToMinutes(time);
  const next = rowIndex >= 0 && rowIndex + 1 < allTimes.length
    ? timeToMinutes(allTimes[rowIndex + 1])
    : 24 * 60;

  if (start === null || now.minutes <= start || now.minutes >= next) {
    return `Row ${time} is editable only after ${time} and before the next row time in India time.`;
  }

  return '';
}

async function mergeAndValidateChecklistReadings(options) {
  const { Model, date, readings, fields, times, extraQuery = {} } = options;
  const dateString = String(date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return { error: 'Valid checklist date is required.' };
  }
  const incomingReadings = Array.isArray(readings) ? readings : [];
  const allTimes = times || Array.from(new Set(incomingReadings.map(r => r.time).filter(Boolean)));
  const { start, end } = getDateRangeForRequestDate(dateString);

  const existing = await Model.findOne({
    date: { $gte: start, $lte: end },
    ...extraQuery
  }).sort({ createdAt: -1 });

  if (!existing) {
    for (const reading of incomingReadings) {
      for (const field of fields) {
        if (isFilled(reading[field])) {
          const error = getActiveTimeWindowError(dateString, reading.time, allTimes);
          if (error) return { error };
        }
      }
    }
    return { readings: incomingReadings };
  }

  const byTime = new Map();
  existing.readings.forEach(reading => byTime.set(reading.time, reading.toObject ? reading.toObject() : reading));

  for (const reading of incomingReadings) {
    if (!reading.time) continue;
    const existingReading = byTime.get(reading.time) || { time: reading.time };

    for (const field of fields) {
      const oldValue = existingReading[field];
      const newValue = reading[field];

      if (isFilled(oldValue)) {
        if (isFilled(newValue) && !sameCellValue(oldValue, newValue)) {
          return { error: `Cell ${reading.time} / ${field} already has data and cannot be edited.` };
        }
        existingReading[field] = oldValue;
      } else if (isFilled(newValue)) {
        const error = getActiveTimeWindowError(dateString, reading.time, allTimes);
        if (error) return { error };
        existingReading[field] = newValue;
      }
    }

    byTime.set(reading.time, existingReading);
  }

  return { readings: Array.from(byTime.values()) };
}

// ==================== API ROUTES ====================

// HUB ROOM ENDPOINTS
app.post('/api/hubroom/save', async (req, res) => {
  try {
    const { date, readings, checkedBy, supervisorName, supervisorSignature } = req.body;
    const validation = await mergeAndValidateChecklistReadings({
      Model: HubRoom,
      date,
      readings,
      fields: ['temperature', 'signature', 'notes'],
      times: TWO_HOUR_TIMES_24H
    });

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const hubRoomData = new HubRoom({
      date: new Date(date),
      readings: validation.readings || [],
      checkedBy,
      supervisorName,
      supervisorSignature
    });

    const savedData = await hubRoomData.save();
    res.status(201).json({
      success: true,
      message: 'Hub Room checklist saved successfully',
      data: savedData,
      id: savedData._id
    });
  } catch (error) {
    console.error('Error saving Hub Room data:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving Hub Room checklist',
      error: error.message
    });
  }
});

app.get('/api/hubroom/all', async (req, res) => {
  try {
    const allRecords = await HubRoom.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: allRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Hub Room records',
      error: error.message
    });
  }
});

app.get('/api/hubroom/:id', async (req, res) => {
  try {
    const record = await HubRoom.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Hub Room record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Hub Room record',
      error: error.message
    });
  }
});

// SERVER ROOM ENDPOINTS
app.post('/api/serverroom/save', async (req, res) => {
  try {
    const { date, readings, checkedBy, supervisorName, supervisorSignature } = req.body;
    const validation = await mergeAndValidateChecklistReadings({
      Model: ServerRoom,
      date,
      readings,
      fields: ['temperature', 'humidity', 'signature', 'notes'],
      times: TWO_HOUR_TIMES_SHORT
    });

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const serverRoomData = new ServerRoom({
      date: new Date(date),
      readings: validation.readings || [],
      checkedBy,
      supervisorName,
      supervisorSignature
    });

    const savedData = await serverRoomData.save();
    res.status(201).json({
      success: true,
      message: 'Server Room checklist saved successfully',
      data: savedData,
      id: savedData._id
    });
  } catch (error) {
    console.error('Error saving Server Room data:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving Server Room checklist',
      error: error.message
    });
  }
});

app.get('/api/serverroom/all', async (req, res) => {
  try {
    const allRecords = await ServerRoom.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: allRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Server Room records',
      error: error.message
    });
  }
});

app.get('/api/serverroom/:id', async (req, res) => {
  try {
    const record = await ServerRoom.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Server Room record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching Server Room record',
      error: error.message
    });
  }
});

// UPS ENDPOINTS
app.post('/api/ups/save', async (req, res) => {
  try {
    const { date, upsUnit, readings, checkedBy, supervisorName, supervisorSignature } = req.body;
    const validation = await mergeAndValidateChecklistReadings({
      Model: UPS,
      date,
      readings,
      fields: Array.from({ length: 20 }, (_, index) => `col${index}`),
      times: TWO_HOUR_TIMES_SHORT,
      extraQuery: { upsUnit }
    });

    if (validation.error) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const upsData = new UPS({
      date: new Date(date),
      upsUnit,
      readings: validation.readings || [],
      checkedBy,
      supervisorName,
      supervisorSignature
    });

    const savedData = await upsData.save();
    res.status(201).json({
      success: true,
      message: 'UPS checklist saved successfully',
      data: savedData,
      id: savedData._id
    });
  } catch (error) {
    console.error('Error saving UPS data:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving UPS checklist',
      error: error.message
    });
  }
});

app.get('/api/ups/all', async (req, res) => {
  try {
    const allRecords = await UPS.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      data: allRecords
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching UPS records',
      error: error.message
    });
  }
});

app.get('/api/ups/:id', async (req, res) => {
  try {
    const record = await UPS.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'UPS record not found'
      });
    }
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching UPS record',
      error: error.message
    });
  }
});

// DELETE endpoints
app.delete('/api/hubroom/:id', async (req, res) => {
  try {
    await HubRoom.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Hub Room record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting record',
      error: error.message
    });
  }
});

app.delete('/api/serverroom/:id', async (req, res) => {
  try {
    await ServerRoom.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Server Room record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting record',
      error: error.message
    });
  }
});

app.delete('/api/ups/:id', async (req, res) => {
  try {
    await UPS.findByIdAndDelete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'UPS record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting record',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date()
  });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════╗
  ║   Facility Checklist API Server        ║
  ║   Running on port ${PORT}               ║
  ║   Environment: ${process.env.NODE_ENV}      ║
  ╚════════════════════════════════════════╝
  `);
});

module.exports = app;
