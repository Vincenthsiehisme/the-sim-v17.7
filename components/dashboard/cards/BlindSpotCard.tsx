
import React from 'react';
import { Target, Zap } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';

export const BlindSpotCard: React.FC<{ label?: string, description?: string, strategy?: string }> = ({ label, description, strategy }) => {
   // Safe guards for missing data
   const safeLabel = label || "無明顯盲點";
   const safeDesc = description || "AI 尚未偵測到顯著的決策盲點。";
   const safeStrat = strategy || "建議維持目前的溝通策略，持續觀察。";

   return (
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden h-full flex flex-col">
         <SectionTitle title="盲點與對策" info="基於性格特質交集出的行為阻礙與建議解法" icon={Target} />
         
         <div className="flex-1 space-y-4 flex flex-col">
           <div className="bg-rose-50 rounded-xl p-4 border border-rose-100 flex-1">
             <div className="text-xs font-bold text-rose-400 uppercase mb-1">潛在盲點 (Blind Spot)</div>
             <h4 className="font-bold text-rose-800 text-lg mb-2">{safeLabel}</h4>
             <p className="text-sm text-rose-900/80 leading-relaxed">{safeDesc}</p>
           </div>

           <div className="relative pl-4 pt-1 shrink-0">
              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-indigo-100"></div>
              <div className="absolute left-[-4px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white shadow-sm"></div>
              <div className="text-xs font-bold text-indigo-500 uppercase mb-1 flex items-center gap-1">
                 <Zap className="w-3 h-3" /> 建議行動策略
              </div>
              <p className="text-sm font-bold text-slate-700 leading-snug">
                {safeStrat}
              </p>
           </div>
         </div>
      </div>
   );
};
