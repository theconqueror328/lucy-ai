export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { message } = req.body || {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({
        error: "Please provide a message."
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
          "Authorization":
            `Bearer ${process.env.OPENAI_API_KEY}`
        },

        body: JSON.stringify({
          model: "gpt-5.6-luna",

          instructions:
            "You are LUCY, a smart, friendly, helpful AI assistant. " +
            "Be conversational, clear, honest and respectful. " +
            "Explain difficult things simply. " +
            "Give useful and age-appropriate answers.",

          input: message
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

    return res.status(200).json({
      reply:
        data.output_text ||
        "LUCY couldn't generate a response."
    });

  } catch (error) {
    console.error("Server error:", error);

    return res.status(500).json({
      error:
        error.message ||
        "Something went wrong."
    });
  }
}
