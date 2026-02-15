"use client";

import { useState } from "react";
import { Project, GeneratedPack, ChangeRequest, Task } from "@/lib/types";
import {
  getPipelineIssues,
  calculateHealthScore,
  getHealthStatus,
  PipelineIssue,
} from "@/lib/pipelineHealth";

interface PipelineHealthProps {
  project: Project;
  setProject: (p: Project) => void;
  generatedPlan: GeneratedPack | null;
  setGeneratedPlan: (p: GeneratedPack | null) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onRegeneratePlan?: () => void;
}

export function PipelineHealth({
  project,
  setProject,
  generatedPlan,
  setGeneratedPlan,
  onTaskUpdate,
  onRegeneratePlan,
}: PipelineHealthProps) {
  const [dismissedIssues, setDismissedIssues] = useState<Set<string>>(new Set());

  const changeRequests = project.changeRequests || [];
  const issues = getPipelineIssues(generatedPlan, changeRequests);
  const activeIssues = issues.filter((i) => !dismissedIssues.has(i.id));
  const healthScore = calculateHealthScore(activeIssues);
  const healthStatus = getHealthStatus(healthScore);

  const severityColor = {
    high: "bg-red-100 border-red-300 text-red-900",
    medium: "bg-yellow-100 border-yellow-300 text-yellow-900",
    low: "bg-blue-100 border-blue-300 text-blue-900",
  };

  const severityBadgeColor = {
    high: "bg-red-200 text-red-800",
    medium: "bg-yellow-200 text-yellow-800",
    low: "bg-blue-200 text-blue-800",
  };

  const handleFixUnassigned = (issue: PipelineIssue) => {
    if (!issue.taskId || !project.team || project.team.length === 0) return;

    // Assign to first team member
    const firstMember = project.team[0];
    if (onTaskUpdate) {
      onTaskUpdate(issue.taskId, { ownerId: firstMember.id });
    }
    setDismissedIssues((prev) => new Set([...prev, issue.id]));
  };

  const handleFixOverdue = (issue: PipelineIssue) => {
    if (!issue.taskId) return;

    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split("T")[0];

    if (onTaskUpdate) {
      onTaskUpdate(issue.taskId, { dueDate: dateStr });
    }
    setDismissedIssues((prev) => new Set([...prev, issue.id]));
  };

  const handleApplyChange = (issue: PipelineIssue) => {
    if (!issue.changeId) return;

    const updatedChanges = changeRequests.map((c) =>
      c.id === issue.changeId ? { ...c, appliedToPipeline: true } : c
    );

    setProject({
      ...project,
      changeRequests: updatedChanges,
    });

    setDismissedIssues((prev) => new Set([...prev, issue.id]));
  };

  const handleRegenerateTasks = (issue: PipelineIssue) => {
    if (onRegeneratePlan) {
      onRegeneratePlan();
    }
    setDismissedIssues((prev) => new Set([...prev, issue.id]));
  };

  const handleDismiss = (issue: PipelineIssue) => {
    setDismissedIssues((prev) => new Set([...prev, issue.id]));
  };

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Pipeline Health</h2>

        {/* Health Score */}
        <div className="flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-gray-900">Overall Health</span>
              <span
                className={`text-2xl font-bold px-4 py-2 rounded-lg ${
                  healthStatus === "healthy"
                    ? "bg-green-100 text-green-800"
                    : healthStatus === "warning"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {healthScore}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  healthStatus === "healthy"
                    ? "bg-green-600"
                    : healthStatus === "warning"
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }`}
                style={{ width: `${healthScore}%` }}
              />
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-gray-600 mb-1">Issues Found</p>
            <p className="text-3xl font-bold text-gray-900">{activeIssues.length}</p>
          </div>
        </div>
      </div>

      {/* Issues List */}
      {activeIssues.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Issues to Fix</h3>

          {activeIssues.map((issue) => (
            <div
              key={issue.id}
              className={`p-6 rounded-lg border-2 ${severityColor[issue.severity]} space-y-4`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-bold">{issue.title}</h4>
                    <span
                      className={`text-sm font-bold px-3 py-1 rounded-full ${
                        severityBadgeColor[issue.severity]
                      }`}
                    >
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-lg">{issue.description}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-current border-opacity-20">
                {issue.type === "unassigned_task" && (
                  <>
                    <button
                      onClick={() => handleFixUnassigned(issue)}
                      disabled={!project.team || project.team.length === 0}
                      className="px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      Assign to First Member
                    </button>
                    <button
                      onClick={() => handleDismiss(issue)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {issue.type === "overdue_task" && (
                  <>
                    <button
                      onClick={() => handleFixOverdue(issue)}
                      className="px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Extend Due Date
                    </button>
                    <button
                      onClick={() => handleDismiss(issue)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {issue.type === "unapplied_change" && (
                  <>
                    <button
                      onClick={() => handleApplyChange(issue)}
                      className="px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                      Mark as Applied
                    </button>
                    <button
                      onClick={() => handleDismiss(issue)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}

                {issue.type === "empty_milestone" && (
                  <>
                    <button
                      onClick={() => handleRegenerateTasks(issue)}
                      disabled={!onRegeneratePlan}
                      className="px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                    >
                      Regenerate Draft
                    </button>
                    <button
                      onClick={() => handleDismiss(issue)}
                      className="px-6 py-3 bg-gray-300 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* All Issues Resolved */}
      {activeIssues.length === 0 && issues.length > 0 && (
        <div className="p-6 bg-green-50 rounded-lg text-center">
          <p className="text-lg font-bold text-green-800">✓ All issues dismissed or resolved!</p>
        </div>
      )}
    </div>
  );
}
