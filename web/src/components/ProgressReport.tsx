"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack, Milestone, Task } from "@/lib/types";
import { getPipelineIssues, calculateHealthScore } from "@/lib/pipelineHealth";

interface ProgressReportProps {
  project: Project;
  constraints: Constraint[];
  generatedPlan: GeneratedPack | null;
  completedTaskIds: string[];
  generatedRisks: GeneratedPack | null;
}

export function ProgressReport({
  project,
  constraints,
  generatedPlan,
  completedTaskIds,
  generatedRisks,
}: ProgressReportProps) {
  const [showReport, setShowReport] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateReport = (): string => {
    const lines: string[] = [];
    const now = new Date().toLocaleDateString();

    // Header
    lines.push(`PROGRESS REPORT: ${project.title || "Untitled Project"}`);
    lines.push(`Generated: ${now}`);
    lines.push("=".repeat(60));
    lines.push("");

    // SUMMARY
    lines.push("SUMMARY");
    lines.push("-".repeat(60));
    if (project.visionText) {
      lines.push(`Vision: ${project.visionText}`);
    }
    if (project.audience) {
      lines.push(`Audience: ${project.audience}`);
    }
    if (project.success) {
      lines.push(`Success Criteria: ${project.success}`);
    }
    lines.push("");

    // Project Stats
    const allTasks = generatedPlan?.milestones?.flatMap((m) => m.tasks || []) || [];
    const completedCount = completedTaskIds.length;
    const totalTasks = allTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

    lines.push("PROJECT STATUS");
    lines.push(`  Overall Progress: ${progressPercent}% (${completedCount}/${totalTasks} tasks)`);
    if (project.team) {
      lines.push(`  Team Size: ${project.team.length} members`);
    }
    if (constraints.length > 0) {
      lines.push(`  Constraints: ${constraints.length}`);
    }
    lines.push("");

    // COMPLETED
    if (completedCount > 0) {
      lines.push("COMPLETED");
      lines.push("-".repeat(60));

      generatedPlan?.milestones?.forEach((milestone) => {
        const completedInMilestone = milestone.tasks?.filter((t) =>
          completedTaskIds.includes(String(t.id))
        ) || [];

        if (completedInMilestone.length > 0) {
          lines.push(`\n${milestone.title}:`);
          completedInMilestone.forEach((task) => {
            const owner = project.team?.find((m) => m.id === task.ownerId);
            const ownerText = owner ? ` (${owner.name})` : "";
            lines.push(`  ✓ ${task.title}${ownerText}`);
          });
        }
      });
      lines.push("");
    }

    // NEXT (In Progress / Todo)
    const incompleteTasks = allTasks.filter((t) => !completedTaskIds.includes(String(t.id)));
    if (incompleteTasks.length > 0) {
      lines.push("NEXT");
      lines.push("-".repeat(60));

      const nextActions = generatedPlan?.next3Actions || [];
      if (nextActions.length > 0) {
        lines.push("Immediate Next Steps:");
        nextActions.slice(0, 3).forEach((action) => {
          lines.push(`  • ${action}`);
        });
        lines.push("");
      }

      lines.push("Upcoming Tasks:");
      let taskCount = 0;
      generatedPlan?.milestones?.forEach((milestone) => {
        const upcomingInMilestone = milestone.tasks?.filter(
          (t) => !completedTaskIds.includes(String(t.id))
        ) || [];

        if (upcomingInMilestone.length > 0 && taskCount < 10) {
          lines.push(`\n${milestone.title} (${milestone.etaHours}h):`);
          upcomingInMilestone.forEach((task) => {
            if (taskCount < 10) {
              const owner = project.team?.find((m) => m.id === task.ownerId);
              const ownerText = owner ? ` [${owner.name}]` : " [Unassigned]";
              const dueText = task.dueDate ? ` Due: ${task.dueDate}` : "";
              lines.push(`  - ${task.title}${ownerText}${dueText}`);
              taskCount++;
            }
          });
        }
      });
      lines.push("");
    }

    // BLOCKERS & HEALTH
    const changeRequests = project.changeRequests || [];
    const issues = getPipelineIssues(generatedPlan, changeRequests);
    const healthScore = calculateHealthScore(issues);

    if (issues.length > 0 || healthScore < 80) {
      lines.push("BLOCKERS & CONCERNS");
      lines.push("-".repeat(60));
      lines.push(`Pipeline Health: ${healthScore}%`);

      const highSeverity = issues.filter((i) => i.severity === "high");
      if (highSeverity.length > 0) {
        lines.push("\nCritical Issues:");
        highSeverity.forEach((issue) => {
          lines.push(`  ⚠ ${issue.title}: ${issue.description}`);
        });
      }

      const mediumSeverity = issues.filter((i) => i.severity === "medium");
      if (mediumSeverity.length > 0) {
        lines.push("\nWarnings:");
        mediumSeverity.forEach((issue) => {
          lines.push(`  ! ${issue.title}: ${issue.description}`);
        });
      }

      lines.push("");
    }

    // RISKS
    if (generatedRisks?.risks && generatedRisks.risks.length > 0) {
      lines.push("RISKS & MITIGATION");
      lines.push("-".repeat(60));

      generatedRisks.risks.forEach((risk) => {
        lines.push(`\n${risk.issue} [${risk.severity}]`);
        lines.push(`  Category: ${risk.category}`);
        lines.push(`  Mitigation: ${risk.mitigation}`);
      });
      lines.push("");
    }

    // CHANGES
    const unappliedChanges = changeRequests.filter((c) => !c.appliedToPipeline);
    if (changeRequests.length > 0) {
      lines.push("CHANGE REQUESTS");
      lines.push("-".repeat(60));

      if (unappliedChanges.length > 0) {
        lines.push(`Pending (${unappliedChanges.length}):`);
        unappliedChanges.forEach((change) => {
          lines.push(`  [ ] ${change.title}`);
          if (change.description) {
            lines.push(`      ${change.description}`);
          }
        });
        lines.push("");
      }

      const appliedChanges = changeRequests.filter((c) => c.appliedToPipeline);
      if (appliedChanges.length > 0) {
        lines.push(`Applied (${appliedChanges.length}):`);
        appliedChanges.forEach((change) => {
          lines.push(`  [✓] ${change.title}`);
        });
        lines.push("");
      }
    }

    // VISION INTEGRITY
    lines.push("VISION INTEGRITY");
    lines.push("-".repeat(60));

    const setupComplete = project.title && project.visionText && project.audience;
    lines.push(`Project Setup: ${setupComplete ? "✓ Complete" : "⚠ Incomplete"}`);
    lines.push(`Constraints Defined: ${constraints.length > 0 ? "✓ Yes" : "⚠ No"}`);
    lines.push(`Draft Plan Created: ${generatedPlan ? "✓ Yes" : "⚠ No"}`);
    lines.push(`Team Assigned: ${project.team && project.team.length > 0 ? "✓ Yes" : "⚠ No"}`);
    lines.push(`Issues Identified: ${generatedRisks?.risks ? `✓ ${generatedRisks.risks.length}` : "⚠ No"}`);
    lines.push("");

    // Footer
    lines.push("=".repeat(60));
    lines.push("End of Report");

    return lines.join("\n");
  };

  const handleCopyReport = async () => {
    const report = generateReport();
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy report:", err);
    }
  };

  if (!generatedPlan) return null;

  const report = generateReport();

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowReport(!showReport)}
        className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors"
      >
        {showReport ? "Hide" : "View"} Progress Report
      </button>

      {showReport && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Progress Report</h3>
            <button
              onClick={handleCopyReport}
              className="px-4 py-2 bg-gray-200 text-gray-900 text-lg font-bold rounded-lg hover:bg-gray-300 transition-colors"
            >
              {copied ? "✓ Copied!" : "Copy Report"}
            </button>
          </div>

          <pre className="bg-gray-50 p-6 rounded border border-gray-200 text-sm overflow-x-auto whitespace-pre-wrap break-words text-gray-700 leading-relaxed font-mono">
            {report}
          </pre>
        </div>
      )}
    </div>
  );
}
