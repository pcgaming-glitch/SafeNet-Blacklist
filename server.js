const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const session = require('express-session');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_CODE = process.env.ADMIN_CODE || 'gKY5u7y62013';

const UPLOAD_DIR = path.join(__dirname, 'uploads');
const REPORT_FILE = path.join(__dirname, 'reports.json');

// Ensure uploads and reports file exist
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(REPORT_FILE)) fs.writeFileSync(REPORT_FILE, JSON.stringify([], null, 2));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'safenet-secret',
  resave: false,
  saveUninitialized: true
}));

// Serve public files
app.use(express.static(path.join(__dirname, 'public')));
// Serve uploads
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// POST report
app.post('/report', upload.single('proof'), (req, res) => {
  try {
    const { person, userId, reason } = req.body;
    if (!person || !userId || !reason) {
      return res.status(400).json({ ok: false, message: 'Vul alle velden in.' });
    }
    if (!req.file) {
      return res.status(400).json({ ok: false, message: 'Geen foto geüpload.' });
    }

    const reports = JSON.parse(fs.readFileSync(REPORT_FILE));
    const record = {
      id: uuidv4(),
      person,
      userId,
      reason,
      proofFilename: req.file.filename,
      proofOriginalName: req.file.originalname,
      createdAt: new Date().toISOString()
    };
    reports.unshift(record);
    fs.writeFileSync(REPORT_FILE, JSON.stringify(reports, null, 2));
    return res.json({ ok: true, message: 'Rapport ontvangen.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, message: 'Server error' });
  }
});

// Admin login
app.post('/admin/login', (req, res) => {
  const { code } = req.body;
  if (code === ADMIN_CODE) {
    req.session.isAdmin = true;
    return res.json({ ok: true });
  } else {
    return res.status(401).json({ ok: false, message: 'Onjuist code' });
  }
});

// Admin logout
app.post('/admin/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.json({ ok: true });
  });
});

// Get reports (admin only)
app.get('/api/reports', (req, res) => {
  if (!req.session.isAdmin) return res.status(401).json({ ok: false, message: 'Unauthorized' });
  const reports = JSON.parse(fs.readFileSync(REPORT_FILE));
  res.json({ ok: true, reports });
});

// Start server
app.listen(PORT, () => {
  console.log(`SafeNet Blacklist server running on http://localhost:${PORT}`);
  console.log(`Admin code (default): ${ADMIN_CODE}`);
});
