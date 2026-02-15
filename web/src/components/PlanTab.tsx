"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack, Milestone, Task } from "@/lib/types";

interface PlanTabProps {
  project: Project;
  constraints: Constraint[];
  generatedPlan: GeneratedPack | null;
  setGeneratedPlan: (p: GeneratedPack | null) => void;
  completedTaskIds: string[];
  setCompletedTaskIds: (ids: string[]) => void;
}
export function PlanTab({ project, constraints, generatedPlan, setGeneratedPlan, completedTaskIds, setCompletedTaskIds }: PlanTabProps) {
  const [plan, setPlan] = useState<GeneratedPack | null>(generatedPlan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // completed tasks are stored in parent/localStorage as an array of ids
  // convert to Set for quick checks
  const completedSet = new Set((completedTaskIds || []).map(String));

  const handleGeneratePlan = async () => {
    if (!project.title || !project.visionText) {
      setError("Please fill in project title and vision first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "plan",
          input: {
            title: project.title,
            vision: project.visionText,
            audience: project.audience,
            constraints: constraints.map((c) => `${c.type}: ${c.value}`),
          },
        }),
      });

      const data = await response.json();

        if (!data.ok) {
          setError(data.error || "Failed to create draft plan");
        console.error("[PlanTab] API error:", data.error);
        return;
      }

      console.log("[PlanTab] Plan generated successfully:", data.data);
      console.log("[PlanTab] Plan structure:", {
        hasMilestones: !!data.data.milestones,
        milestonesLength: data.data.milestones?.length,
        milestones: data.data.milestones,
      });
      setPlan(data.data);
      setGeneratedPlan(data.data);
      setCompletedTaskIds([]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error creating draft plan";
      console.error("[PlanTab] Fetch error:", errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string) => {
    const newCompleted = new Set(completedSet);

    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
    } else {
      newCompleted.add(taskId);
    }

    setCompletedTaskIds(Array.from(newCompleted));
  };

  const calculateProgress = () => {
    try {
      // Safe guards for unexpected plan shape
      const milestones = Array.isArray(plan?.milestones) ? plan.milestones : [];
      if (milestones.length === 0) return 0;

      // Flatten all tasks with safety checks
      const allTasks = milestones
        .flatMap((m) => {
          if (!m || typeof m !== "object") return [];
          return Array.isArray(m.tasks) ? m.tasks : [];
        })
        .filter((t) => t && typeof t === "object");

      if (allTasks.length === 0) return 0;

      const completed = allTasks.filter((t: any) => {
        const taskId = String(t?.id ?? "");
        return completedSet.has(taskId);
      }).length;

      return Math.round((completed / allTasks.length) * 100);
    } catch (err) {
      console.error("[calculateProgress] Error:", err);
      return 0;
    }
  };

  const progress = calculateProgress();

  const renderText = (v: any) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "object") {
      if (typeof v.action === "string") return v.action;
      if (typeof v.name === "string") return v.name;
      if (typeof v.title === "string") return v.title;
      return JSON.stringify(v);
    }
    return String(v);
  };

  return (
    <div className="space-y-8 p-10">
      {/* Generate Button */}
      <div className="flex gap-3 items-start">
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Creating..." : "Create Draft Plan"}
        </button>

        {/* XP/gamification removed */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!plan && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 bg-blue-50 text-center space-y-3">
          <p className="text-lg font-semibold text-gray-800">No plan yet.</p>
          <p className="text-gray-600">Click <span className="font-semibold">Create Draft Plan</span> to generate a project roadmap.</p>
        </div>
      )}

      {/* Progress Bar */}
      {plan && (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-900">Overall Progress</h3>
            <span className="text-sm font-semibold text-gray-700">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Milestones */}
      {plan && (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-900">Milestones</h3>

          {(() => {
            const milestones = Array.isArray(plan.milestones) ? plan.milestones : [];
            return milestones.length === 0 ? (
              <p className="text-lg text-gray-600 italic">No milestones in draft yet</p>
            ) : (
              <div className="grid gap-4">
                {milestones.map((milestone, idx) => (
                  <MilestoneCard
                    key={idx}
                    milestone={milestone}
                    completedTasks={completedSet}
                    onTaskToggle={handleTaskToggle}
                  />
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Next 3 Actions */}
      {plan && plan.next3Actions?.length > 0 && (
        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900">Next 3 Actions</h3>
          <ol className="space-y-2">
            {plan.next3Actions.map((action, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-sm text-gray-700"
              >
                <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                <span>{renderText(action)}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  completedTasks: Set<string>;
  onTaskToggle: (taskId: string) => void;
}

function MilestoneCard({
  milestone,
  completedTasks,
  onTaskToggle,
}: MilestoneCardProps) {
  const safeId = (v: any) => String(v ?? "");
  const renderText = (v: any) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "object") {
      if (typeof v.name === "string") return v.name;
      if (typeof v.title === "string") return v.title;
      return JSON.stringify(v);
    }
    return String(v);
  };

  // Safe guard: treat tasks as empty array if undefined or not an array
  const tasks = Array.isArray(milestone?.tasks) ? milestone.tasks : [];
  
  const tasksWithSafe = tasks
    .filter((t) => t && typeof t === "object")
    .map((t: any) => ({
      id: safeId(t?.id),
      title: renderText(t?.title),
      raw: t,
    }));

  const completedCount = tasksWithSafe.filter((t) => completedTasks.has(t.id)).length;

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow">
      {/* Milestone Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900">{renderText(milestone?.title)}</h4>
          <p className="text-xs text-gray-600 mt-0.5">
            ⏱️ {milestone?.etaHours || 0}h estimated
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded">
          {completedCount}/{tasksWithSafe.length}
        </span>
      </div>

      {/* Points */}
      {/* Points/gamification removed */}

      {/* Tasks */}
      <div className="space-y-2">
        {tasksWithSafe.map((task) => (
          <label
            key={task.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={completedTasks.has(task.id)}
              onChange={() => onTaskToggle(task.id)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-600"
            />
            <div className="flex-1 min-w-0">
              <span
                className={`text-sm ${
                  completedTasks.has(task.id)
                    ? "line-through text-gray-500"
                    : "text-gray-700"
                }`}
              >
                {task.title}
              </span>
            </div>
            {/* points removed */}
          </label>
        ))}
      </div>
    </div>
  );
}
