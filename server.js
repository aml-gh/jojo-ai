import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "السلام عليكم";

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct",
        messages: [
          {
            role: "system",
            content: "أنتِ جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. تحدثي بلهجة سعودية رسمية، أنيقة، مختصرة، ذكية."
          },
          {
            role: "user",
            content: userMessage
          }
        ]
      })
    });

    const data = await response.json();

    const reply =
      data.choices?.[0]?.message?.content ||
      "أعتذر، حدث خطأ مؤقت.";

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.json({
      reply: "أعتذر، تعذر الاتصال حالياً."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
