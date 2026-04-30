/* ═══════════════════════════════════════════════════════════
   جوجو AI - Script
   أمانة محافظة الطائف
   استخدام مباشر لـ @elevenlabs/client SDK
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const AGENT_ID = 'agent_5301kqcwsvhxfa7aqn1sjewpd30z';

  // العناصر
  const splash = document.getElementById('splash');
  const main = document.getElementById('main');
  const startButton = document.getElementById('startButton');
  const voiceBtn = document.getElementById('voiceBtn');
  const vbbIcon = document.getElementById('vbbIcon');
  const vbbText = document.getElementById('vbbText');
  const voiceStatus = document.getElementById('voiceStatus');
  const vsDot = document.getElementById('vsDot');
  const vsText = document.getElementById('vsText');
  const videoStage = document.getElementById('videoStage');
  const mainVideo = document.getElementById('mainVideo');
  const closeVideoBtn = document.getElementById('closeVideoBtn');
  const toast = document.getElementById('toast');
  const particlesContainer = document.getElementById('particles');
  const jojoIdle = document.getElementById('jojoIdle');

  let currentLang = 'ar';
  let conversation = null;
  let isConnecting = false;

  const questions = {
    ar: {
      q1: 'ما جهود أمانة الطائف في النظافة خلال موسم الحج؟',
      q2: 'ما المواقع التي تخدمها أمانة الطائف خلال موسم الحج؟',
      q3: 'كيف تتم أعمال الإصحاح البيئي ومكافحة الحشرات؟'
    },
    en: {
      q1: "What are Taif Municipality's sanitation efforts during Hajj?",
      q2: 'Which locations are served during Hajj season?',
      q3: 'How are environmental sanitation and pest control done?'
    },
    fr: {
      q1: 'Quels sont les efforts de propreté pendant le Hajj ?',
      q2: 'Quels sont les sites desservis pendant le Hajj ?',
      q3: "Comment se fait l'assainissement environnemental ?"
    },
    ur: {
      q1: 'حج کے دوران صفائی کے لیے امانتِ طائف کی کیا کوششیں ہیں؟',
      q2: 'حج کے موسم میں کن مقامات پر خدمات فراہم کی جاتی ہیں؟',
      q3: 'ماحولیاتی صفائی اور حشرات کشی کیسے کی جاتی ہے؟'
    },
    tr: {
      q1: 'Hac sırasında temizlik çalışmaları nelerdir?',
      q2: 'Hac sezonunda hangi bölgelerde hizmet verilir?',
      q3: 'Çevre sağlığı ve haşere kontrolü nasıl yapılır?'
    }
  };

  const availableVideoAnswers = {
    ar: ['q1', 'q2', 'q3'],
    en: [], fr: [], ur: [], tr: []
  };

  function init() {
    createParticles();
    bindEvents();
    updateQuestions();
    checkVideoSupport();
    console.log('✅ جوجو AI جاهزة');
  }

  function createParticles() {
    if (!particlesContainer) return;
    const count = window.innerWidth < 768 ? 15 : 30;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('span');
      p.className = 'particle';
      p.style.left = Math.random() * 100 + '%';
      p.style.bottom = '-10px';
      p.style.animationDuration = (Math.random() * 15 + 10) + 's';
      p.style.animationDelay = Math.random() * 10 + 's';
      p.style.opacity = Math.random() * 0.6 + 0.2;
      const size = Math.random() * 3 + 2;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      particlesContainer.appendChild(p);
    }
  }

  function checkVideoSupport() {
    if (!jojoIdle) return;
    jojoIdle.addEventListener('error', function () {
      jojoIdle.classList.add('video-failed');
      jojoIdle.style.display = 'none';
    });
    setTimeout(function () {
      if (jojoIdle.readyState === 0) {
        jojoIdle.classList.add('video-failed');
        jojoIdle.style.display = 'none';
      }
    }, 2000);
  }

  function bindEvents() {
    if (startButton) {
      startButton.addEventListener('click', startApp);
    }

    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setLanguage(this.dataset.lang);
      });
    });

    document.querySelectorAll('.question-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        playAnswer(this.dataset.q);
      });
    });

    if (voiceBtn) {
      voiceBtn.addEventListener('click', toggleConversation);
    }

    if (closeVideoBtn) {
      closeVideoBtn.addEventListener('click', closeVideo);
    }

    if (mainVideo) {
      mainVideo.addEventListener('ended', closeVideo);
      mainVideo.addEventListener('error', function () {
        showToast('عذرًا، تعذر تشغيل الفيديو');
        closeVideo();
      });
    }

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && videoStage && !videoStage.classList.contains('hidden')) {
        closeVideo();
      }
    });

    document.addEventListener('pointerdown', addRippleEffect, { passive: true });

    window.addEventListener('beforeunload', function () {
      if (conversation) {
        try { conversation.endSession(); } catch (e) {}
      }
    });
  }

  function startApp() {
    if (!splash || !main) return;
    splash.classList.add('fade-out');
    setTimeout(function () {
      splash.classList.add('hidden');
      main.classList.remove('hidden');
    }, 700);
  }

  function setLanguage(lang) {
    if (!questions[lang]) return;
    currentLang = lang;
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });
    updateQuestions();
  }

  function updateQuestions() {
    const langData = questions[currentLang];
    if (!langData) return;
    document.querySelectorAll('.question-btn').forEach(function (btn) {
      const qKey = btn.dataset.q;
      const qText = btn.querySelector('.q-text');
      if (qText && langData[qKey]) {
        qText.textContent = langData[qKey];
      }
    });
  }

  function playAnswer(qKey) {
    if (!availableVideoAnswers[currentLang] || !availableVideoAnswers[currentLang].includes(qKey)) {
      const messages = {
        ar: 'هذه الإجابة قيد التجهيز. اضغطي "ابدأ المحادثة" للحصول على إجابة فورية!',
        en: 'This answer is being prepared. Click "Start Conversation"!',
        fr: 'Cette réponse est en préparation.',
        ur: 'یہ جواب تیار کیا جا رہا ہے۔',
        tr: 'Bu cevap hazırlanıyor.'
      };
      showToast(messages[currentLang] || messages.ar);
      return;
    }

    if (!videoStage || !mainVideo) return;
    const videoSrc = currentLang + '_' + qKey + '.mp4';
    mainVideo.src = videoSrc;
    mainVideo.load();
    videoStage.classList.remove('hidden');
    const playPromise = mainVideo.play();
    if (playPromise) {
      playPromise.catch(function () {
        showToast('عذرًا، تعذر تشغيل الفيديو');
        closeVideo();
      });
    }
  }

  function closeVideo() {
    if (!videoStage || !mainVideo) return;
    mainVideo.pause();
    mainVideo.currentTime = 0;
    videoStage.classList.add('hidden');
  }

  // ═══════════════════════════════════════════════════════════
  // المحادثة الصوتية - SDK مباشر
  // ═══════════════════════════════════════════════════════════

  function setVoiceStatus(state, text) {
    if (!voiceStatus || !vsDot || !vsText) return;
    voiceStatus.classList.remove('hidden');
    vsDot.className = 'vs-dot ' + state;
    vsText.textContent = text;
  }

  function setButtonState(state) {
    if (!voiceBtn || !vbbText) return;
    voiceBtn.classList.remove('connecting', 'connected', 'error');

    if (state === 'connecting') {
      voiceBtn.classList.add('connecting');
      vbbText.textContent = 'جاري الاتصال...';
    } else if (state === 'connected') {
      voiceBtn.classList.add('connected');
      vbbText.textContent = 'إنهاء المحادثة';
    } else if (state === 'error') {
      voiceBtn.classList.add('error');
      vbbText.textContent = 'حدث خطأ - اضغط للمحاولة مجددًا';
    } else {
      vbbText.textContent = 'ابدأ المحادثة';
    }
  }

  async function toggleConversation() {
    if (conversation) {
      await endConversation();
    } else {
      await startConversation();
    }
  }

  async function waitForSDK(maxAttempts) {
    if (typeof maxAttempts === 'undefined') maxAttempts = 100;

    return new Promise(function (resolve, reject) {
      let count = 0;

      const check = function () {
        if (window.ElevenLabsConversation) {
          resolve(window.ElevenLabsConversation);
          return;
        }
        count++;
        if (count > maxAttempts) {
          reject(new Error('SDK timeout'));
          return;
        }
        setTimeout(check, 100);
      };

      check();
    });
  }

  async function requestMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err) {
      console.error('❌ Microphone:', err);
      return false;
    }
  }

  async function startConversation() {
    if (isConnecting || conversation) return;
    isConnecting = true;

    setButtonState('connecting');
    setVoiceStatus('connecting', 'جاري التحضير...');

    const micOk = await requestMic();
    if (!micOk) {
      isConnecting = false;
      setButtonState('error');
      setVoiceStatus('error', 'يُرجى السماح بالميكروفون');
      showToast('🎤 يُرجى السماح بالوصول للميكروفون');
      setTimeout(function () {
        setButtonState('idle');
        if (voiceStatus) voiceStatus.classList.add('hidden');
      }, 3000);
      return;
    }

    setVoiceStatus('connecting', 'جاري الاتصال بجوجو...');

    try {
      const Conversation = await waitForSDK();

      conversation = await Conversation.startSession({
        agentId: AGENT_ID,
        connectionType: 'webrtc',

        onConnect: function () {
          console.log('✅ متصل');
          isConnecting = false;
          setButtonState('connected');
          setVoiceStatus('listening', 'متصل - تحدث الآن');
        },

        onDisconnect: function () {
          console.log('🔌 منقطع');
          cleanup();
        },

        onError: function (error) {
          console.error('❌ خطأ:', error);
          isConnecting = false;
          setButtonState('error');
          setVoiceStatus('error', 'حدث خطأ في الاتصال');
          showToast('❌ تعذر الاتصال، حاولي مجددًا');
          setTimeout(cleanup, 2500);
        },

        onModeChange: function (modeData) {
          const mode = (modeData && modeData.mode) || modeData;
          console.log('🔄 الوضع:', mode);
          if (mode === 'speaking') {
            setVoiceStatus('speaking', 'تتحدث جوجو...');
          } else if (mode === 'listening') {
            setVoiceStatus('listening', 'أستمع إليك...');
          }
        },

        onMessage: function (msg) {
          console.log('💬', msg);
        }
      });

      console.log('✅ المحادثة بدأت');

    } catch (err) {
      console.error('❌ فشل بدء المحادثة:', err);
      isConnecting = false;
      setButtonState('error');
      setVoiceStatus('error', 'تعذر الاتصال');
      showToast('❌ تعذر بدء المحادثة');
      setTimeout(cleanup, 2500);
    }
  }

  async function endConversation() {
    if (conversation) {
      try {
        await conversation.endSession();
      } catch (e) {
        console.warn('خطأ عند الإنهاء:', e);
      }
    }
    cleanup();
  }

  function cleanup() {
    conversation = null;
    isConnecting = false;
    setButtonState('idle');
    if (voiceStatus) {
      setTimeout(function () {
        voiceStatus.classList.add('hidden');
      }, 1500);
    }
  }

  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 4500);
  }

  function addRippleEffect(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('close-video-btn')) return;

    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2.2;
    const ripple = document.createElement('span');
    ripple.style.cssText =
      'position: absolute;' +
      'border-radius: 50%;' +
      'pointer-events: none;' +
      'z-index: 999;' +
      'width: ' + size + 'px;' +
      'height: ' + size + 'px;' +
      'left: ' + (e.clientX - rect.left - size / 2) + 'px;' +
      'top: ' + (e.clientY - rect.top - size / 2) + 'px;' +
      'background: rgba(255, 255, 255, 0.18);' +
      'transform: scale(0);' +
      'animation: ripple-grow 0.6s ease-out forwards;';

    const computedStyle = window.getComputedStyle(btn);
    if (computedStyle.position === 'static') {
      btn.style.position = 'relative';
    }
    btn.style.overflow = 'hidden';
    btn.appendChild(ripple);

    setTimeout(function () {
      if (ripple.parentNode) ripple.remove();
    }, 650);
  }

  (function () {
    const style = document.createElement('style');
    style.textContent = '@keyframes ripple-grow { to { transform: scale(1); opacity: 0; } }';
    document.head.appendChild(style);
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
