// =====================================================
// جوجو AI - Server (مبسّط مع ElevenLabs ConvAI)
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

// Content Security Policy - يسمح بـ ElevenLabs SDK
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.elevenlabs.io wss://api.elevenlabs.io https://*.elevenlabs.io wss://*.elevenlabs.io; " +
    "media-src 'self' blob: https:; " +
    "worker-src 'self' blob:;"
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
    mode: 'ElevenLabs Conversational AI',
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
  console.log(`💬 يستخدم ElevenLabs Conversational AI`);
  console.log('═══════════════════════════════════════════');
});
