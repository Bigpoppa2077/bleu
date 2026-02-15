"use client";

import React from "react";

interface StepperProps {
  activeStep: number; // 1..3
  onChange: (step: number) => void;
}

const steps = [
  { id: 1, label: "Define" },
  { id: 2, label: "Organize" },
  { id: 3, label: "Deliver" },
];

export function TabNavigation({ activeStep, onChange }: StepperProps) {
  return (
    <div className="p-4">
      <div className="mb-3 text-xs text-gray-500">Step {activeStep} of {steps.length}</div>
      <nav className="flex flex-col" aria-label="Steps">
        {steps.map((s) => {
          const isActive = activeStep === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onChange(s.id)}
              className={`flex items-center justify-between px-4 py-3 text-sm font-medium border-l-2 transition-colors ${
                isActive
                  ? "border-blue-600 text-gray-900 bg-gray-50"
                  : "border-transparent text-gray-600 hover:text-gray-900"
              }`}
            >
              <span className="font-semibold">{s.label}</span>
              <span className="text-xs text-gray-400">{s.id}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
