export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { messages } = req.body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: "Please provide conversation messages."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions:
            "You are LUCY, a personal AI assistant. " +
            "Your name is LUCY. When asked who you are, say you are LUCY. " +
            "Never identify yourself as ChatGPT. " +
            "You are friendly, intelligent, helpful, calm and conversational. " +
            "Speak naturally and clearly. " +
            "Remember and use the conversation context provided to you. " +
            "Be honest when uncertain and never invent facts. " +
            "Do not pretend to be human. " +
            "Give safe and age-appropriate answers.",

          input: messages
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          "OpenAI returned an error."
      });
    }

    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text || "")
      .join("");

    if (!reply) {
      return res.status(500).json({
        error: "LUCY received no text from the AI."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error: error.message || "Server error."
    });
  }
}
