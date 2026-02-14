"use client";

import { Project } from "@/lib/types";

interface VisionTabProps {
  project: Project;
  setProject: (project: Project) => void;
}

export function VisionTab({ project, setProject }: VisionTabProps) {
  const handleChange = (field: keyof Project, value: any) => {
    setProject({ ...project, [field]: value });
  };

  const handleReferencesChange = (value: string) => {
    const refs = value.split(",").map((ref) => ref.trim());
    handleChange("references", refs);
  };

  return (
    <div className="space-y-6 p-8">
      {/* Title */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
          Project Title
        </label>
        <input
          type="text"
          value={project.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="e.g., Creative AI Assistant"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
        />
      </div>

      {/* Vision Text */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
          Vision Text
        </label>
        <textarea
          value={project.visionText}
          onChange={(e) => handleChange("visionText", e.target.value)}
          placeholder="Describe your vision for this project. What problem does it solve?"
          rows={6}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm"
        />
      </div>

      {/* Audience */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
          Target Audience
        </label>
        <input
          type="text"
          value={project.audience}
          onChange={(e) => handleChange("audience", e.target.value)}
          placeholder="e.g., Creative professionals, startup founders"
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent text-sm"
        />
      </div>

      {/* Success Definition */}
      <div>
        <label className="block text-xs font-semibold text-gray-900 mb-2 uppercase tracking-wide">
          Success Definition
        </label>
        <textarea
          value={project.success}
          onChange={(e) => handleChange("success", e.target.value)}
          placeholder="How will you measure success? What does winning look like?"
          rows={4}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none text-sm"
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
    </div>
  );
}
