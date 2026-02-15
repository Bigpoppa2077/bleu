import { NextRequest, NextResponse } from "next/server";
import { GeneratedPack } from "@/lib/types";
import { mockBrief, mockPlan, mockRisks } from "@/lib/mock";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
 * Call Gemini API with JSON response format
 */
async function callGeminiProvider(mode: GenerateMode, input: any): Promise<GeneratedPack> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY or GOOGLE_API_KEY not configured");
  }

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

  const prompt = buildPrompt(mode, input);

  const generationConfig = {
    temperature: 0.7,
    responseMimeType: "application/json",
  };

  const response = await model.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
    generationConfig,
  });

  const text = response.response.text();
  console.log(`[API] Gemini raw response for mode ${mode}:`, text);
  if (!text) {
    throw new Error("Empty response from Gemini API");
  }

  const parsed = parseSafeJSON(text);
  console.log(`[API] After normalization for mode ${mode}:`, JSON.stringify(parsed));
  return parsed;
}

/**
 * Safely parse JSON with fallback and normalization
 */
function parseSafeJSON(jsonStr: string): GeneratedPack {
  try {
    console.log(`[Parse] Attempting to parse JSON string (length: ${jsonStr.length})`);
    let data = JSON.parse(jsonStr);
    console.log(`[Parse] Parsed raw data:`, JSON.stringify(data).substring(0, 500));
    
    // Normalize the response structure
    data = normalizeGeneratedPack(data);
    console.log(`[Parse] After normalization:`, JSON.stringify(data).substring(0, 500));
    return data;
  } catch (error) {
    console.error("Failed to parse JSON response:", error);
    // Try to extract JSON object from response if it contains extra text
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        console.log(`[Parse] Extracted JSON from text, attempting to parse`);
        let data = JSON.parse(jsonMatch[0]);
        console.log(`[Parse] Extracted data:`, JSON.stringify(data).substring(0, 500));
        data = normalizeGeneratedPack(data);
        return data;
      } catch (innerError) {
        console.error("Failed to parse extracted JSON:", innerError);
      }
    }
    throw new Error("Invalid JSON response from Gemini API");
  }
}

/**
 * Normalize GeneratedPack structure from API response
 */
function normalizeGeneratedPack(data: any): GeneratedPack {
  // Unwrap common wrappers
  if (data?.GeneratedPack) data = data.GeneratedPack;
  if (data?.generatedPack) data = data.generatedPack;
  if (data?.result) data = data.result;

  const brief = data.brief || data.summary || data.description || "";
  const northStar = Array.isArray(data.northStar)
    ? data.northStar.join(" ")
    : data.northStar || data.north_star || "";

  // Build milestones from either explicit milestones or nested phases -> milestones
  let rawMilestones: any[] = [];
  if (Array.isArray(data.milestones)) {
    rawMilestones = data.milestones;
  } else if (Array.isArray(data.phases)) {
    // phases may contain nested milestones
    data.phases.forEach((phase: any) => {
      if (Array.isArray(phase.milestones)) {
        phase.milestones.forEach((m: any) => rawMilestones.push(m));
      } else if (Array.isArray(phase.tasks)) {
        // treat phase.tasks as a single milestone
        rawMilestones.push({ title: phase.phaseName || phase.title || "Phase", tasks: phase.tasks });
      }
    });
  }

  return {
    brief,
    northStar,
    milestones: normalizeMilestones(rawMilestones),
    risks: normalizeRisks(data.risks || data.Risks || []),
    gaps: normalizeGaps(data.gaps || []),
    next3Actions: Array.isArray(data.next3Actions) ? data.next3Actions : (Array.isArray(data.next_actions) ? data.next_actions : []),
  };
}

/**
 * Normalize milestones array
 */
