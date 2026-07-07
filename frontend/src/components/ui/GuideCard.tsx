"use client";

import React from "react";
import { ChevronRight, Clock, ShieldCheck } from "lucide-react";

export interface GuideCardProps {
  stepNumber?: number;
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime?: string;
  actionText?: string;
  actionHref?: string;
  onActionClick?: () => void;
}

export function GuideCard({
  stepNumber,
  title,
  description,
  icon: Icon,
  difficulty = "Beginner",
  estimatedTime = "3 min",
  actionText = "Read Guide",
  actionHref,
  onActionClick,
}: GuideCardProps) {
  const handleAction = () => {
    if (onActionClick) {
      onActionClick();
    } else if (actionHref) {
      window.location.href = actionHref;
    }
  };

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/30 p-6 flex flex-col justify-between space-y-5 transition-all duration-300 hover:border-cyan-500/30 hover:bg-slate-900/40">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {stepNumber !== undefined ? (
              <div className="h-9 w-9 rounded-2xl bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-xs font-black text-white shadow-md shadow-cyan-500/10">
                0{stepNumber}
              </div>
            ) : Icon ? (
              <div className="h-9 w-9 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Icon className="h-4 w-4" />
              </div>
            ) : null}
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                {difficulty}
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                <Clock className="h-3 w-3 text-cyan-400" /> {estimatedTime}
              </span>
            </div>
          </div>
          <ShieldCheck className="h-4 w-4 text-emerald-400 opacity-60" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>
        </div>
      </div>

      <div className="pt-3 border-t border-white/5">
        <button
          type="button"
          onClick={handleAction}
          className="w-full flex items-center justify-between rounded-2xl bg-slate-950 px-4 py-2.5 text-xs font-semibold text-cyan-400 border border-white/10 hover:border-cyan-400/50 hover:bg-cyan-500/10 transition active:scale-95"
        >
          <span>{actionText}</span>
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
