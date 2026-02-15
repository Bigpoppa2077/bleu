"use client";

import { useEffect, useState } from "react";
import { Project, Constraint, ChangeRequest } from "@/lib/types";
import {
  calculateIntegrity,
  getPillarHealth,
  formatPillarDelta,
  IntegrityResult,
} from "@/lib/integrity";

interface VisionIntegrityPanelProps {
  project: Project;
  constraints: Constraint[];
  changeRequests: ChangeRequest[];
  onRecalculate?: (result: IntegrityResult) => void;
}

const PILLAR_COLORS: Record<string, { bg: string; bar: string; text: string }> =
  {
    luxury: { bg: "bg-amber-50", bar: "bg-amber-400", text: "text-amber-700" },
    craft: { bg: "bg-orange-50", bar: "bg-orange-400", text: "text-orange-700" },
    minimal: { bg: "bg-sky-50", bar: "bg-sky-400", text: "text-sky-700" },
    bold: { bg: "bg-red-50", bar: "bg-red-400", text: "text-red-700" },
    warm: { bg: "bg-rose-50", bar: "bg-rose-400", text: "text-rose-700" },
  };

const PILLAR_LABELS: Record<string, string> = {
  luxury: "Luxury",
  craft: "Craft",
  minimal: "Minimal",
  bold: "Bold",
  warm: "Warm",
};

