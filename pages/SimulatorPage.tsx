
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { usePersona } from '../context/PersonaContext';
import { runMarketingSimulation } from '../services/geminiService';
import { useAvatarGenerator } from '../hooks/useAvatarGenerator';
import { ContextTuner } from '../components/ContextTuner';
import { AvatarDisplay } from '../components/dashboard';
import { Sparkles, Trophy, XCircle, TrendingUp, AlertTriangle, Target, Loader2, Zap, Brain, Sliders, Beaker, Settings2, X, ShoppingCart, BookOpen, Activity, Mic, Lock } from 'lucide-react';
import { getAvatarTitle } from '../utils/personaAnalytics';

// === NEW: Cognitive Stream Loader Component ===
const CognitiveStreamLoader: React.FC<{ contextMode: string }> = ({ contextMode }) => {
    const [step, setStep] = useState(0);
    
    // The sequence of "thoughts" to display
    const steps = [
        "正在解析行銷訴求 (Analyzing)...",
        "搜尋市場競品資訊 (Grounding)...",
        "連線 PTT/論壇風向 (Social Check)...",
        "比對個人預算限制 (Constraints)...",
        "計算購買衝動 (Calculation)...", 
        "生成最終反應 (Generating)..."
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setStep(prev => (prev + 1) % steps.length);
        }, 1200); // Change text every 1.2s for dynamic feel
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur-md flex flex-col items-center justify-center text-center animate-fade-in">
           {/* Animated Brain/Processor */}
           <div className="w-24 h-24 bg-white rounded-full shadow-2xl flex items-center justify-center mb-8 relative ring-4 ring-indigo-50">
              <div className="absolute inset-0 border-t-4 border-indigo-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-b-4 border-indigo-300 rounded-full animate-spin-reverse opacity-50"></div>
              <Brain className="w-10 h-10 text-indigo-600 animate-pulse" />
           </div>
           
           <h3 className="text-2xl font-black text-slate-800 mb-4 tracking-tight">模擬演算中</h3>
           
           {/* Dynamic Text Stream */}
           <div className="h-8 overflow-hidden relative w-full max-w-xs">
               <div key={step} className="animate-fade-in-up text-sm font-bold text-indigo-600">
                   {steps[step]}
               </div>
           </div>
           
           <p className="text-xs text-slate-400 mt-6 max-w-xs mx-auto leading-relaxed px-4">
              AI 分身正在模擬 <span className="font-bold text-slate-600">{contextMode === 'sales' ? '消費決策' : '內容互動'}</span> 路徑...
           </p>
        </div>
    );
};