function normalizeMilestones(items: any[]): any[] {
  return items.map((item) => {
    // item may use different keys (milestoneName, milestone_name, title)
    const title = item.title || item.milestoneName || item.milestone_name || item.phaseName || "";

    // eta may be dueDate or a string; we can't reliably convert to hours, default 0
    const etaHours = item.etaHours || item.eta || 0;

    // tasks can be array of objects with varying keys or array of strings
    const rawTasks = Array.isArray(item.tasks)
      ? item.tasks
      : Array.isArray(item.tasks || item.Tasks)
      ? (item.tasks || item.Tasks)
      : [];

    const tasks = rawTasks.map((task: any, idx: number) => {
      if (typeof task === "string") {
        return { id: `${idx}-${Math.random()}`, title: task, done: false };
      }

      return {
        id: task.id || task.taskId || `${idx}-${Math.random()}`,
        title: task.title || task.taskName || task.name || "",
        done: !!(task.done || task.complete || task.completed),
      };
    });

    return { title, etaHours, tasks };
  });
}

/**
 * Normalize risks array
 */
function normalizeRisks(items: any[]): any[] {
  return items.map((item) => ({
    category: item.category || "",
    severity: (item.severity?.toLowerCase?.() || "medium") as "low" | "medium" | "high",
    issue: item.issue || "",
    mitigation: item.mitigation || "",
  }));
}

/**
 * Normalize gaps array
 */
function normalizeGaps(items: any[]): any[] {
  return items.map((item) => ({
    want: item.want || "",
    reality: item.reality || "",
    impact: item.impact || "",
  }));
}

/**
 * Build prompt based on mode
 */
function buildPrompt(mode: GenerateMode, input: any): string {
  const inputStr = JSON.stringify(input, null, 2);

  const systemPrompt =
    "You are a creative project assistant. Always respond with valid JSON only, no additional text or markdown.";

  const schemas = {
    brief: `Generate a brief GeneratedPack with these exact fields: brief (string), northStar (string), milestones array (each with title, etaHours, tasks array), risks array (each with category, severity, issue, mitigation), gaps array (each with want, reality, impact), next3Actions array (strings). Ensure all arrays are present even if empty.`,
    plan: `Generate a detailed project plan GeneratedPack with realistic phases, tasks, and milestones. Include brief, northStar, milestones array with nested tasks, risks array, gaps array, and next3Actions array. Ensure valid JSON structure.`,
    risks: `Analyze and generate a comprehensive risk assessment as a GeneratedPack with: brief, northStar, empty milestones array, risks array with category, severity (low|medium|high), issue, and mitigation, gaps array, and next3Actions array. Ensure all required fields.`,
  };

  return `${systemPrompt}\n\nSchema requirements:\n${schemas[mode]}\n\nInput data:\n${inputStr}\n\nRespond ONLY with valid JSON object, no markdown, no extra text.`;
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

    // Try Gemini API first, fallback to mock
    let result: GeneratedPack;

    if (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY) {
      try {
        console.log(`[API] Calling Gemini for mode: ${mode}`);
        result = await callGeminiProvider(mode, input);
        console.log(`[API] Gemini success for mode: ${mode}`);
        console.log(`[API] Normalized result:`, JSON.stringify(result, null, 2));
      } catch (aiError) {
        console.error(`[API] Gemini failed for mode ${mode}:`, aiError);
        console.log(`[API] Falling back to mock data for mode: ${mode}`);
        result = getMockOutput(mode);
      }
    } else {
      console.log(`[API] No API key configured, using mock data for mode: ${mode}`);
      result = getMockOutput(mode);
    }

    console.log(`[API] Final response structure for mode ${mode}:`, {
      hasMilestones: !!result.milestones,
      milestonesLength: result.milestones?.length,
      hasRisks: !!result.risks,
      risksLength: result.risks?.length,
      hasGaps: !!result.gaps,
      gapsLength: result.gaps?.length,
      hasNext3Actions: !!result.next3Actions,
      next3ActionsLength: result.next3Actions?.length,
    });

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
