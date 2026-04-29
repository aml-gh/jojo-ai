/* =====================================================
   جوجو AI - Frontend Script
   مع ElevenLabs Conversational AI
   تجربة محادثة فورية مثل ChatGPT Voice
   ===================================================== */

(function () {
  'use strict';

  // =====================================================
  // إعدادات الـ Agent
  // =====================================================
  const AGENT_ID = 'agent_5301kqcwsvhxfa7aqn1sjewpd30z';

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
    conversation: null,
    isConnected: false,
    isConnecting: false,
    mode: 'idle' // idle | listening | speaking
  };

  // =====================================================
  // التحقق من تحميل SDK
  // =====================================================
  function waitForSDK(callback, retries = 30) {
    if (window.ElevenLabs && window.ElevenLabs.Conversation) {
      callback();
      return;
    }
    if (retries <= 0) {
      console.error('❌ فشل تحميل ElevenLabs SDK');
      showError('عذرًا، فشل تحميل خدمة المحادثة. يُرجى تحديث الصفحة.');
      return;
    }
    setTimeout(() => waitForSDK(callback, retries - 1), 200);
  }

  // =====================================================
  // تحديث الحالة المرئية
  // =====================================================
  function setStatus(mode, text) {
    state.mode = mode;
    statusIndicator.className = 'status-indicator ' + mode;
    statusText.textContent = text;
    avatar.className = 'avatar';
    voiceWaves.classList.remove('active');

    if (mode === 'listening') {
      avatar.classList.add('listening');
    } else if (mode === 'speaking') {
      avatar.classList.add('speaking');
      voiceWaves.classList.add('active');
    } else if (mode === 'thinking') {
      avatar.classList.add('listening');
    }
  }

  function setButtonState(connected) {
    if (connected) {
      talkButton.classList.add('recording');
      buttonText.textContent = 'المحادثة جارية...';
      stopButton.classList.add('visible');
    } else {
      talkButton.classList.remove('recording');
      buttonText.textContent = 'تحدث مع جوجو';
      stopButton.classList.remove('visible');
    }
  }

  // =====================================================
  // عرض الرسائل
  // =====================================================
  function clearWelcomeMessage() {
    const welcome = chatDisplay.querySelector('.welcome-message');
    if (welcome) welcome.remove();
  }

  function detectTextLanguage(text) {
    if (!text) return 'ar';
    if (/[\u0600-\u06FF]/.test(text)) return 'ar';
    return 'en';
  }

  function addMessage(text, sender) {
    if (!text) return;
    clearWelcomeMessage();

    const msg = document.createElement('div');
    msg.className = 'message ' + sender;

    const lang = detectTextLanguage(text);
    const isRTL = lang === 'ar';
    msg.dir = isRTL ? 'rtl' : 'ltr';
    msg.style.textAlign = isRTL ? 'right' : 'left';

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
  // طلب إذن الميكروفون
  // =====================================================
  async function requestMicrophone() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // إغلاق المسار مباشرة - SDK راح يفتحه بنفسه
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err) {
      console.error('❌ فشل الوصول للميكروفون:', err);
      showError('يُرجى السماح بالوصول إلى الميكروفون للتحدث مع جوجو');
      return false;
    }
  }

  // =====================================================
  // بدء المحادثة
  // =====================================================
  async function startConversation() {
    if (state.isConnecting || state.isConnected) return;

    state.isConnecting = true;
    setStatus('thinking', 'جاري الاتصال...');
    buttonText.textContent = 'جاري الاتصال...';

    // طلب الميكروفون أولاً
    const hasMic = await requestMicrophone();
    if (!hasMic) {
      state.isConnecting = false;
      setStatus('', 'جاهزة');
      buttonText.textContent = 'تحدث مع جوجو';
      return;
    }

    try {
      const Conversation = window.ElevenLabs.Conversation;

      state.conversation = await Conversation.startSession({
        agentId: AGENT_ID,

        onConnect: function () {
          console.log('✅ تم الاتصال بجوجو');
          state.isConnected = true;
          state.isConnecting = false;
          setButtonState(true);
          setStatus('listening', 'متصلة - تحدث الآن');
        },

        onDisconnect: function () {
          console.log('🔌 تم قطع الاتصال');
          state.isConnected = false;
          state.isConnecting = false;
          setButtonState(false);
          setStatus('', 'جاهزة');
        },

        onMessage: function (message) {
          console.log('💬 رسالة:', message);
          if (message && message.message) {
            const sender = message.source === 'user' ? 'user' : 'jojo';
            addMessage(message.message, sender);
          }
        },

        onError: function (error) {
          console.error('❌ خطأ:', error);
          state.isConnected = false;
          state.isConnecting = false;
          setButtonState(false);
          setStatus('', 'جاهزة');
          showError('حدث خطأ في الاتصال. يُرجى المحاولة مجددًا.');
        },

        onModeChange: function (mode) {
          console.log('🔄 الوضع:', mode);
          // mode يكون: 'speaking' أو 'listening'
          if (mode && mode.mode === 'speaking') {
            setStatus('speaking', 'تتحدث جوجو...');
          } else if (mode && mode.mode === 'listening') {
            setStatus('listening', 'أستمع إليك...');
          }
        },

        onStatusChange: function (status) {
          console.log('📡 الحالة:', status);
        }
      });

    } catch (err) {
      console.error('❌ فشل بدء المحادثة:', err);
      state.isConnected = false;
      state.isConnecting = false;
      setButtonState(false);
      setStatus('', 'جاهزة');
      showError('عذرًا، تعذر بدء المحادثة. يُرجى المحاولة مرة أخرى.');
    }
  }

  // =====================================================
  // إنهاء المحادثة
  // =====================================================
  async function endConversation() {
    if (state.conversation) {
      try {
        await state.conversation.endSession();
      } catch (err) {
        console.error('خطأ عند الإنهاء:', err);
      }
      state.conversation = null;
    }
    state.isConnected = false;
    state.isConnecting = false;
    setButtonState(false);
    setStatus('', 'جاهزة');
  }

  // =====================================================
  // معالج زر التحدث
  // =====================================================
  function handleTalkButton() {
    if (state.isConnected) {
      endConversation();
    } else {
      startConversation();
    }
  }

  // =====================================================
  // ربط الأحداث
  // =====================================================
  waitForSDK(function () {
    console.log('✅ ElevenLabs SDK جاهز');
    talkButton.addEventListener('click', handleTalkButton);
    stopButton.addEventListener('click', endConversation);
  });

  // إنهاء المحادثة عند إغلاق الصفحة
  window.addEventListener('beforeunload', function () {
    if (state.conversation) {
      try {
        state.conversation.endSession();
      } catch (e) {
        // تجاهل
      }
    }
  });

  console.log('✅ جوجو AI جاهزة (Conversational AI)');
})();
