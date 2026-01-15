

import React from 'react';
import { ScanLine, Clock, Wallet, ShoppingCart, Brain, Smartphone, AlertCircle, Zap, CheckCircle2 } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';
import { DataCompletenessAnalysis } from '../../../utils/personaAnalytics';

export const DataGeneCard: React.FC<{ analysis: DataCompletenessAnalysis }> = ({ analysis }) => {
  const { overallScore, dimensions, suggestions } = analysis;
  
  // Traffic Light Logic
  const getLightConfig = (score: number) => {
    if (score >= 80) return { color: "bg-emerald-500", shadow: "shadow-emerald-200", label: "優良 (Good)", text: "text-emerald-600" };
    if (score >= 50) return { color: "bg-amber-400", shadow: "shadow-amber-200", label: "普通 (Average)", text: "text-amber-500" };
    return { color: "bg-rose-500", shadow: "shadow-rose-200", label: "需加強 (Poor)", text: "text-rose-500" };
  };

  const status = getLightConfig(overallScore);

  const getDimensionIcon = (id: string) => {
    switch (id) {
      case 'time': return Clock;
      case 'money': return Wallet;
      case 'content': return ShoppingCart;
      case 'psych': return Brain;
      case 'context': return Smartphone;
      default: return ScanLine;
    }
  };

  return (
    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col min-w-0 relative">
      <SectionTitle 
        title="資料品質檢測 (Data Quality)" 
        subtitle="輸入數據完整性與信賴度評估" 
        icon={ScanLine} 
        info="系統掃描輸入數據的五大維度（時間、金錢、內容、性格、情境），若缺乏關鍵欄位，AI 可能會使用推論（Inference）來補足缺失。" 
      />
      
      {/* Single Traffic Light Header */}
      <div className="flex items-center gap-5 mb-5 px-2 shrink-0">
         <div className={`w-16 h-16 rounded-full ${status.color} shadow-xl ${status.shadow} border-4 border-white flex items-center justify-center shrink-0`}>
             <span className="text-white font-black text-xl">{overallScore}</span>
         </div>
         <div className="flex-1">
            <div className="text-sm font-bold text-slate-800 mb-1">資料健康度</div>
            <div className={`text-lg font-black leading-tight ${status.text}`}>
              {status.label}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              {overallScore >= 80 ? "品質優良，解析精準" : overallScore >= 50 ? "部分依賴 AI 推論" : "訊號微弱，建議補充資料"}
            </p>
         </div>
      </div>

      {/* Dimension List with Signal Lights - Compacted */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-0 space-y-2 custom-scrollbar pb-2">
        {dimensions.map((d, i) => {
          const Icon = getDimensionIcon(d.id);
          const isStrong = d.score >= 80;
          const isModerate = d.score >= 50 && d.score < 80;
          const isWeak = d.score < 50;

          // Light color for list items
          const dotColor = isStrong ? 'bg-emerald-500' : isModerate ? 'bg-amber-400' : 'bg-rose-500';
          const labelText = isStrong ? '優良' : isModerate ? '普通' : '需加強';
          const labelColor = isStrong ? 'text-emerald-600' : isModerate ? 'text-amber-600' : 'text-rose-600';
          const boxBg = isWeak ? 'bg-rose-50/40 border-rose-100' : 'bg-white border-slate-100';

          return (
            <div key={i} className={`p-2.5 rounded-lg border transition-all ${boxBg}`}>
               <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 shadow-sm border border-slate-50 bg-white text-slate-400`}>
                     <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0 flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-700 truncate">{d.dimension}</span>
                     
                     <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${labelColor}`}>{labelText}</span>
                        <div className={`w-3 h-3 rounded-full ${dotColor} shadow-sm border border-white/50`}></div>
                     </div>
                  </div>
               </div>
               {d.missingReason && (
                 <div className="mt-2 text-[10px] text-rose-600 flex items-start gap-1.5 bg-rose-50/50 p-2 rounded-lg border border-rose-100/50 ml-10">
                    <AlertCircle className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="leading-tight">{d.missingReason}</span>
                 </div>
               )}
            </div>
          );
        })}
      </div>
      
       {/* Suggestions Footer */}
        {suggestions.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 shrink-0">
             <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-2.5">
               <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 uppercase mb-1.5">
                  <Zap className="w-3 h-3" /> 優化建議
               </div>
               <ul className="space-y-1.5">
                 {suggestions.slice(0, 2).map((s, i) => (
                   <li key={i} className="text-[10px] text-slate-600 flex items-start gap-2 leading-snug">
                      <CheckCircle2 className="w-3 h-3 text-indigo-500 shrink-0 mt-0.5" />
                      {s}
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        )}
    </div>
  );
};