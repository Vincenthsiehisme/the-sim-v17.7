
import React from 'react';
import { Target, Wallet, Clock, BookOpen, Lock, ShieldAlert, Zap, Eye, Ghost } from 'lucide-react';
import { Constraints, RealityCheck } from '../../../types';

interface ResistanceProps { 
    blindSpot: { label: string, strategy: string };
    constraints: Constraints;
    realityCheck?: RealityCheck;
}

// Convert qualitative strings to 0-100 Resistance Score (Low to High Barrier)
const calculateActualResistance = (type: 'money' | 'time' | 'knowledge' | 'inertia', data: any): { score: number, label: string } => {
   // Goal: 0 = Easy (Low Barrier), 100 = Hard (High Barrier)
   
   if (type === 'money') {
       const power = data.spending_power_level || "中";
       const sens = data.price_sensitivity || "中";
       let base = 50;
       if (power.includes('High') || power.includes('高')) base -= 30; // Rich = Low Barrier
       if (power.includes('Low') || power.includes('低')) base += 30;  // Poor = High Barrier
       return { score: Math.max(10, Math.min(90, base)), label: base > 60 ? "預算受限" : base < 40 ? "預算充裕" : "一般水準" };
   }

   if (type === 'time') {
       const t = (data.available_time_pattern || "").toLowerCase();
       if (t.includes('limited') || t.includes('破碎') || t.includes('忙碌')) return { score: 80, label: "時間破碎" };
       if (t.includes('flexible') || t.includes('彈性') || t.includes('多')) return { score: 20, label: "時間彈性" };
       return { score: 50, label: "一般作息" };
   }

   if (type === 'knowledge') {
       const k = (data.domain_knowledge_level || "").toLowerCase();
       if (k.includes('high') || k.includes('expert') || k.includes('資深')) return { score: 20, label: "資深玩家" }; // Expert = Low Barrier to understand
       if (k.includes('low') || k.includes('novice') || k.includes('新手')) return { score: 80, label: "認知門檻高" };
       return { score: 50, label: "一般大眾" };
   }

   if (type === 'inertia') {
       const i = (data.change_aversion || "").toLowerCase();
       if (i.includes('high') || i.includes('高')) return { score: 90, label: "高度慣性" };
       if (i.includes('low') || i.includes('低')) return { score: 10, label: "心態開放" };
       return { score: 50, label: "中度慣性" };
   }

   return { score: 50, label: "Unknown" };
};

// Calculate "Perceived" Resistance (The Ghost Value)
// If Delusional: They think barriers are lower than they actually are (e.g. think they are rich -> Low Money Barrier)
const calculatePerceivedResistance = (type: 'money' | 'time' | 'knowledge' | 'inertia', actualScore: number, realityCheck?: RealityCheck): number | null => {
    if (!realityCheck || realityCheck.coherence_level !== 'Delusional') return null;

    // Delusion Logic: "I am powerful/rich/smart" -> Barriers appear LOW (Score ~20)
    if (type === 'money') return 20; // Thinks they are rich
    if (type === 'knowledge') return 20; // Dunning-Kruger (Thinks they know it)
    if (type === 'time') return 20; // Thinks they have time
    
    return null; 
};

