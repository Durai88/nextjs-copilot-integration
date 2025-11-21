import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: NextRequest) {
  try {
    const { image, filename } = await req.json();
    
    // Use GPT-4 Vision if OpenAI key is available
    if (process.env.OPENAI_API_KEY && !process.env.GROQ_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: "Describe this image in detail. What do you see?" },
              { type: "image_url", image_url: { url: image } }
            ],
          },
        ],
        max_tokens: 500,
      });
      
      return NextResponse.json({
        description: response.choices[0]?.message?.content || "Unable to analyze image"
      });
    }
    
    return NextResponse.json({
      description: `Image: ${filename}. Vision analysis requires GPT-4 Vision. To enable: Use OpenAI API key instead of Groq.`
    });
    
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: "Failed to analyze image" },
      { status: 500 }
    );
  }
}
