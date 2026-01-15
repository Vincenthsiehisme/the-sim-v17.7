

import React, { useState } from 'react';
import { Zap, Crown, Brain, AlertCircle, Info, TrendingUp, PenTool, ShieldAlert, Heart, Lock } from 'lucide-react';
import { SectionTitle } from '../ui/SectionTitle';
import { TensionAnalysis, MarketingTactic } from '../../../types';

interface Driver {
  label: string;
  score: number;
  type: 'positive' | 'negative';
  generated_tactic?: MarketingTactic;
}

// === 1. Standardized Action Map (Frontend Glossary) ===
const ACTION_GLOSSARY: Record<string, string> = {
  "稀缺性": "製造急迫",
  "新品": "強調首發",
  "熱銷排行": "建立信任",
  "網友口碑": "展示實證",
  "從眾心理": "營造熱度",
  "專家認證": "引用權威",
  "折扣促銷": "溝通讓利",
  "高溢價": "塑尊榮感",
  "質感": "強調工藝",
  "功能實用性": "直擊痛點"
};

// === 2. Driver Definitions (Educational Tooltip) ===
const DRIVER_DEFINITIONS: Record<string, string> = {
  "稀缺性": "利用損失厭惡心理，強調機會稍縱即逝。",
  "新品": "利用多巴胺迴路，滿足大腦對新鮮事物的渴望。",
  "熱銷排行": "利用社會認同原理，降低決策風險。",
  "網友口碑": "透過真實見證建立信任橋樑。",
  "專家認證": "利用權威偏誤，快速建立專業可信度。",
  "折扣促銷": "直接降低金錢成本，提升感知價值。",
  "質感": "透過感官細節描寫，提升心理擁有感。",
  "功能實用性": "理性訴求，強調解決具體問題的效率。"
};

// === 3. Attribute Classification ===
const getDriverNature = (label: string): 'rational' | 'emotional' => {
  const key = label.split(' ')[0];
  const emotionalSet = new Set(["稀缺性", "新品", "熱銷排行", "網友口碑", "從眾心理", "高溢價", "質感"]);
  return emotionalSet.has(key) ? 'emotional' : 'rational';
};

const getKey = (label: string) => label.split(' ')[0];

const generateNarrative = (drivers: Driver[]): string => {
  if (drivers.length === 0) return "尚無足夠數據判讀。";

  const top = drivers[0];
  const topKey = getKey(top.label);
  
  let emotionalScore = 0;
  let rationalScore = 0;
  drivers.forEach(d => {
    if (getDriverNature(d.label) === 'emotional') emotionalScore += d.score;
    else rationalScore += d.score;
  });

  const dominant = emotionalScore > rationalScore ? "感性" : "理性";
  return `用戶決策偏向「${dominant}」，「${topKey}」為核心驅動力。`;
};

// --- Sub-component: Rich Tooltip ---
const DriverTooltip: React.FC<{ driver: Driver, isActive: boolean }> = ({ driver, isActive }) => {
  if (!isActive) return null;

  const key = getKey(driver.label);
  const definition = DRIVER_DEFINITIONS[key] || "影響決策的關鍵心理因素。";
  const strategy = driver.generated_tactic?.tactic || "建議結合產品特點，強調此一優勢。";
  const copyExample = driver.generated_tactic?.copy || "（尚無具體文案範例）";

  return (
    <div className="absolute z-50 left-0 right-0 bottom-full mb-2 bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700 text-xs animate-fade-in pointer-events-none w-full md:w-[120%] md:-left-[10%]">
       <div className="font-bold text-slate-200 mb-2 border-b border-slate-700 pb-2 flex justify-between items-center">
          <span className="text-sm text-white">{key}</span>
          <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-400">心理機制</span>
       </div>
       <p className="text-slate-400 mb-4 leading-relaxed">{definition}</p>
       
       <div className="space-y-3">
          {/* Strategy Section */}
          <div>
            <div className="font-bold text-indigo-300 mb-1 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
               <Brain className="w-3 h-3" />
               <span>策略佈局</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-4 border-l-2 border-slate-700">
               {strategy}
            </p>
          </div>

          {/* Copy Inspiration Section */}
          <div>
            <div className="font-bold text-emerald-300 mb-1 flex items-center gap-1.5 uppercase tracking-wide text-[10px]">
               <PenTool className="w-3 h-3" />
               <span>文案靈感</span>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg border border-slate-600/50 relative mt-1">
               <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-lg"></div>
               <p className="text-white font-medium italic pl-2 leading-relaxed font-serif">
                  "{copyExample}"
               </p>
            </div>
          </div>
       </div>

       {/* Arrow */}
       <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-900 rotate-45 border-r border-b border-slate-700"></div>
    </div>
  );
};

// --- Sub-component: High Tension Breakdown ---
const HighTensionPanel: React.FC<{ breakdown: NonNullable<TensionAnalysis['breakdown']> }> = ({ breakdown }) => (
    <div className="mt-2 bg-white/80 rounded-lg p-3 text-xs border border-rose-200/50 flex flex-col gap-2">
       {/* Conflict Visualizer */}
       <div className="flex items-center justify-between gap-2">
          <div className="flex-1 bg-rose-100/50 p-2 rounded text-rose-800 border border-rose-100">
             <div className="font-bold text-[10px] uppercase text-rose-400 mb-0.5 flex items-center gap-1">
                <Heart className="w-3 h-3" /> 渴望 (Desire)
             </div>
             <div className="leading-tight font-medium">{breakdown.desire_source}</div>
          </div>
          <div className="text-rose-300 font-black text-xs">VS</div>
          <div className="flex-1 bg-slate-100/50 p-2 rounded text-slate-700 border border-slate-200">
             <div className="font-bold text-[10px] uppercase text-slate-400 mb-0.5 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> 恐懼 (Fear)
             </div>
             <div className="leading-tight font-medium">{breakdown.defense_source}</div>
          </div>
       </div>

       {/* Resolution Alibi */}
       <div className="bg-gradient-to-r from-indigo-50 to-white p-2.5 rounded border border-indigo-100 flex gap-2 items-start mt-1">
          <Lock className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
          <div>
             <span className="font-bold text-indigo-700 block text-[10px] uppercase mb-0.5">解鎖金鑰 (Rational Alibi)</span>
             <span className="text-slate-700 leading-snug block">{breakdown.rational_alibi}</span>
          </div>
       </div>
    </div>
);

