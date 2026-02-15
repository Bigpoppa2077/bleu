"use client";

import { useState } from "react";
import { Project, TeamMember, Task, Milestone } from "@/lib/types";

interface TeamPanelProps {
  project: Project;
  setProject: (p: Project) => void;
  generatedPlan: { milestones: Milestone[] } | null;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
}

export function TeamPanel({
  project,
  setProject,
  generatedPlan,
  onTaskUpdate,
}: TeamPanelProps) {
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("");
  const [assigningTaskId, setAssigningTaskId] = useState<string | null>(null);
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [assignmentMemberId, setAssignmentMemberId] = useState("");

  const team = project.team || [];

  const handleAddMember = () => {
    if (!newMemberName.trim() || !newMemberRole.trim()) return;

    const newMember: TeamMember = {
      id: `member-${Date.now()}`,
      name: newMemberName,
      role: newMemberRole,
      availability: "Full-time",
    };

    setProject({
      ...project,
      team: [...team, newMember],
    });

    setNewMemberName("");
    setNewMemberRole("");
  };

  const handleRemoveMember = (memberId: string) => {
    setProject({
      ...project,
      team: team.filter((m) => m.id !== memberId),
    });
  };

  const handleAssignTask = () => {
    if (!assigningTaskId || !assignmentMemberId) return;

    const updates: Partial<Task> = {
      ownerId: assignmentMemberId,
    };

    if (assignmentDueDate) {
      updates.dueDate = assignmentDueDate;
    }

    if (onTaskUpdate) {
      onTaskUpdate(assigningTaskId, updates);
    }

    setAssigningTaskId(null);
    setAssignmentMemberId("");
    setAssignmentDueDate("");
  };

  const getUnassignedTasks = (): { id: string; title: string; milestoneTitle: string }[] => {
    const unassigned: { id: string; title: string; milestoneTitle: string }[] = [];

    if (generatedPlan?.milestones) {
      generatedPlan.milestones.forEach((milestone) => {
        milestone.tasks?.forEach((task) => {
          if (!task.ownerId) {
            unassigned.push({
              id: task.id,
              title: task.title,
              milestoneTitle: milestone.title,
            });
          }
        });
      });
    }

    return unassigned;
  };

  const unassignedTasks = getUnassignedTasks();
  const selectedTask = unassignedTasks.find((t) => t.id === assigningTaskId);
  const selectedMember = team.find((m) => m.id === assignmentMemberId);

  return (
    <div className="space-y-8">
      {/* Team Members Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Members</h2>

        {team.length > 0 ? (
          <div className="space-y-4 mb-8">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-6 border border-gray-200 rounded-lg bg-gray-50"
              >
                <div className="flex-1">
                  <p className="text-xl font-semibold text-gray-900">{member.name}</p>
                  <p className="text-lg text-gray-600">{member.role}</p>
                  <p className="text-sm text-gray-500 mt-1">{member.availability}</p>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.id)}
                  className="px-6 py-3 bg-red-100 text-red-700 text-lg font-bold rounded-lg hover:bg-red-200 transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-lg text-gray-600 mb-8">No team members yet.</p>
        )}

        {/* Add Member Form */}
        <div className="border-t border-gray-200 pt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Add Team Member</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">Name</label>
              <input
                type="text"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="e.g., Sarah"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
              />
            </div>

            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">Role</label>
              <input
                type="text"
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                placeholder="e.g., Designer, Developer"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
              />
            </div>

            <button
              onClick={handleAddMember}
              disabled={!newMemberName.trim() || !newMemberRole.trim()}
              className="w-full px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              Add Member
            </button>
          </div>
        </div>
      </div>

      {/* Task Assignment Section */}
      {unassignedTasks.length > 0 && team.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Assign Tasks ({unassignedTasks.length} unassigned)
          </h2>

          <div className="space-y-6">
            {/* Select Task to Assign */}
            <div>
              <label className="block text-lg font-bold text-gray-900 mb-3">
                Select Task
              </label>
              <select
                value={assigningTaskId || ""}
                onChange={(e) => {
                  setAssigningTaskId(e.target.value || null);
                  setAssignmentMemberId("");
                  setAssignmentDueDate("");
                }}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
              >
                <option value="">Choose a task...</option>
                {unassignedTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title} (in {task.milestoneTitle})
                  </option>
                ))}
              </select>
            </div>

            {/* Assignment Details */}
            {assigningTaskId && selectedTask && (
              <div className="p-6 bg-blue-50 rounded-lg border border-blue-200 space-y-5">
                <div>
                  <p className="text-sm font-semibold text-gray-600 mb-2">SELECTED TASK</p>
                  <p className="text-xl font-bold text-gray-900">{selectedTask.title}</p>
                </div>

                {/* Select Member */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Assign To
                  </label>
                  <select
                    value={assignmentMemberId || ""}
                    onChange={(e) => setAssignmentMemberId(e.target.value || "")}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
                  >
                    <option value="">Choose member...</option>
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name} ({member.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Set Due Date */}
                <div>
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 text-lg"
                  />
                </div>

                {/* Assignment Preview */}
                {selectedMember && (
                  <div className="p-4 bg-white rounded border border-gray-300">
                    <p className="text-sm font-semibold text-gray-600 mb-2">PREVIEW</p>
                    <div className="space-y-2">
                      <p className="text-lg text-gray-700">
                        <span className="font-semibold">Assign to:</span> {selectedMember.name}
                      </p>
                      {assignmentDueDate && (
                        <p className="text-lg text-gray-700">
                          <span className="font-semibold">Due:</span> {assignmentDueDate}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-blue-200">
                  <button
                    onClick={() => {
                      setAssigningTaskId(null);
                      setAssignmentMemberId("");
                      setAssignmentDueDate("");
                    }}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-900 text-lg font-bold rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAssignTask}
                    disabled={!assignmentMemberId}
                    className="flex-1 px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  >
                    Assign Task
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Empty State */}
      {unassignedTasks.length === 0 && team.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-10">
          <p className="text-lg text-gray-600 text-center">
            All tasks are assigned! ✓
          </p>
        </div>
      )}
    </div>
  );
}
