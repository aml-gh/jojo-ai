import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("."));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "السلام عليكم";

    const prompt = `
أنتِ جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف.
تحدثي بلهجة سعودية رسمية، لبقة، ذكية، ومختصرة.

رسالة المستخدم:
${userMessage}
`;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt
    });

    res.json({
      reply: response.text || "أهلًا وسهلًا، كيف أقدر أخدمك؟"
    });

  } catch (error) {
    console.error("GEMINI ERROR:", error);

    res.json({
      reply: "خطأ حقيقي: " + error.message
    });
  }
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
