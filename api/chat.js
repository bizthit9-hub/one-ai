export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS / CORS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Only POST
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

    /*
      Accepts:

      {
        "message": "Hello"
      }

      OR:

      {
        "messages": [
          { "role": "user", "content": "Hello" },
          { "role": "assistant", "content": "Hi!" }
        ]
      }

      OR:

      {
        "message": "Hello",
        "history": [...]
      }
    */

    let messages = [];

    // Existing messages
    if (Array.isArray(body.messages)) {
      messages = [...body.messages];
    }

    // Frontend history support
    if (Array.isArray(body.history)) {
      messages = [...body.history, ...messages];
    }

    // New message
    if (body.message && typeof body.message === "string") {
      messages.push({
        role: "user",
        content: body.message
      });
    }

    // Validate
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

    /*
      Gemini uses:
      user -> user
      assistant -> model

      System messages are converted into normal context
      so the API remains compatible with the existing frontend.
    */

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

    // Gemini 2.5 Flash
    const url =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" +
      encodeURIComponent(apiKey);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents,

        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1200
        }
      })
    });

    const data = await response.json();

    // Gemini API error
    if (!response.ok) {
      console.error("Gemini API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          `Gemini API request failed (${response.status}).`
      });
    }

    // Extract Gemini response
    const reply =
      data?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim();

    if (!reply) {
      console.error("Empty Gemini response:", data);

      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    return res.status(200).json({
      reply,
      model: "gemini-2.5-flash"
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: error?.message || "Server error. Please try again."
    });
  }
  }
