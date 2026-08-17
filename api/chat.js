export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Only POST requests are allowed."
    });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "GEMINI_API_KEY is not configured in Vercel Environment Variables."
      });
    }

    const body = req.body || {};

    // Support:
    // { message: "Hello", history: [...] }
    // OR
    // { messages: [...] }

    let messages = Array.isArray(body.messages)
      ? body.messages
      : Array.isArray(body.history)
        ? body.history
        : [];

    if (body.message && typeof body.message === "string") {
      messages = [
        ...messages,
        {
          role: "user",
          content: body.message
        }
      ];
    }

    // Keep valid messages only
    messages = messages
      .filter(
        (m) =>
          m &&
          typeof m.content === "string" &&
          ["user", "assistant", "system"].includes(m.role)
      )
      .slice(-30);

    if (!messages.length) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    // Separate system instruction
    const systemMessages = messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n\n");

    // Gemini uses "model" instead of "assistant"
    const contents = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [
          {
            text: m.content
          }
        ]
      }));

    const requestBody = {
      contents,
      generationConfig: {
        maxOutputTokens: 1200
      }
    };

    if (systemMessages) {
      requestBody.systemInstruction = {
        parts: [
          {
            text: systemMessages
          }
        ]
      };
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify(requestBody)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          `Gemini API request failed (${response.status}).`
      });
    }

    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.filter((part) => typeof part.text === "string")
        ?.map((part) => part.text)
        ?.join("") ||
      "I couldn't generate a response.";

    return res.status(200).json({
      reply,
      model: "gemini-3.6-flash"
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
}
