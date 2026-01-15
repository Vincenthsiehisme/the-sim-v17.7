
import React from 'react';

export const TagGroup: React.FC<{ tags: string[] }> = ({ tags }) => (
  <div className="flex flex-wrap gap-2">
    {tags.map((tag, i) => (
      <span key={i} className="px-3 py-1 bg-white border border-slate-200 text-slate-600 text-xs md:text-sm rounded-full font-bold shadow-sm transition-transform hover:-translate-y-0.5">
        #{tag}
      </span>
    ))}
  </div>
);
