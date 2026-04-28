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

app.get("/", (req, res) => {
  res.sendFile("index.html", { root: "." });
});

app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message || "";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "أنتِ جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. تحدثي بلهجة سعودية رسمية، بأسلوب راقٍ، مختصر، واضح، ومناسب للزوار والحجاج. لا تطيلي الرد."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("JOJO ERROR:", error);
    res.json({
      reply: "عذرًا، حدث خطأ مؤقت في الاتصال. حاول مرة ثانية."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Jojo is running on port ${PORT}`);
});

    res.json({
      reply: completion.choices[0].message.content
    });
  } catch (error) {
    console.error("JOJO ERROR:", error);
    res.json({
      reply: "عذرًا، حدث خطأ مؤقت في الاتصال. حاول مرة ثانية."
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Jojo is running on port ${PORT}`);
});
