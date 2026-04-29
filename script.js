/* =====================================================
   جوجو AI - Frontend Script (مع ElevenLabs)
   - الميكروفون يحول الكلام لنص
   - الرد يأتي صوت طبيعي من ElevenLabs
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
    currentAudio: null,
    currentLang: 'ar-SA'
  };

  // =====================================================
  // اللغات
  // =====================================================
  const LANG_CODES = {
    ar: 'ar-SA', en: 'en-US', fr: 'fr-FR', es: 'es-ES',
    de: 'de-DE', it: 'it-IT', tr: 'tr-TR', ru: 'ru-RU',
    zh: 'zh-CN', ja: 'ja-JP', ko: 'ko-KR'
  };

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
      networkError: 'خطأ في الاتصال',
      sendError: 'عذرًا، حدث خطأ. يُرجى المحاولة مجددًا.',
      browserNotSupported: 'يُرجى استخدام Chrome أو Edge.'
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
      networkError: 'Network error',
      sendError: 'Sorry, an error occurred. Please try again.',
      browserNotSupported: 'Please use Chrome or Edge.'
    }
  };

  // =====================================================
  // كشف لغة النص
  // =====================================================
  function detectTextLanguage(text) {
    if (!text) return 'ar';
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    if (/[\u4E00-\u9FFF]/.test(text)) return 'zh';
    if (/[\u3040-\u309F\u30A0-\u30FF]/.test(text)) return 'ja';
    if (/[\u0400-\u04FF]/.test(text)) return 'ru';

    const lower = text.toLowerCase();
    if (/\b(bonjour|merci|oui|comment)\b/.test(lower) ||
        /[àâçéèêëîïôûùüÿœæ]/.test(lower)) return 'fr';
    if (/\b(hola|gracias|cómo|qué)\b/.test(lower) ||
        /[ñ¿¡]/.test(lower)) return 'es';
    if (/\b(hallo|danke|guten)\b/.test(lower) ||
        /[äöüß]/.test(lower)) return 'de';
    if (/\b(merhaba|teşekkür)\b/.test(lower) ||
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

    const textLang = detectTextLanguage(text);
    const isRTL = textLang === 'ar';
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
        const detectedLang = detectTextLanguage(transcript);
        state.currentLang = LANG_CODES[detectedLang] || 'ar-SA';
        addMessage(transcript, 'user');
        sendToServer(transcript);
      } else {
        setStatus('', getUIText('ready'));
      }
    };

    recognition.onerror = function (event) {
      console.error('❌ خطأ التعرف:', event.error);
      state.isListening = false;
      setButtonRecording(false);

      if (event.error === 'aborted') {
        setStatus('', getUIText('ready'));
        return;
      }

      let msg = getUIText('noSpeech');
      if (event.error === 'not-allowed' || event.error === 'permission-denied') {
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
        body: JSON.stringify({ message: message, history: state.history })
      });

      const data = await response.json();
      const reply = data.reply || 'عذرًا، لم أتمكن من الرد.';
      const replyLang = data.replyLang || detectTextLanguage(reply);
      state.currentLang = LANG_CODES[replyLang] || state.currentLang;

      state.history.push({ role: 'user', content: message });
      state.history.push({ role: 'assistant', content: reply });
      if (state.history.length > 12) {
        state.history = state.history.slice(-12);
      }

      addMessage(reply, 'jojo');
      state.isThinking = false;

      // قراءة الرد بصوت ElevenLabs
      await speakWithElevenLabs(reply);

    } catch (err) {
      console.error('❌ خطأ الإرسال:', err);
      state.isThinking = false;
      setStatus('', getUIText('ready'));
      showError(getUIText('sendError'));
    }
  }

  // =====================================================
  // 🔊 قراءة الرد بصوت ElevenLabs
  // =====================================================
  async function speakWithElevenLabs(text) {
    if (!text) {
      setStatus('', getUIText('ready'));
      return;
    }

    // إيقاف أي صوت سابق
    stopSpeaking();

    state.isSpeaking = true;
    setStatus('speaking', getUIText('speaking'));
    stopButton.classList.add('visible');

    try {
      console.log('🔊 طلب الصوت من ElevenLabs...');

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text })
      });

      if (!response.ok) {
        throw new Error('فشل الحصول على الصوت');
      }

      // تحويل الرد لـ Blob ثم URL
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      state.currentAudio = audio;

      audio.onended = function () {
        state.isSpeaking = false;
        setStatus('', getUIText('ready'));
        stopButton.classList.remove('visible');
        URL.revokeObjectURL(audioUrl);
        state.currentAudio = null;
      };

      audio.onerror = function (e) {
        console.error('⚠️ خطأ تشغيل الصوت:', e);
        state.isSpeaking = false;
        setStatus('', getUIText('ready'));
        stopButton.classList.remove('visible');
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      console.log('✅ يتم تشغيل الصوت');

    } catch (err) {
      console.error('❌ خطأ ElevenLabs:', err);
      state.isSpeaking = false;
      setStatus('', getUIText('ready'));
      stopButton.classList.remove('visible');

      // كحل احتياطي، نستخدم صوت المتصفح
      fallbackToSpeechSynthesis(text);
    }
  }

  // =====================================================
  // صوت احتياطي (إذا فشل ElevenLabs)
  // =====================================================
  function fallbackToSpeechSynthesis(text) {
    if (!('speechSynthesis' in window)) return;

    console.log('🔄 استخدام صوت المتصفح كاحتياطي');
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = state.currentLang;
    utterance.rate = 0.95;
    utterance.pitch = 1.05;

    utterance.onstart = function () {
      state.isSpeaking = true;
      setStatus('speaking', getUIText('speaking'));
      stopButton.classList.add('visible');
    };

    utterance.onend = function () {
      state.isSpeaking = false;
      setStatus('', getUIText('ready'));
      stopButton.classList.remove('visible');
    };

    setTimeout(() => window.speechSynthesis.speak(utterance), 100);
  }

  // =====================================================
  // إيقاف الصوت
  // =====================================================
  function stopSpeaking() {
    if (state.currentAudio) {
      state.currentAudio.pause();
      state.currentAudio.currentTime = 0;
      state.currentAudio = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    state.isSpeaking = false;
    setStatus('', getUIText('ready'));
    stopButton.classList.remove('visible');
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

  // ربط الأحداث
  talkButton.addEventListener('click', startVoiceChat);
  stopButton.addEventListener('click', stopSpeaking);

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
      speakWithElevenLabs(greeting);
    }
  }, { once: true });

  console.log('✅ جوجو AI جاهزة (مع ElevenLabs)');
})();
