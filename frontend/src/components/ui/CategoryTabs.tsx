"use client";

import React from "react";

export interface CategoryOption {
  id: string;
  label: string;
  count?: number;
  icon?: React.ComponentType<{ className?: string }>;
}

interface CategoryTabsProps {
  categories: CategoryOption[];
  activeCategory: string;
  onSelect: (id: string) => void;
  className?: string;
}

export function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  className = "",
}: CategoryTabsProps) {
  return (
    <div className={`flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none ${className}`}>
      {categories.map((cat) => {
        const Icon = cat.icon;
        const isActive = activeCategory === cat.id;

        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition whitespace-nowrap ${
              isActive
                ? "border-cyan-500/50 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 text-cyan-300 shadow-md shadow-cyan-500/10"
                : "border-white/10 bg-slate-900/40 text-slate-400 hover:border-white/20 hover:text-white"
            }`}
          >
            {Icon && <Icon className={`h-3.5 w-3.5 ${isActive ? "text-cyan-400" : "text-slate-400"}`} />}
            <span>{cat.label}</span>
            {cat.count !== undefined && (
              <span
                className={`rounded-full px-2 py-0.2 text-[9px] font-mono ${
                  isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-white/5 text-slate-500"
                }`}
              >
                {cat.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
