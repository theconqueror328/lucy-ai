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
        error: "OPENAI_API_KEY is missing in Vercel."
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
          input: message
        })
      }
    );

    const raw = await response.text();

    console.log("OPENAI STATUS:", response.status);
    console.log("OPENAI RESPONSE:", raw);

    if (!response.ok) {
      return res.status(response.status).json({
        error: `OpenAI HTTP ${response.status}: ${raw}`
      });
    }

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return res.status(500).json({
        error: "OpenAI returned invalid JSON."
      });
    }

    const reply = (data.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === "output_text")
      .map(item => item.text || "")
      .join("");

    if (!reply) {
      return res.status(500).json({
        error:
          "OpenAI responded successfully, but LUCY found no text in the response."
      });
    }

    return res.status(200).json({
      reply
    });

  } catch (error) {
    console.error("LUCY SERVER ERROR:", error);

    return res.status(500).json({
      error: `Server error: ${error.message}`
    });
  }
}
