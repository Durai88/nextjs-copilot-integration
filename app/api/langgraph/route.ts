import { NextRequest, NextResponse } from "next/server";
import { StateGraph } from "@langchain/langgraph";

export async function POST(req: NextRequest) {
  const { input } = await req.json();

  const graph = new StateGraph({ channels: ["input", "output"] });
  graph.addNode("start", async (state) => {
    return { output: `Hello, ${state.input}` };
  });

  const app = graph.compile();
  const result = await app.invoke({ input });

  return NextResponse.json(result);
}
