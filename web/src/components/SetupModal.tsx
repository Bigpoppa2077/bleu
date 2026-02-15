"use client";

import { useState } from "react";
import { Project, Constraint, TeamMember } from "@/lib/types";
import { VisionTab } from "@/components/VisionTab";
import { ConstraintsTab } from "@/components/ConstraintsTab";
import { VisionAnchorsStep } from "@/components/VisionAnchorsStep";

interface SetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  setProject: (p: Project) => void;
  constraints: Constraint[];
  setConstraints: (c: Constraint[]) => void;
}

export function SetupModal({
  isOpen,
  onClose,
  project,
  setProject,
  constraints,
  setConstraints,
}: SetupModalProps) {
  const [setupStep, setSetupStep] = useState<"vision" | "constraints" | "anchors" | "team">(
    "vision"
  );
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [newMemberAvailability, setNewMemberAvailability] = useState("Full-time");

  const suggestedByType: Record<string, string[]> = {
    "Brand/Design": ["Brand rules", "Timeline", "Tools", "Budget"],
    "Video/Content": ["Format", "Length", "Platform", "Budget"],
    "Product/Physical": ["Materials", "Manufacturing", "Budget", "Timeline"],
    "Music/Audio": ["Reference tracks", "Duration", "Distribution", "Budget"],
    "Writing": ["Word count", "Style guide", "Deadline", "Budget"],
    "Space/Architecture": ["Site constraints", "Regulations", "Budget", "Timeline"],
    "General": ["Budget", "Timeline", "Tools", "Platform"],
  };

  const suggested = suggestedByType[project.projectType || "General"] || suggestedByType["General"];

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) return;

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole,
      availability: newMemberAvailability,
    };

    setProject({
      ...project,
      team: [...(project.team || []), newMember],
    });

    setNewMemberName("");
    setNewMemberRole("");
    setNewMemberAvailability("Full-time");
  };

  const handleRemoveMember = (memberId: string) => {
    setProject({
      ...project,
      team: (project.team || []).filter((m) => m.id !== memberId),
    });
  };

  if (!isOpen) return null;

  const stepLabels = {
    vision: "Define your project vision",
    constraints: "Organize your constraints",
    anchors: "Set your vision anchors",
    team: "Build your team",
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Project Setup</h2>
            <p className="text-sm text-gray-600 mt-1">
              {stepLabels[setupStep]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {setupStep === "vision" ? (
            <div className="space-y-6">
              <VisionTab project={project} setProject={setProject} />
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setSetupStep("constraints")}
                  disabled={!project.title || !project.visionText}
                  className="px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                >
                  Next: Constraints
                </button>
              </div>
            </div>
          ) : setupStep === "constraints" ? (
            <div className="space-y-6">
              <ConstraintsTab
                constraints={constraints}
                setConstraints={setConstraints}
                suggestedTypes={suggested}
              />
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSetupStep("vision")}
                  className="px-6 py-3 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setSetupStep("anchors")}
                  className="px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Vision Anchors
                </button>
              </div>
            </div>
          ) : setupStep === "anchors" ? (
            <div className="space-y-6">
              <VisionAnchorsStep project={project} setProject={setProject} />
              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSetupStep("constraints")}
                  className="px-6 py-3 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={() => setSetupStep("team")}
                  className="px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Next: Team
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Team Members List */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Team Members</h3>
                {project.team && project.team.length > 0 ? (
                  <div className="space-y-3 mb-6">
                    {project.team.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                      >
                        <div>
                          <p className="font-semibold text-gray-900">{member.name}</p>
                          <p className="text-sm text-gray-600">
                            {member.role} • {member.availability}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="text-red-600 hover:text-red-800 font-semibold"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600 mb-6">No team members yet.</p>
                )}
              </div>

              {/* Add Member Form */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Add Team Member</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      placeholder="e.g., Sarah"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={newMemberRole}
                      onChange={(e) => setNewMemberRole(e.target.value)}
                      placeholder="e.g., Designer, Developer"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-lg font-bold text-gray-900 mb-2">
                      Availability
                    </label>
                    <select
                      value={newMemberAvailability}
                      onChange={(e) => setNewMemberAvailability(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
                    >
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contractor</option>
                      <option>As needed</option>
                    </select>
                  </div>

                  <button
                    onClick={handleAddMember}
                    disabled={!newMemberName.trim() || !newMemberRole.trim()}
                    className="w-full px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                  >
                    Add Member
                  </button>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSetupStep("anchors")}
                  className="px-6 py-3 text-gray-700 text-lg font-bold rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
