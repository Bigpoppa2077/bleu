import { Project, Constraint, ChangeRequest, VisionAnchors } from "./types";

export interface IntegrityResult {
  integrityScore: number; // 0-100
  pillarDeltas: {
    luxury: number;
    craft: number;
    minimal: number;
    bold: number;
    warm: number;
  };
  baselinePillars: VisionAnchors["pillars"];
  explanations: string[];
  fixSuggestions: string[];
}

// Material keywords for detecting changes
const MATERIAL_KEYWORDS = {
  luxury: ["gold", "silver", "leather", "silk", "premium", "marble", "crystal"],
  budget: ["budget", "affordable", "cheap", "cost", "expense"],
  quality: ["craft", "quality", "handmade", "artisan", "detail"],
  minimal: ["simple", "clean", "minimal", "essential", "basic"],
  bold: ["striking", "dramatic", "bold", "vibrant", "eye-catching"],
  warm: ["warm", "cozy", "intimate", "human", "approachable"],
};

function detectMaterialChanges(changeText: string): {
  affectedPillars: string[];
  direction: "negative" | "positive";
} {
  const lowerText = changeText.toLowerCase();
  const affected = new Set<string>();
  let direction: "negative" | "positive" = "negative";

  // Detect downgrade patterns (reduce luxury/craft)
  if (
    lowerText.includes("glass to acrylic") ||
    lowerText.includes("marble to plastic") ||
    lowerText.includes("leather to fabric") ||
    lowerText.includes("upgrade to downgrade") ||
    lowerText.includes("reduce quality")
  ) {
    affected.add("luxury");
    affected.add("craft");
    direction = "negative";
  }

  // Detect upgrade patterns (increase luxury/craft)
  if (
    lowerText.includes("acrylic to glass") ||
    lowerText.includes("plastic to marble") ||
    lowerText.includes("fabric to leather") ||
    lowerText.includes("downgrade to upgrade") ||
    lowerText.includes("improve quality")
  ) {
    affected.add("luxury");
    affected.add("craft");
    direction = "positive";
  }

  // Detect simplification (increase minimal)
  if (lowerText.includes("simplify") || lowerText.includes("reduce features")) {
    affected.add("minimal");
    direction = "positive";
  }

  // Detect complexity increase (reduce minimal)
  if (lowerText.includes("add features") || lowerText.includes("complexity")) {
    affected.add("minimal");
    direction = "negative";
  }

  return { affectedPillars: Array.from(affected), direction };
}

function analyzeConstraintChanges(
  baselineConstraints: Constraint[],
  currentConstraints: Constraint[]
): { delta: number; pillar: string; reason: string }[] {
  const deltas: { delta: number; pillar: string; reason: string }[] = [];

  // Budget constraint changes
  const baseBudget = baselineConstraints.find(
    (c) => c.type.toLowerCase().includes("budget")
  );
  const currentBudget = currentConstraints.find((c) =>
    c.type.toLowerCase().includes("budget")
  );

  if (baseBudget && currentBudget) {
    const baseAmount = extractNumber(baseBudget.value);
    const currentAmount = extractNumber(currentBudget.value);

    if (baseAmount && currentAmount && currentAmount < baseAmount) {
      deltas.push({
        delta: -15,
        pillar: "luxury",
        reason: "Budget reduced - less room for premium materials",
      });
    } else if (baseAmount && currentAmount && currentAmount > baseAmount) {
      deltas.push({
        delta: 10,
        pillar: "luxury",
        reason: "Budget increased - more premium options available",
      });
    }
  }

  // Deadline constraint changes
  const baseDeadline = baselineConstraints.find(
    (c) => c.type.toLowerCase().includes("deadline") || c.type.toLowerCase().includes("time")
  );
  const currentDeadline = currentConstraints.find(
    (c) => c.type.toLowerCase().includes("deadline") || c.type.toLowerCase().includes("time")
  );

  if (baseDeadline && currentDeadline) {
    const baseDays = extractDays(baseDeadline.value);
    const currentDays = extractDays(currentDeadline.value);

    if (baseDays && currentDays && currentDays < baseDays) {
      deltas.push({
        delta: -12,
        pillar: "craft",
        reason: "Deadline reduced - less time for meticulous craftsmanship",
      });
    } else if (baseDays && currentDays && currentDays > baseDays) {
      deltas.push({
        delta: 8,
        pillar: "craft",
        reason: "Deadline extended - more time for detailed work",
      });
    }
  }

  // Tool/Platform changes
  const baseTools = baselineConstraints.find(
    (c) => c.type.toLowerCase().includes("tool") || c.type.toLowerCase().includes("platform")
  );
  const currentTools = currentConstraints.find(
    (c) => c.type.toLowerCase().includes("tool") || c.type.toLowerCase().includes("platform")
  );

  if (baseTools && currentTools && baseTools.value !== currentTools.value) {
    deltas.push({
      delta: -8,
      pillar: "bold",
      reason: "Tool/platform changed - may limit creative possibilities",
    });
  }

  return deltas;
}

