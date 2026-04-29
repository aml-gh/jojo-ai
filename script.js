/* =====================================================
   جوجو AI - Frontend Script (متعدد اللغات)
   - يكتشف لغة المستخدم تلقائيًا
   - الميكروفون يدعم لغات متعددة
   - الصوت يقرأ بنفس لغة الرد
   ===================================================== */

(function () {
  'use strict';

  // =====================================================
  // العناصر
  // =====================================================
  const talkButton = document.getElementById('talkButton');
  const stopButton = document.getElementById('stopButton');
  const buttonText = document.getElementById('buttonText');
  const statusText = document.getElementById('statusText');
  const statusIndicator = document.getElementById('statusIndicator');
  const chatDisplay = document.getElementById('chatDisplay');
  const avatar = document.getElementById('avatar');
  const voiceWaves = document.getElementById('voiceWaves');

  // =====================================================
  // الحالة
  // =====================================================
  const state = {
    isListening: false,
    isThinking: false,
    isSpeaking: false,
    history: [],
    recognition: null,
    currentUtterance: null,
    currentLang: 'ar-SA' // اللغة الحالية للتعرف
  };

  // =====================================================
  // اللغات المدعومة وأكوادها
  // =====================================================
  const LANG_CODES = {
    ar: 'ar-SA',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    de: 'de-DE',
    it: 'it-IT',
    tr: 'tr-TR',
    ru: 'ru-RU',
    zh: 'zh-CN',
    ja: 'ja-JP',
    ko: 'ko-KR',
    he: 'he-IL',
    th: 'th-TH'
  };

  // نصوص الواجهة بكل لغة
  const UI_TEXTS = {
    ar: {
      ready: 'جاهزة',
      listening: 'أستمع إليك...',
      thinking: 'أفكر في الرد...',
      speaking: 'أتحدث...',
      buttonIdle: 'تحدث مع جوجو',
      buttonRecording: 'جاري الاستماع... اضغط للإيقاف',
      you: 'أنت',
      jojo: 'جوجو',
      welcome: 'أهلاً وسهلاً بك، يسعدني خدمتك. كيف أقدر أساعدك اليوم؟',
      noSpeech: 'لم أسمع أي صوت، يُرجى المحاولة مجددًا',
      micPermission: 'يُرجى السماح بالوصول إلى الميكروفون',
      networkError: 'خطأ في الاتصال بخدمة التعرف على الصوت',
      sendError: 'عذرًا، حدث خطأ في الاتصال. يُرجى المحاولة مجددًا.',
      browserNotSupported: 'عذرًا، المتصفح لا يدعم التعرف على الصوت. يُرجى استخدام Chrome أو Edge.'
    },
    en: {
      ready: 'Ready',
      listening: 'Listening...',
      thinking: 'Thinking...',
      speaking: 'Speaking...',
      buttonIdle: 'Talk to Jojo',
      buttonRecording: 'Listening... tap to stop',
      you: 'You',
      jojo: 'Jojo',
      welcome: 'Welcome, it is my pleasure to assist you. How may I help you today?',
      noSpeech: 'I did not hear anything, please try again',
      micPermission: 'Please allow microphone access',
      networkError: 'Network error with speech recognition',
      sendError: 'Sorry, a connection error occurred. Please try again.',
      browserNotSupported: 'Sorry, your browser does not support speech recognition. Please use Chrome or Edge.'
    }
  };

  // =====================================================
  // كشف لغة النص (نسخة مبسّطة من السيرفر)
  // =====================================================
  function detectTextLanguage(text) {
    if (!text) return 'ar';

    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    if (/[\uAC00-\uD7AF]/.test(text)) return 'ko';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';
    if (/[\u0590-\u05FF]/.test(text)) return 'he';
    if (/[\u0E00-\u0E7F]/.test(text)) return 'th';

    const lower = text.toLowerCase();

    if (/\b(bonjour|merci|oui|comment|allez|vous|je|suis)\b/.test(lower) ||
        /[àâçéèêëîïôûùüÿœæ]/.test(lower)) return 'fr';

    if (/\b(hola|gracias|cómo|qué|sí|buenos|buenas|adiós)\b/.test(lower) ||
        /[ñ¿¡]/.test(lower)) return 'es';

    if (/\b(hallo|danke|guten|tag|wie|was|ich|bin)\b/.test(lower) ||
        /[äöüß]/.test(lower)) return 'de';

    if (/\b(ciao|grazie|come|cosa|sì|buongiorno|prego)\b/.test(lower)) return 'it';

    if (/\b(merhaba|teşekkür|nasıl|evet|hayır|günaydın)\b/.test(lower) ||
        /[çğıöşü]/.test(lower)) return 'tr';

    return 'en';
  }

  function getUIText(key) {
    const lang = state.currentLang.startsWith('ar') ? 'ar' : 'en';
    return UI_TEXTS[lang][key] || UI_TEXTS.en[key] || key;
  }

  // =====================================================
  // التحقق من دعم المتصفح
  // =====================================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSynthesisSupported = 'speechSynthesis' in window;

  if (!SpeechRecognition) {
    showError(getUIText('browserNotSupported'));
    talkButton.disabled = true;
  }

  // =====================================================
  // تحديث الحالة المرئية
  // =====================================================
  function setStatus(mode, text) {
    statusIndicator.className = 'status-indicator ' + mode;
    statusText.textContent = text;
    avatar.className = 'avatar';
    voiceWaves.classList.remove('active');

    if (mode === 'listening') {
      avatar.classList.add('listening');
    } else if (mode === 'speaking') {
      avatar.classList.add('speaking');
      voiceWaves.classList.add('active');
    }
  }

  function setButtonRecording(recording) {
    if (recording) {
      talkButton.classList.add('recording');
      buttonText.textContent = getUIText('buttonRecording');
    } else {
      talkButton.classList.remove('recording');
      buttonText.textContent = getUIText('buttonIdle');
    }
  }

  // =====================================================
  // عرض الرسائل
  // =====================================================
  function clearWelcomeMessage() {
    const welcome = chatDisplay.querySelector('.welcome-message');
    if (welcome) welcome.remove();
  }

  function addMessage(text, sender) {
    clearWelcomeMessage();
    const msg = document.createElement('div');
    msg.className = 'message ' + sender;

    // اتجاه الرسالة حسب اللغة
    const textLang = detectTextLanguage(text);
    const isRTL = ['ar', 'he'].includes(textLang);
    msg.dir = isRTL ? 'rtl' : 'ltr';
    msg.style.textAlign = isRTL ? 'right' : 'left';

    const label = document.createElement('span');
    label.className = 'message-label';
    label.textContent = sender === 'user' ? getUIText('you') : getUIText('jojo');

    const content = document.createElement('p');
    content.textContent = text;

    msg.appendChild(label);
    msg.appendChild(content);
    chatDisplay.appendChild(msg);
    chatDisplay.scrollTop = chatDisplay.scrollHeight;
  }

  function showError(text) {
    addMessage(text, 'jojo');
  }

  // =====================================================
  // التعرف على الكلام
  // =====================================================
  function initRecognition(lang) {
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = lang || state.currentLang;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      state.isListening = true;
      setButtonRecording(true);
      setStatus('listening', getUIText('listening'));
    };

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript.trim();
      console.log('📝 تم التعرف:', transcript);

      if (transcript) {
        // كشف لغة النص واستخدامها للتحديثات التالية
        const detectedLang = detectTextLanguage(transcript);
        const newLangCode = LANG_CODES[detectedLang] || 'ar-SA';
        state.currentLang = newLangCode;

        addMessage(transcript, 'user');
        sendToServer(transcript);
      } else {
        setStatus('', getUIText('ready'));
      }
    };

    recognition.onerror = function (event) {
      console.error('❌ خطأ في التعرف:', event.error);
      state.isListening = false;
      setButtonRecording(false);

      if (event.error === 'aborted') {
        setStatus('', getUIText('ready'));
        return;
      }

      let msg = getUIText('noSpeech');
      if (event.error === 'no-speech') {
        msg = getUIText('noSpeech');
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        msg = getUIText('micPermission');
      } else if (event.error === 'network') {
        msg = getUIText('networkError');
      }

      setStatus('', getUIText('ready'));
      showError(msg);
    };

    recognition.onend = function () {
      state.isListening = false;
      setButtonRecording(false);
      if (!state.isThinking && !state.isSpeaking) {
        setStatus('', getUIText('ready'));
      }
    };

    return recognition;
  }

  // =====================================================
  // إرسال للسيرفر
  // =====================================================
  async function sendToServer(message) {
    state.isThinking = true;
    setStatus('thinking', getUIText('thinking'));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          history: state.history
        })
      });

      const data = await response.json();
      const reply = data.reply || 'عذرًا، لم أتمكن من الرد.';
      const replyLang = data.replyLang || detectTextLanguage(reply);

      // تحديث اللغة الحالية بناءً على لغة الرد
      const newLangCode = LANG_CODES[replyLang] || state.currentLang;
      state.currentLang = newLangCode;

      // حفظ في السجل
      state.history.push({ role: 'user', content: message });
      state.history.push({ role: 'assistant', content: reply });
      if (state.history.length > 12) {
        state.history = state.history.slice(-12);
      }

      addMessage(reply, 'jojo');
      state.isThinking = false;
      speak(reply, newLangCode);

    } catch (err) {
      console.error('❌ خطأ في الإرسال:', err);
      state.isThinking = false;
      setStatus('', getUIText('ready'));
      showError(getUIText('sendError'));
    }
  }

  // =====================================================
  // قراءة الرد صوتيًا بالغة المناسبة
  // =====================================================
  function getBestVoiceForLang(langCode) {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const langPrefix = langCode.split('-')[0];

    // البحث عن صوت يطابق اللغة الكاملة
    let voice = voices.find(v => v.lang === langCode);
    if (voice) return voice;

    // البحث عن صوت يبدأ بنفس اللغة
    voice = voices.find(v => v.lang && v.lang.startsWith(langPrefix));
    if (voice) return voice;

    return null;
  }

  function speak(text, langCode) {
    if (!speechSynthesisSupported || !text) {
      setStatus('', getUIText('ready'));
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode || state.currentLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    const voice = getBestVoiceForLang(utterance.lang);
    if (voice) {
      utterance.voice = voice;
      console.log(`🔊 صوت: ${voice.name} (${voice.lang})`);
    }

    utterance.onstart = function () {
      state.isSpeaking = true;
      setStatus('speaking', getUIText('speaking'));
      stopButton.classList.add('visible');
    };

    utterance.onend = function () {
      state.isSpeaking = false;
      setStatus('', getUIText('ready'));
      stopButton.classList.remove('visible');
      state.currentUtterance = null;
    };

    utterance.onerror = function (e) {
      console.warn('⚠️ خطأ في النطق:', e.error);
      state.isSpeaking = false;
      setStatus('', getUIText('ready'));
      stopButton.classList.remove('visible');
    };

    state.currentUtterance = utterance;

    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }

  // =====================================================
  // الأحداث
  // =====================================================
  function startVoiceChat() {
    if (state.isSpeaking) {
      stopSpeaking();
      return;
    }

    if (state.isListening) {
      if (state.recognition) state.recognition.stop();
      return;
    }

    if (state.isThinking) return;

    // إنشاء recognition جديد بكل ضغطة عشان نضمن استخدام اللغة الحالية
    state.recognition = initRecognition(state.currentLang);

    if (state.recognition) {
      try {
        state.recognition.start();
      } catch (err) {
        console.error('❌ فشل بدء التعرف:', err);
        showError(getUIText('noSpeech'));
      }
    }
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    state.isSpeaking = false;
    setStatus('', getUIText('ready'));
    stopButton.classList.remove('visible');
  }

  // ربط الأحداث
  talkButton.addEventListener('click', startVoiceChat);
  stopButton.addEventListener('click', stopSpeaking);

  // تحميل الأصوات
  if (speechSynthesisSupported) {
    window.speechSynthesis.onvoiceschanged = function () {
      window.speechSynthesis.getVoices();
    };
    window.speechSynthesis.getVoices();
  }

  // ترحيب عند أول ضغطة
  let firstClick = true;
  talkButton.addEventListener('click', function () {
    if (firstClick) {
      firstClick = false;
      if (state.recognition && state.isListening) {
        state.recognition.abort();
      }
      const greeting = UI_TEXTS.ar.welcome;
      addMessage(greeting, 'jojo');
      speak(greeting, 'ar-SA');
    }
  }, { once: true });

  console.log('✅ جوجو AI جاهزة (متعددة اللغات)');
})();
