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

// ─────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['*']
}));
app.use(express.json({ limit: '1mb' }));

// ─────────────────────────────────────────────
// Headers - بدون أي قيود تحجب WebRTC
// ─────────────────────────────────────────────
app.use(function (req, res, next) {
  // إذن الميكروفون مهم
  res.setHeader('Permissions-Policy', 'microphone=*, camera=*');

  // إزالة أي قيود على الـ embedding
  res.removeHeader('X-Frame-Options');
  res.removeHeader('Content-Security-Policy');
  res.removeHeader('Cross-Origin-Embedder-Policy');
  res.removeHeader('Cross-Origin-Opener-Policy');

  next();
});

// ─────────────────────────────────────────────
// Static Files
// ─────────────────────────────────────────────
app.use(express.static(__dirname, {
  index: false,
  extensions: ['html'],
  setHeaders: function (res, filepath) {
    if (filepath.endsWith('.mp4') || filepath.endsWith('.webm')) {
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Cache-Control', 'public, max-age=3600');
    }
  }
}));

// ─────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────
app.get('/api/health', function (req, res) {
  res.json({
    status: 'ok',
    service: 'Jojo AI - Cinematic Edition',
    version: '5.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─────────────────────────────────────────────
// Home Route
// ─────────────────────────────────────────────
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', function () {
  console.log('═══════════════════════════════════════════');
  console.log('🌟 جوجو AI - Cinematic Edition v5');
  console.log('📡 Port: ' + PORT);
  console.log('🤖 ElevenLabs Direct SDK');
  console.log('🎤 Microphone: Allowed');
  console.log('═══════════════════════════════════════════');
});
