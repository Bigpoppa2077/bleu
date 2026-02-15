import { GeneratedPack, ChangeRequest, Task } from "./types";

export type PipelineIssueType =
  | "unassigned_task"
  | "overdue_task"
  | "unapplied_change"
  | "empty_milestone";

export interface PipelineIssue {
  id: string;
  type: PipelineIssueType;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  taskId?: string;
  taskTitle?: string;
  milestoneTitle?: string;
  changeId?: string;
  changeTitle?: string;
  dueDate?: string;
}

export function getPipelineIssues(
  plan: GeneratedPack | null,
  changeRequests: ChangeRequest[] = []
): PipelineIssue[] {
  const issues: PipelineIssue[] = [];

  if (!plan) return issues;

  // Check for tasks with no owner
  plan.milestones?.forEach((milestone) => {
    milestone.tasks?.forEach((task) => {
      if (!task.ownerId) {
        issues.push({
          id: `unassigned-${task.id}`,
          type: "unassigned_task",
          severity: "medium",
          title: "Unassigned Task",
          description: `"${task.title}" in "${milestone.title}" has no owner assigned.`,
          taskId: task.id,
          taskTitle: task.title,
          milestoneTitle: milestone.title,
        });
      }
    });
  });

  // Check for overdue tasks
  const today = new Date().toISOString().split("T")[0];
  plan.milestones?.forEach((milestone) => {
    milestone.tasks?.forEach((task) => {
      if (task.dueDate && task.dueDate < today && !task.done) {
        issues.push({
          id: `overdue-${task.id}`,
          type: "overdue_task",
          severity: "high",
          title: "Overdue Task",
          description: `"${task.title}" in "${milestone.title}" was due on ${task.dueDate}.`,
          taskId: task.id,
          taskTitle: task.title,
          milestoneTitle: milestone.title,
          dueDate: task.dueDate,
        });
      }
    });
  });

  // Check for unapplied changes
  changeRequests?.forEach((change) => {
    if (!change.appliedToPipeline) {
      issues.push({
        id: `unapplied-${change.id}`,
        type: "unapplied_change",
        severity: "medium",
        title: "Unapplied Change",
        description: `"${change.title}" has not been applied to the pipeline yet.`,
        changeId: change.id,
        changeTitle: change.title,
      });
    }
  });

  // Check for empty milestones
  plan.milestones?.forEach((milestone) => {
    if (!milestone.tasks || milestone.tasks.length === 0) {
      issues.push({
        id: `empty-${milestone.title}`,
        type: "empty_milestone",
        severity: "low",
        title: "Empty Milestone",
        description: `"${milestone.title}" has no tasks. Consider removing it or adding tasks.`,
        milestoneTitle: milestone.title,
      });
    }
  });

  return issues;
}

export function calculateHealthScore(issues: PipelineIssue[]): number {
  if (issues.length === 0) return 100;

  const highSeverityCount = issues.filter((i) => i.severity === "high").length;
  const mediumSeverityCount = issues.filter((i) => i.severity === "medium").length;
  const lowSeverityCount = issues.filter((i) => i.severity === "low").length;

  // Deduct points: high=10, medium=5, low=2
  let score = 100;
  score -= highSeverityCount * 10;
  score -= mediumSeverityCount * 5;
  score -= lowSeverityCount * 2;

  return Math.max(0, score);
}

export function getHealthStatus(score: number): "healthy" | "warning" | "critical" {
  if (score >= 80) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}
