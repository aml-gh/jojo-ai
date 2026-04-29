/* =====================================================
   جوجو AI - Frontend Script
   يربط زر "تحدث مع جوجو" بـ ElevenLabs Widget
   ===================================================== */

(function () {
  'use strict';

  const openButton = document.getElementById('openWidgetButton');

  if (!openButton) {
    console.error('❌ زر التحدث غير موجود');
    return;
  }

  // =====================================================
  // فتح widget ElevenLabs
  // =====================================================
  function openWidget() {
    // البحث عن widget element
    const widget = document.querySelector('elevenlabs-convai');

    if (!widget) {
      console.warn('⏳ Widget لم يتحمل بعد');
      alert('يُرجى الانتظار قليلاً حتى يتم تحميل خدمة المحادثة...');
      return;
    }

    // Widget الـ ElevenLabs يحتوي على Shadow DOM
    // نحاول العثور على زر التشغيل والضغط عليه
    try {
      // البحث في shadow DOM
      const shadowRoot = widget.shadowRoot;

      if (shadowRoot) {
        // ابحث عن أي زر داخل widget
        const triggerButton = shadowRoot.querySelector('button[aria-label*="call"], button[aria-label*="conversation"], button[aria-label*="start"], button');
        if (triggerButton) {
          triggerButton.click();
          console.log('✅ تم فتح widget');
          return;
        }
      }

      // fallback: إذا ما لقينا الزر، نحاول النقر على widget نفسه
      widget.click();
      console.log('✅ تم النقر على widget');

    } catch (err) {
      console.error('❌ خطأ في فتح widget:', err);
      alert('عذرًا، يُرجى البحث عن أيقونة المحادثة في أسفل يسار الصفحة والضغط عليها.');
    }
  }

  // =====================================================
  // ربط الحدث
  // =====================================================
  openButton.addEventListener('click', openWidget);

  // =====================================================
  // مراقبة تحميل widget
  // =====================================================
  let checkCount = 0;
  const checkInterval = setInterval(function () {
    const widget = document.querySelector('elevenlabs-convai');
    if (widget && widget.shadowRoot) {
      console.log('✅ ElevenLabs Widget جاهز');
      clearInterval(checkInterval);
    }
    checkCount++;
    if (checkCount > 30) {
      console.warn('⚠️ Widget لم يكتمل تحميله');
      clearInterval(checkInterval);
    }
  }, 500);

  console.log('✅ جوجو AI - الواجهة جاهزة');
})();
