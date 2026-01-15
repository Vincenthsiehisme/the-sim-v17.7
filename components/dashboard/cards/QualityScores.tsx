
import React from 'react';
import { Sparkles } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';
import { QualityReport } from '../../../utils/personaAnalytics';

export const QualityScores: React.FC<{ 
  qualityReport: QualityReport; 
}> = ({ qualityReport }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 h-full flex flex-col justify-center">
    <SectionTitle 
      title="AI生成品質" 
      icon={Sparkles} 
    />
    <div className="grid grid-cols-2 gap-4 text-center w-full">
      <div className="flex flex-col">
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">生成品質 (Quality)</span>
        <span className={`text-xl font-black ${
          qualityReport.qualityScore > 70 ? 'text-emerald-500' : 'text-amber-500'
        }`}>
          {qualityReport.qualityScore}%
        </span>
      </div>
      <div className="flex flex-col border-l border-slate-200 pl-4">
        <span className="text-[10px] uppercase font-bold text-slate-400 mb-1">穩定度 (Stability)</span>
        <span className={`text-xl font-black ${
          qualityReport.stabilityScore > 70 ? 'text-indigo-500' : 'text-slate-500'
        }`}>
          {qualityReport.stabilityScore}%
        </span>
      </div>
    </div>
  </div>
);
