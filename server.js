// =====================================================
// جوجو AI - Server (مع ElevenLabs TTS)
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
// إعدادات ElevenLabs
// =====================================================
const JOJO_VOICE_ID = 'mRdG9GYEjJmIzqbYTidv'; // صوت Sana
const ELEVENLABS_MODEL = 'eleven_multilingual_v2'; // يدعم العربية وكل اللغات

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
// شخصية جوجو
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
- NEVER mix languages in one reply.

RESPONSE RULES:
1. Keep replies SHORT (2-3 sentences max) because they will be read aloud.
2. Greet warmly when appropriate.
3. Speak about Taif and urban transformation projects with pride.
4. NEVER use emojis or Markdown symbols.
5. Do NOT mention you are an AI unless directly asked.
6. Stay in character as Jojo at all times.

EXAMPLE:
User: "السلام عليكم"
You: "وعليكم السلام ورحمة الله، أهلاً وسهلاً بك. أنا جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. كيف أقدر أساعدك؟"`;

// =====================================================
// نماذج OpenRouter
// =====================================================
const PRIMARY_MODEL = 'openrouter/free';
const FALLBACK_MODELS = [
  'meta-llama/llama-3.3-70b-instruct',
  'mistralai/mistral-small-3.1-24b-instruct',
  'google/gemma-3-27b-it'
];

// =====================================================
// كشف اللغة
// =====================================================
function detectLanguage(text) {
  if (!text) return 'unknown';
  if (/[\u0600-\u06FF]/.test(text)) return 'ar';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
  if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
  if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
  if (/[\u0400-\u04FF]/.test(text)) return 'ru';

  const lower = text.toLowerCase();
  if (/\b(bonjour|merci|oui|comment|allez|vous|je|suis)\b/.test(lower) ||
      /[àâçéèêëîïôûùüÿœæ]/.test(lower)) return 'fr';
  if (/\b(hola|gracias|cómo|qué|sí|buenos|buenas)\b/.test(lower) ||
      /[ñ¿¡]/.test(lower)) return 'es';
  if (/\b(hallo|danke|guten|tag|wie|was|ich|bin)\b/.test(lower) ||
      /[äöüß]/.test(lower)) return 'de';
  if (/\b(merhaba|teşekkür|nasıl|evet|hayır)\b/.test(lower) ||
      /[çğıöşü]/.test(lower)) return 'tr';

  return 'en';
}

// =====================================================
// استدعاء نموذج OpenRouter
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
  if (!reply) throw new Error(`[${model}] رد فارغ`);
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

    // محاولة النموذج الرئيسي
    try {
      const result = await callModel(PRIMARY_MODEL, messages, apiKey, siteUrl);
      const replyLang = detectLanguage(result.reply);
      console.log(`✅ ${result.modelUsed}: ${result.reply.substring(0, 60)}...`);
      return res.json({ reply: result.reply, model: result.modelUsed, userLang, replyLang });
    } catch (err) {
      console.warn(`⚠️ فشل ${PRIMARY_MODEL}:`, err.message);
    }

    // المحاولات الاحتياطية
    let lastError = null;
    for (const model of FALLBACK_MODELS) {
      try {
        const result = await callModel(model, messages, apiKey, siteUrl);
        const replyLang = detectLanguage(result.reply);
        console.log(`✅ ${result.modelUsed}`);
        return res.json({ reply: result.reply, model: result.modelUsed, userLang, replyLang });
      } catch (err) {
        console.warn(`⚠️ فشل ${model}:`, err.message);
        lastError = err;
      }
    }

    const errorMessages = {
      ar: 'عذرًا، الخدمة مشغولة حاليًا. يُرجى المحاولة بعد قليل.',
      en: 'Sorry, the service is busy right now. Please try again shortly.',
      fr: 'Désolé, le service est occupé. Veuillez réessayer plus tard.'
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
// نقطة تحويل النص لصوت (ElevenLabs TTS)
// =====================================================
app.post('/api/tts', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'النص مطلوب' });
    }

    const elevenApiKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenApiKey) {
      console.error('❌ ELEVENLABS_API_KEY غير موجود');
      return res.status(500).json({ error: 'مفتاح ElevenLabs غير مهيأ' });
    }

    console.log(`🔊 تحويل النص لصوت (${text.length} حرف)`);

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${JOJO_VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenApiKey
        },
        body: JSON.stringify({
          text: text,
          model_id: ELEVENLABS_MODEL,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ خطأ من ElevenLabs:', response.status, errorText);
      return res.status(response.status).json({
        error: 'فشل تحويل النص لصوت',
        details: errorText
      });
    }

    // تمرير الصوت مباشرة للمتصفح
    const audioBuffer = await response.buffer();
    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Cache-Control': 'no-cache'
    });
    res.send(audioBuffer);

    console.log(`✅ تم إرسال ${audioBuffer.length} بايت من الصوت`);

  } catch (error) {
    console.error('❌ خطأ في TTS:', error.message);
    res.status(500).json({ error: 'خطأ في تحويل النص لصوت' });
  }
});

// =====================================================
// نقطة فحص الصحة
// =====================================================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Jojo AI',
    hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
    hasElevenLabsKey: !!process.env.ELEVENLABS_API_KEY,
    voiceId: JOJO_VOICE_ID,
    primaryModel: PRIMARY_MODEL,
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
  console.log(`🌟 جوجو AI تعمل على المنفذ ${PORT}`);
  console.log(`🔑 OpenRouter: ${process.env.OPENROUTER_API_KEY ? '✅' : '❌'}`);
  console.log(`🎤 ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? '✅' : '❌'}`);
  console.log(`🎵 Voice ID: ${JOJO_VOICE_ID}`);
  console.log('═══════════════════════════════════════════');
});
