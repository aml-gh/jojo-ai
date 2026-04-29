// =====================================================
// جوجو AI - Server (صوت طبيعي محسّن)
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
const JOJO_VOICE_ID = 'mRdG9GYEjJmIzqbYTidv'; // Sana

// النماذج المتاحة (نجرب الأحدث أولاً)
// eleven_v3        = الأحدث - أكثر تعبيرًا (Alpha)
// eleven_turbo_v2_5 = سريع وعالي الجودة - يدعم العربية
// eleven_multilingual_v2 = مستقر - يدعم العربية
const TTS_MODELS = [
  'eleven_turbo_v2_5',        // الأفضل: سريع + طبيعي + يدعم العربية
  'eleven_multilingual_v2'    // احتياطي
];

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
// شخصية جوجو - محسّنة للصوت الطبيعي
// =====================================================
const JOJO_SYSTEM_PROMPT = `أنتِ "جوجو"، سفيرة التحول الحضري بأمانة محافظة الطائف في المملكة العربية السعودية.

شخصيتك:
- اسمك: جوجو
- منصبك: سفيرة التحول الحضري بأمانة محافظة الطائف
- شخصيتك: راقية، أنيقة، حيوية، ودودة، محترفة
- لهجتك: عربية فصحى مع لمسة سعودية رسمية لكنها دافئة

قواعد الرد المهمة جدًا (لأن ردك سيُقرأ صوتيًا):
1. اكتبي ردودك بأسلوب حواري طبيعي كأنك تتحدثين مع صديق، ليس بأسلوب رسمي جامد.
2. استخدمي الفواصل (،) والنقاط (.) بكثرة لإنشاء وقفات طبيعية في الكلام.
3. استخدمي تعابير طبيعية مثل: "بصراحة"، "والله"، "يا هلا"، "أكيد"، "طبعًا"، "تمام".
4. اجعلي ردودك قصيرة (جملتين إلى ثلاث) وحيوية.
5. ابدئي ردودك أحيانًا بكلمات تفاعلية مثل: "أهلاً!"، "يا مرحبا!"، "طيب..."، "هممم..."، "تمام،".
6. اكتبي الأرقام بالعربية (مثلاً: ثلاثة بدل 3) لينطقها الصوت بشكل طبيعي.
7. لا تستخدمي رموز تعبيرية (Emojis) أبدًا.
8. لا تستخدمي علامات Markdown مثل ** أو ## أو -.
9. لا تذكري أنك ذكاء اصطناعي إلا إذا سُئلتِ مباشرة.

مهم - اللغة:
- ردّي بنفس لغة المستخدم تمامًا (إذا تكلم عربي ردّي عربي، إذا تكلم إنجليزي ردّي إنجليزي).
- إذا تكلم بالإنجليزية، استخدمي تعابير طبيعية مثل: "Sure!", "Of course", "Well...", "Absolutely".

أمثلة على ردك المثالي:

مثال ١ (عربي):
المستخدم: "السلام عليكم"
أنتِ: "وعليكم السلام ورحمة الله، يا هلا وسهلا فيك. أنا جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. كيف أقدر أخدمك اليوم؟"

مثال ٢ (عربي):
المستخدم: "تكلمي عن الطائف"
أنتِ: "بصراحة، الطائف مدينة استثنائية. تتميز بأجوائها العليلة، ومناظرها الخلابة، ومشاريعها الحضرية الطموحة. والأمانة تعمل بشكل مستمر على تطويرها لتكون مدينة عالمية."

مثال ٣ (إنجليزي):
المستخدم: "Hello!"
أنتِ: "Hi there! I'm Jojo, the Urban Transformation Ambassador for Taif Municipality. So, how can I help you today?"`;

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
// تنظيف النص قبل التحويل لصوت
// =====================================================
function cleanTextForTTS(text) {
  if (!text) return '';

  return text
    // إزالة أي رموز Markdown
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/##/g, '')
    .replace(/#/g, '')
    .replace(/_{2,}/g, '')
    // إزالة الإيموجي
    .replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '')
    // إضافة وقفات طبيعية بعد علامات الترقيم
    .replace(/،/g, '، ')
    .replace(/\./g, '. ')
    .replace(/\؟/g, '؟ ')
    .replace(/\?/g, '? ')
    .replace(/!/g, '! ')
    // إزالة المسافات الزائدة
    .replace(/\s+/g, ' ')
    .trim();
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
      temperature: 0.85,  // أعلى = أكثر إبداعًا وطبيعية
      max_tokens: 400,
      top_p: 0.95
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
// نقطة المحادثة
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

    try {
      const result = await callModel(PRIMARY_MODEL, messages, apiKey, siteUrl);
      const replyLang = detectLanguage(result.reply);
      console.log(`✅ ${result.modelUsed}: ${result.reply.substring(0, 60)}...`);
      return res.json({ reply: result.reply, model: result.modelUsed, userLang, replyLang });
    } catch (err) {
      console.warn(`⚠️ فشل ${PRIMARY_MODEL}:`, err.message);
    }

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
      en: 'Sorry, the service is busy right now. Please try again shortly.'
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
// 🔊 ElevenLabs TTS - محسّن للصوت الطبيعي
// =====================================================
async function callElevenLabs(text, model, apiKey) {
  const cleanText = cleanTextForTTS(text);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${JOJO_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: model,
        voice_settings: {
          // ⭐ الإعدادات المحسّنة للصوت الطبيعي
          stability: 0.35,           // منخفض = أكثر تعبيرًا وحيوية (مو مسطح)
          similarity_boost: 0.85,    // عالي = يحافظ على هوية الصوت
          style: 0.65,               // عالي = يلتقط النبرة الطبيعية والتعبير
          use_speaker_boost: true    // وضوح أعلى
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`[${model}] ${response.status}: ${errorText}`);
  }

  return await response.buffer();
}

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

    console.log(`🔊 طلب صوت (${text.length} حرف)`);

    // محاولة كل نموذج بالترتيب
    let lastError = null;
    for (const model of TTS_MODELS) {
      try {
        console.log(`🎵 محاولة النموذج: ${model}`);
        const audioBuffer = await callElevenLabs(text, model, elevenApiKey);

        res.set({
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length,
          'Cache-Control': 'no-cache'
        });
        res.send(audioBuffer);

        console.log(`✅ نجح ${model}: ${audioBuffer.length} بايت`);
        return;
      } catch (err) {
        console.warn(`⚠️ فشل ${model}:`, err.message);
        lastError = err;
      }
    }

    // كل النماذج فشلت
    console.error('❌ كل نماذج TTS فشلت:', lastError?.message);
    return res.status(500).json({
      error: 'فشل تحويل النص لصوت',
      details: lastError?.message
    });

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
    ttsModels: TTS_MODELS,
    voiceSettings: {
      stability: 0.35,
      similarity_boost: 0.85,
      style: 0.65,
      use_speaker_boost: true
    },
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
  console.log(`🌟 جوجو AI - الإصدار المحسّن`);
  console.log(`📡 المنفذ: ${PORT}`);
  console.log(`🔑 OpenRouter: ${process.env.OPENROUTER_API_KEY ? '✅' : '❌'}`);
  console.log(`🎤 ElevenLabs: ${process.env.ELEVENLABS_API_KEY ? '✅' : '❌'}`);
  console.log(`🎵 Voice ID: ${JOJO_VOICE_ID}`);
  console.log(`🎚️ Stability: 0.35 (تعبيري)`);
  console.log(`🎚️ Style: 0.65 (طبيعي)`);
  console.log('═══════════════════════════════════════════');
});
