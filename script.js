let working = false;

async function startVoiceChat() {
  if (working) return;
  working = true;

  const status = document.getElementById("status");
  status.innerText = "جوجو تستمع الآن...";

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

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
        body: JSON.stringify({
          message: text
        })
      });

      const data = await res.json();

      console.log(data);

      if (data.reply) {
        speak(data.reply);
      } else {
        speak("لم يصل رد");
      }

      status.innerText = "جاهزة";

    } catch (error) {
      console.log(error);
      speak("حدث خطأ");
      status.innerText = "جاهزة";
    }

    working = false;
  };
}

function speak(text) {
  window.speechSynthesis.cancel();

  const msg = new SpeechSynthesisUtterance(text);
  msg.lang = "ar-SA";
  msg.rate = 0.95;
  msg.pitch = 1;

  window.speechSynthesis.speak(msg);
}
