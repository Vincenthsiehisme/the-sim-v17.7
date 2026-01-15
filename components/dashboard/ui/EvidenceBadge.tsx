
import React from 'react';
import { FileText } from 'lucide-react';
import { parseEvidence } from '../../../utils/personaAnalytics';

export const EvidenceBadge: React.FC<{ text: string }> = ({ text }) => {
  const { reasoning, reference } = parseEvidence(text);

  return (
    <div className="mt-auto pt-3">
      <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed flex flex-col gap-1.5 group hover:bg-white hover:border-indigo-100 transition-colors">
        <div className="flex gap-2">
           <div className="min-w-[4px] w-[4px] bg-indigo-200 rounded-full shrink-0"></div>
           <div>
             <span className="font-bold text-indigo-600 block mb-0.5">推論觀點</span>
             {reasoning}
           </div>
        </div>
        
        {reference && (
          <div className="ml-3 pl-2 border-l border-slate-200 mt-1">
             <div className="flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-100/50 px-2 py-1 rounded w-fit">
                <FileText className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-mono text-slate-500">{reference}</span>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};
