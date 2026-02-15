"use client";

import { useState } from "react";
import { Project, Constraint, GeneratedPack } from "@/lib/types";
import { useLocalStorageState } from "@/lib/hooks";
import { Dashboard } from "@/components/Dashboard";
import { SetupModal } from "@/components/SetupModal";

const DEFAULT_PROJECT: Project = {
  id: "1",
  title: "",
  visionText: "",
  audience: "",
  success: "",
  references: [],
  projectType: "General",
  notes: {},
  team: [],
  changeRequests: [],
  visionAnchors: {
    pillars: { luxury: 50, craft: 50, minimal: 50, bold: 50, warm: 50 },
    keywords: [],
    nonNegotiables: [],
  },
};

export default function Home() {
  const [setupModalOpen, setSetupModalOpen] = useState(false);

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
  const [completedTasks, setCompletedTasks] = useLocalStorageState<string[]>("bleu_completedTasks", []);

  const calculatePlanProgress = (): number | undefined => {
    if (!generatedPlan || !generatedPlan.milestones) return undefined;
    const allTasks = generatedPlan.milestones.flatMap((m) => m.tasks || []);
    if (allTasks.length === 0) return undefined;

    const taskIds = new Set(allTasks.map((t) => String(t.id)));
    const completedCount = completedTasks.filter((id) => taskIds.has(String(id))).length;
    const pct = Math.round((completedCount / allTasks.length) * 100);
    return Math.min(100, Math.max(0, pct));
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-200 sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">
                {project.title || "BLEU"}
              </h1>
              <p className="text-sm text-gray-600 mt-1">Creative Project Assistant</p>
            </div>

            <button
              onClick={() => setSetupModalOpen(true)}
              className="px-6 py-3 bg-gray-100 text-gray-900 text-lg font-bold rounded-lg hover:bg-gray-200 transition-colors"
            >
              Project Setup
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <Dashboard
          project={project}
          setProject={setProject}
          constraints={constraints}
          generatedPlan={generatedPlan}
          setGeneratedPlan={setGeneratedPlan}
          generatedRisks={generatedRisks}
          setGeneratedRisks={setGeneratedRisks}
          completedTaskIds={completedTasks}
          setCompletedTaskIds={setCompletedTasks}
          onOpenSetup={() => setSetupModalOpen(true)}
        />
      </div>

      {/* Setup Modal */}
      <SetupModal
        isOpen={setupModalOpen}
        onClose={() => setSetupModalOpen(false)}
        project={project}
        setProject={setProject}
        constraints={constraints}
        setConstraints={setConstraints}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center">
          <p className="text-sm text-gray-600">
            BLEU • Creative Project Assistant MVP
          </p>
        </div>
      </footer>
    </div>
  );
}
