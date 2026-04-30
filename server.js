// ═══════════════════════════════════════════════════════════
// جوجو AI - Server
// أمانة محافظة الطائف
// ═══════════════════════════════════════════════════════════

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// إعدادات بسيطة
app.use(function (req, res, next) {
  res.setHeader('Permissions-Policy', 'microphone=*');
  next();
});

// Static Files - يخدم كل الملفات
app.use(express.static(__dirname));

// Health Check
app.get('/api/health', function (req, res) {
  res.json({ status: 'ok', service: 'Jojo AI' });
});

// الصفحة الرئيسية
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start Server
app.listen(PORT, '0.0.0.0', function () {
  console.log('🌟 Jojo AI running on port ' + PORT);
});
