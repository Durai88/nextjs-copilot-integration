import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Use Groq (free) or OpenAI based on available key
const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY!,
  baseURL: process.env.GROQ_API_KEY ? "https://api.groq.com/openai/v1" : undefined,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body.operationName === "generateCopilotResponse") {
      const messages = body.variables?.data?.messages || [];
      const threadId = body.variables?.data?.threadId || `thread-${Date.now()}`;
      
      // Extract context from the request
      const context = body.variables?.data?.context || [];
      const contextText = context
        .map((ctx: any) => `${ctx.description}: ${ctx.value}`)
        .join('\n\n');
      
      console.log('Context received:', contextText);
      
      // Convert CopilotKit messages to OpenAI format
      const openaiMessages = messages
        .filter((msg: any) => msg.textMessage?.content)
        .map((msg: any) => ({
          role: msg.textMessage.role,
          content: msg.textMessage.content,
        }))
        .filter((msg: any) => msg.role !== 'system'); // Remove all system messages
      
      // Add our own system message with context
      openaiMessages.unshift({
        role: 'system',
        content: `You are a helpful AI assistant. Answer questions directly and concisely based on the conversation and any provided context.

${contextText ? 'Available Context:\n' + contextText : 'No additional context provided.'}

When analyzing data:
- For CSV/Excel data: Provide insights, summaries, and answer specific questions about the data
- For images: Note that image analysis is limited, describe what you can infer from the filename
- Always be specific and reference the actual data when answering`
      });
      
      console.log('Messages being sent to AI:', JSON.stringify(openaiMessages, null, 2));
      
      // Call API (Groq or OpenAI)
      const completion = await client.chat.completions.create({
        model: process.env.GROQ_API_KEY ? "llama-3.3-70b-versatile" : "gpt-3.5-turbo",
        messages: openaiMessages,
        stream: false,
      });
      
      const assistantContent = completion.choices[0]?.message?.content || "I'm here to help!";
      
      // Ensure content is a string
      const contentString = typeof assistantContent === 'string' 
        ? assistantContent 
        : String(assistantContent);
      
      // Return response in CopilotKit GraphQL format
      return NextResponse.json({
        data: {
          generateCopilotResponse: {
            threadId,
            runId: `run-${Date.now()}`,
            extensions: null,
            status: {
              code: "SUCCESS",
              __typename: "BaseResponseStatus"
            },
            messages: [
              {
                __typename: "TextMessageOutput",
                id: `msg-${Date.now()}`,
                createdAt: new Date().toISOString(),
                content: [contentString],
                role: "assistant",
                parentMessageId: null,
                status: {
                  code: "SUCCESS",
                  __typename: "SuccessMessageStatus"
                }
              }
            ],
            metaEvents: [],
            __typename: "CopilotResponse"
          }
        }
      });
    }
    
    // Default response for other queries
    return NextResponse.json({ data: {} });
    
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { errors: [{ message: error instanceof Error ? error.message : "Unknown error" }] },
      { status: 500 }
    );
  }
}
