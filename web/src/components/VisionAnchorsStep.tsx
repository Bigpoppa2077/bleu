"use client";

import { Project, VisionAnchors } from "@/lib/types";

interface VisionAnchorsStepProps {
  project: Project;
  setProject: (p: Project) => void;
}

const PILLAR_DEFINITIONS: Record<
  keyof VisionAnchors["pillars"],
  { label: string; description: string; lowExample: string; highExample: string }
> = {
  luxury: {
    label: "Luxury",
    description: "Premium, refined, upscale",
    lowExample: "Budget-friendly, accessible",
    highExample: "High-end, exclusive, opulent",
  },
  craft: {
    label: "Craft",
    description: "Handmade, artisanal, detailed",
    lowExample: "Mass-produced, quick",
    highExample: "Handcrafted, artisan, meticulous",
  },
  minimal: {
    label: "Minimal",
    description: "Simple, essential, clean",
    lowExample: "Ornate, complex, detailed",
    highExample: "Bare essentials, uncluttered",
  },
  bold: {
    label: "Bold",
    description: "Striking, confident, daring",
    lowExample: "Subtle, conservative, understated",
    highExample: "Dramatic, eye-catching, audacious",
  },
  warm: {
    label: "Warm",
    description: "Approachable, human, intimate",
    lowExample: "Cold, impersonal, clinical",
    highExample: "Cozy, inviting, heartfelt",
  },
};

export function VisionAnchorsStep({
  project,
  setProject,
}: VisionAnchorsStepProps) {
  const anchors = project.visionAnchors || {
    pillars: { luxury: 50, craft: 50, minimal: 50, bold: 50, warm: 50 },
    keywords: [],
    nonNegotiables: [],
  };

  const handlePillarChange = (pillar: keyof VisionAnchors["pillars"], value: number) => {
    setProject({
      ...project,
      visionAnchors: {
        ...anchors,
        pillars: {
          ...anchors.pillars,
          [pillar]: value,
        },
      },
    });
  };

  const handleKeywordChange = (keywords: string) => {
    setProject({
      ...project,
      visionAnchors: {
        ...anchors,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
      },
    });
  };

  const handleNonNegotiablesChange = (nonNegotiables: string) => {
    setProject({
      ...project,
      visionAnchors: {
        ...anchors,
        nonNegotiables: nonNegotiables
          .split(",")
          .map((n) => n.trim())
          .filter((n) => n.length > 0),
      },
    });
  };

  const pillars: Array<keyof VisionAnchors["pillars"]> = [
    "luxury",
    "craft",
    "minimal",
    "bold",
    "warm",
  ];

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Vision Pillars</h3>
        <p className="text-lg text-gray-600 mb-6">
          Rate how important each pillar is to your project (0-100).
        </p>

        <div className="space-y-8">
          {pillars.map((pillar) => {
            const def = PILLAR_DEFINITIONS[pillar];
            const value = anchors.pillars[pillar];

            return (
              <div key={pillar} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">{def.label}</h4>
                    <p className="text-sm text-gray-600">{def.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{value}</div>
                    <div className="text-xs text-gray-500">out of 100</div>
                  </div>
                </div>

                {/* Slider */}
                <div className="flex items-center gap-4">
                  <span className="text-sm font-semibold text-gray-600 w-24">
                    {def.lowExample}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={value}
                    onChange={(e) => handlePillarChange(pillar, parseInt(e.target.value))}
                    className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <span className="text-sm font-semibold text-gray-600 w-24 text-right">
                    {def.highExample}
                  </span>
                </div>

                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-gray-400 to-blue-600 transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keywords */}
      <div className="border-t border-gray-200 pt-8">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-2">
            Keywords
          </label>
          <p className="text-sm text-gray-600 mb-3">
            Enter keywords that define your project (comma-separated)
          </p>
          <textarea
            value={anchors.keywords.join(", ")}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="e.g., modern, sustainable, playful"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
          />
        </div>
      </div>

      {/* Non-Negotiables */}
      <div className="border-t border-gray-200 pt-8">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-2">
            Non-Negotiables
          </label>
          <p className="text-sm text-gray-600 mb-3">
            What absolutely must be true about your project?
          </p>
          <textarea
            value={anchors.nonNegotiables.join(", ")}
            onChange={(e) => handleNonNegotiablesChange(e.target.value)}
            placeholder="e.g., Must be eco-friendly, Must be affordable, Must be accessible"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
          />
        </div>
      </div>

      {/* Summary */}
      {(anchors.keywords.length > 0 || anchors.nonNegotiables.length > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 space-y-4">
          <h4 className="font-bold text-gray-900 text-lg">Vision Summary</h4>

          {anchors.keywords.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Keywords:</p>
              <div className="flex flex-wrap gap-2">
                {anchors.keywords.map((keyword, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-200 text-blue-900 rounded-full text-sm font-semibold"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {anchors.nonNegotiables.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Non-Negotiables:</p>
              <ul className="space-y-1">
                {anchors.nonNegotiables.map((item, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