function analyzeChangeRequests(
  changeRequests: ChangeRequest[]
): { delta: number; pillar: string; reason: string }[] {
  const deltas: { delta: number; pillar: string; reason: string }[] = [];

  const appliedChanges = changeRequests.filter((c) => c.appliedToPipeline);

  appliedChanges.forEach((change) => {
    const { affectedPillars, direction } = detectMaterialChanges(
      `${change.title} ${change.description}`
    );

    const magnitude = direction === "negative" ? -10 : 8;

    affectedPillars.forEach((pillar) => {
      deltas.push({
        delta: magnitude,
        pillar: pillar,
        reason: `Applied change: ${change.title}`,
      });
    });
  });

  return deltas;
}

function extractNumber(text: string): number | null {
  const match = text.match(/\d+(?:,\d{3})*(?:\.\d+)?/);
  return match ? parseFloat(match[0].replace(/,/g, "")) : null;
}

function extractDays(text: string): number | null {
  const lowerText = text.toLowerCase();

  // Match patterns like "30 days", "4 weeks", "2 months"
  const dayMatch = text.match(/(\d+)\s*(?:days?)/i);
  if (dayMatch) return parseInt(dayMatch[1]);

  const weekMatch = text.match(/(\d+)\s*(?:weeks?)/i);
  if (weekMatch) return parseInt(weekMatch[1]) * 7;

  const monthMatch = text.match(/(\d+)\s*(?:months?)/i);
  if (monthMatch) return parseInt(monthMatch[1]) * 30;

  const plainNumber = text.match(/\d+/);
  return plainNumber ? parseInt(plainNumber[0]) : null;
}

function generateExplanations(
  deltas: { delta: number; pillar: string; reason: string }[]
): string[] {
  const explanations: string[] = [];
  const pillarMap = new Map<string, { delta: number; reasons: string[] }>();

  deltas.forEach(({ delta, pillar, reason }) => {
    if (!pillarMap.has(pillar)) {
      pillarMap.set(pillar, { delta: 0, reasons: [] });
    }
    const entry = pillarMap.get(pillar)!;
    entry.delta += delta;
    entry.reasons.push(reason);
  });

  pillarMap.forEach((value, pillar) => {
    if (value.delta !== 0) {
      const direction = value.delta > 0 ? "increased" : "decreased";
      const magnitude = Math.abs(value.delta);
      explanations.push(
        `${pillar} pillar ${direction} by ~${magnitude}%: ${value.reasons.join(", ")}`
      );
    }
  });

  return explanations;
}

