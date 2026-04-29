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
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// ─────────────────────────────────────────────
// Headers مهمة لـ ElevenLabs ConvAI
// ─────────────────────────────────────────────
app.use(function (req, res, next) {
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self' https: data: blob:",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' https: data:",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https: wss: data: blob:",
      "media-src 'self' blob: data: https:",
      "worker-src 'self' blob: data:",
      "child-src 'self' blob: data:",
      "frame-src 'self' https: blob:",
      "object-src 'none'"
    ].join('; ')
  );

  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self), camera=()');

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
    version: '4.0.0',
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
  console.log('🌟 جوجو AI - Cinematic Edition');
  console.log('📡 Port: ' + PORT);
  console.log('🤖 ElevenLabs ConvAI: Active');
  console.log('🎨 Design: Premium Cinematic');
  console.log('═══════════════════════════════════════════');
});
