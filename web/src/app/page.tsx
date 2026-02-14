"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack } from "@/lib/types";
import { useLocalStorageState } from "@/lib/hooks";
import { TabNavigation } from "@/components/TabNavigation";
import { VisionTab } from "@/components/VisionTab";
import { ConstraintsTab } from "@/components/ConstraintsTab";
import { PlanTab } from "@/components/PlanTab";
import { RisksTab } from "@/components/RisksTab";
import { ExportComponent } from "@/components/ExportComponent";

const DEFAULT_PROJECT: Project = {
  id: "1",
  title: "",
  visionText: "",
  audience: "",
  success: "",
  references: [],
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<"vision" | "constraints" | "plan" | "risks">(
    "vision"
  );

  const [project, setProject] = useLocalStorageState<Project>("bleu_project", DEFAULT_PROJECT);
  const [constraints, setConstraints] = useLocalStorageState<Constraint[]>(
    "bleu_constraints",
    []
  );
  const [generatedPlan, setGeneratedPlan] = useLocalStorageState<GeneratedPack | null>(
    "bleu_plan",
    null
  );
  const [generatedRisks, setGeneratedRisks] = useLocalStorageState<GeneratedPack | null>(
    "bleu_risks",
    null
  );
  const [xp, setXp] = useLocalStorageState<number>("bleu_xp", 0);

  const calculatePlanProgress = (): number | undefined => {
    if (!generatedPlan || !generatedPlan.milestones) return undefined;
    const allTasks = generatedPlan.milestones.flatMap((m) => m.tasks);
    if (allTasks.length === 0) return undefined;
    // This is a rough estimate; actual progress would need to track completed tasks
    return Math.round((generatedPlan.milestones.length / 3) * 100);
  };

  const calculateRisksProgress = (): number | undefined => {
    if (!generatedRisks || !generatedRisks.risks) return undefined;
    if (generatedRisks.risks.length === 0) return undefined;
    // Count mitigated risks (this is a simple heuristic)
    const mitigated = generatedRisks.risks.filter((r) => r.mitigation).length;
    return Math.round((mitigated / generatedRisks.risks.length) * 100);
  };

  const planProgress = calculatePlanProgress();
  const risksProgress = calculateRisksProgress();

  const renderContent = () => {
    switch (activeTab) {
      case "vision":
        return <VisionTab project={project} setProject={setProject} />;
      case "constraints":
        return <ConstraintsTab constraints={constraints} setConstraints={setConstraints} />;
      case "plan":
        return (
          <PlanTab
            project={project}
            constraints={constraints}
            xp={xp}
            setXp={setXp}
          />
        );
      case "risks":
        return <RisksTab project={project} constraints={constraints} />;
      default:
        return null;
    }
  };

  const hasOutputs = generatedPlan || generatedRisks;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {project.title || "BLEU"}
              </h1>
              <p className="text-xs text-gray-600 mt-1">Creative Project Assistant</p>
            </div>

            <div className="flex items-center gap-6">
              {/* XP Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">XP</span>
                <span className="text-2xl font-bold text-blue-600">{xp}</span>
              </div>

              {/* Progress Bar */}
              {hasOutputs && (
                <div className="w-40">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Progress</span>
                    <span className="text-xs font-semibold text-gray-700">
                      {generatedPlan ? planProgress : "—"}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${generatedPlan ? planProgress : 0}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Sidebar - Tabs */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-lg border border-gray-200 overflow-hidden">
              <TabNavigation
                activeTab={activeTab}
                onChange={setActiveTab}
                planBadge={generatedPlan ? { completionPercent: planProgress } : undefined}
                risksBadge={generatedRisks ? { completionPercent: risksProgress } : undefined}
              />
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3 space-y-8">
            {/* Tab Content */}
            <div className="bg-white rounded-lg border border-gray-200">
              {renderContent()}
            </div>

            {/* Share Section */}
            {hasOutputs && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 px-8 py-5">
                  <h2 className="text-lg font-semibold text-gray-900">Share Project Pack</h2>
                  <p className="text-xs text-gray-600 mt-1">
                    Export your complete project summary
                  </p>
                </div>
                <ExportComponent
                  project={project}
                  constraints={constraints}
                  generatedPack={generatedPlan || generatedRisks}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-gray-600">
            BLEU • Creative Project Assistant MVP
          </p>
        </div>
      </footer>
    </div>
  );
}
