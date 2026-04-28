import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("."));

app.post("/api/chat", async (req, res) => {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const userMessage = req.body.message || "";

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      input: `
أنت جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف.
تحدثي بلهجة سعودية رسمية، مختصرة، ذكية.

سؤال المستخدم:
${userMessage}
`
    });

    res.json({
      reply: response.output_text
    });

  } catch (error) {
    console.log(error);

    res.json({
      reply: "خطأ حقيقي: " + error.message
    });
  }
});

app.listen(process.env.PORT || 3000);
