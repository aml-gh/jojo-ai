async function startVoiceChat() {
  const status = document.getElementById("status");
  status.innerText = "جوجو تستمع الآن...";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    status.innerText = "المتصفح لا يدعم الميكروفون";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.start();

  recognition.onresult = async function (event) {
    const text = event.results[0][0].transcript;
    status.innerText = "سمعت: " + text;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      const msg = new SpeechSynthesisUtterance(data.reply);
      msg.lang = "ar-SA";
      speechSynthesis.speak(msg);

      status.innerText = "جاهزة";
    } catch (e) {
      status.innerText = "حدث خطأ مؤقت";
    }
  };

  recognition.onerror = function () {
    status.innerText = "تعذر تشغيل الميكروفون";
  };
}
