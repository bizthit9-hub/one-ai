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
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "OPENAI_API_KEY is not configured in Vercel Environment Variables."
      });
    }

    const body = req.body || {};

    // Accept either:
    // { message: "Hello" }
    // OR
    // { messages: [{role:"user",content:"Hello"}] }

    let messages = Array.isArray(body.messages)
      ? body.messages
      : [];

    if (body.message && typeof body.message === "string") {
      messages.push({
        role: "user",
        content: body.message
      });
    }

    if (!messages.length) {
      return res.status(400).json({
        error: "Message is required."
      });
    }

    // Keep only valid chat messages
    messages = messages
      .filter(
        (m) =>
          m &&
          typeof m.content === "string" &&
          ["user", "assistant", "system"].includes(m.role)
      )
      .slice(-30);

    // OpenAI Responses API input
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-5.6",
        input: messages.map((m) => ({
          role: m.role,
          content: [
            {
              type: "input_text",
              text: m.content
            }
          ]
        })),
        max_output_tokens: 1200
      })
    });

    const data = await response.json();

    // OpenAI error
    if (!response.ok) {
      console.error("OpenAI API error:", data);

      return res.status(response.status).json({
        error:
          data?.error?.message ||
          `OpenAI API request failed (${response.status}).`
      });
    }

    // Responses API normally provides output_text
    const reply =
      data.output_text ||
      data.output
        ?.flatMap((item) => item.content || [])
        ?.filter((item) => item.type === "output_text")
        ?.map((item) => item.text)
        ?.join("") ||
      "I couldn't generate a response.";

    return res.status(200).json({
      reply,
      model: "gpt-5.6"
    });

  } catch (error) {
    console.error("Chat API error:", error);

    return res.status(500).json({
      error: "Server error. Please try again."
    });
  }
  }
