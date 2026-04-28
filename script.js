let active = false;

async function startVoiceChat() {
  if (active) return;
  active = true;

  const status = document.getElementById("status");
  if (status) status.innerText = "جوجو تستمع الآن...";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    if (status) status.innerText = "المتصفح لا يدعم الميكروفون";
    active = false;
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.start();

  recognition.onresult = async function (event) {
    const userText = event.results[0][0].transcript;

    if (status) status.innerText = "سمعت: " + userText;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: userText })
      });

      const data = await res.json();
      const reply = data.reply || "أعتذر، لم أتمكن من تجهيز الرد.";

      speak(reply);

      if (status) status.innerText = "جاهزة";
    } catch (error) {
      speak("أعتذر، حدث خطأ مؤقت.");
      if (status) status.innerText = "جاهزة";
    }

    active = false;
  };

  recognition.onerror = function () {
    if (status) status.innerText = "تعذر تشغيل الميكروفون";
    active = false;
  };

  recognition.onend = function () {
    active = false;
  };
}

function speak(text) {
  window.speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.9;
  msg.pitch = 1.05;
  msg.volume = 1;

  window.speechSynthesis.speak(msg);
}
