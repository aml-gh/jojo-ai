let listening = false;

const talkBtn = document.getElementById("talkBtn");
const statusText = document.getElementById("status");
const replyText = document.getElementById("reply");

talkBtn.addEventListener("click", startVoice);

function speak(text) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  utterance.rate = 1;
  speechSynthesis.speak(utterance);
}

async function startVoice() {
  if (listening) return;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("المتصفح لا يدعم المايكروفون");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  listening = true;
  statusText.innerText = "جوجو تستمع الآن...";

  recognition.start();

  recognition.onresult = async function (event) {
    const text = event.results[0][0].transcript;

    statusText.innerText = "سمعت: " + text;

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: text
        })
      });

      const data = await response.json();

      replyText.innerText = data.reply;

      speak(data.reply);

      statusText.innerText = "جاهزة";
    } catch (error) {
      replyText.innerText = "اعتذر، حدث خطأ مؤقت";
      speak("اعتذر، حدث خطأ مؤقت");
      statusText.innerText = "جاهزة";
    }

    listening = false;
  };

  recognition.onerror = function () {
    statusText.innerText = "جاهزة";
    listening = false;
  };

  recognition.onend = function () {
    listening = false;
  };
}
