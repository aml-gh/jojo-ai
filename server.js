// =====================================================
// جوجو AI - Server (مع ElevenLabs Widget)
// سفيرة التحول الحضري بأمانة محافظة الطائف
// =====================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// Middleware
// =====================================================
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Content Security Policy - يسمح لـ ElevenLabs widget بالعمل
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://*.elevenlabs.io https://unpkg.com; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://*.elevenlabs.io https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://*.elevenlabs.io; " +
    "font-src 'self' https://fonts.gstatic.com https://*.elevenlabs.io data:; " +
    "img-src 'self' data: blob: https:; " +
    "connect-src 'self' https://*.elevenlabs.io wss://*.elevenlabs.io https://api.us.elevenlabs.io wss://api.us.elevenlabs.io; " +
    "media-src 'self' blob: https://*.elevenlabs.io; " +
    "worker-src 'self' blob:; " +
    "frame-src 'self' https://*.elevenlabs.io;"
  );
  next();
});

// تقديم الملفات الثابتة من جذر المشروع
app.use(express.static(__dirname, {
  index: false,
  extensions: ['html']
}));

// =====================================================
// نقطة فحص الصحة
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Jojo AI',
    mode: 'ElevenLabs Conversational AI Widget',
    agentId: 'agent_5301kqcwsvhxfa7aqn1sjewpd30z',
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// الصفحة الرئيسية
// =====================================================
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// =====================================================
// تشغيل السيرفر
// =====================================================
app.listen(PORT, '0.0.0.0', () => {
  console.log('═══════════════════════════════════════════');
  console.log(`🌟 جوجو AI - Conversational Edition`);
  console.log(`📡 المنفذ: ${PORT}`);
  console.log(`🤖 Agent ID: agent_5301kqcwsvhxfa7aqn1sjewpd30z`);
  console.log(`💬 ElevenLabs Conversational AI Widget`);
  console.log('═══════════════════════════════════════════');
});
