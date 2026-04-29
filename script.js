/* =====================================================
   جوجو AI - Frontend Script
   - تشغيل الميكروفون
   - تحويل الكلام إلى نص (Web Speech API)
   - إرسال للسيرفر واستقبال الرد
   - قراءة الرد صوتيًا بالعربية
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
    currentUtterance: null
  };

  // =====================================================
  // التحقق من دعم المتصفح
  // =====================================================
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const speechSynthesisSupported = 'speechSynthesis' in window;

  if (!SpeechRecognition) {
    showError('عذرًا، المتصفح لا يدعم التعرف على الصوت. يُرجى استخدام Chrome أو Edge.');
    talkButton.disabled = true;
  }

  if (!speechSynthesisSupported) {
    console.warn('⚠️ تشغيل الصوت غير مدعوم في هذا المتصفح');
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
      buttonText.textContent = 'جاري الاستماع... اضغط للإيقاف';
    } else {
      talkButton.classList.remove('recording');
      buttonText.textContent = 'تحدث مع جوجو';
    }
  }

  // =====================================================
  // عرض الرسائل في صندوق المحادثة
  // =====================================================
  function clearWelcomeMessage() {
    const welcome = chatDisplay.querySelector('.welcome-message');
    if (welcome) welcome.remove();
  }

  function addMessage(text, sender) {
    clearWelcomeMessage();
    const msg = document.createElement('div');
    msg.className = 'message ' + sender;

    const label = document.createElement('span');
    label.className = 'message-label';
    label.textContent = sender === 'user' ? 'أنت' : 'جوجو';

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
  function initRecognition() {
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function () {
      state.isListening = true;
      setButtonRecording(true);
      setStatus('listening', 'أستمع إليك...');
    };

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript.trim();
      console.log('📝 تم التعرف:', transcript);

      if (transcript) {
        addMessage(transcript, 'user');
        sendToServer(transcript);
      } else {
        setStatus('', 'جاهزة');
      }
    };

    recognition.onerror = function (event) {
      console.error('❌ خطأ في التعرف على الصوت:', event.error);
      state.isListening = false;
      setButtonRecording(false);

      let msg = 'حدث خطأ في الميكروفون';
      if (event.error === 'no-speech') {
        msg = 'لم أسمع أي صوت، يُرجى المحاولة مجددًا';
      } else if (event.error === 'not-allowed' || event.error === 'permission-denied') {
        msg = 'يُرجى السماح بالوصول إلى الميكروفون';
      } else if (event.error === 'network') {
        msg = 'خطأ في الاتصال بخدمة التعرف على الصوت';
      } else if (event.error === 'aborted') {
        // المستخدم أوقفها بنفسه - لا نعرض خطأ
        setStatus('', 'جاهزة');
        return;
      }

      setStatus('', 'جاهزة');
      showError(msg);
    };

    recognition.onend = function () {
      state.isListening = false;
      setButtonRecording(false);
      if (!state.isThinking && !state.isSpeaking) {
        setStatus('', 'جاهزة');
      }
    };

    return recognition;
  }

  // =====================================================
  // إرسال للسيرفر
  // =====================================================
  async function sendToServer(message) {
    state.isThinking = true;
    setStatus('thinking', 'أفكر في الرد...');

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

      // حفظ في السجل
      state.history.push({ role: 'user', content: message });
      state.history.push({ role: 'assistant', content: reply });
      if (state.history.length > 12) {
        state.history = state.history.slice(-12);
      }

      addMessage(reply, 'jojo');
      state.isThinking = false;
      speak(reply);

    } catch (err) {
      console.error('❌ خطأ في الإرسال:', err);
      state.isThinking = false;
      setStatus('', 'جاهزة');
      showError('عذرًا، حدث خطأ في الاتصال. يُرجى المحاولة مجددًا.');
    }
  }

  // =====================================================
  // قراءة الرد صوتيًا
  // =====================================================
  function getArabicVoice() {
    const voices = window.speechSynthesis.getVoices();
    // البحث عن أفضل صوت عربي
    const preferred = voices.find(v => v.lang === 'ar-SA') ||
                      voices.find(v => v.lang === 'ar-XA') ||
                      voices.find(v => v.lang === 'ar-EG') ||
                      voices.find(v => v.lang && v.lang.startsWith('ar'));
    return preferred || null;
  }

  function speak(text) {
    if (!speechSynthesisSupported || !text) {
      setStatus('', 'جاهزة');
      return;
    }

    // إلغاء أي قراءة سابقة
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    utterance.volume = 1.0;

    const arabicVoice = getArabicVoice();
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = function () {
      state.isSpeaking = true;
      setStatus('speaking', 'أتحدث...');
      stopButton.classList.add('visible');
    };

    utterance.onend = function () {
      state.isSpeaking = false;
      setStatus('', 'جاهزة');
      stopButton.classList.remove('visible');
      state.currentUtterance = null;
    };

    utterance.onerror = function (e) {
      console.warn('⚠️ خطأ في النطق:', e.error);
      state.isSpeaking = false;
      setStatus('', 'جاهزة');
      stopButton.classList.remove('visible');
    };

    state.currentUtterance = utterance;

    // بعض المتصفحات تحتاج تأخير بسيط
    setTimeout(() => {
      window.speechSynthesis.speak(utterance);
    }, 100);
  }

  // =====================================================
  // الأحداث
  // =====================================================
  function startVoiceChat() {
    // إذا كانت تتحدث، أوقفها أولاً
    if (state.isSpeaking) {
      stopSpeaking();
      return;
    }

    // إذا كانت تستمع، أوقفها
    if (state.isListening) {
      if (state.recognition) {
        state.recognition.stop();
      }
      return;
    }

    // إذا كانت تفكر، انتظر
    if (state.isThinking) return;

    // ابدأ الاستماع
    if (!state.recognition) {
      state.recognition = initRecognition();
    }

    if (state.recognition) {
      try {
        state.recognition.start();
      } catch (err) {
        console.error('❌ فشل بدء التعرف:', err);
        showError('يُرجى المحاولة مرة أخرى');
      }
    }
  }

  function stopSpeaking() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    state.isSpeaking = false;
    setStatus('', 'جاهزة');
    stopButton.classList.remove('visible');
  }

  // ربط الأحداث
  talkButton.addEventListener('click', startVoiceChat);
  stopButton.addEventListener('click', stopSpeaking);

  // تحميل الأصوات (بعض المتصفحات تحتاج لذلك)
  if (speechSynthesisSupported) {
    window.speechSynthesis.onvoiceschanged = function () {
      // تحميل الأصوات
      window.speechSynthesis.getVoices();
    };
    // محاولة تحميل مبكرة
    window.speechSynthesis.getVoices();
  }

  // ترحيب صوتي عند أول تفاعل (اختياري - يحتاج تفاعل المستخدم)
  let welcomedOnce = false;
  function welcomeUser() {
    if (welcomedOnce) return;
    welcomedOnce = true;
    const greeting = 'أهلاً وسهلاً بك، يسعدني خدمتك. كيف أقدر أساعدك اليوم؟';
    addMessage(greeting, 'jojo');
    speak(greeting);
  }

  // ترحيب عند أول ضغطة (لأن المتصفحات تتطلب تفاعل المستخدم)
  let firstClick = true;
  talkButton.addEventListener('click', function () {
    if (firstClick) {
      firstClick = false;
      // إيقاف الاستماع الذي بدأ، وعرض الترحيب أولاً
      if (state.recognition && state.isListening) {
        state.recognition.abort();
      }
      welcomeUser();
    }
  }, { once: true });

  console.log('✅ جوجو AI جاهزة');
})();
