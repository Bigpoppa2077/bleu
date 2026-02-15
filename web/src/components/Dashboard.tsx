"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack, Task } from "@/lib/types";
import { ExportComponent } from "@/components/ExportComponent";
import { TeamPanel } from "@/components/TeamPanel";
import { PipelineHealth } from "@/components/PipelineHealth";
import { ProgressReport } from "@/components/ProgressReport";

interface DashboardProps {
  project: Project;
  setProject: (p: Project) => void;
  constraints: Constraint[];
  generatedPlan: GeneratedPack | null;
  setGeneratedPlan: (p: GeneratedPack | null) => void;
  generatedRisks: GeneratedPack | null;
  setGeneratedRisks: (p: GeneratedPack | null) => void;
  completedTaskIds: string[];
  setCompletedTaskIds: (ids: string[]) => void;
  onOpenSetup: () => void;
}

export function Dashboard({
  project,
  setProject,
  constraints,
  generatedPlan,
  setGeneratedPlan,
  generatedRisks,
  setGeneratedRisks,
  completedTaskIds,
  setCompletedTaskIds,
  onOpenSetup,
}: DashboardProps) {
  const [planLoading, setPlanLoading] = useState(false);
  const [planError, setPlanError] = useState("");
  const [risksLoading, setRisksLoading] = useState(false);
  const [implementationText, setImplementationText] = useState("");
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);

  const completedSet = new Set((completedTaskIds || []).map(String));

  // Generate Draft Plan
  const handleGeneratePlan = async () => {
    if (!project.title || !project.visionText) {
      setPlanError("Please complete project setup first");
      return;
    }

    setPlanLoading(true);
    setPlanError("");

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
        setPlanError(data.error || "Failed to create draft plan");
        return;
      }

      setGeneratedPlan(data.data);
      setCompletedTaskIds([]);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error creating draft plan";
      setPlanError(errMsg);
    } finally {
      setPlanLoading(false);
    }
  };

  // Generate Potential Issues
  const handleSuggestIssues = async () => {
    if (!implementationText.trim()) {
      return;
    }

    setRisksLoading(true);

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
            implementation: implementationText,
            constraints: constraints.map((c) => `${c.type}: ${c.value}`),
          },
        }),
      });

      const data = await response.json();
      if (!data.ok) {
        return;
      }

      setGeneratedRisks(data.data);
    } catch (err) {
      console.error("Error suggesting issues:", err);
    } finally {
      setRisksLoading(false);
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

  const renderText = (v: any) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    if (typeof v === "number") return String(v);
    if (typeof v === "object") return JSON.stringify(v);
    return String(v);
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    if (!generatedPlan) return;

    const newPlan = {
      ...generatedPlan,
      milestones: generatedPlan.milestones.map((milestone) => ({
        ...milestone,
        tasks: milestone.tasks?.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
      })),
    };

    setGeneratedPlan(newPlan);
  };

  // Extract all tasks from milestones
  const allTasks = generatedPlan?.milestones?.flatMap((m) => m.tasks || []) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Main Column (2/3 width) */}
      <div className="lg:col-span-2 space-y-8">
        {/* Section 1: Today - Next 3 Actions */}
        <div className="bg-white rounded-lg border border-gray-200 p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Today: Next 3 Actions</h2>

          {generatedPlan?.next3Actions && generatedPlan.next3Actions.length > 0 ? (
            <ul className="space-y-4">
              {generatedPlan.next3Actions.map((action, idx) => (
                <li key={idx} className="flex gap-4 items-start">
                  <input
                    type="checkbox"
                    className="w-6 h-6 mt-1 cursor-pointer"
                  />
                  <span className="text-lg text-gray-700 flex-1">{renderText(action)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600 text-center">
                No actions yet. Create a draft plan to get started.
              </p>
            </div>
          )}
        </div>

        {/* Section 2: Pipeline - Milestones and Tasks */}
        <div className="bg-white rounded-lg border border-gray-200 p-10">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Pipeline</h2>
            <button
              onClick={handleGeneratePlan}
              disabled={planLoading || !project.title || !project.visionText}
              className="px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {planLoading ? "Creating..." : "Create Draft Plan"}
            </button>
          </div>

          {planError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {planError}
            </div>
          )}

          {generatedPlan?.milestones && generatedPlan.milestones.length > 0 ? (
            <div className="space-y-6">
              {generatedPlan.milestones.map((milestone, mIdx) => (
                <div key={mIdx} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-baseline justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {renderText(milestone.title)}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {milestone.etaHours}h
                    </span>
                  </div>

                  {milestone.tasks && milestone.tasks.length > 0 ? (
                    <ul className="space-y-3 ml-2">
                      {milestone.tasks.map((task: Task) => {
                        const owner = project.team?.find((tm) => tm.id === task.ownerId);
                        return (
                          <li key={task.id} className="flex gap-3 items-start">
                            <input
                              type="checkbox"
                              checked={completedSet.has(String(task.id))}
                              onChange={() => handleTaskToggle(String(task.id))}
                              className="w-5 h-5 mt-1 cursor-pointer"
                            />
                            <div className="flex-1">
                              <span
                                className={`text-lg ${
                                  completedSet.has(String(task.id))
                                    ? "line-through text-gray-500"
                                    : "text-gray-700"
                                }`}
                              >
                                {renderText(task.title)}
                              </span>
                              <div className="mt-2 flex gap-2 items-center">
                                {owner ? (
                                  <span className="text-sm px-2 py-1 bg-blue-50 text-blue-700 rounded">
                                    {owner.name}
                                  </span>
                                ) : (
                                  <>
                                    <span className="text-sm px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                      Unassigned
                                    </span>
                                    {project.team && project.team.length > 0 && (
                                      <button
                                        onClick={() => setAssigningTaskId(task.id)}
                                        className="text-sm px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                                      >
                                        Assign
                                      </button>
                                    )}
                                  </>
                                )}
                                {task.dueDate && (
                                  <span className="text-sm text-gray-500 ml-auto">
                                    Due: {task.dueDate}
                                  </span>
                                )}
                              </div>
                              {assigningTaskId === task.id && project.team && project.team.length > 0 && (
                                <div className="mt-3 p-3 bg-gray-50 rounded space-y-2">
                                  <p className="text-sm font-semibold text-gray-700">Assign to:</p>
                                  <div className="space-y-2">
                                    {project.team.map((member) => (
                                      <button
                                        key={member.id}
                                        onClick={() => {
                                          // Update task with owner - this would need a callback from parent
                                          setAssigningTaskId(null);
                                        }}
                                        className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-100 rounded transition-colors"
                                      >
                                        {member.name} ({member.role})
                                      </button>
                                    ))}
                                  </div>
                                  <button
                                    onClick={() => setAssigningTaskId(null)}
                                    className="text-xs text-gray-600 hover:text-gray-900"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-gray-600 italic">No tasks in this milestone</p>
                  )}
                </div>
              ))}

              {/* Progress Bar */}
              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-semibold text-gray-900">Overall Progress</span>
                  <span className="text-lg font-bold text-blue-600">
                    {allTasks.length > 0
                      ? Math.round(
                          (completedTaskIds.filter((id) =>
                            allTasks.map((t: Task) => String(t.id)).includes(String(id))
                          ).length /
                            allTasks.length) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                    style={{
                      width:
                        allTasks.length > 0
                          ? `${Math.round(
                              (completedTaskIds.filter((id) =>
                                allTasks.map((t: Task) => String(t.id)).includes(String(id))
                              ).length /
                                allTasks.length) *
                                100
                            )}`
                          : "0",
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600 text-center">
                No milestones yet. Click "Create Draft Plan" to generate a plan.
              </p>
            </div>
          )}
        </div>

        {/* Pipeline Health Section */}
        <PipelineHealth
          project={project}
          setProject={setProject}
          generatedPlan={generatedPlan}
          setGeneratedPlan={setGeneratedPlan}
          onTaskUpdate={handleTaskUpdate}
          onRegeneratePlan={handleGeneratePlan}
        />

        {/* Section 3: Potential Issues */}
        <div className="bg-white rounded-lg border border-gray-200 p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Potential Issues</h2>

          <div className="space-y-6 mb-8">
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">
                How it will be made/published
              </label>
              <textarea
                value={implementationText}
                onChange={(e) => setImplementationText(e.target.value)}
                placeholder="Describe your approach: e.g., 'Built with Next.js, deployed on Vercel, using external services...'"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg resize-none"
              />
            </div>

            <button
              onClick={handleSuggestIssues}
              disabled={risksLoading || !implementationText.trim()}
              className="px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {risksLoading ? "Analyzing..." : "Analyze for Issues"}
            </button>
          </div>

          {generatedRisks?.risks && generatedRisks.risks.length > 0 ? (
            <div className="space-y-4">
              {generatedRisks.risks.map((risk, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-6">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {renderText(risk.issue)}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        risk.severity === "high"
                          ? "bg-red-100 text-red-800"
                          : risk.severity === "medium"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-green-100 text-green-800"
                      }`}
                    >
                      {risk.severity}
                    </span>
                  </div>

                  <p className="text-gray-600 mb-3">
                    <span className="font-semibold">Category:</span> {risk.category}
                  </p>

                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">Why it matters:</p>
                    <p className="text-gray-700">
                      {risk.issue} ({risk.severity} severity)
                    </p>
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-semibold text-gray-900 mb-2">What to do next:</p>
                    <p className="text-gray-700">{risk.mitigation}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg">
              <p className="text-lg text-gray-600 text-center">
                {implementationText.trim()
                  ? "Analyze your implementation to identify potential issues."
                  : "Describe how your project will be made to identify potential issues."}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar (1/3 width) */}
      <div className="lg:col-span-1 space-y-6">
        {/* Vision Integrity Meter */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 sticky top-32">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vision Integrity</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Project Setup</span>
                <span className="text-sm font-bold text-gray-900">
                  {project.title && project.visionText && project.audience ? "100" : "0"}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: project.title && project.visionText && project.audience ? "100" : "0",
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Constraints</span>
                <span className="text-sm font-bold text-gray-900">
                  {constraints.length > 0 ? "100" : "0"}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all"
                  style={{ width: constraints.length > 0 ? "100" : "0" }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">Plan</span>
                <span className="text-sm font-bold text-gray-900">
                  {generatedPlan ? "100" : "0"}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all"
                  style={{ width: generatedPlan ? "100" : "0" }}
                />
              </div>
            </div>

            <button
              onClick={onOpenSetup}
              className="w-full mt-4 px-4 py-3 bg-gray-100 text-gray-900 text-lg font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Project Setup
            </button>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Team</h3>
            {project.team && project.team.length > 0 && (
              <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {project.team.length}
              </span>
            )}
          </div>
          {project.team && project.team.length > 0 ? (
            <div className="space-y-3">
              {project.team.map((member) => (
                <div key={member.id} className="p-3 border border-gray-200 rounded-lg">
                  <p className="font-semibold text-gray-900">{member.name}</p>
                  <p className="text-xs text-gray-600">{member.role}</p>
                  <p className="text-xs text-gray-500">{member.availability}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-sm">No team members yet. Add them in Project Setup.</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Changes Feed</h3>
          <div className="space-y-3 text-sm">
            {project.title && (
              <div className="p-3 bg-blue-50 rounded text-gray-700">
                <p className="font-semibold">Project created</p>
                <p className="text-xs text-gray-600">{project.title}</p>
              </div>
            )}
            {project.team && project.team.length > 0 && (
              <div className="p-3 bg-indigo-50 rounded text-gray-700">
                <p className="font-semibold">{project.team.length} team member(s) added</p>
              </div>
            )}
            {constraints.length > 0 && (
              <div className="p-3 bg-green-50 rounded text-gray-700">
                <p className="font-semibold">{constraints.length} constraint(s) added</p>
              </div>
            )}
            {generatedPlan && (
              <div className="p-3 bg-purple-50 rounded text-gray-700">
                <p className="font-semibold">Draft plan created</p>
              </div>
            )}
            {generatedRisks && (
              <div className="p-3 bg-red-50 rounded text-gray-700">
                <p className="font-semibold">Issues analyzed</p>
              </div>
            )}
            {completedTaskIds.length > 0 && (
              <div className="p-3 bg-yellow-50 rounded text-gray-700">
                <p className="font-semibold">{completedTaskIds.length} task(s) completed</p>
              </div>
            )}
            {!project.title && (
              <div className="p-3 bg-gray-50 rounded text-gray-600 text-center">
                <p>No activity yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Share Pack Button */}
        {(generatedPlan || generatedRisks) && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share Pack</h3>
            <ExportComponent
              project={project}
              constraints={constraints}
              generatedPack={generatedPlan || generatedRisks}
            />
          </div>
        )}

        {/* Progress Report */}
        <ProgressReport
          project={project}
          constraints={constraints}
          generatedPlan={generatedPlan}
          completedTaskIds={completedTaskIds}
          generatedRisks={generatedRisks}
        />
      </div>

      {/* Team Management Section - Full Width */}
      {project.team && project.team.length > 0 && (
        <div className="lg:col-span-3 mt-8 border-t border-gray-200 pt-8">
          <TeamPanel
            project={project}
            setProject={setProject}
            generatedPlan={generatedPlan}
            onTaskUpdate={handleTaskUpdate}
          />
        </div>
      )}
    </div>
  );
}
