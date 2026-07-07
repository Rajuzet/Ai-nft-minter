"use client";

import React from "react";
import { Clock, User, ArrowUpRight } from "lucide-react";

export interface ArticleCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  author: {
    name: string;
    avatarUrl?: string;
    role?: string;
  };
  date: string;
  imageUrl: string;
  href?: string;
  featured?: boolean;
}

export function ArticleCard({
  title,
  description,
  category,
  readTime,
  author,
  date,
  imageUrl,
  href = "#",
  featured = false,
}: ArticleCardProps) {
  return (
    <article
      onClick={() => {
        if (href && href !== "#") window.location.href = href;
      }}
      className={`group cursor-pointer rounded-3xl border border-white/5 bg-slate-900/30 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:border-cyan-500/30 hover:shadow-2xl hover:shadow-cyan-500/10 ${
        featured ? "md:grid md:grid-cols-2 md:items-center" : ""
      }`}
    >
      <div className={`relative bg-slate-950 overflow-hidden ${featured ? "aspect-video md:h-full" : "aspect-video"}`}>
        <img
          src={imageUrl}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute top-3 left-3 flex items-center gap-2">
          <span className="rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 px-3 py-1 text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
            {category}
          </span>
          {featured && (
            <span className="rounded-full bg-gradient-to-r from-fuchsia-500 to-indigo-500 px-3 py-1 text-[10px] font-black text-white uppercase tracking-wider">
              Featured
            </span>
          )}
        </div>
      </div>

      <div className="p-6 space-y-4 flex flex-col justify-between flex-1">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-cyan-400" /> {readTime} read
            </span>
            <span>{date}</span>
          </div>

          <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {title}
          </h3>

          <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {author.avatarUrl ? (
              <img
                src={author.avatarUrl}
                alt={author.name}
                className="h-7 w-7 rounded-full object-cover border border-white/10"
              />
            ) : (
              <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-white leading-none">{author.name}</p>
              {author.role && (
                <p className="text-[9px] text-slate-500 font-mono mt-0.5">{author.role}</p>
              )}
            </div>
          </div>

          <div className="h-8 w-8 rounded-full bg-white/5 group-hover:bg-cyan-500/20 text-slate-400 group-hover:text-cyan-400 flex items-center justify-center transition-colors">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </article>
  );
}
