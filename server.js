import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.static("."));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/api/chat", async (req, res) => {
  try {
    const message = req.body.message || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "أنتِ جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. تحدثي بأسلوب سعودي رسمي، مختصر، ودود، ومناسب للزوار والحجاج."
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error(error);
    res.json({
      reply: "عذرًا، حدث خلل في الاتصال بالذكاء الاصطناعي."
    });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("Jojo is running on port " + port);
});
