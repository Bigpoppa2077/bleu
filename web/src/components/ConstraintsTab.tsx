"use client";

import { useState } from "react";
import { Constraint } from "@/lib/types";

interface ConstraintsTabProps {
  constraints: Constraint[];
  setConstraints: (constraints: Constraint[]) => void;
  suggestedTypes?: string[];
}

const DEFAULT_SUGGESTED_TYPES = [
  "Budget",
  "Timeline",
  "Tools",
  "Platform",
  "Materials",
  "Brand rules",
];

export function ConstraintsTab({ constraints, setConstraints, suggestedTypes }: ConstraintsTabProps) {
  const [type, setType] = useState("");
  const [value, setValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleAdd = () => {
    if (!type.trim() || !value.trim()) return;

    const newConstraint: Constraint = {
      type: type.trim(),
      value: value.trim(),
    };

    setConstraints([...constraints, newConstraint]);
    setType("");
    setValue("");
    setShowSuggestions(false);
  };

  const handleRemove = (index: number) => {
    setConstraints(constraints.filter((_, i) => i !== index));
  };

  const handleTypeSelect = (selectedType: string) => {
    setType(selectedType);
    setShowSuggestions(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAdd();
    }
  };

  return (
    <div className="space-y-8 p-10">
      {/* Add Constraint Form */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Add Constraint</h3>

        <div className="flex gap-3">
          {/* Type Input */}
          <div className="flex-1 relative">
            <label className="block text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Type
            </label>
            <input
              type="text"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="e.g., Budget"
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 text-lg"
            />

            {/* Suggestions Dropdown */}
            {showSuggestions && type && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {(suggestedTypes || DEFAULT_SUGGESTED_TYPES)
                  .filter((t) => t.toLowerCase().includes(type.toLowerCase()))
                  .map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => handleTypeSelect(suggestion)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    >
                      {suggestion}
                    </button>
                  ))}
              </div>
            )}
          </div>

          {/* Value Input */}
          <div className="flex-1">
            <label className="block text-lg font-bold text-gray-900 mb-3 uppercase tracking-wide">
              Value
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g., $10,000"
              onKeyPress={handleKeyPress}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-3 focus:ring-blue-600 focus:border-blue-600 text-lg"
            />
          </div>

          {/* Add Button */}
          <div className="flex items-end">
            <button
              onClick={handleAdd}
              disabled={!type.trim() || !value.trim()}
              className="px-6 py-4 bg-blue-600 text-white text-lg font-bold rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Constraints List */}
      <div className="space-y-3">
        <h3 className="text-lg font-bold text-gray-900">
          Constraints ({constraints.length})
        </h3>

        {constraints.length === 0 ? (
          <p className="text-lg text-gray-600 italic">
            No constraints yet. Add one to get started.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {constraints.map((constraint, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-full text-sm"
              >
                <span className="font-medium text-gray-900">
                  {constraint.type}:
                </span>
                <span className="text-gray-600">{constraint.value}</span>
                <button
                  onClick={() => handleRemove(index)}
                  className="ml-1 text-gray-400 hover:text-gray-600 font-bold"
                  aria-label="Remove constraint"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
