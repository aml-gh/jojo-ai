/* ═══════════════════════════════════════════════════════════
   جوجو AI - Script سينمائي
   أمانة محافظة الطائف
═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ─────────────────────────────────────────────
  // الإعدادات
  // ─────────────────────────────────────────────
  const AGENT_ID = 'agent_5301kqcwsvhxfa7aqn1sjewpd30z';

  // ─────────────────────────────────────────────
  // العناصر
  // ─────────────────────────────────────────────
  const splash = document.getElementById('splash');
  const main = document.getElementById('main');
  const startButton = document.getElementById('startButton');
  const homeButton = document.getElementById('homeButton');
  const voiceButton = document.getElementById('voiceButton');
  const voiceOverlay = document.getElementById('voiceOverlay');
  const closeVoiceBtn = document.getElementById('closeVoiceBtn');
  const endVoiceBtn = document.getElementById('endVoiceBtn');
  const voiceStatus = document.getElementById('voiceStatus');
  const voiceStatusText = document.getElementById('voiceStatusText');
  const voiceWaves = document.getElementById('voiceWaves');
  const voiceTranscript = document.getElementById('voiceTranscript');
  const videoStage = document.getElementById('videoStage');
  const mainVideo = document.getElementById('mainVideo');
  const closeVideoBtn = document.getElementById('closeVideoBtn');
  const toast = document.getElementById('toast');
  const particlesContainer = document.getElementById('particles');
  const jojoIdle = document.getElementById('jojoIdle');
  const voiceJojoVideo = document.getElementById('voiceJojoVideo');

  // ─────────────────────────────────────────────
  // الحالة
  // ─────────────────────────────────────────────
  let currentLang = 'ar';
  let conversation = null;
  let isConnecting = false;

  // ─────────────────────────────────────────────
  // بيانات الأسئلة (5 لغات)
  // ─────────────────────────────────────────────
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

  // اللغات اللي عندها فيديو إجابة (ar فقط حاليًا)
  const availableVideoAnswers = {
    ar: ['q1', 'q2', 'q3'],
    en: [],
    fr: [],
    ur: [],
    tr: []
  };

  // ─────────────────────────────────────────────
  // التهيئة
  // ─────────────────────────────────────────────
  function init() {
    createParticles();
    bindEvents();
    updateQuestions();
    checkVideoSupport();
    console.log('✅ جوجو AI جاهزة - النسخة السينمائية');
  }

  // ─────────────────────────────────────────────
  // إنشاء الجسيمات
  // ─────────────────────────────────────────────
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

  // ─────────────────────────────────────────────
  // فحص دعم الفيديو
  // ─────────────────────────────────────────────
  function checkVideoSupport() {
    [jojoIdle, voiceJojoVideo].forEach(video => {
      if (!video) return;

      video.addEventListener('error', function () {
        video.classList.add('video-failed');
        video.style.display = 'none';
      });

      video.addEventListener('loadeddata', function () {
        video.classList.remove('video-failed');
      });

      // إذا الـ source ما اشتغل خلال 2 ثانية
      setTimeout(function () {
        if (video.readyState === 0) {
          video.classList.add('video-failed');
          video.style.display = 'none';
        }
      }, 2000);
    });
  }

  // ─────────────────────────────────────────────
  // ربط الأحداث
  // ─────────────────────────────────────────────
  function bindEvents() {
    // زر البدء
    if (startButton) {
      startButton.addEventListener('click', startApp);
    }

    // زر العودة للرئيسية
    if (homeButton) {
      homeButton.addEventListener('click', function () {
        homeButton.classList.add('hidden');
      });
    }

    // أزرار اللغات
    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const lang = this.dataset.lang;
        setLanguage(lang);
      });
    });

    // أزرار الأسئلة
    document.querySelectorAll('.question-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const q = this.dataset.q;
        playAnswer(q);
      });
    });

    // زر التحدث
    if (voiceButton) {
      voiceButton.addEventListener('click', startVoiceChat);
    }

    // زر إغلاق المحادثة
    if (closeVoiceBtn) {
      closeVoiceBtn.addEventListener('click', endVoiceChat);
    }

    if (endVoiceBtn) {
      endVoiceBtn.addEventListener('click', endVoiceChat);
    }

    // خلفية المحادثة (للإغلاق)
    if (voiceOverlay) {
      const backdrop = voiceOverlay.querySelector('.vo-backdrop');
      if (backdrop) {
        backdrop.addEventListener('click', endVoiceChat);
      }
    }

    // إغلاق الفيديو
    if (closeVideoBtn) {
      closeVideoBtn.addEventListener('click', closeVideo);
    }

    // عند انتهاء الفيديو
    if (mainVideo) {
      mainVideo.addEventListener('ended', closeVideo);
      mainVideo.addEventListener('error', function () {
        showToast('عذرًا، تعذر تشغيل الفيديو');
        closeVideo();
      });
    }

    // ESC لإغلاق
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (voiceOverlay && voiceOverlay.classList.contains('active')) {
          endVoiceChat();
        } else if (videoStage && !videoStage.classList.contains('hidden')) {
          closeVideo();
        }
      }
    });

    // تأثير ripple على الأزرار
    document.addEventListener('pointerdown', addRippleEffect, { passive: true });

    // إنهاء المحادثة عند إغلاق الصفحة
    window.addEventListener('beforeunload', function () {
      if (conversation) {
        try { conversation.endSession(); } catch (e) { /* ignore */ }
      }
    });
  }

  // ─────────────────────────────────────────────
  // بدء التطبيق
  // ─────────────────────────────────────────────
  function startApp() {
    if (!splash || !main) return;

    splash.classList.add('fade-out');

    setTimeout(function () {
      splash.classList.add('hidden');
      main.classList.remove('hidden');
    }, 700);
  }

  // ─────────────────────────────────────────────
  // اختيار اللغة
  // ─────────────────────────────────────────────
  function setLanguage(lang) {
    if (!questions[lang]) return;

    currentLang = lang;

    document.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    updateQuestions();
  }

  // ─────────────────────────────────────────────
  // تحديث نصوص الأسئلة
  // ─────────────────────────────────────────────
  function updateQuestions() {
    const langData = questions[currentLang];
    if (!langData) return;

    document.querySelectorAll('.question-btn').forEach(btn => {
      const qKey = btn.dataset.q;
      const qText = btn.querySelector('.q-text');
      if (qText && langData[qKey]) {
        qText.textContent = langData[qKey];
      }
    });
  }

  // ─────────────────────────────────────────────
  // تشغيل إجابة فيديو
  // ─────────────────────────────────────────────
  function playAnswer(qKey) {
    if (!availableVideoAnswers[currentLang] || !availableVideoAnswers[currentLang].includes(qKey)) {
      const messages = {
        ar: 'هذه الإجابة قيد التجهيز. اضغط على "تحدث مع جوجو" للحصول على إجابة فورية!',
        en: 'This answer is being prepared. Click "Talk to Jojo" for an instant response!',
        fr: 'Cette réponse est en préparation. Cliquez sur "Parler à Jojo" !',
        ur: 'یہ جواب تیار کیا جا رہا ہے۔ "جوجو سے بات کریں" پر کلک کریں!',
        tr: 'Bu cevap hazırlanıyor. "Jojo ile konuş"a tıklayın!'
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

  // ─────────────────────────────────────────────
  // إغلاق الفيديو
  // ─────────────────────────────────────────────
  function closeVideo() {
    if (!videoStage || !mainVideo) return;

    mainVideo.pause();
    mainVideo.currentTime = 0;
    videoStage.classList.add('hidden');
  }

  // ─────────────────────────────────────────────
  // المحادثة الصوتية - بدء
  // ─────────────────────────────────────────────
  async function startVoiceChat() {
    if (isConnecting || conversation) return;
    isConnecting = true;

    if (!voiceOverlay) return;

    voiceOverlay.classList.remove('hidden');
    requestAnimationFrame(function () {
      voiceOverlay.classList.add('active');
    });

    setVoiceStatus('connecting', 'جاري التحضير...');

    // طلب إذن الميكروفون
    const micOk = await requestMic();
    if (!micOk) {
      setVoiceStatus('error', 'يُرجى السماح بالميكروفون');
      setTimeout(endVoiceChat, 2500);
      return;
    }

    setVoiceStatus('connecting', 'جاري الاتصال بجوجو...');

    try {
      // انتظار تحميل SDK
      const Conversation = await waitForSDK();

      conversation = await Conversation.startSession({
        agentId: AGENT_ID,

        onConnect: function () {
          console.log('✅ متصل بجوجو');
          isConnecting = false;
          setVoiceStatus('listening', 'متصل - تحدث الآن');
        },

        onDisconnect: function () {
          console.log('🔌 انتهت المحادثة');
          cleanup();
        },

        onError: function (error) {
          console.error('❌ خطأ:', error);
          setVoiceStatus('error', 'حدث خطأ، حاول مجددًا');
          setTimeout(endVoiceChat, 2500);
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
          console.log('💬 رسالة:', msg);
          if (msg && msg.message) {
            showTranscript(msg.message);
          }
        }
      });

    } catch (err) {
      console.error('❌ فشل الاتصال:', err);
      isConnecting = false;
      setVoiceStatus('error', 'تعذر الاتصال، حاول مجددًا');
      setTimeout(endVoiceChat, 2500);
    }
  }

  // ─────────────────────────────────────────────
  // إنهاء المحادثة
  // ─────────────────────────────────────────────
  async function endVoiceChat() {
    if (conversation) {
      try {
        await conversation.endSession();
      } catch (e) {
        console.warn('خطأ عند الإنهاء:', e);
      }
    }
    cleanup();
  }

  // ─────────────────────────────────────────────
  // التنظيف
  // ─────────────────────────────────────────────
  function cleanup() {
    conversation = null;
    isConnecting = false;

    if (!voiceOverlay) return;

    voiceOverlay.classList.remove('active');
    setTimeout(function () {
      voiceOverlay.classList.add('hidden');

      if (voiceTranscript) {
        voiceTranscript.textContent = '';
        voiceTranscript.classList.remove('visible');
      }

      setVoiceStatus('', 'جاهزة');
    }, 400);
  }

  // ─────────────────────────────────────────────
  // تحديث الحالة المرئية
  // ─────────────────────────────────────────────
  function setVoiceStatus(state, text) {
    if (!voiceStatus || !voiceStatusText) return;

    voiceStatus.className = 'vo-status' + (state ? ' ' + state : '');
    voiceStatusText.textContent = text;

    if (!voiceWaves) return;

    voiceWaves.classList.remove('speaking', 'listening', 'active');

    if (state === 'speaking') {
      voiceWaves.classList.add('speaking', 'active');
    } else if (state === 'listening') {
      voiceWaves.classList.add('listening', 'active');
    }
  }

  // ─────────────────────────────────────────────
  // عرض النص
  // ─────────────────────────────────────────────
  function showTranscript(text) {
    if (!voiceTranscript || !text) return;
    voiceTranscript.textContent = text;
    voiceTranscript.classList.add('visible');
  }

  // ─────────────────────────────────────────────
  // طلب إذن الميكروفون
  // ─────────────────────────────────────────────
  async function requestMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      return true;
    } catch (err) {
      console.error('❌ فشل الميكروفون:', err);
      return false;
    }
  }

  // ─────────────────────────────────────────────
  // انتظار SDK
  // ─────────────────────────────────────────────
  function waitForSDK(maxRetries) {
    if (typeof maxRetries === 'undefined') maxRetries = 50;

    return new Promise(function (resolve, reject) {
      let count = 0;

      const check = function () {
        if (window.ElevenLabsConversation) {
          resolve(window.ElevenLabsConversation);
          return;
        }

        count++;
        if (count > maxRetries) {
          reject(new Error('SDK timeout'));
          return;
        }

        setTimeout(check, 100);
      };

      check();
    });
  }

  // ─────────────────────────────────────────────
  // Toast
  // ─────────────────────────────────────────────
  let toastTimer = null;
  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove('show');
    }, 3500);
  }

  // ─────────────────────────────────────────────
  // تأثير Ripple
  // ─────────────────────────────────────────────
  function addRippleEffect(e) {
    const btn = e.target.closest('button');
    if (!btn) return;

    // تجاهل بعض الأزرار
    if (btn.classList.contains('vo-close') ||
        btn.classList.contains('icon-btn') ||
        btn.classList.contains('close-video-btn')) {
      return;
    }

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

    // التأكد من ربطها بزر له position نسبي
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

  // إضافة CSS للـ ripple
  (function () {
    const style = document.createElement('style');
    style.textContent = '@keyframes ripple-grow { to { transform: scale(1); opacity: 0; } }';
    document.head.appendChild(style);
  })();

  // ─────────────────────────────────────────────
  // البدء
  // ─────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
