// Project entity types for creative project assistant MVP

export interface Task {
  id: string;
  title: string;
  done: boolean;
  ownerId?: string;
  dueDate?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  availability: string;
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

export interface ChangeRequest {
  id: string;
  title: string;
  description: string;
  appliedToPipeline: boolean;
  createdAt: string;
}

export interface VisionAnchors {
  pillars: {
    luxury: number;
    craft: number;
    minimal: number;
    bold: number;
    warm: number;
  };
  keywords: string[];
  nonNegotiables: string[];
}

export interface Project {
  id: string;
  title: string;
  visionText: string;
  audience: string;
  success: string;
  references: string[];
  projectType?:
    | "Brand/Design"
    | "Video/Content"
    | "Product/Physical"
    | "Music/Audio"
    | "Writing"
    | "Space/Architecture"
    | "General";
  // optional free-form answers to tailored questions
  notes?: Record<string, string>;
  // team members for the project
  team?: TeamMember[];
  // change requests for the pipeline
  changeRequests?: ChangeRequest[];
  // vision anchors - pillars, keywords, non-negotiables
  visionAnchors?: VisionAnchors;
}

export interface GeneratedPack {
  brief: string;
  northStar: string;
  milestones: Milestone[];
  risks: Risk[];
  gaps: Gap[];
  next3Actions: string[];
}
