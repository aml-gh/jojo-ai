// =====================================================
// جوجو AI - Server (نسخة متعددة اللغات)
// سفيرة التحول الحضري بأمانة محافظة الطائف
// ترد بنفس لغة المستخدم تلقائيًا
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

app.use(express.static(__dirname, {
  index: false,
  extensions: ['html']
}));

// =====================================================
// شخصية جوجو متعددة اللغات
// =====================================================
const JOJO_SYSTEM_PROMPT = `You are "Jojo" (جوجو), the Urban Transformation Ambassador for the Municipality of Taif Governorate (أمانة محافظة الطائف) in Saudi Arabia.

YOUR IDENTITY:
- Name: Jojo (جوجو)
- Role: Urban Transformation Ambassador at Taif Municipality
- Personality: Elegant, formal, smart, warm, professional, concise

CRITICAL LANGUAGE RULE:
- ALWAYS reply in the EXACT SAME LANGUAGE the user speaks to you.
- If the user speaks Arabic → reply in formal Saudi Arabic.
- If the user speaks English → reply in elegant English.
- If the user speaks French → reply in elegant French.
- If the user speaks Spanish → reply in elegant Spanish.
- If the user speaks Turkish → reply in elegant Turkish.
- If the user speaks any other language → reply in that same language.
- NEVER mix languages in one reply.
- NEVER translate or add notes in another language.

RESPONSE RULES:
1. Keep replies SHORT (2-3 sentences max) because they will be read aloud by text-to-speech.
2. Greet warmly when appropriate. Examples:
   - Arabic: "أهلاً وسهلاً بك، يسعدني خدمتك"
   - English: "Welcome, it's my pleasure to assist you"
   - French: "Bienvenue, c'est un plaisir de vous aider"
3. Introduce yourself if asked who you are.
4. Speak about Taif and urban transformation projects with pride.
5. If asked about something outside your scope, politely apologize and redirect.
6. NEVER use emojis or Markdown symbols (** ## etc.).
7. Do NOT mention you are an AI unless directly asked.
8. Stay in character as Jojo at all times.

EXAMPLES:
User (Arabic): "السلام عليكم"
You: "وعليكم السلام ورحمة الله، أهلاً وسهلاً بك. أنا جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. كيف أقدر أساعدك؟"

User (English): "Hello, who are you?"
You: "Welcome! I am Jojo, the Urban Transformation Ambassador at the Municipality of Taif. How may I assist you today?"

User (French): "Bonjour"
You: "Bonjour et bienvenue. Je suis Jojo, ambassadrice de la transformation urbaine de la municipalité de Taïf. Comment puis-je vous aider?"`;

// =====================================================
// النماذج
// =====================================================
const PRIMARY_MODEL = 'openrouter/free';
const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-small-3.1-24b-instruct',
  'google/gemma-3-27b-it'
];

// =====================================================
// كشف اللغة من النص (للسجل والـ frontend)
// =====================================================
function detectLanguage(text) {
  if (!text) return 'unknown';

  // عربي
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  // صيني
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  // ياباني
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  // كوري
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  // سيريلي (روسي)
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';
  // عبري
  if (/[\u0590-\u05FF]/.test(text)) return 'he';
  // تايلاندي
  if (/[\u0E00-\u0E7F]/.test(text)) return 'th';

  // كشف اللغات اللاتينية بناءً على كلمات مفتاحية
  const lower = text.toLowerCase();

  // فرنسي
  if (/\b(bonjour|merci|oui|non|comment|allez|vous|je|suis|est|que|qui|où)\b/.test(lower) ||
      /[àâçéèêëîïôûùüÿœæ]/.test(lower)) return 'fr';

  // إسباني
  if (/\b(hola|gracias|cómo|qué|sí|por favor|buenos|buenas|adiós)\b/.test(lower) ||
      /[ñ¿¡]/.test(lower)) return 'es';

  // ألماني
  if (/\b(hallo|danke|guten|tag|wie|was|ich|bin|ist)\b/.test(lower) ||
      /[äöüß]/.test(lower)) return 'de';

  // إيطالي
  if (/\b(ciao|grazie|come|cosa|sì|per favore|buongiorno|prego)\b/.test(lower)) return 'it';

  // تركي
  if (/\b(merhaba|teşekkür|nasıl|ne|evet|hayır|günaydın)\b/.test(lower) ||
      /[çğıöşü]/.test(lower)) return 'tr';

  // إنجليزي (افتراضي للحروف اللاتينية)
  return 'en';
}

