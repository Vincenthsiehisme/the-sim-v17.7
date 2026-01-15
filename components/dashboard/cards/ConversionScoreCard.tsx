
import React from 'react';
import { Minus, TrendingUp, TrendingDown, User } from 'lucide-react';
import { ConversionAnalysis } from '../../../utils/personaAnalytics';

export const ConversionScoreCard: React.FC<{ analysis: ConversionAnalysis, label: string }> = ({ analysis, label }) => {
  const { totalScore, sentiment, boosters, blockers, marketingFlavor } = analysis;

  let colorClass = "text-slate-500";
  let bgClass = "bg-slate-50";
  let icon = <Minus className="w-5 h-5" />;

  if (totalScore >= 70) {
    colorClass = "text-emerald-600";
    bgClass = "bg-emerald-50";
    icon = <TrendingUp className="w-5 h-5" />;
  } else if (totalScore <= 40) {
    colorClass = "text-red-500";
    bgClass = "bg-red-50";
    icon = <TrendingDown className="w-5 h-5" />;
  } else {
    colorClass = "text-amber-500";
    bgClass = "bg-amber-50";
    icon = <Minus className="w-5 h-5" />;
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col h-full">
      <div className={`p-4 ${bgClass} flex justify-between items-start shrink-0`}>
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{label}</span>
          <div className="flex items-center gap-2 mt-1 mb-1">
            <span className={`text-3xl font-black ${colorClass}`}>{totalScore}</span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-white/60 ${colorClass} shadow-sm border border-white/50`}>
              {sentiment}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-white/50 px-2 py-1 rounded-md border border-white/40 max-w-fit">
             <User className="w-3 h-3 text-indigo-400" />
             {marketingFlavor}
          </div>
        </div>
        <div className={`p-3 rounded-full bg-white shadow-sm ${colorClass}`}>
          {icon}
        </div>
      </div>
      
      <div className="p-4 space-y-4 flex-1 flex flex-col justify-center overflow-y-auto">
        {boosters.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase mb-2 block flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> 主要推力 (Boosters)
            </span>
            <ul className="space-y-2">
              {boosters.map((b, i) => (
                <li key={i} className="text-xs font-medium text-slate-700 flex justify-between items-center bg-emerald-50/50 p-1.5 rounded">
                  <span>{b.label}</span>
                  <span className="text-emerald-600 font-bold">+{b.impact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {blockers.length > 0 && (
          <div>
            <span className="text-[10px] font-bold text-red-500 uppercase mb-2 block flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> 主要阻力 (Blockers)
            </span>
            <ul className="space-y-2">
              {blockers.map((b, i) => (
                <li key={i} className="text-xs font-medium text-slate-700 flex justify-between items-center bg-red-50/50 p-1.5 rounded">
                  <span>{b.label}</span>
                  <span className="text-red-500 font-bold">{b.impact}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
