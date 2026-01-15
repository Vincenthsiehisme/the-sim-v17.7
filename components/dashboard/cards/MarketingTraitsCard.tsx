
import React from 'react';
import { User } from 'lucide-react';

export const MarketingTraitsCard: React.FC<{ traits: any[] }> = ({ traits }) => (
  <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col justify-center min-h-[180px]">
    <div className="flex items-center gap-2 mb-3 px-1">
        <User className="h-4 w-4 text-indigo-500" />
        <span className="text-xs font-bold text-slate-700">行銷關鍵特質</span>
    </div>
    <div className="grid grid-cols-2 gap-2 flex-1">
      {traits.map((t, i) => (
        <div key={i} className={`rounded-xl p-2.5 flex flex-col justify-center ${t.bg}`}>
           <span className="text-[9px] font-bold text-slate-500 uppercase mb-0.5 tracking-wide">{t.label}</span>
           <span className={`text-sm font-black ${t.color} leading-tight truncate`}>{t.value}</span>
           <span className="text-[9px] text-slate-400 mt-0.5 truncate opacity-80">{t.sub}</span>
        </div>
      ))}
    </div>
  </div>
);