// === NEW: Polygraph Panel Component ===
const PolygraphPanel: React.FC<{ 
    gutFeeling: string, 
    verbal: string, 
    actionProb: number, 
    realityCheck: string,
    avatarUrl?: string,
    isLoading: boolean,
    error: string | null,
    title: string
}> = ({ gutFeeling, verbal, actionProb, realityCheck, avatarUrl, isLoading, error, title }) => {
    
    // Determine status color for Action Probability
    let probColor = "bg-slate-400";
    if (actionProb >= 80) probColor = "bg-emerald-500";
    else if (actionProb >= 50) probColor = "bg-indigo-500";
    else if (actionProb >= 20) probColor = "bg-amber-500";
    else probColor = "bg-rose-500";

    // Bluff Detection
    // Simple heuristic: If action is low (<30) but verbal length is high or positive sentiment (hard to detect sentiment purely here, but we rely on reality check string usually)
    // Actually, let's use the explicit 'system_reality_check' content or action probability
    const isBluffing = actionProb < 30 && realityCheck.length > 5; 

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            {/* 1. Verbal Layer (The Surface) */}
            <div className="pt-10 pb-5 px-5 flex gap-4 border-b border-slate-100 relative">
                <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-100 shadow-sm shrink-0 bg-slate-50 relative z-10">
                        <AvatarDisplay avatarUrl={avatarUrl} isLoading={isLoading} error={error} simple />
                    </div>
                    {/* Gut Feeling Bubble (The Comic Thought Style) */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 z-20 w-max max-w-[150px]">
                        <div className="bg-slate-800 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl shadow-md relative border border-slate-600">
                            {gutFeeling}
                            {/* Bubble Tail */}
                            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[6px] border-t-slate-800"></div>
                        </div>
                    </div>
                </div>
                
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-bold text-slate-800 text-sm truncate">{title}</span>
                        <div className="flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-500 font-bold uppercase tracking-wide shrink-0">
                            <Mic className="w-3 h-3" /> 
                            Verbal Response
                        </div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-2xl rounded-tl-none border border-slate-100 text-slate-700 text-sm leading-relaxed relative">
                        "{verbal}"
                    </div>
                </div>
            </div>

            {/* 2. Action Layer (The Truth) */}
            <div className="bg-slate-50/50 p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        真實行動機率 (Action Probability)
                    </div>
                    {isBluffing && (
                        <div className="flex items-center gap-1 text-[10px] font-black bg-rose-100 text-rose-600 px-2 py-0.5 rounded border border-rose-200 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            BLUFF DETECTED
                        </div>
                    )}
                </div>

                {/* Progress Bar */}
                <div className="h-4 bg-slate-200 rounded-full overflow-hidden relative">
                    <div 
                        className={`h-full ${probColor} transition-all duration-1000 relative`}
                        style={{ width: `${actionProb}%` }}
                    >
                        <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                    </div>
                    {/* Tick Marks */}
                    <div className="absolute inset-0 flex justify-between px-2">
                        <div className="w-px h-full bg-white/50"></div>
                        <div className="w-px h-full bg-white/50"></div>
                        <div className="w-px h-full bg-white/50"></div>
                        <div className="w-px h-full bg-white/50"></div>
                    </div>
                </div>
                
                <div className="flex justify-between text-[10px] font-bold text-slate-400 px-1">
                    <span>0% (Abandon)</span>
                    <span className="text-slate-800 text-lg leading-none -mt-2">{actionProb}%</span>
                    <span>100% (Convert)</span>
                </div>

                {/* 3. System Truth (Reality Check) */}
                <div className="flex gap-3 bg-white border border-slate-200 p-3 rounded-xl shadow-inner mt-1">
                    <div className="p-1.5 bg-slate-100 rounded text-slate-400 h-fit shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase block mb-0.5">系統判讀 (System Log)</span>
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            {realityCheck}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SimulatorPage: React.FC = () => {
  const { persona, simulatorState, setSimulatorState, setPersona, simulationModifiers, scenarioMode, setScenarioMode } = usePersona();
  const [isSimulating, setIsSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Mobile Tab State: 'setup' | 'results'
  const [activeMobileTab, setActiveMobileTab] = useState<'setup' | 'results'>('setup');
  const [showTunerMobile, setShowTunerMobile] = useState(false);
  
  const { isAvatarLoading, avatarError } = useAvatarGenerator(persona, setPersona);

  // === AUTO-RESET TO SALES/CONTENT MODE ===
  // If user enters Simulator from Chat (Friend Mode), reset to 'sales' (default) or keep 'content' if appropriate.
  // Simulator should NEVER be in 'friend' mode.
  useEffect(() => {
    if (scenarioMode === 'friend') {
        // Default fallback to sales, or could infer from persona data source
        setScenarioMode('sales');
    }
  }, [scenarioMode, setScenarioMode]);

  // Auto-switch tab to results on successful simulation
  useEffect(() => {
    if (simulatorState.result && !isSimulating) {
        setActiveMobileTab('results');
    }
  }, [simulatorState.result, isSimulating]);

  // Calculate Victory Stats (Delta & Classification)
  const victoryStats = useMemo(() => {
    if (!simulatorState.result) return null;
    const { scores, winner } = simulatorState.result;
    const delta = Math.abs(scores.a - scores.b);
    
    if (winner === 'Tie') {
        return { label: "🤝 勢均力敵 (Draw)", color: "bg-slate-100 text-slate-600 border-slate-200", delta: 0 };
    }
    
    // Victory Classification Logic
    if (delta >= 30) return { label: "🚀 壓倒性勝利 (Landslide)", color: "bg-indigo-50 text-indigo-700 border-indigo-200", delta };
    if (delta >= 10) return { label: "✨ 顯著勝出 (Solid Win)", color: "bg-emerald-50 text-emerald-700 border-emerald-200", delta };
    return { label: "⚖️ 些微差距 (Marginal)", color: "bg-amber-50 text-amber-700 border-amber-200", delta };
  }, [simulatorState.result]);

  if (!persona) return <Navigate to="/" replace />;

  const { campaignName, copyA, copyB, result } = simulatorState;
  const decisionArchetype = persona.context_profile?.marketing_archetype?.decision_archetype || "一般觀望型";

  const handleSimulate = async () => {
    if (!copyA.trim() || !copyB.trim()) return;
    
    setIsSimulating(true);
    setError(null);
    setSimulatorState(prev => ({ ...prev, result: null }));
    
    // On mobile, switch to results tab immediately to show loading
    setActiveMobileTab('results');

    try {
      // Prepend Context info to Campaign Name to inform AI about the mode
      const contextPrefix = scenarioMode === 'sales' ? "[MODE: PRODUCT SALES]" : "[MODE: CONTENT ENGAGEMENT]";
      const effectiveCampaignName = `${contextPrefix} ${campaignName}`;

      // Pass scenarioMode to simulation service
      const simResult = await runMarketingSimulation(persona, effectiveCampaignName, copyA, copyB, simulationModifiers, scenarioMode);
      setSimulatorState(prev => ({ ...prev, result: simResult }));
    } catch (err) {
      console.error(err);
      setError("模擬失敗，請稍後再試。");
      setActiveMobileTab('setup'); // Go back to fix inputs
    } finally {
      setIsSimulating(false);
    }
  };

  const fillDemoData = () => {
    if (scenarioMode === 'sales') {
        setSimulatorState(prev => ({
           ...prev,
           campaignName: "新款降噪耳機推廣",
           copyA: "【限時優惠】最後 3 小時！擁有頂級靜謐體驗，現在下單現折 $500。再不買就沒貨了！",
           copyB: "在喧囂的世界，找回屬於你的寧靜。專為通勤族設計的極致降噪，讓每一次聆聽都是享受。"
        }));
    } else {
        setSimulatorState(prev => ({
           ...prev,
           campaignName: "AI 趨勢分析報告 (訂閱制)",
           copyA: "【懶人包】只要 3 分鐘，搞懂未來 5 年 AI 發展趨勢！點擊領取重點摘要。",
           copyB: "深度解析：從技術底層到商業應用，這份 50 頁的白皮書將為你揭示 AI 的真實面貌。"
        }));
    }
  };

  const updateState = (key: keyof typeof simulatorState, value: any) => {
    setSimulatorState(prev => ({ ...prev, [key]: value }));
  };

  return (
    // MAIN LAYOUT: Full Height, No Global Scroll
    <div className="w-full max-w-[1600px] mx-auto h-[calc(100vh-125px)] flex flex-col md:flex-row gap-4 px-2 md:px-6 py-2 md:py-3 animate-fade-in relative">
      
      {/* MOBILE TABS (Visible only on small screens) */}
      <div className="md:hidden flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-sm mb-2 shrink-0">
         <button 
            onClick={() => setActiveMobileTab('setup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
               activeMobileTab === 'setup' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
         >
            <Settings2 className="w-4 h-4" /> 實驗設定
         </button>
         <button 
            onClick={() => setActiveMobileTab('results')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
               activeMobileTab === 'results' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500'
            }`}
         >
            <Beaker className="w-4 h-4" /> 模擬結果
            {result && <span className="w-2 h-2 rounded-full bg-emerald-500"></span>}
         </button>
         <button 
            onClick={() => setShowTunerMobile(true)}
            className="w-10 flex items-center justify-center border-l border-slate-100 text-slate-400"
         >
            <Sliders className="w-4 h-4" />
         </button>
      </div>

      {/* === COLUMN 1: EXPERIMENT SETUP (Left) === */}
      {/* On mobile: Hidden if tab is not setup */}
      <div className={`
         w-full md:w-[35%] lg:w-[30%] flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full relative z-10 transition-transform
         ${activeMobileTab === 'setup' ? 'flex' : 'hidden md:flex'}
      `}>
         <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
            <h2 className="font-black text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
               <Settings2 className="w-4 h-4 text-indigo-500" />
               實驗參數 (Setup)
            </h2>
            <button onClick={fillDemoData} className="text-[10px] bg-white border border-slate-200 px-2 py-1 rounded text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-colors">
               載入範例
            </button>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
            
            {/* Scenario Mode Toggle (Read Only here, controlled in Tuner) */}
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                   <span className="font-bold">當前模式:</span>
                   {scenarioMode === 'sales' ? (
                      <span className="flex items-center gap-1 text-indigo-600 font-bold"><ShoppingCart className="w-3 h-3" /> 產品銷售</span>
                   ) : (
                      <span className="flex items-center gap-1 text-indigo-600 font-bold"><BookOpen className="w-3 h-3" /> 內容推廣</span>
                   )}
                </div>
                <button onClick={() => setShowTunerMobile(true)} className="text-[10px] text-indigo-500 underline md:hidden">更改</button>
                <span className="text-[10px] text-slate-400 hidden md:inline">請在右側面板切換</span>
            </div>

            {/* Campaign Name */}
            <div>
               <label className="block text-xs font-bold text-slate-500 mb-1.5 ml-1">活動/內容主題</label>
               <input 
                  type="text" 
                  value={campaignName}
                  onChange={(e) => updateState('campaignName', e.target.value)}
                  placeholder={scenarioMode === 'sales' ? "e.g. 雙11限時促銷..." : "e.g. 年度趨勢報告..."}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-300"
               />
            </div>

            {/* Copy A */}
            <div className="group">
               <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="text-xs font-bold text-indigo-600">方案 A (Blue)</label>
                  <span className="text-[10px] text-slate-300">{copyA.length} chars</span>
               </div>
               <div className="relative">
                  <div className="absolute top-3 left-0 w-1 h-6 bg-indigo-500 rounded-r"></div>
                  <textarea 
                     value={copyA}
                     onChange={(e) => updateState('copyA', e.target.value)}
                     placeholder="輸入第一種行銷訴求..."
                     className="w-full h-36 pl-4 pr-3 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm outline-none resize-none focus:border-indigo-400 focus:bg-indigo-50/10 transition-all placeholder:text-slate-300 leading-relaxed"
                  />
               </div>
            </div>

            {/* Copy B */}
            <div className="group">
               <div className="flex justify-between items-center mb-1.5 ml-1">
                  <label className="text-xs font-bold text-emerald-600">方案 B (Green)</label>
                  <span className="text-[10px] text-slate-300">{copyB.length} chars</span>
               </div>
               <div className="relative">
                  <div className="absolute top-3 left-0 w-1 h-6 bg-emerald-500 rounded-r"></div>
                  <textarea 
                     value={copyB}
                     onChange={(e) => updateState('copyB', e.target.value)}
                     placeholder="輸入第二種行銷訴求..."
                     className="w-full h-36 pl-4 pr-3 py-3 bg-white border-2 border-slate-100 rounded-xl text-sm outline-none resize-none focus:border-emerald-400 focus:bg-emerald-50/10 transition-all placeholder:text-slate-300 leading-relaxed"
                  />
               </div>
            </div>
         </div>

         {/* Sticky Footer Button */}
         <div className="p-4 border-t border-slate-100 bg-white/90 backdrop-blur-sm z-20">
            <button
               onClick={handleSimulate}
               disabled={!copyA.trim() || !copyB.trim() || isSimulating}
               className="w-full py-3.5 bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
               {isSimulating ? (
                  <>
                     <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                     <span className="text-slate-300">模擬演算中...</span>
                  </>
               ) : (
                  <>
                     <Beaker className="w-5 h-5 text-indigo-400 group-hover:rotate-12 transition-transform" />
                     <span>開始模擬 (Run)</span>
                  </>
               )}
            </button>
         </div>
      </div>

      {/* === COLUMN 2: REACTION CHAMBER (Center) === */}
      <div className={`
         w-full md:w-[65%] lg:w-[45%] flex flex-col bg-slate-100/50 rounded-2xl border border-slate-200 shadow-inner overflow-hidden h-full relative
         ${activeMobileTab === 'results' ? 'flex' : 'hidden md:flex'}
      `}>
         {/* Background Grid */}
         <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

         <div className="px-5 py-4 border-b border-slate-200/50 bg-white/60 backdrop-blur-sm flex justify-between items-center shrink-0 z-10">
            <h2 className="font-black text-slate-700 flex items-center gap-2 text-sm uppercase tracking-wide">
               <Target className="w-4 h-4 text-rose-500" />
               反應艙 (Reaction)
            </h2>
            {result && (
               <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  已完成
               </span>
            )}
         </div>

         {/* Loading Overlay with Cognitive Stream */}
         {isSimulating && (
            <CognitiveStreamLoader contextMode={scenarioMode} />
         )}

         {/* Content Area */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 relative z-0">
            {!result && !isSimulating && !error && (
               <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-6 opacity-60">
                  <div className="relative">
                     <div className="w-32 h-32 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center bg-slate-50">
                        <Beaker className="w-12 h-12 text-slate-300" />
                     </div>
                     <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-sm border border-slate-200">
                        <Target className="w-6 h-6 text-indigo-300" />
                     </div>
                  </div>
                  <div className="text-center">
                     <p className="font-bold text-lg text-slate-500">準備就緒 (Ready)</p>
                     <p className="text-xs max-w-[200px] mx-auto mt-1 leading-relaxed">
                        請在左側選擇情境、輸入文案並點擊開始，觀察分身的真實反應。
                     </p>
                  </div>
               </div>
            )}

            {error && (
               <div className="h-full flex items-center justify-center">
                  <div className="bg-white p-6 rounded-2xl border border-rose-100 shadow-sm text-center max-w-sm">
                     <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-3 text-rose-500">
                        <AlertTriangle className="w-6 h-6" />
                     </div>
                     <h3 className="font-bold text-slate-800 mb-1">模擬發生錯誤</h3>
                     <p className="text-xs text-slate-500">{error}</p>
                  </div>
               </div>
            )}

            {result && victoryStats && (
               <div className="space-y-6 animate-fade-in-up pb-10">
                  
                  {/* 1. WINNER CARD (REFACTORED FOR VISIBILITY) */}
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group hover:shadow-md transition-all">
                     <div className={`absolute top-0 left-0 w-full h-1.5 ${
                        result.winner === 'A' ? 'bg-indigo-500' : result.winner === 'B' ? 'bg-emerald-500' : 'bg-slate-400'
                     }`}></div>
                     
                     <div className="p-6 text-center relative">
                        {/* Dynamic Badge */}
                        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wide mb-6 shadow-sm ${victoryStats.color}`}>
                           <span>{victoryStats.label}</span>
                           {victoryStats.delta > 0 && (
                               <>
                                  <span className="w-px h-3 bg-current opacity-20"></span>
                                  <span>+{victoryStats.delta} 分</span>
                               </>
                           )}
                        </div>
                        
                        <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center justify-center gap-2">
                           {result.winner === 'Tie' ? '平分秋色' : `方案 ${result.winner} 勝出`}
                        </h2>
                        
                        {/* SCORE BARS - FIXED LAYOUT */}
                        <div className="flex justify-center items-end gap-8 mb-4">
                           {/* Option A Column */}
                           <div className="flex flex-col items-center gap-2 w-24">
                              <span className={`text-4xl font-black transition-all ${
                                 result.winner === 'A' ? 'text-indigo-600 scale-110' : 'text-slate-400'
                              }`}>
                                 {result.scores.a}
                              </span>
                              
                              {/* Fixed Height Track */}
                              <div className="h-32 w-16 bg-slate-100 rounded-xl relative flex items-end overflow-hidden border border-slate-200">
                                 <div 
                                    className={`w-full transition-all duration-1000 ease-out relative ${
                                       result.winner === 'A' ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]' : 'bg-slate-300'
                                    }`}
                                    style={{ height: `${result.scores.a}%` }}
                                 >
                                    {result.winner === 'A' && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30"></div>}
                                 </div>
                              </div>
                              
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Option A</span>
                           </div>

                           {/* VS Divider */}
                           <div className="h-20 w-px bg-slate-200 opacity-50 mb-8"></div>

                           {/* Option B Column */}
                           <div className="flex flex-col items-center gap-2 w-24">
                              <span className={`text-4xl font-black transition-all ${
                                 result.winner === 'B' ? 'text-emerald-600 scale-110' : 'text-slate-400'
                              }`}>
                                 {result.scores.b}
                              </span>
                              
                              {/* Fixed Height Track */}
                              <div className="h-32 w-16 bg-slate-100 rounded-xl relative flex items-end overflow-hidden border border-slate-200">
                                 <div 
                                    className={`w-full transition-all duration-1000 ease-out relative ${
                                       result.winner === 'B' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-slate-300'
                                    }`}
                                    style={{ height: `${result.scores.b}%` }}
                                 >
                                    {result.winner === 'B' && <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/30"></div>}
                                 </div>
                              </div>
                              
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-2">Option B</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* 2. POLYGRAPH PANEL (NEW) */}
                  <PolygraphPanel 
                     gutFeeling={result.gut_feeling}
                     verbal={result.verbal_response || result.reasoning} // Fallback
                     actionProb={result.action_probability || 50} 
                     realityCheck={result.system_reality_check || result.deep_rationale}
                     avatarUrl={persona.avatar_url}
                     isLoading={isAvatarLoading}
                     error={avatarError}
                     title={getAvatarTitle(persona)}
                  />

                  {/* 3. ANALYSIS GRID */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     {/* Rationale */}
                     <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                           <div className="p-1.5 bg-indigo-50 rounded text-indigo-600">
                              <Brain className="w-4 h-4" />
                           </div>
                           <span className="text-xs font-bold text-slate-700 uppercase">深層動機解析</span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed pl-1">
                           {result.deep_rationale}
                        </p>
                     </div>

                     {/* Triggers */}
                     <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                        <div className="flex items-center gap-2 mb-3 text-emerald-700 font-bold text-xs uppercase">
                           <TrendingUp className="w-4 h-4" /> 推力 (Boosters)
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {result.psychological_triggers.positive.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-white text-emerald-600 text-[10px] font-bold rounded shadow-sm border border-emerald-100">{t}</span>
                           ))}
                        </div>
                     </div>

                     {/* Blockers */}
                     <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                        <div className="flex items-center gap-2 mb-3 text-rose-700 font-bold text-xs uppercase">
                           <XCircle className="w-4 h-4" /> 阻力 (Blockers)
                        </div>
                        <div className="flex flex-wrap gap-2">
                           {result.psychological_triggers.negative.map((t, i) => (
                              <span key={i} className="px-2 py-1 bg-white text-rose-600 text-[10px] font-bold rounded shadow-sm border border-rose-100">{t}</span>
                           ))}
                        </div>
                     </div>
                  </div>

                  {/* 4. SUGGESTION */}
                  <div className="bg-slate-800 text-slate-200 p-5 rounded-2xl shadow-lg relative overflow-hidden">
                     <div className="absolute -right-4 -top-4 w-20 h-20 bg-indigo-500 rounded-full blur-2xl opacity-20"></div>
                     <div className="relative z-10 flex gap-3">
                        <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                           <h4 className="font-bold text-white text-sm mb-1">AI 優化建議</h4>
                           <p className="text-xs leading-relaxed opacity-90">
                              {result.suggested_refinement}
                           </p>
                        </div>
                     </div>
                  </div>

               </div>
            )}
         </div>
      </div>

      {/* === COLUMN 3: VARIABLES (Right) === */}
      <div className={`
         w-full lg:w-[25%] hidden lg:block h-full min-w-[300px]
      `}>
         <ContextTuner excludeModes={['friend']} />
      </div>

      {/* MOBILE TUNER OVERLAY */}
      {showTunerMobile && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm md:hidden flex justify-end animate-fade-in">
           <div className="w-[85%] max-w-[320px] bg-white h-full shadow-2xl animate-fade-in-right flex flex-col">
              <div className="p-2 flex justify-end border-b border-slate-100">
                 <button onClick={() => setShowTunerMobile(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-slate-200">
                    <X className="w-5 h-5" />
                 </button>
              </div>
              <div className="flex-1 overflow-hidden p-2 pt-0 bg-slate-50">
                 <ContextTuner excludeModes={['friend']} />
              </div>
           </div>
        </div>
      )}

    </div>
  );
};

export default SimulatorPage;
