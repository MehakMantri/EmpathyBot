// app/api/chat/route.js
import { NextResponse } from "next/server";
import { systemPrompt } from "@/app/shared/promts";
// Define your OpenRouter API key and site details
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY; // Ensure this is set
const YOUR_SITE_URL = 'https://your-site-url.com'; // Replace with your site URL
const YOUR_SITE_NAME = 'EmpathyAI'; // Replace with your site name

export async function POST(req) {
  const data = await req.json();

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": YOUR_SITE_URL,
        "X-Title": YOUR_SITE_NAME,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-3.1-8b-instruct:free",
        messages: [
          { role: "system", content: systemPrompt },
          ...data.messages, // Pass user messages
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let jsonResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            jsonResponse += decoder.decode(value, { stream: true });
            
            try {
              const parsedResponse = JSON.parse(jsonResponse);
              const messageContent = parsedResponse.choices[0].message.content;
              
              controller.enqueue(new TextEncoder().encode(messageContent));
              
              jsonResponse = '';
            } catch (parseError) {
              // Continue accumulating data
            }
          }
        } catch (error) {
          controller.error(error);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);

  } catch (error) {
    return new NextResponse(error.message, { status: 500 });
  }
}
