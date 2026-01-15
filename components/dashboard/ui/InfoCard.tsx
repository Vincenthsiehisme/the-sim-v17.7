
import React from 'react';

export const InfoCard: React.FC<{ label: string; value: string | number | null; icon?: React.ElementType, sub?: string, relativeLabel?: string }> = ({ label, value, icon: Icon, sub, relativeLabel }) => (
  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:border-indigo-100 group min-w-0 relative overflow-hidden h-full">
    {relativeLabel && (
      <div className="absolute top-0 right-0 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
        {relativeLabel}
      </div>
    )}
    {Icon && (
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors flex-shrink-0">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <div className="min-w-0 flex-1 pt-1">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
         <h4 className="text-xl font-extrabold text-slate-800 truncate">{value || 'N/A'}</h4>
         {sub && <span className="text-xs font-medium text-slate-400 truncate bg-slate-100 px-1.5 py-0.5 rounded">{sub}</span>}
      </div>
    </div>
  </div>
);
