"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack } from "@/lib/types";

interface ExportComponentProps {
  project: Project;
  constraints: Constraint[];
  generatedPack: GeneratedPack | null;
}

export function ExportComponent({
  project,
  constraints,
  generatedPack,
}: ExportComponentProps) {
  const [copied, setCopied] = useState(false);

  const generateProjectPack = (): string => {
    if (!generatedPack) return "";

    const lines: string[] = [];

    // Header
    lines.push(`PROJECT PACK: ${project.title}`);
    lines.push(`Generated: ${new Date().toLocaleDateString()}`);
    lines.push("=".repeat(60));
    lines.push("");

    // Brief
    if (generatedPack.brief) {
      lines.push("BRIEF");
      lines.push("-".repeat(40));
      lines.push(generatedPack.brief);
      lines.push("");
    }

    // North Star
    if (generatedPack.northStar) {
      lines.push("NORTH STAR");
      lines.push("-".repeat(40));
      lines.push(generatedPack.northStar);
      lines.push("");
    }

    // Project Details
    lines.push("PROJECT DETAILS");
    lines.push("-".repeat(40));
    lines.push(`Title: ${project.title}`);
    lines.push(`Audience: ${project.audience}`);
    lines.push(`Vision: ${project.visionText}`);
    lines.push(`Success Metrics: ${project.success}`);
    if (project.references.length > 0) {
      lines.push(`References: ${project.references.join(", ")}`);
    }
    lines.push("");

    // Constraints
    if (constraints.length > 0) {
      lines.push("CONSTRAINTS");
      lines.push("-".repeat(40));
      constraints.forEach((c) => {
        lines.push(`• ${c.type}: ${c.value}`);
      });
      lines.push("");
    }

    // Milestones
    if (generatedPack.milestones && generatedPack.milestones.length > 0) {
      lines.push("MILESTONES");
      lines.push("-".repeat(40));
      generatedPack.milestones.forEach((milestone, idx) => {
        lines.push(
          `${idx + 1}. ${milestone.title} (${milestone.etaHours}h estimated)`
        );
        milestone.tasks.forEach((task) => {
          lines.push(`   ☐ ${task.title} [${task.points}pts]`);
        });
        lines.push("");
      });
    }

    // Risks
    if (generatedPack.risks && generatedPack.risks.length > 0) {
      lines.push("RISKS & MITIGATIONS");
      lines.push("-".repeat(40));
      generatedPack.risks.forEach((risk) => {
        lines.push(
          `• [${risk.severity.toUpperCase()}] ${risk.issue} (${risk.category})`
        );
        lines.push(`  Mitigation: ${risk.mitigation}`);
      });
      lines.push("");
    }

    // Gaps
    if (generatedPack.gaps && generatedPack.gaps.length > 0) {
      lines.push("VISION → REALITY GAPS");
      lines.push("-".repeat(40));
      generatedPack.gaps.forEach((gap) => {
        lines.push(`• Want: ${gap.want}`);
        lines.push(`  Reality: ${gap.reality}`);
        lines.push(`  Impact: ${gap.impact}`);
        lines.push("");
      });
    }

    // Next Actions
    if (generatedPack.next3Actions && generatedPack.next3Actions.length > 0) {
      lines.push("NEXT 3 ACTIONS");
      lines.push("-".repeat(40));
      generatedPack.next3Actions.forEach((action, idx) => {
        lines.push(`${idx + 1}. ${action}`);
      });
      lines.push("");
    }

    lines.push("=".repeat(60));

    return lines.join("\n");
  };

  const projectPack = generateProjectPack();

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(projectPack);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  if (!generatedPack) {
    return (
      <div className="max-w-4xl p-6 text-center">
        <p className="text-gray-500 italic">
          Generate a plan and predict problems to create a project pack
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Export Summary</h3>
        <button
          onClick={handleCopyToClipboard}
          className={`px-4 py-2 font-medium rounded-lg transition-all ${
            copied
              ? "bg-green-100 text-green-700"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {copied ? "✓ Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      <textarea
        value={projectPack}
        readOnly
        rows={24}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 font-mono text-xs text-gray-700 focus:outline-none resize-none"
      />

      <p className="text-xs text-gray-600">
        Read-only project summary. Use the copy button to share or export.
      </p>
    </div>
  );
}
