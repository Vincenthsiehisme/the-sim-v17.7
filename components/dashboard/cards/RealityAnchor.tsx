
import React from 'react';
import { ScanFace, Wallet, Fingerprint, AlertTriangle, Link2, Link2Off, Sparkles } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';
import { RealityCheck, Constraints } from '../../../types';

export const RealityAnchor: React.FC<{ 
  realityCheck?: RealityCheck; 
  constraints: Constraints;
}> = ({ realityCheck, constraints }) => {
  // Safe default
  if (!realityCheck) {
      return null; 
  }

  const { coherence_level, reality_gap_description, correction_rules } = realityCheck;
  const isDelusional = coherence_level === 'Delusional';
  const isLowCoherence = coherence_level === 'Low';

  // Visual Config based on Coherence Level
  const statusConfig = {
      'High': { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: Link2, label: '認知協調 (Coherent)' },
      'Medium': { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: Link2, label: '大致符合 (Aligned)' },
      'Low': { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: AlertTriangle, label: '認知偏差 (Skewed)' },
      'Delusional': { color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', icon: Link2Off, label: '嚴重解離 (Delusional)' }
  }[coherence_level] || { color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: Link2, label: '未知' };

  const StatusIcon = statusConfig.icon;

  // Derive "Actual Reality" text from constraints
  const getMoneyText = (level: string) => {
      if (level.includes('High') || level.includes('高')) return '高消費力';
      if (level.includes('Low') || level.includes('低')) return '預算拮据';
      return '一般水準';
  };
  const actualReality = getMoneyText(constraints.money.spending_power_level);

  // Derive "Perceived Self" text
  // Clean up role string (remove parenthesis)
  const perceivedSelf = correction_rules?.display_role 
      ? correction_rules.display_role.replace(/[?()]/g, '').trim() 
      : "未知角色";

  return (
    <div className={`h-full bg-white rounded-2xl border ${isDelusional ? 'border-rose-200 shadow-lg shadow-rose-50' : 'border-slate-200 shadow-sm'} p-5 relative flex flex-col group transition-all duration-500 hover:shadow-md`}>
        
        {/* Background & Stamp Layer (Clips content) */}
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none z-0">
            {isDelusional && (
                <div className="absolute -right-12 top-6 bg-rose-500 text-white text-[9px] font-black py-1 px-12 rotate-45 shadow-sm tracking-widest opacity-90">
                    DELUSIONAL
                </div>
            )}
        </div>

        {/* Content Layer (Allows tooltip overflow) */}
        <div className="relative z-10 flex flex-col h-full">
            <SectionTitle 
                title="現實校準 (Reality Anchor)" 
                subtitle="自我認知 vs 客觀事實" 
                icon={ScanFace} 
                info="分析使用者的『自我描述』與實際『行為數據』之間的落差。高度落差代表該用戶可能處於『眼高手低』或『過度自信』的心理狀態。"
            />
            
            <div className="flex-1 flex flex-col gap-5 mt-2">
                
                {/* 1. Status Indicator */}
                <div className={`flex items-center gap-3 p-3 rounded-xl border ${statusConfig.bg} ${statusConfig.border}`}>
                    <div className={`p-2 rounded-full bg-white shadow-sm shrink-0 ${statusConfig.color}`}>
                        <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                        <div className={`text-[10px] font-bold uppercase tracking-wider opacity-80 ${statusConfig.color}`}>一致性評級</div>
                        <div className={`text-base font-black ${statusConfig.color}`}>{statusConfig.label}</div>
                    </div>
                </div>

                {/* 2. The Gap Visualizer */}
                <div className="grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
                    
                    {/* Left: Perception */}
                    <div className="relative p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-center group/card">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white text-indigo-400 p-1 rounded-full border border-indigo-100 shadow-sm">
                        <Fingerprint className="w-3 h-3" />
                        </div>
                        <div className="text-[9px] text-indigo-400 font-bold uppercase mt-2 mb-1">主觀認知 (Self)</div>
                        <div className="text-sm font-black text-indigo-700 truncate px-1">
                            {perceivedSelf}
                        </div>
                    </div>

                    {/* Middle: Connector */}
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-300">
                        <div className="w-full h-px bg-slate-200"></div>
                        {isDelusional ? <Link2Off className="w-4 h-4 text-rose-400 animate-pulse" /> : <Link2 className="w-4 h-4" />}
                        <div className="w-full h-px bg-slate-200"></div>
                    </div>

                    {/* Right: Reality */}
                    <div className="relative p-3 bg-slate-50 rounded-xl border border-slate-200 text-center group/card">
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-white text-slate-400 p-1 rounded-full border border-slate-200 shadow-sm">
                        <Wallet className="w-3 h-3" />
                        </div>
                        <div className="text-[9px] text-slate-400 font-bold uppercase mt-2 mb-1">客觀現實 (Fact)</div>
                        <div className="text-sm font-black text-slate-600 truncate px-1">
                            {actualReality}
                        </div>
                    </div>
                </div>

                {/* 3. AI Commentary */}
                <div className="mt-auto relative bg-slate-50/80 p-3 rounded-lg border-l-4 border-slate-300">
                    <p className="text-xs text-slate-600 leading-relaxed font-medium pl-1 italic">
                        "{reality_gap_description}"
                    </p>
                </div>
            </div>
        </div>
    </div>
  );
};
