// =====================================================
// جوجو AI - Server (مع ElevenLabs Widget + AudioWorklets)
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

// =====================================================
// Headers مهمة للـ AudioWorklets و Widget
// =====================================================
app.use((req, res, next) => {
  // CSP مفتوح للسماح بكل ما يحتاجه Widget من ElevenLabs
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

  // Headers مهمة لـ AudioWorklets
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'microphone=(self "https://*.elevenlabs.io"), camera=()');

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
  console.log(`🌟 جوجو AI - Conversational Edition v2`);
  console.log(`📡 المنفذ: ${PORT}`);
  console.log(`🤖 Agent ID: agent_5301kqcwsvhxfa7aqn1sjewpd30z`);
  console.log(`💬 ElevenLabs Conversational AI Widget`);
  console.log(`🎤 AudioWorklets: مفعّل`);
  console.log('═══════════════════════════════════════════');
});
