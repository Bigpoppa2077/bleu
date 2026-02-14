"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack, Risk, Gap } from "@/lib/types";

interface RisksTabProps {
  project: Project;
  constraints: Constraint[];
}

const severityColors = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-red-100 text-red-800 border-red-300",
};

export function RisksTab({ project, constraints }: RisksTabProps) {
  const [implementation, setImplementation] = useState("");
  const [risks, setRisks] = useState<GeneratedPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePredictProblems = async () => {
    if (!implementation.trim()) {
      setError("Please describe how it will be made/published");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "risks",
          input: {
            title: project.title,
            vision: project.visionText,
            audience: project.audience,
            implementation,
            constraints: constraints.map((c) => `${c.type}: ${c.value}`),
          },
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        setError(data.error || "Failed to predict problems");
        return;
      }

      setRisks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error predicting problems");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-8">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
            How it will be made/published
          </label>
          <textarea
            value={implementation}
            onChange={(e) => setImplementation(e.target.value)}
            placeholder="Describe your approach: e.g., 'Built with Next.js, deployed on Vercel, using OpenAI API for AI features, distributed through ProductHunt'"
            rows={4}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handlePredictProblems}
            disabled={loading || !implementation.trim()}
            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? "Predicting..." : "Predict Problems"}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      {risks && (
        <div className="space-y-6">
          {/* Vision → Reality Gaps */}
          {risks.gaps && risks.gaps.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Vision → Reality Gaps
              </h3>
              <div className="space-y-3">
                {risks.gaps.map((gap, idx) => (
                  <GapCard key={idx} gap={gap} />
                ))}
              </div>
            </section>
          )}

          {/* Risks */}
          {risks.risks && risks.risks.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">Risks</h3>
              <div className="space-y-3">
                {risks.risks.map((risk, idx) => (
                  <RiskCard key={idx} risk={risk} />
                ))}
              </div>
            </section>
          )}

          {/* Early Checks (from next3Actions) */}
          {risks.next3Actions && risks.next3Actions.length > 0 && (
            <section className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900">Early Checks</h3>
              <ul className="space-y-2">
                {risks.next3Actions.map((check, idx) => (
                  <li key={idx} className="flex gap-3 text-sm text-gray-700">
                    <span className="font-bold flex-shrink-0">✓</span>
                    <span>{check}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Empty State */}
          {(!risks.gaps || risks.gaps.length === 0) &&
            (!risks.risks || risks.risks.length === 0) && (
              <p className="text-sm text-gray-500 italic text-center py-6">
                No risks identified. You might be onto something!
              </p>
            )}
        </div>
      )}
    </div>
  );
}

interface GapCardProps {
  gap: Gap;
}

function GapCard({ gap }: GapCardProps) {
  return (
    <div className="border border-gray-200 rounded-lg p-4 bg-white space-y-2">
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0">⚠️</div>
        <div className="flex-1 space-y-1">
          <p className="text-sm">
            <span className="font-medium text-gray-900">Want:</span>{" "}
            <span className="text-gray-700">{gap.want}</span>
          </p>
          <p className="text-sm">
            <span className="font-medium text-gray-900">Reality:</span>{" "}
            <span className="text-gray-700">{gap.reality}</span>
          </p>
          <p className="text-sm mt-2">
            <span className="font-medium text-gray-900">Impact:</span>{" "}
            <span className="text-gray-700">{gap.impact}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

interface RiskCardProps {
  risk: Risk;
}

function RiskCard({ risk }: RiskCardProps) {
  const severityColor = severityColors[risk.severity];

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">{risk.issue}</h4>
          <p className="text-xs text-gray-600 mt-0.5">{risk.category}</p>
        </div>
        <span
          className={`inline-block px-2.5 py-1 text-xs font-semibold rounded border ${severityColor} flex-shrink-0`}
        >
          {risk.severity.charAt(0).toUpperCase() + risk.severity.slice(1)}
        </span>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-medium text-gray-900">Mitigation:</p>
        <p className="text-sm text-gray-600">{risk.mitigation}</p>
      </div>
    </div>
  );
}
