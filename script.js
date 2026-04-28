let active = false;

const JOJO_INTRO =
  "أهلًا وسهلًا بك، أنا جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. كيف أقدر أخدمك اليوم؟";

async function startVoiceChat() {
  if (active) return;
  active = true;

  setState("جوجو تستمع الآن...", "listen");

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    speak("المتصفح لا يدعم الاستماع الصوتي. الرجاء استخدام متصفح كروم.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onresult = async (event) => {
    const userText = event.results[0][0].transcript;
    setState("جوجو تفكر...", "think");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();
      speak(data.reply || "عذرًا، لم أتمكن من تجهيز الرد.");
    } catch (err) {
      speak("عذرًا، حدث خلل في الاتصال بالذكاء الاصطناعي.");
    }
  };

  recognition.onerror = () => {
    speak("ما سمعتك بوضوح، حاول مرة ثانية من فضلك.");
  };

  recognition.start();
}

function speak(text) {
  setState("جوجو تتحدث...", "talk");

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ar-SA";
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  const voices = window.speechSynthesis.getVoices();
  const arabicVoice =
    voices.find(v => v.lang === "ar-SA") ||
    voices.find(v => v.lang.startsWith("ar")) ||
    voices.find(v => v.name.toLowerCase().includes("female"));

  if (arabicVoice) utterance.voice = arabicVoice;

  utterance.onend = () => {
    active = false;
    setState("جاهزة", "");
  };

  utterance.onerror = () => {
    active = false;
    setState("جاهزة", "");
  };

  window.speechSynthesis.speak(utterance);
}

function setState(text, mode) {
  const status = document.getElementById("status");
  const jojo = document.getElementById("jojo");

  if (status) status.innerText = text;

  if (jojo) {
    jojo.className = "";
    if (mode) jojo.classList.add(mode);
  }
}

window.addEventListener("load", () => {
  setTimeout(() => {
    speak(JOJO_INTRO);
  }, 800);
});
