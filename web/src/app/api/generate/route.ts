import { NextRequest, NextResponse } from "next/server";
import { GeneratedPack } from "@/lib/types";
import { mockBrief, mockPlan, mockRisks } from "@/lib/mock";

type GenerateMode = "brief" | "plan" | "risks";

interface GenerateRequest {
  mode: GenerateMode;
  input: any;
}

interface GenerateResponse {
  ok: boolean;
  data?: GeneratedPack;
  error?: string;
}

/**
 * Simple AI provider call (implement your preferred service)
 */
async function callAIProvider(mode: GenerateMode, input: any): Promise<GeneratedPack> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured");
  }

  // Example: Simple OpenAI API call structure
  const prompt = buildPrompt(mode, input);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content:
            "You are a creative project assistant. Respond with valid JSON matching the specified schema.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.statusText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Invalid response from OpenAI");
  }

  return JSON.parse(content);
}

/**
 * Build prompt based on mode
 */
function buildPrompt(mode: GenerateMode, input: any): string {
  const inputStr = JSON.stringify(input, null, 2);

  const schemas = {
    brief: `Generate a brief GeneratedPack with: brief (string), northStar (string), milestones array, risks array, gaps array, next3Actions array.`,
    plan: `Generate a detailed project plan GeneratedPack with realistic phases, tasks, and milestones.`,
    risks: `Analyze and generate comprehensive risk assessment as a GeneratedPack with risk categories, severity levels, and mitigations.`,
  };

  return `${schemas[mode]}\n\nBased on this input:\n${inputStr}\n\nRespond with a valid JSON object.`;
}

/**
 * Get mock output based on mode
 */
function getMockOutput(mode: GenerateMode): GeneratedPack {
  const mocks: Record<GenerateMode, () => GeneratedPack> = {
    brief: mockBrief,
    plan: mockPlan,
    risks: mockRisks,
  };

  return mocks[mode]();
}

/**
 * POST /api/generate
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateResponse>> {
  try {
    const body: GenerateRequest = await request.json();

    const { mode, input } = body;

    // Validate request
    if (!mode || !["brief", "plan", "risks"].includes(mode)) {
      return NextResponse.json(
        { ok: false, error: "Invalid mode. Must be 'brief', 'plan', or 'risks'" },
        { status: 400 }
      );
    }

    if (!input) {
      return NextResponse.json(
        { ok: false, error: "Missing input field" },
        { status: 400 }
      );
    }

    // Try AI provider first, fallback to mock
    let result: GeneratedPack;

    if (process.env.OPENAI_API_KEY) {
      try {
        result = await callAIProvider(mode, input);
      } catch (aiError) {
        console.warn("AI provider failed, using mock:", aiError);
        result = getMockOutput(mode);
      }
    } else {
      result = getMockOutput(mode);
    }

    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    console.error("Generate endpoint error:", error);

    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
