// =====================================================
// جوجو AI - Server (نسخة محسّنة بنماذج متعددة)
// سفيرة التحول الحضري بأمانة محافظة الطائف
// =====================================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// Middleware
// =====================================================
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Content Security Policy آمن
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com data:; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self'; " +
    "media-src 'self' blob:;"
  );
  next();
});

// تقديم الملفات الثابتة من جذر المشروع
app.use(express.static(__dirname, {
  index: false,
  extensions: ['html']
}));

// =====================================================
// شخصية جوجو
// =====================================================
const JOJO_SYSTEM_PROMPT = `أنتِ "جوجو"، سفيرة التحول الحضري بأمانة محافظة الطائف في المملكة العربية السعودية.

شخصيتك:
- اسمك: جوجو
- منصبك: سفيرة التحول الحضري بأمانة محافظة الطائف
- لهجتك: سعودية رسمية أنيقة
- أسلوبك: راقٍ، مختصر، ذكي، ودود، مهني

قواعد الرد:
1. ردّي دائمًا باللغة العربية الفصحى مع لمسة سعودية رسمية.
2. اجعلي إجاباتك مختصرة (جملتين إلى ثلاث جمل في الغالب) لأن ردك سيُقرأ صوتيًا.
3. رحّبي بالمستخدم بأسلوب راقٍ مثل: "أهلاً وسهلاً بك، يسعدني خدمتك".
4. عرّفي بنفسك عند أول رد إذا سُئلتِ.
5. تحدثي عن الطائف ومشاريع التحول الحضري بفخر واعتزاز.
6. إذا سُئلتِ عن أمر خارج اختصاصك، اعتذري بلطف ووجّهي المستخدم.
7. لا تستخدمي رموز تعبيرية (Emojis) ولا علامات Markdown مثل ** أو ##.
8. اكتبي الأرقام بالعربية إن أمكن.
9. لا تذكري أنك ذكاء اصطناعي إلا إذا سُئلتِ مباشرة.

مثال على ردك:
"أهلاً وسهلاً بك، يسعدني خدمتك. كيف أقدر أساعدك اليوم؟"`;

// =====================================================
// قائمة النماذج بالترتيب (الأعلى جودة أولاً، ثم احتياطي)
// =====================================================
const MODELS = [
  'deepseek/deepseek-chat-v3.1:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'google/gemini-2.0-flash-exp:free',
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'qwen/qwen-2.5-72b-instruct:free'
];

// =====================================================
// دالة استدعاء نموذج واحد
// =====================================================
async function callModel(model, messages, apiKey, siteUrl) {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': siteUrl,
      'X-Title': 'Jojo AI - Taif Municipality'
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.7,
      max_tokens: 400,
      top_p: 0.9
    })
  });

  const data = await response.json();

  if (!response.ok) {
    const errMsg = data?.error?.message || `HTTP ${response.status}`;
    throw new Error(`[${model}] ${errMsg}`);
  }

  const reply = data?.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error(`[${model}] رد فارغ`);
  }

  return reply;
}

// =====================================================
// نقطة المحادثة الرئيسية
// =====================================================
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'الرسالة مطلوبة',
        reply: 'عذرًا، لم أتمكن من فهم رسالتك. هل يمكنك إعادة المحاولة؟'
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error('❌ OPENROUTER_API_KEY غير موجود');
      return res.status(500).json({
        error: 'مفتاح API غير مهيأ',
        reply: 'عذرًا، الخدمة غير متاحة حاليًا.'
      });
    }

    const siteUrl = process.env.SITE_URL || 'https://jojo-ai.up.railway.app';

    // بناء سجل المحادثة
    const messages = [
      { role: 'system', content: JOJO_SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];

    console.log('📨 رسالة جديدة:', message);

    // محاولة كل نموذج بالترتيب
    let lastError = null;
    for (const model of MODELS) {
      try {
        console.log(`🔄 محاولة النموذج: ${model}`);
        const reply = await callModel(model, messages, apiKey, siteUrl);
        console.log(`✅ نجح النموذج: ${model}`);
        console.log(`💬 الرد: ${reply.substring(0, 80)}...`);
        return res.json({ reply, model });
      } catch (err) {
        console.warn(`⚠️ فشل ${model}:`, err.message);
        lastError = err;
        // كمّل للنموذج التالي
      }
    }

    // كل النماذج فشلت
    console.error('❌ كل النماذج فشلت. آخر خطأ:', lastError?.message);
    return res.status(500).json({
      error: 'فشل كل النماذج',
      details: lastError?.message,
      reply: 'عذرًا، الخدمة مشغولة حاليًا. يُرجى المحاولة بعد قليل.'
    });

  } catch (error) {
    console.error('❌ خطأ في السيرفر:', error.message);
    res.status(500).json({
      error: 'خطأ داخلي',
      reply: 'عذرًا، حدث خطأ غير متوقع. يُرجى المحاولة مرة أخرى.'
    });
  }
});

// =====================================================
// نقطة فحص الصحة
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Jojo AI',
    hasApiKey: !!process.env.OPENROUTER_API_KEY,
    models: MODELS.length,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// اختبار النماذج (للتشخيص)
// =====================================================
app.get('/api/test-models', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return res.json({ error: 'لا يوجد مفتاح API' });
  }

  const siteUrl = process.env.SITE_URL || 'https://jojo-ai.up.railway.app';
  const testMessages = [{ role: 'user', content: 'قل: مرحبا' }];
  const results = [];

  for (const model of MODELS) {
    try {
      const reply = await callModel(model, testMessages, apiKey, siteUrl);
      results.push({ model, status: 'ok', reply: reply.substring(0, 50) });
    } catch (err) {
      results.push({ model, status: 'failed', error: err.message });
    }
  }

  res.json({ results });
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
  console.log(`🌟 جوجو AI تعمل على المنفذ ${PORT}`);
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✅ موجود' : '❌ مفقود'}`);
  console.log(`🤖 عدد النماذج المتاحة: ${MODELS.length}`);
  console.log('═══════════════════════════════════════════');
});