function generateFixSuggestions(
  integrityScore: number,
  deltas: { delta: number; pillar: string; reason: string }[],
  project: Project
): string[] {
  const suggestions: string[] = [];

  if (integrityScore < 50) {
    suggestions.push("⚠️ Major integrity issues detected. Review recent changes.");
  }

  if (integrityScore < 70) {
    suggestions.push("Review constraints to ensure they align with vision.");
  }

  // Find pillars with biggest negative deltas
  const negativePillars = new Map<string, number>();
  deltas
    .filter((d) => d.delta < 0)
    .forEach(({ delta, pillar }) => {
      negativePillars.set(pillar, (negativePillars.get(pillar) || 0) + delta);
    });

  negativePillars.forEach((totalDelta, pillar) => {
    if (pillar === "luxury" && totalDelta < -5) {
      suggestions.push("🛡️ Luxury reduced: Consider budget recovery or premium material choices.");
    }
    if (pillar === "craft" && totalDelta < -5) {
      suggestions.push(
        "🛡️ Craft reduced: Consider extending timeline or adding artisan resources."
      );
    }
    if (pillar === "minimal" && totalDelta < -5) {
      suggestions.push("🛡️ Minimal reduced: Review scope creep; consider feature prioritization.");
    }
    if (pillar === "bold" && totalDelta < -5) {
      suggestions.push("🛡️ Bold reduced: Ensure tool choices don't limit creative expression.");
    }
    if (pillar === "warm" && totalDelta < -5) {
      suggestions.push("🛡️ Warm reduced: Review team changes; ensure human-focused approach.");
    }
  });

  if (!project.team || project.team.length === 0) {
    suggestions.push("📋 No team assigned yet. Building a team can improve execution alignment.");
  }

  return suggestions;
}

export function calculateIntegrity(
  project: Project,
  constraints: Constraint[],
  changeRequests: ChangeRequest[]
): IntegrityResult {
  const baseline = project.visionAnchors?.pillars || {
    luxury: 50,
    craft: 50,
    minimal: 50,
    bold: 50,
    warm: 50,
  };

  // Collect all deltas
  const allDeltas: { delta: number; pillar: string; reason: string }[] = [];

  // Analyze constraints (assuming we track baseline separately)
  const constraintDeltas = analyzeConstraintChanges(constraints, constraints);
  allDeltas.push(...constraintDeltas);

  // Analyze change requests
  const changeDeltas = analyzeChangeRequests(changeRequests);
  allDeltas.push(...changeDeltas);

  // Calculate net deltas per pillar
  const pillarDeltas: Record<string, number> = {
    luxury: 0,
    craft: 0,
    minimal: 0,
    bold: 0,
    warm: 0,
  };

  allDeltas.forEach(({ delta, pillar }) => {
    if (pillar in pillarDeltas) {
      pillarDeltas[pillar] += delta;
    }
  });

  // Clamp deltas between -100 and 100
  Object.keys(pillarDeltas).forEach((key) => {
    pillarDeltas[key] = Math.max(-100, Math.min(100, pillarDeltas[key]));
  });

  // Calculate overall integrity score
  // Start at 100, deduct for negative deltas, add for positive
  let score = 100;
  Object.values(pillarDeltas).forEach((delta) => {
    if (delta < 0) {
      score += delta; // Negative delta reduces score
    } else if (delta > 0) {
      score += delta * 0.3; // Positive deltas less impactful (maintenance focus)
    }
  });

  score = Math.max(0, Math.min(100, Math.round(score)));

  // Generate explanations and suggestions
  const explanations = generateExplanations(allDeltas);
  const fixSuggestions = generateFixSuggestions(score, allDeltas, project);

  return {
    integrityScore: score,
    pillarDeltas: {
      luxury: pillarDeltas.luxury,
      craft: pillarDeltas.craft,
      minimal: pillarDeltas.minimal,
      bold: pillarDeltas.bold,
      warm: pillarDeltas.warm,
    },
    baselinePillars: baseline,
    explanations,
    fixSuggestions,
  };
}

export function getPillarHealth(
  integrityScore: number
): "healthy" | "degraded" | "critical" {
  if (integrityScore >= 75) return "healthy";
  if (integrityScore >= 50) return "degraded";
  return "critical";
}

export function formatPillarDelta(delta: number): string {
  if (delta === 0) return "→";
  if (delta > 0) return `↑ +${delta}`;
  return `↓ ${delta}`;
}