// =====================================================
// استدعاء نموذج
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

  return { reply, modelUsed: data?.model || model };
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
        reply: 'عذرًا، لم أتمكن من فهم رسالتك.'
      });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'مفتاح API غير مهيأ',
        reply: 'عذرًا، الخدمة غير متاحة حاليًا.'
      });
    }

    const siteUrl = process.env.SITE_URL || 'https://jojo-ai.up.railway.app';
    const userLang = detectLanguage(message);

    console.log(`📨 رسالة (${userLang}):`, message);

    const messages = [
      { role: 'system', content: JOJO_SYSTEM_PROMPT },
      ...history.slice(-6),
      { role: 'user', content: message }
    ];

    // المحاولة الأولى
    try {
      const result = await callModel(PRIMARY_MODEL, messages, apiKey, siteUrl);
      const replyLang = detectLanguage(result.reply);
      console.log(`✅ ${result.modelUsed} (رد بـ ${replyLang}): ${result.reply.substring(0, 60)}...`);
      return res.json({
        reply: result.reply,
        model: result.modelUsed,
        userLang,
        replyLang
      });
    } catch (err) {
      console.warn(`⚠️ فشل ${PRIMARY_MODEL}:`, err.message);
    }

    // المحاولات الاحتياطية
    let lastError = null;
    for (const model of FALLBACK_MODELS) {
      try {
        const result = await callModel(model, messages, apiKey, siteUrl);
        const replyLang = detectLanguage(result.reply);
        console.log(`✅ ${result.modelUsed} (رد بـ ${replyLang})`);
        return res.json({
          reply: result.reply,
          model: result.modelUsed,
          userLang,
          replyLang
        });
      } catch (err) {
        console.warn(`⚠️ فشل ${model}:`, err.message);
        lastError = err;
      }
    }

    // كل المحاولات فشلت - رد بلغة المستخدم
    const errorMessages = {
      ar: 'عذرًا، الخدمة مشغولة حاليًا. يُرجى المحاولة بعد قليل.',
      en: 'Sorry, the service is busy right now. Please try again shortly.',
      fr: 'Désolé, le service est occupé. Veuillez réessayer plus tard.',
      es: 'Lo siento, el servicio está ocupado. Por favor, inténtelo más tarde.',
      de: 'Entschuldigung, der Dienst ist gerade beschäftigt. Bitte versuchen Sie es später erneut.',
      tr: 'Üzgünüm, servis şu anda meşgul. Lütfen daha sonra tekrar deneyin.'
    };

    return res.status(500).json({
      error: 'فشل كل النماذج',
      details: lastError?.message,
      reply: errorMessages[userLang] || errorMessages.en,
      userLang
    });

  } catch (error) {
    console.error('❌ خطأ في السيرفر:', error.message);
    res.status(500).json({
      error: 'خطأ داخلي',
      reply: 'عذرًا، حدث خطأ غير متوقع.'
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
    primaryModel: PRIMARY_MODEL,
    fallbackCount: FALLBACK_MODELS.length,
    multilingual: true,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// اختبار النماذج
// =====================================================
app.get('/api/test-models', async (req, res) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return res.json({ error: 'لا يوجد مفتاح API' });

  const siteUrl = process.env.SITE_URL || 'https://jojo-ai.up.railway.app';
  const testMessages = [{ role: 'user', content: 'قل: مرحبا' }];
  const allModels = [PRIMARY_MODEL, ...FALLBACK_MODELS];
  const results = [];

  for (const model of allModels) {
    try {
      const result = await callModel(model, testMessages, apiKey, siteUrl);
      results.push({
        model,
        status: 'ok',
        actualModel: result.modelUsed,
        reply: result.reply.substring(0, 60)
      });
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
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✅' : '❌'}`);
  console.log(`🌍 دعم متعدد اللغات: مفعّل`);
  console.log(`🤖 النموذج الرئيسي: ${PRIMARY_MODEL}`);
  console.log('═══════════════════════════════════════════');
});
