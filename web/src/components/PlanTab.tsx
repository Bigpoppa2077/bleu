"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack, Milestone, Task } from "@/lib/types";

interface PlanTabProps {
  project: Project;
  constraints: Constraint[];
  xp: number;
  setXp: (xp: number) => void;
}

export function PlanTab({ project, constraints, xp, setXp }: PlanTabProps) {
  const [plan, setPlan] = useState<GeneratedPack | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

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
        setError(data.error || "Failed to generate plan");
        return;
      }

      setPlan(data.data);
      setCompletedTasks(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error generating plan");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = (taskId: string, points: number) => {
    const newCompleted = new Set(completedTasks);

    if (newCompleted.has(taskId)) {
      newCompleted.delete(taskId);
      setXp(Math.max(0, xp - points));
    } else {
      newCompleted.add(taskId);
      setXp(xp + points);
    }

    setCompletedTasks(newCompleted);
  };

  const calculateProgress = () => {
    if (!plan || plan.milestones.length === 0) return 0;

    const allTasks = plan.milestones.flatMap((m) => m.tasks);
    if (allTasks.length === 0) return 0;

    const completed = allTasks.filter((t) => completedTasks.has(t.id)).length;
    return Math.round((completed / allTasks.length) * 100);
  };

  const progress = calculateProgress();

  return (
    <div className="space-y-6 p-8">
      {/* Generate Button */}
      <div className="flex gap-3 items-start">
        <button
          onClick={handleGeneratePlan}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {loading ? "Generating..." : "Generate Plan"}
        </button>

        {/* XP Display */}
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
          <span className="text-sm font-medium text-gray-900">XP:</span>
          <span className="text-lg font-bold text-blue-600">{xp}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
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
          <h3 className="text-lg font-semibold text-gray-900">Milestones</h3>

          {plan.milestones.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No milestones generated yet</p>
          ) : (
            <div className="grid gap-4">
              {plan.milestones.map((milestone, idx) => (
                <MilestoneCard
                  key={idx}
                  milestone={milestone}
                  completedTasks={completedTasks}
                  onTaskToggle={handleTaskToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Next 3 Actions */}
      {plan && plan.next3Actions.length > 0 && (
        <div className="space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-semibold text-gray-900">Next 3 Actions</h3>
          <ol className="space-y-2">
            {plan.next3Actions.map((action, idx) => (
              <li
                key={idx}
                className="flex gap-3 text-sm text-gray-700"
              >
                <span className="font-bold flex-shrink-0">{idx + 1}.</span>
                <span>{action}</span>
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
  onTaskToggle: (taskId: string, points: number) => void;
}

function MilestoneCard({
  milestone,
  completedTasks,
  onTaskToggle,
}: MilestoneCardProps) {
  const completedCount = milestone.tasks.filter((t) =>
    completedTasks.has(t.id)
  ).length;
  const totalPoints = milestone.tasks.reduce((sum, t) => sum + t.points, 0);
  const earnedPoints = milestone.tasks
    .filter((t) => completedTasks.has(t.id))
    .reduce((sum, t) => sum + t.points, 0);

  return (
    <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-white hover:shadow-md transition-shadow">
      {/* Milestone Header */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
          <p className="text-xs text-gray-600 mt-0.5">
            ⏱️ {milestone.etaHours}h estimated
          </p>
        </div>
        <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-700 rounded">
          {completedCount}/{milestone.tasks.length}
        </span>
      </div>

      {/* Points */}
      <div className="text-xs text-gray-600">
        Points: {earnedPoints}/{totalPoints}
      </div>

      {/* Tasks */}
      <div className="space-y-2">
        {milestone.tasks.map((task) => (
          <label
            key={task.id}
            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer"
          >
            <input
              type="checkbox"
              checked={completedTasks.has(task.id)}
              onChange={() => onTaskToggle(task.id, task.points)}
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
            <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">
              +{task.points}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
