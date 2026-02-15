"use client";

import { Project, Constraint } from "@/lib/types";

interface VisionTabProps {
  project: Project;
  setProject: (project: Project) => void;
}

const PROJECT_TYPES = [
  "Brand/Design",
  "Video/Content",
  "Product/Physical",
  "Music/Audio",
  "Writing",
  "Space/Architecture",
  "General",
] as const;

const TAILORED_QUESTIONS: Record<string, string[]> = {
  "Brand/Design": [
    "What are the core brand values to reflect?",
    "Are there specific visual references or styleguides?",
  ],
  "Video/Content": [
    "What's the expected video length and format?",
    "Who hosts/presents and what's the tone?",
  ],
  "Product/Physical": [
    "What's the target price point?",
    "Are there manufacturing or material constraints?",
  ],
  "Music/Audio": [
    "What genre or reference tracks should be used?",
    "What's the target duration and release plan?",
  ],
  Writing: [
    "What's the target word count and structure?",
    "Who is the primary reader and reading level?",
  ],
  "Space/Architecture": [
    "What's the approximate square footage or site constraints?",
    "Are there code/regulatory constraints to consider?",
  ],
  General: [
    "What are the main goals for this project?",
    "Who are the key stakeholders?",
  ],
};

export function VisionTab({ project, setProject }: VisionTabProps) {
  const handleChange = (field: keyof Project, value: any) => {
    setProject({ ...project, [field]: value });
  };

  const handleReferencesChange = (value: string) => {
    const refs = value.split(",").map((ref) => ref.trim());
    handleChange("references", refs);
  };

  return (
    <div className="space-y-8 p-10">
      {/* Title */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">
          Project Title
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., Creative Assistant"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 text-lg"
        />
      </div>

      {/* Vision Text */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">
          Vision Text
        </label>
        <textarea
          value={project.visionText}
          onChange={(e) => handleChange("visionText", e.target.value)}
          placeholder="Describe your vision for this project. What problem does it solve?"
          rows={6}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 resize-none text-lg"
        />
      </div>

      {/* Audience */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">
          Target Audience
        </label>
        <input
          type="text"
          value={project.audience}
          onChange={(e) => handleChange("audience", e.target.value)}
          placeholder="e.g., Creative professionals, startup founders"
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 text-lg"
        />
      </div>

      {/* Success Definition */}
      <div>
        <label className="block text-lg font-bold text-gray-900 mb-3">
          Success Definition
        </label>
        <textarea
          value={project.success}
          onChange={(e) => handleChange("success", e.target.value)}
          placeholder="How will you measure success? What does winning look like?"
          rows={4}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 resize-none text-lg"
        />
      </div>

      {/* References */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
          References
        </label>
        <input
          type="text"
          value={project.references.join(", ")}
          onChange={(e) => handleReferencesChange(e.target.value)}
          placeholder="e.g., Notion, Figma, GitHub (comma-separated)"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
        />
        <p className="mt-2 text-xs text-gray-600">
          Separate multiple references with commas
        </p>
      </div>
      {/* Project Type */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
          Project Type
        </label>
        <select
          value={project.projectType || "General"}
          onChange={(e) => handleChange("projectType", e.target.value)}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
        >
          {PROJECT_TYPES.map((pt) => (
            <option key={pt} value={pt}>
              {pt}
            </option>
          ))}
        </select>
        <p className="mt-2 text-xs text-gray-600">Choose the project category to surface tailored questions and constraint suggestions.</p>
      </div>

      {/* Tailored Questions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Tailored Questions</h3>
        <div className="space-y-3">
          {(TAILORED_QUESTIONS[project.projectType || "General"] || []).map((q, idx) => (
            <div key={idx}>
              <label className="block text-xs text-gray-700 mb-1">{q}</label>
              <input
                type="text"
                value={(project.notes && project.notes[q]) || ""}
                onChange={(e) =>
                  handleChange("notes", { ...(project.notes || {}), [q]: e.target.value })
                }
                placeholder="Optional detail"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
