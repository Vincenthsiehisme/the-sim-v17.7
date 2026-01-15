
import React, { useState } from 'react';
import { IcebergSVG } from './IcebergSVG';
import { Target, Anchor, Search, ChevronDown, AlertCircle, Zap, Eye, MousePointerClick } from 'lucide-react';

interface Goal {
  goal: string;
  evidence?: string;
}

interface Need {
  hypothesis: string;
  confidence?: number;
  evidence?: string;
}

interface IcebergModelProps {
  goals: Goal[];
  needs: Need[];
  isLoading?: boolean;
}

export const IcebergModel: React.FC<IcebergModelProps> = ({
  goals,
  needs,
  isLoading = false,
}) => {
  // Shared state for highlighting (both from List and from SVG nodes)
  const [hoveredState, setHoveredState] = useState<{ section: 'surface' | 'deep' | null, index: number | null }>({ section: null, index: null });
  const [expandedIndex, setExpandedIndex] = useState<{ type: 'goal' | 'need', index: number } | null>(null);

  const toggleExpand = (type: 'goal' | 'need', index: number) => {
    if (expandedIndex?.type === type && expandedIndex?.index === index) {
        setExpandedIndex(null);
    } else {
        setExpandedIndex({ type, index });
    }
  };

  const isEmpty = goals.length === 0 && needs.length === 0;

  // Helper to translate behavior evidence into a short "Signal" label
  const getSignalLabel = (text: string) => {
      if (!text) return "一般瀏覽";
      if (text.includes("Price") || text.includes("Sort") || text.includes("比價")) return "比價行為";
      if (text.includes("Review") || text.includes("Comment") || text.includes("留言")) return "查看評價";
      if (text.includes("Search") || text.includes("query") || text.includes("搜尋")) return "主動搜尋";
      if (text.includes("Cart") || text.includes("Checkout") || text.includes("車")) return "購物意圖";
      return "瀏覽行為";
  };

  // Helper to translate latent need into an "Opportunity" strategy
  const getOpportunityLabel = (hypothesis: string) => {
      const h = hypothesis.toLowerCase();
      if (h.includes("validation") || h.includes("認同")) return "強調社群歸屬感";
      if (h.includes("safety") || h.includes("security") || h.includes("安全")) return "提供無風險保證";
      if (h.includes("superiority") || h.includes("status") || h.includes("優越")) return "塑造尊榮獨特性";
      if (h.includes("control") || h.includes("掌握")) return "強調可自訂選項";
      if (h.includes("fear") || h.includes("fomo")) return "製造稀缺急迫感";
      return "提供情感價值連結";
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-full w-full flex flex-col md:flex-row shadow-sm bg-white select-none group/container">
      
      {/* === LEFT COLUMN: VISUAL ANCHOR (35%) === */}
      <div className="w-full md:w-[35%] lg:w-[30%] relative bg-slate-900 overflow-hidden min-h-[240px] md:min-h-auto flex flex-col border-r border-slate-200">
         {/* Background Gradients */}
         <div className="absolute inset-0 z-0 flex flex-col pointer-events-none">
            <div className="h-[35%] w-full bg-gradient-to-b from-sky-50 via-sky-100 to-cyan-200" />
            <div className="h-[65%] w-full bg-gradient-to-b from-cyan-900 via-slate-900 to-slate-950 relative overflow-hidden">
               {/* Ambient Particles */}
               <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-cyan-400/30 rounded-full animate-pulse" />
               <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-cyan-400/20 rounded-full animate-pulse delay-1000" />
            </div>
         </div>

         {/* The SVG - Now handles highlighting logic internally based on props */}
         <IcebergSVG 
            highlight={hoveredState.section} 
            activeIndex={hoveredState.index}
            // Pass a callback to lift state up when hovering nodes in SVG
            onNodeHover={(section, index) => setHoveredState({ section, index })}
         />

         {/* Overlay Labels (Visual Cues) */}
         <div className="absolute top-6 left-6 z-20 pointer-events-none">
            <div className={`transition-all duration-500 ${hoveredState.section === 'surface' ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest text-sky-700 bg-white/90 backdrop-blur px-3 py-1.5 rounded shadow-sm border border-white/50">
                  Surface
               </span>
            </div>
         </div>
         <div className="absolute bottom-6 left-6 z-20 pointer-events-none">
            <div className={`transition-all duration-500 ${hoveredState.section === 'deep' ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-1'}`}>
               <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 bg-slate-900/60 backdrop-blur px-3 py-1.5 rounded border border-cyan-800 shadow-sm">
                  Deep
               </span>
            </div>
         </div>
      </div>

      {/* === RIGHT COLUMN: INSPECTOR LISTS (65%) === */}
      <div className="w-full md:w-[65%] lg:w-[70%] flex flex-col h-full bg-slate-50 relative z-10">
         
         {/* Empty State */}
         {isEmpty && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-30 bg-white/80 backdrop-blur-sm">
               <div className="text-center p-6 text-slate-400">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">尚無資料</p>
               </div>
            </div>
         )}

         {/* 1. SURFACE ZONE (Top Half) */}
         <div className="flex-1 flex flex-col px-5 py-4 overflow-y-auto bg-white border-b-4 border-slate-100 relative custom-scrollbar">
            <div className="sticky top-0 bg-white/95 backdrop-blur z-10 pb-3 border-b border-slate-50 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-sky-600 pl-1">
                   <Target className="w-4 h-4" />
                   <span className="text-xs font-black uppercase tracking-wider">顯性目標 (Goals)</span>
                </div>
            </div>
            
            <div className="space-y-3 px-1 pb-2">
               {goals.slice(0, 3).map((g, i) => {
                  const isExpanded = expandedIndex?.type === 'goal' && expandedIndex.index === i;
                  // Highlight if hovered via list OR via SVG node
                  const isHovered = hoveredState.section === 'surface' && hoveredState.index === i;
                  
                  return (
                     <div 
                        key={i} 
                        className={`group border rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                           isHovered 
                              ? 'bg-sky-50 border-sky-300 shadow-md translate-x-1' 
                              : 'bg-white border-slate-200 hover:border-sky-200 hover:shadow-sm'
                        }`}
                        onMouseEnter={() => setHoveredState({ section: 'surface', index: i })}
                        onMouseLeave={() => setHoveredState({ section: null, index: null })}
                        onClick={() => toggleExpand('goal', i)}
                     >
                        {isHovered && <div className="absolute left-0 top-0 bottom-0 w-1 bg-sky-500"></div>}
                        <div className="p-3 md:p-4 flex items-start gap-3">
                           <div className="flex-1">
                              {/* Primary Text: Goal */}
                              <p className="text-sm font-bold text-slate-700 leading-relaxed mb-1">{g.goal}</p>
                              
                              {/* Secondary Text: Translated Signal (Always visible in minimal form) */}
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                 <MousePointerClick className="w-3 h-3" />
                                 <span className="uppercase tracking-wide font-bold text-sky-600">
                                    訊號: {getSignalLabel(g.evidence || "")}
                                 </span>
                              </div>

                              {/* Expanded Evidence Detail */}
                              <div className={`grid transition-all duration-300 ease-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                 <div className="min-h-0 pt-1">
                                    <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 flex gap-2 items-start">
                                       <Search className="w-3 h-3 shrink-0 mt-0.5 text-slate-400" />
                                       <span className="leading-relaxed">{g.evidence || "無具體佐證"}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform mt-0.5 ${isExpanded ? 'rotate-180 text-sky-500' : ''}`} />
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

         {/* 2. DEEP ZONE (Bottom Half) - Darker Theme */}
         <div className="flex-1 flex flex-col px-5 py-4 overflow-y-auto bg-slate-900/5 relative custom-scrollbar">
            <div className="sticky top-0 bg-[#f1f5f9]/95 backdrop-blur z-10 pb-3 border-b border-slate-200/50 mb-4 flex justify-between items-center">
                <div className="flex items-center gap-2 text-cyan-700 pl-1">
                   <Anchor className="w-4 h-4" />
                   <span className="text-xs font-black uppercase tracking-wider">隱性渴望 (Latent Needs)</span>
                </div>
            </div>

            <div className="space-y-3 px-1 pb-2">
               {needs.slice(0, 4).map((n, i) => {
                  const isExpanded = expandedIndex?.type === 'need' && expandedIndex.index === i;
                  const isHovered = hoveredState.section === 'deep' && hoveredState.index === i;
                  
                  return (
                     <div 
                        key={i} 
                        className={`group border rounded-xl transition-all cursor-pointer relative overflow-hidden ${
                           isHovered 
                              ? 'bg-slate-800 border-cyan-500 shadow-lg text-white translate-x-1' 
                              : 'bg-white border-slate-200 hover:border-cyan-300 hover:shadow-sm'
                        }`}
                        onMouseEnter={() => setHoveredState({ section: 'deep', index: i })}
                        onMouseLeave={() => setHoveredState({ section: null, index: null })}
                        onClick={() => toggleExpand('need', i)}
                     >
                        {isHovered && <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400"></div>}
                        <div className="p-3 md:p-4 flex items-start gap-3">
                           
                           <div className="flex-1">
                              {/* Primary Text: Hypothesis */}
                              <p className={`text-sm font-bold leading-relaxed transition-colors mb-1 ${
                                 isHovered ? 'text-white' : 'text-slate-700'
                              }`}>
                                 {n.hypothesis}
                              </p>
                              
                              {/* Secondary Text: Translated Opportunity (Insight Translation) */}
                              <div className={`flex items-center gap-1.5 text-[10px] transition-colors ${isHovered ? 'text-cyan-300' : 'text-slate-400'}`}>
                                 <Zap className="w-3 h-3" />
                                 <span className="uppercase tracking-wide font-bold">
                                    切入機會: {getOpportunityLabel(n.hypothesis)}
                                 </span>
                              </div>

                              {/* Expanded Detail */}
                              <div className={`grid transition-all duration-300 ease-out overflow-hidden ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-2' : 'grid-rows-[0fr] opacity-0'}`}>
                                 <div className="min-h-0 pt-1">
                                    <div className="text-xs text-cyan-100 bg-slate-700 p-2 rounded-lg border border-slate-600 flex gap-2 items-start">
                                       <Eye className="w-3 h-3 shrink-0 mt-0.5 opacity-50" />
                                       <span className="leading-relaxed opacity-90">{n.evidence || "由行為模式推論"}</span>
                                    </div>
                                 </div>
                              </div>
                           </div>
                           
                           <ChevronDown className={`w-4 h-4 transition-transform mt-0.5 ${
                              isExpanded ? 'rotate-180 text-cyan-400' : 'text-slate-300'
                           }`} />
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>

      </div>
    </div>
  );
};
