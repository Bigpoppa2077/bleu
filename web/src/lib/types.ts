// Project entity types for creative project assistant MVP

export interface Task {
  id: string;
  title: string;
  done: boolean;
  points: number;
}

export interface Milestone {
  title: string;
  etaHours: number;
  tasks: Task[];
}

export interface Constraint {
  type: string;
  value: string;
}

export interface Risk {
  category: string;
  severity: "low" | "medium" | "high";
  issue: string;
  mitigation: string;
}

export interface Gap {
  want: string;
  reality: string;
  impact: string;
}

export interface Project {
  id: string;
  title: string;
  visionText: string;
  audience: string;
  success: string;
  references: string[];
}

export interface GeneratedPack {
  brief: string;
  northStar: string;
  milestones: Milestone[];
  risks: Risk[];
  gaps: Gap[];
  next3Actions: string[];
}
