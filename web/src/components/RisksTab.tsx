"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack, Risk } from "@/lib/types";

interface RisksTabProps {
  project: Project;
  constraints: Constraint[];
  generatedRisks: GeneratedPack | null;
  setGeneratedRisks: (p: GeneratedPack | null) => void;
}

const severityColors = {
  low: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  high: "bg-red-100 text-red-800 border-red-300",
};

export function RisksTab({ project, constraints, generatedRisks, setGeneratedRisks }: RisksTabProps) {
  const [implementation, setImplementation] = useState("");
  const [risks, setRisks] = useState<GeneratedPack | null>(generatedRisks);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuggestIssues = async () => {
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
        setError(data.error || "Failed to suggest potential issues");
        return;
      }

      setRisks(data.data);
      setGeneratedRisks(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error suggesting potential issues");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 p-10">
      {/* Input Section */}
      <div className="space-y-4">
        <div>
          <label className="block text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
            How it will be made/published
          </label>
          <textarea
            value={implementation}
            onChange={(e) => setImplementation(e.target.value)}
            placeholder="Describe your approach: e.g., 'Built with Next.js, deployed on Vercel, using external services for draft features, distributed through ProductHunt'"
            rows={4}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 resize-none text-lg"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSuggestIssues}
            disabled={loading || !implementation.trim()}
            className="px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? "Analyzing..." : "Potential Issues"}
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
          {/* Risks */}
          {risks.risks && risks.risks.length > 0 && (
            <section className="space-y-4">
              <h3 className="text-2xl font-bold text-gray-900">Potential Issues</h3>
              <div className="space-y-4">
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
              <p className="text-lg text-gray-600 italic text-center py-8">
                No issues detected yet—add constraints or delivery method to refine.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// Gaps intentionally removed from UI

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

      <div className="space-y-2">
        <div>
          <p className="text-xs font-medium text-gray-900">Why it matters</p>
          <p className="text-sm text-gray-600">{`${risk.issue}. This is a ${risk.severity} ${risk.category.toLowerCase()} risk that can impact delivery or outcomes.`}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-900">What to do next</p>
          <p className="text-sm text-gray-600">{risk.mitigation || "Define specific mitigations and next steps."}</p>
        </div>
      </div>
    </div>
  );
}
