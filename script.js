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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey || !apiKey.startsWith("sk-")) {
      return res.json({
        reply: "مفتاح OpenAI غير موجود أو غير صحيح في Railway Variables."
      });
    }

    const openai = new OpenAI({ apiKey });

    const userMessage = req.body.message || "السلام عليكم";

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "أنتِ جوجو، سفيرة التحول الحضري بأمانة محافظة الطائف. تحدثي بلهجة سعودية رسمية، بأسلوب راقٍ ومختصر وواضح."
        },
        {
          role: "user",
          content: userMessage
        }
      ]
    });

    res.json({
      reply: completion.choices?.[0]?.message?.content || "لم يصل رد من الذكاء الاصطناعي."
    });

  } catch (error) {
    console.error("OPENAI_REAL_ERROR:", error);

    res.json({
      reply:
        "خطأ OpenAI: " +
        (error?.status ? "status " + error.status + " - " : "") +
        (error?.message || "سبب غير معروف")
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Jojo server running on port " + PORT);
});
