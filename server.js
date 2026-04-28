import express from "express";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("."));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "السلام عليكم";

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash"
    });

    const prompt = `
أنت جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف.
تحدثي بلهجة سعودية رسمية، مهذبة، قصيرة، ذكية.

سؤال المستخدم:
${userMessage}
`;

    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    res.json({ reply });

  } catch (error) {
    console.log(error);

    res.json({
      reply: "أعتذر، تعذر الاتصال بخدمة Gemini."
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Gemini server running");
});
