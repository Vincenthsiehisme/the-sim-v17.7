
import React from 'react';
import { Info, FileText } from 'lucide-react';
import { parseEvidence } from '../../../utils/personaAnalytics';

// Helper for Tooltip
export const InfoTooltip: React.FC<{ text: string }> = ({ text }) => {
  const { reasoning, reference } = parseEvidence(text);
  
  return (
    <div className="group relative inline-block ml-2 align-middle">
      <Info className="w-3 h-3 text-slate-300 hover:text-indigo-400 cursor-help transition-colors" />
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg w-56 md:w-72 z-50 pointer-events-none shadow-xl leading-relaxed">
        <p className="mb-1">{reasoning}</p>
        {reference && (
          <div className="mt-2 pt-2 border-t border-slate-600 flex items-start gap-1.5 text-[10px] text-slate-300">
             <FileText className="w-3 h-3 shrink-0 mt-0.5" />
             <span className="font-mono">{reference}</span>
          </div>
        )}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
      </div>
    </div>
  );
};

export const SectionTitle: React.FC<{ title: string; subtitle?: string; icon?: React.ElementType; info?: string; compact?: boolean }> = ({ title, subtitle, icon: Icon, info, compact }) => (
  <div className={compact ? "mb-2" : "mb-4"}>
    <h3 className={`${compact ? "text-sm" : "text-lg"} font-bold text-slate-800 flex items-center gap-2`}>
      {Icon && <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-indigo-500`} />}
      {title}
      {info && <InfoTooltip text={info} />}
    </h3>
    {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
  </div>
);
