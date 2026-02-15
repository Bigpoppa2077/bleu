import { GeneratedPack } from "./types";

export const mockBrief = (): GeneratedPack => ({
  brief:
    "A creative project management tool that helps teams align on vision, break down work into milestones, and track progress.",
  northStar: "Teams ship better work together by understanding what matters most",
  milestones: [
    {
      title: "MVP Launch",
      etaHours: 40,
      tasks: [
        { id: "1", title: "Design core UI", done: false },
        { id: "2", title: "Build project form", done: false },
        { id: "3", title: "Setup database", done: false },
      ],
    },
    {
      title: "Integration",
      etaHours: 20,
      tasks: [
        { id: "4", title: "Add external API", done: false },
        { id: "5", title: "Test drafts", done: false },
      ],
    },
  ],
  risks: [
    {
      category: "Technical",
      severity: "medium",
      issue: "API rate limits",
      mitigation: "Implement caching and fallback to mock data",
    },
  ],
  gaps: [
    {
      want: "Real-time collaboration",
      reality: "Single-user only",
      impact: "Limits team adoption in early phase",
    },
  ],
  next3Actions: [
    "Define success metrics for MVP",
    "Create wireframes for dashboard",
    "Setup authentication",
  ],
});

export const mockPlan = (): GeneratedPack => ({
  brief:
    "Detailed execution plan for creative project with clear phases and dependencies",
  northStar: "Deliver incrementally with clear checkpoints",
  milestones: [
    {
      title: "Phase 1: Foundation",
      etaHours: 60,
      tasks: [
        { id: "1", title: "Setup dev environment", done: true },
        { id: "2", title: "Database schema design", done: false },
        { id: "3", title: "API scaffolding", done: false },
      ],
    },
    {
      title: "Phase 2: Core Features",
      etaHours: 80,
      tasks: [
        { id: "4", title: "Project creation", done: false },
        { id: "5", title: "Milestone management", done: false },
        { id: "6", title: "Risk tracking", done: false },
      ],
    },
    {
      title: "Phase 3: Polish & Deploy",
      etaHours: 40,
      tasks: [
        { id: "7", title: "Testing & QA", done: false },
        { id: "8", title: "Deploy to production", done: false },
      ],
    },
  ],
  risks: [
    {
      category: "Schedule",
      severity: "high",
      issue: "Underestimated complexity",
      mitigation: "Add 20% buffer to all estimates",
    },
    {
      category: "Technical",
      severity: "medium",
      issue: "Performance at scale",
      mitigation: "Profile early and optimize queries",
    },
  ],
  gaps: [
    {
      want: "Mobile app",
      reality: "Web only",
      impact: "Users on-the-go can't access data",
    },
    {
      want: "Analytics dashboard",
      reality: "No visibility into usage",
      impact: "Can't optimize features based on data",
    },
  ],
  next3Actions: [
    "Schedule planning meeting with stakeholders",
    "Break down Phase 1 into daily tasks",
    "Set up CI/CD pipeline",
  ],
});

export const mockRisks = (): GeneratedPack => ({
  brief: "Risk analysis and mitigation strategies for project",
  northStar: "Identify and mitigate risks before they impact delivery",
  milestones: [],
  risks: [
    {
      category: "Market",
      severity: "high",
      issue: "No clear product-market fit",
      mitigation:
        "Conduct user interviews and validate assumptions with 10 target users",
    },
    {
      category: "Technical",
      severity: "high",
      issue: "External API costs spiral out of control",
      mitigation:
        "Implement strict rate limiting and cost monitoring; cache responses",
    },
    {
      category: "Team",
      severity: "medium",
      issue: "Key person dependency (solo developer)",
      mitigation: "Document all decisions; pair program critical features",
    },
    {
      category: "Financial",
      severity: "low",
      issue: "Limited budget for hosting",
      mitigation: "Use free tier services; optimize infrastructure",
    },
  ],
  gaps: [
    {
      want: "Enterprise security features",
      reality: "Basic authentication only",
      impact: "Can't serve corporate clients",
    },
  ],
  next3Actions: [
    "Create risk register and review weekly",
    "Set up cost alerts on cloud services",
    "Plan knowledge transfer sessions",
  ],
});
