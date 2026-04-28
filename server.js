import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("."));

const PORT = process.env.PORT || 8080;

// تحقق من المفتاح عند التشغيل
if (!process.env.GEMINI_API_KEY) {
  console.log("GEMINI_API_KEY missing");
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "السلام عليكم";

    const prompt = `
أنتِ جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف.
تحدثي بلهجة سعودية رسمية، مختصرة، لطيفة، ذكية.

رسالة المستخدم:
${userMessage}
`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    });

    const reply =
      result?.text ||
      result?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "أهلًا وسهلًا، كيف أقدر أخدمك؟";

    res.json({ reply });

  } catch (error) {
    console.error("REAL ERROR:", error);

    res.json({
      reply: "خطأ حقيقي: " + (error.message || "Unknown error")
    });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