// Segmented Energy Bar with Ghost Indicator
const EnergyBar: React.FC<{ 
    icon: React.ElementType, 
    label: string, 
    value: number, 
    ghostValue: number | null,
    subLabel: string 
}> = ({ icon: Icon, label, value, ghostValue, subLabel }) => {
    
    // Severity Config
    let activeClass = "bg-amber-400";
    let iconClass = "bg-amber-50 text-amber-500 border border-amber-100";
    
    if (value > 70) {
        activeClass = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";
        iconClass = "bg-rose-50 text-rose-500 border border-rose-100";
    } else if (value < 40) {
        activeClass = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]";
        iconClass = "bg-emerald-50 text-emerald-500 border border-emerald-100";
    }

    const segments = Array.from({ length: 10 });
    const activeSegments = Math.ceil(value / 10);
    
    // Ghost Logic
    const hasGhost = ghostValue !== null && Math.abs(ghostValue - value) > 20; // Only show if significant gap
    const ghostSegments = hasGhost ? Math.ceil(ghostValue / 10) : 0;

    return (
        <div className="flex items-center gap-3 group select-none relative">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${iconClass}`}>
                <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-end mb-1.5">
                    <span className="text-xs font-bold text-slate-700">{label}</span>
                    <div className="flex items-center gap-2">
                        {hasGhost && (
                            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 bg-slate-100 px-1.5 rounded">
                                <Ghost className="w-3 h-3" /> 
                                自認: {ghostValue && ghostValue < 40 ? 'LOW' : 'HIGH'}
                            </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-medium truncate">{subLabel}</span>
                    </div>
                </div>
                
                <div className="flex gap-1 h-2 w-full relative">
                    {/* Ghost Markers (Underlay) - If Perceived > Actual (Rare for barriers, usually Actual > Perceived) */}
                    
                    {/* Main Markers */}
                    {segments.map((_, i) => {
                        const isActive = i < activeSegments;
                        const isGhost = hasGhost && i < ghostSegments;
                        
                        // Style Logic
                        let segClass = "bg-slate-100";
                        if (isActive) segClass = activeClass;
                        // Ghost Overlay: If active bar is NOT here, but ghost IS here
                        else if (isGhost) segClass = "bg-slate-200 border border-slate-300"; 
                        
                        return (
                            <div key={i} className={`flex-1 rounded-sm transition-all duration-500 relative ${segClass}`}>
                                {/* Ghost Indicator Logic: If Perceived < Actual (Delusion: Thinks it's easy), show Ghost Marker on top of Active Bar */}
                                {hasGhost && i === ghostSegments - 1 && ghostValue && ghostValue < value && (
                                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-0.5 h-4 bg-slate-400 z-10 opacity-50"></div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export const ResistanceEqualizer: React.FC<ResistanceProps> = ({ blindSpot, constraints, realityCheck }) => {
    
    const categories: ('money' | 'time' | 'knowledge' | 'inertia')[] = ['money', 'time', 'knowledge', 'inertia'];
    const labels = { money: "金錢門檻", time: "時間成本", knowledge: "認知門檻", inertia: "心理慣性" };
    const icons = { money: Wallet, time: Clock, knowledge: BookOpen, inertia: Lock };

    return (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col md:flex-row h-full min-h-[240px]">
            {/* Left: Tactical Command */}
            <div className="md:w-[40%] bg-slate-50 p-6 flex flex-col border-b md:border-b-0 md:border-r border-slate-100 relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-transparent opacity-20"></div>
                <div className="flex items-center gap-2 mb-5">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-wide">戰略核心</span>
                </div>
                <div className="flex-1 flex flex-col justify-center gap-4">
                   <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-rose-400"></div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1 pl-2 tracking-wider">主要盲點 (Blind Spot)</span>
                      <div className="text-sm font-bold text-rose-600 flex items-start gap-1.5 pl-2 leading-tight">
                         <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                         {blindSpot.label}
                      </div>
                   </div>
                   <div className="bg-indigo-600 rounded-xl p-3 shadow-lg shadow-indigo-200 relative overflow-hidden text-white group">
                      <div className="absolute -right-4 -top-4 w-12 h-12 bg-white opacity-10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700"></div>
                      <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
                         <Zap className="w-3 h-3 text-amber-300 fill-current" />
                         <span className="text-[9px] font-bold uppercase tracking-wider">建議攻勢</span>
                      </div>
                      <p className="text-xs font-bold leading-relaxed opacity-95">
                         {blindSpot.strategy}
                      </p>
                   </div>
                </div>
            </div>

            {/* Right: Resistance Equalizer */}
            <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex flex-col">
                       <span className="text-xs font-black text-slate-700 uppercase tracking-wide">阻力控制台</span>
                       <span className="text-[9px] font-bold text-slate-400 uppercase">Actual vs Perceived</span>
                   </div>
                   <div className="flex gap-3 text-[9px] font-bold text-slate-400 uppercase bg-slate-50 px-2 py-1 rounded-lg">
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> Safe</div>
                      <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div> High</div>
                   </div>
                </div>
                
                <div className="space-y-5">
                   {categories.map(cat => {
                       const actual = calculateActualResistance(cat, constraints[cat === 'inertia' ? 'emotional' : cat]);
                       const ghost = calculatePerceivedResistance(cat, actual.score, realityCheck);
                       
                       return (
                           <EnergyBar 
                              key={cat}
                              icon={icons[cat]} 
                              label={labels[cat]} 
                              value={actual.score} 
                              ghostValue={ghost}
                              subLabel={actual.label} 
                           />
                       );
                   })}
                </div>
            </div>
        </div>
    );
};
