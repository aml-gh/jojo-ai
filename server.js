import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.static("."));

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const userMessage = req.body.message || "السلام عليكم";

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `
أنت جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف.
ردي بلهجة سعودية رسمية، قصيرة، مهذبة.

سؤال المستخدم:
${userMessage}
`
    });

    res.json({
      reply: response.output_text || "أهلاً وسهلاً بك، كيف أقدر أخدمك؟"
    });

  } catch (error) {
    console.log(error);

    res.json({
      reply: "أهلاً وسهلاً بك، كيف أقدر أخدمك اليوم؟"
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
