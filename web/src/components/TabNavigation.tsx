"use client";

interface TabBadge {
  completionPercent?: number;
}

interface TabsProps {
  activeTab: "vision" | "constraints" | "plan" | "risks";
  onChange: (tab: "vision" | "constraints" | "plan" | "risks") => void;
  planBadge?: TabBadge;
  risksBadge?: TabBadge;
}

const tabs = [
  { id: "vision", label: "Vision" },
  { id: "constraints", label: "Constraints" },
  { id: "plan", label: "Plan" },
  { id: "risks", label: "Risks" },
] as const;

export function TabNavigation({
  activeTab,
  onChange,
  planBadge,
  risksBadge,
}: TabsProps) {
  const getBadge = (tab: string) => {
    if (tab === "plan" && planBadge?.completionPercent !== undefined) {
      return planBadge.completionPercent;
    }
    if (tab === "risks" && risksBadge?.completionPercent !== undefined) {
      return risksBadge.completionPercent;
    }
    return null;
  };

  return (
    <nav className="flex flex-col" aria-label="Tabs">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const badge = getBadge(tab.id);

        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id as any)}
            className={`flex items-center justify-between px-4 py-3 text-sm font-medium border-l-2 transition-colors ${
              isActive
                ? "border-blue-600 text-gray-900 bg-gray-50"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            <span>{tab.label}</span>
            {badge !== null && (
              <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded-full bg-blue-600 text-white ml-2">
                {badge}%
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
