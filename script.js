let working = false;

async function startVoiceChat() {
  if (working) return;
  working = true;

  const status = document.getElementById("status");
  status.innerText = "جوجو تستمع الآن...";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    status.innerText = "المتصفح لا يدعم الميكروفون";
    working = false;
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
      speak(data.reply || "لم يصل رد من جوجو");

      status.innerText = "جاهزة";
    } catch (e) {
      speak("حدث خطأ مؤقت");
      status.innerText = "جاهزة";
    }

    working = false;
  };

  recognition.onerror = function () {
    status.innerText = "تعذر تشغيل الميكروفون";
    working = false;
  };
}

function speak(text) {
  speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.95;

  speechSynthesis.speak(msg);
}