export function VisionIntegrityPanel({
  project,
  constraints,
  changeRequests,
  onRecalculate,
}: VisionIntegrityPanelProps) {
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(
    null
  );
  const [scoreHistory, setScoreHistory] = useState<number[]>([]);
  const [expandedView, setExpandedView] = useState(false);

  // Recalculate integrity when dependencies change
  useEffect(() => {
    const result = calculateIntegrity(project, constraints, changeRequests);
    setIntegrityResult(result);

    // Update history (keep last 5)
    setScoreHistory((prev) => {
      const updated = [...prev, result.integrityScore];
      return updated.slice(-5);
    });

    onRecalculate?.(result);
  }, [project, constraints, changeRequests, onRecalculate]);

  if (!integrityResult) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <p className="text-gray-500">Loading vision integrity...</p>
      </div>
    );
  }

  const health = getPillarHealth(integrityResult.integrityScore);
  const isHealthy = health === "healthy";
  const isDegraded = health === "degraded";

  // Status message based on health
  const statusMessage =
    integrityResult.integrityScore >= 80
      ? "✨ Your vision is strong and aligned."
      : integrityResult.integrityScore >= 60
        ? "⚠️ Your concept is drifting. Some alignment gaps emerging."
        : "🚨 Your concept is drifting significantly. Reset focus or adjust constraints.";

  // Trend visualization: show last 5 scores
  const minScore = Math.min(...scoreHistory, 0);
  const maxScore = Math.max(...scoreHistory, 100);
  const range = maxScore - minScore || 1;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-5 space-y-5">
      {/* Main Integrity Meter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">Vision Integrity</h3>
          <span className="text-3xl font-bold text-blue-600">
            {integrityResult.integrityScore}%
          </span>
        </div>

        {/* Meter Bar */}
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isHealthy
                ? "bg-green-500"
                : isDegraded
                  ? "bg-yellow-500"
                  : "bg-red-500"
            }`}
            style={{ width: `${integrityResult.integrityScore}%` }}
          />
        </div>

        {/* Status Message */}
        <p className="text-sm font-medium text-gray-700">{statusMessage}</p>
      </div>

      {/* Trend Line - Last 5 Scores */}
      {scoreHistory.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
            Trend ({scoreHistory.length} checkpoints)
          </p>
          <div className="flex items-end gap-2 h-12 bg-white bg-opacity-50 p-3 rounded">
            {scoreHistory.map((score, idx) => {
              const height = ((score - minScore) / range) * 100;
              const isLatest = idx === scoreHistory.length - 1;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    className={`w-full rounded transition-all ${
                      isLatest ? "bg-blue-600" : "bg-blue-300"
                    }`}
                    style={{
                      height: `${Math.max(height, 8)}px`,
                      minHeight: "8px",
                    }}
                    title={`Score: ${score}%`}
                  />
                  <span className="text-xs text-gray-500">{score}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5 Pillar Bars */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Pillar Alignment
        </p>
        <div className="space-y-3">
          {Object.entries(integrityResult.pillarDeltas).map(([pillar, delta]) => {
            const baseline =
              integrityResult.baselinePillars[
                pillar as keyof typeof integrityResult.baselinePillars
              ] || 50;
            const current = baseline + delta;
            const clampedCurrent = Math.max(0, Math.min(100, current));
            const colors = PILLAR_COLORS[pillar];

            return (
              <div key={pillar} className={`${colors.bg} rounded-lg p-3`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`font-semibold text-sm ${colors.text}`}>
                    {PILLAR_LABELS[pillar]}
                  </span>
                  <span className="text-xs font-mono text-gray-600">
                    {baseline} → {clampedCurrent}%{" "}
                    <span className="text-xs font-semibold text-gray-700">
                      {formatPillarDelta(delta)}
                    </span>
                  </span>
                </div>

                {/* Pillar Bar with Baseline Marker */}
                <div className="relative w-full bg-white bg-opacity-60 rounded h-5">
                  {/* Baseline marker line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 bg-opacity-60"
                    style={{ left: `${baseline}%` }}
                    title={`Baseline: ${baseline}%`}
                  />

                  {/* Current value bar */}
                  <div
                    className={`h-full ${colors.bar} rounded transition-all duration-500`}
                    style={{ width: `${clampedCurrent}%` }}
                  />
                </div>

                {/* Mini label */}
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-gray-500">0%</span>
                  <span className="text-xs text-gray-500">100%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What Drifted - Explanations */}
      {integrityResult.explanations.length > 0 && (
        <div className="border-t border-blue-200 pt-4 space-y-2">
          <p className="text-sm font-bold text-gray-800">📊 What drifted:</p>
          <ul className="space-y-1">
            {integrityResult.explanations.map((explanation, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-700 pl-4 border-l-2 border-blue-300"
              >
                {explanation}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Fix Drift Options - Suggestions */}
      {integrityResult.fixSuggestions.length > 0 && (
        <div className="bg-white bg-opacity-70 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="text-sm font-bold text-gray-800">
            🛡️ Ways to preserve the vibe:
          </p>
          <ul className="space-y-2">
            {integrityResult.fixSuggestions.map((suggestion, idx) => (
              <li
                key={idx}
                className="text-sm text-gray-700 flex items-start gap-2"
              >
                <span className="mt-0.5 flex-shrink-0">•</span>
                <span>{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Toggle Expanded View */}
      <button
        onClick={() => setExpandedView(!expandedView)}
        className="w-full text-center py-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:bg-white hover:bg-opacity-50 rounded transition-all"
      >
        {expandedView ? "Show less" : "Show more details"}
      </button>

      {/* Expanded View - Raw Data */}
      {expandedView && (
        <div className="bg-white bg-opacity-70 border border-gray-300 rounded-lg p-4 space-y-3">
          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">Baseline Pillars:</p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              {Object.entries(integrityResult.baselinePillars).map(
                ([pillar, value]) => (
                  <div key={pillar} className="flex justify-between">
                    <span>{pillar}:</span>
                    <span className="font-mono font-semibold">{value}%</span>
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-700 mb-2">
              Current Deltas:
            </p>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              {Object.entries(integrityResult.pillarDeltas).map(
                ([pillar, delta]) => (
                  <div key={pillar} className="flex justify-between">
                    <span>{pillar}:</span>
                    <span className="font-mono font-semibold">
                      {delta > 0 ? "+" : ""}
                      {delta}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 italic">
            {changeRequests.length} change
            {changeRequests.length !== 1 ? "s" : ""} recorded
          </p>
        </div>
      )}
    </div>
  );
}
