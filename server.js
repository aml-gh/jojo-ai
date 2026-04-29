// =====================================================
// جوجو AI - Server
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

// Content Security Policy آمن (يسمح بالميكروفون والصوت بدون eval)
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
// شخصية جوجو - System Prompt
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
// نقطة النهاية الرئيسية للمحادثة
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
        reply: 'عذرًا، الخدمة غير متاحة حاليًا. يُرجى المحاولة لاحقًا.'
      });
    }

    // بناء سجل المحادثة
    const messages = [
      { role: 'system', content: JOJO_SYSTEM_PROMPT },
      ...history.slice(-6), // آخر 6 رسائل فقط للحفاظ على السياق
      { role: 'user', content: message }
    ];

    console.log('📨 إرسال رسالة إلى OpenRouter:', message);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.SITE_URL || 'https://jojo-ai.up.railway.app',
        'X-Title': 'Jojo AI - Taif Municipality'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages: messages,
        temperature: 0.7,
        max_tokens: 400,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ خطأ من OpenRouter:', response.status, errorText);

      // محاولة بنموذج بديل في حال فشل النموذج الأساسي
      const fallbackResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.SITE_URL || 'https://jojo-ai.up.railway.app',
          'X-Title': 'Jojo AI - Taif Municipality'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.0-flash-exp:free',
          messages: messages,
          temperature: 0.7,
          max_tokens: 400
        })
      });

      if (!fallbackResponse.ok) {
        return res.status(500).json({
          error: 'فشل الاتصال بالنموذج',
          reply: 'عذرًا، أواجه صعوبة في الرد حاليًا. يُرجى المحاولة بعد قليل.'
        });
      }

      const fallbackData = await fallbackResponse.json();
      const fallbackReply = fallbackData?.choices?.[0]?.message?.content?.trim() || 'عذرًا، لم أتمكن من الرد.';
      console.log('✅ رد من النموذج البديل');
      return res.json({ reply: fallbackReply });
    }

    const data = await response.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error('❌ رد فارغ من OpenRouter:', JSON.stringify(data));
      return res.status(500).json({
        error: 'رد فارغ',
        reply: 'عذرًا، لم أتمكن من تكوين رد. هل يمكنك إعادة صياغة سؤالك؟'
      });
    }

    console.log('✅ رد جوجو:', reply.substring(0, 80) + '...');
    res.json({ reply });

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
  console.log(`🔑 OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✅ موجود' : '❌ مفقود'}`);
  console.log('═══════════════════════════════════════════');
});