export const DecisionDriversCard: React.FC<{ 
  drivers: Driver[], 
  tensionAnalysis?: TensionAnalysis 
}> = ({ drivers, tensionAnalysis }) => {
  
  const narrative = generateNarrative(drivers);
  const topDriver = drivers[0];
  const otherDrivers = drivers.slice(1);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const isHighTension = tensionAnalysis && tensionAnalysis.state === 'High_Tension';

  return (
    <div className="bg-white p-4 sm:p-5 md:p-6 rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col min-w-0 relative">
      <SectionTitle 
        title="決策驅動排行" 
        subtitle="Key Decision Drivers" 
        icon={Zap} 
        info="分析使用者對於不同行銷訴求的心理反應強度。滑鼠停留可查看具體文案靈感。" 
      />
      
      {/* 1. Insight Block */}
      <div className="mb-4">
        {isHighTension && tensionAnalysis.breakdown ? (
           <div className="bg-rose-50 p-3 rounded-xl border border-rose-100">
              <div className="flex gap-2 items-center mb-1">
                 <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                 <span className="text-sm font-bold text-rose-700">高衝突警示 (High Tension)</span>
              </div>
              <p className="text-xs text-rose-900/60 mb-2 ml-6">
                使用者處於「想買又不敢買」的糾結狀態。
              </p>
              <HighTensionPanel breakdown={tensionAnalysis.breakdown} />
           </div>
        ) : (
           <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-3 items-start">
              <Brain className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                 {narrative}
              </p>
           </div>
        )}
      </div>

      <div className="flex-1 flex flex-col gap-3 min-h-[200px] relative">
        
        {/* === RANK #1: THE CROWN === */}
        {topDriver ? (() => {
           const nature = getDriverNature(topDriver.label);
           const key = getKey(topDriver.label);
           const actionTag = ACTION_GLOSSARY[key] || "強調優勢";
           
           return (
             <div 
               className="relative p-4 rounded-xl border bg-gradient-to-br from-indigo-50/50 to-white border-indigo-200 shadow-sm group transition-all hover:shadow-md cursor-help"
               onMouseEnter={() => setHoverIndex(0)}
               onMouseLeave={() => setHoverIndex(null)}
             >
                <DriverTooltip driver={topDriver} isActive={hoverIndex === 0} />
                
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-sm">
                         <Crown className="w-3 h-3 fill-amber-300 text-amber-300" />
                      </div>
                      <span className="text-sm font-black text-slate-800 tracking-tight">
                         {key}
                      </span>
                   </div>
                   <div className="text-2xl font-black text-indigo-600 tracking-tighter">
                      {topDriver.score}
                   </div>
                </div>

                <div className="flex items-center gap-2">
                   <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        nature === 'emotional' 
                          ? 'bg-rose-50 text-rose-600 border-rose-100' 
                          : 'bg-blue-50 text-blue-600 border-blue-100'
                     }`}>
                        {nature === 'emotional' ? '感性' : '理性'}
                   </span>
                   
                   <div className="flex items-center gap-1 text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm">
                      <TrendingUp className="w-3 h-3 text-slate-400" />
                      {actionTag}
                   </div>
                   
                   <Info className="w-3 h-3 text-slate-300 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
             </div>
           );
        })() : (
           <div className="text-center text-slate-400 py-10 text-xs">無數據</div>
        )}

        {/* === RANK #2+ List === */}
        <div className="flex flex-col gap-2 mt-1">
          {otherDrivers.map((driver, index) => {
             const idx = index + 1; // Array index 0 is rank 2
             const nature = getDriverNature(driver.label);
             const key = getKey(driver.label);
             const actionTag = ACTION_GLOSSARY[key] || "重點優化";
             
             const barWidth = Math.max(20, driver.score);

             return (
               <div 
                 key={index} 
                 className="relative flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-help group border border-transparent hover:border-slate-100"
                 onMouseEnter={() => setHoverIndex(idx)}
                 onMouseLeave={() => setHoverIndex(null)}
               >
                  <DriverTooltip driver={driver} isActive={hoverIndex === idx} />

                  <div className="w-6 text-center text-xs font-bold text-slate-300">
                     #{idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-slate-700 truncate">{key}</span>
                        <span className="text-[10px] text-slate-400 font-medium group-hover:text-indigo-500 transition-colors">
                           {actionTag}
                        </span>
                     </div>
                     <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div 
                           className={`h-full rounded-full ${nature === 'emotional' ? 'bg-rose-300' : 'bg-blue-300'}`} 
                           style={{ width: `${barWidth}%` }}
                        ></div>
                     </div>
                  </div>

                  <div className="w-8 text-right text-xs font-bold text-slate-600">
                     {driver.score}
                  </div>
               </div>
             );
          })}
        </div>
      </div>
    </div>
  );
};