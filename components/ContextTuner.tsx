

import React, { useState, useEffect } from 'react';
import { usePersona } from '../context/PersonaContext';
import { Sliders, RotateCcw, Wallet, Zap, EyeOff, Search, Info, AlertTriangle, PanelRightClose, PanelRightOpen, ShoppingCart, BookOpen, Check, Coffee, Clock, MessageCircle, MessageSquareDashed, Instagram, User, ChevronDown, ChevronRight, LayoutGrid } from 'lucide-react';
import { calculateBaselines } from '../utils/personaAnalytics';
import { ScenarioMode, SimulationModifiers, SocialPlatform } from '../types';

// === DYNAMIC TIER CONFIGURATION ===
// Returns different labels/descriptions based on scenario mode
const getTierConfig = (mode: ScenarioMode) => ({
  budget_anxiety: mode === 'sales' ? [
    { value: 10, label: "闊綽", desc: "金錢寬裕，只在乎品質與服務，對價格極不敏感。", color: "text-emerald-600", bg: "bg-emerald-500", dot: "bg-emerald-500" },
    { value: 30, label: "寬裕", desc: "願意為更好的體驗支付溢價。", color: "text-emerald-500", bg: "bg-emerald-400", dot: "bg-emerald-400" },
    { value: 50, label: "理性", desc: "會計算性價比，覺得划算才會購買。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "拮据", desc: "預算有限，主動尋找折扣，對原價有抗性。", color: "text-orange-500", bg: "bg-orange-400", dot: "bg-orange-400" },
    { value: 90, label: "生存", desc: "拒絕一切非必要開支，價格是唯一考量。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
  ] : mode === 'content' ? [
    // Content Mode: Value Threshold
    { value: 10, label: "高價值門檻", desc: "只看權威來源或獨家深度內容，拒絕農場文。", color: "text-emerald-600", bg: "bg-emerald-500", dot: "bg-emerald-500" },
    { value: 30, label: "重視質感", desc: "偏好排版精美、資訊密度高的優質內容。", color: "text-emerald-500", bg: "bg-emerald-400", dot: "bg-emerald-400" },
    { value: 50, label: "一般標準", desc: "內容有趣或實用即可，不特別挑剔來源。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "來者不拒", desc: "容易被聳動標題吸引，對內容品質要求不高。", color: "text-orange-500", bg: "bg-orange-400", dot: "bg-orange-400" },
    { value: 90, label: "低門檻", desc: "只尋找免費資源或懶人包，拒絕付費訂閱。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
  ] : [
    // Friend Mode: Generosity / Financial Values
    { value: 10, label: "慷慨", desc: "願意請客，不計較小錢，大方分享。", color: "text-emerald-600", bg: "bg-emerald-500", dot: "bg-emerald-500" },
    { value: 30, label: "大方", desc: "出去玩願意分擔多一點，不會斤斤計較。", color: "text-emerald-500", bg: "bg-emerald-400", dot: "bg-emerald-400" },
    { value: 50, label: "AA制", desc: "親兄弟明算帳，公平分攤，互不佔便宜。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "節省", desc: "會提議去便宜的地方，對價格比較敏感。", color: "text-orange-500", bg: "bg-orange-400", dot: "bg-orange-400" },
    { value: 90, label: "哭窮", desc: "總是說自己沒錢，甚至會想佔朋友便宜。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
  ],
  patience: mode === 'sales' ? [
    { value: 10, label: "極度急躁", desc: "流程需在3秒內完成，極易放棄結帳。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
    { value: 30, label: "沒空等待", desc: "討厭繁瑣註冊或過長載入時間。", color: "text-orange-500", bg: "bg-orange-400", dot: "bg-orange-400" },
    { value: 50, label: "普通耐心", desc: "可以接受標準的購物與結帳流程。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "願意等待", desc: "為了買到好東西，願意花時間填表或等待預購。", color: "text-emerald-500", bg: "bg-emerald-400", dot: "bg-emerald-400" },
    { value: 90, label: "極具耐心", desc: "會詳細閱讀所有條款，不介意複雜流程。", color: "text-emerald-600", bg: "bg-emerald-500", dot: "bg-emerald-500" },
  ] : mode === 'content' ? [
    // Content Mode: Reading Patience
    { value: 10, label: "標題掃描", desc: "只讀標題和粗體字，稍微太長直接跳出。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
    { value: 30, label: "缺乏耐性", desc: "需要懶人包或重點摘要，無法閱讀長文。", color: "text-orange-500", bg: "bg-orange-400", dot: "bg-orange-400" },
    { value: 50, label: "一般閱讀", desc: "會閱讀有興趣的段落，篇幅適中即可。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "願意深讀", desc: "能夠閱讀長篇深度報導或技術文件。", color: "text-emerald-500", bg: "bg-emerald-400", dot: "bg-emerald-400" },
    { value: 90, label: "重度鑽研", desc: "會逐字閱讀並查證細節，熱愛硬核內容。", color: "text-emerald-600", bg: "bg-emerald-500", dot: "bg-emerald-500" },
  ] : [
    // Friend Mode: Listening Patience
    { value: 10, label: "插嘴王", desc: "完全沒耐心聽你說完，急著表達自己的意見。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
    { value: 30, label: "急躁", desc: "會頻繁看手機或打斷，希望能快點講重點。", color: "text-orange-500", bg: "bg-orange-400", dot: "bg-orange-400" },
    { value: 50, label: "一般傾聽", desc: "有在聽，也會適時回應，但不會太深入。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "耐心傾聽", desc: "願意花時間聽你訴苦，不會隨便打斷。", color: "text-emerald-500", bg: "bg-emerald-400", dot: "bg-emerald-400" },
    { value: 90, label: "心靈導師", desc: "極度有耐心，引導你說出心裡話。", color: "text-emerald-600", bg: "bg-emerald-500", dot: "bg-emerald-500" },
  ],
  social_mask: [
    { value: 10, label: "真實直言", desc: "完全透明，心裡想什麼就說什麼，不修飾。", color: "text-violet-600", bg: "bg-violet-500", icon: EyeOff, dot: "bg-violet-500" },
    { value: 30, label: "直率", desc: "講話直接，好惡分明，不太客套。", color: "text-indigo-500", bg: "bg-indigo-400", dot: "bg-indigo-400" },
    { value: 50, label: "一般社交", desc: "維持基本的禮貌與社會互動規範。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 70, label: "客套禮貌", desc: "會講場面話，為了禮貌可能不會直接拒絕。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-300" },
    { value: 90, label: "官方防備", desc: "回答像公關稿，隱藏真實意圖，難以測知真心。", color: "text-slate-400", bg: "bg-slate-300", dot: "bg-slate-400" },
  ],
  purchase_intent: mode === 'sales' ? [
    { value: 10, label: "隨意閒逛", desc: "無目的瀏覽，容易分心跳出。", color: "text-slate-400", bg: "bg-slate-300", dot: "bg-slate-300" },
    { value: 30, label: "觀望中", desc: "有一點興趣，但還沒打算行動。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-400" },
    { value: 50, label: "比較評估", desc: "正在評估不同選項，會看性價比。", color: "text-indigo-500", bg: "bg-indigo-400", dot: "bg-indigo-400" },
    { value: 70, label: "目標明確", desc: "知道自己要什麼，只在意規格是否符合。", color: "text-amber-600", bg: "bg-amber-500", dot: "bg-amber-500" },
    { value: 90, label: "急迫需求", desc: "為了解決問題願意妥協，轉換率極高。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
  ] : mode === 'content' ? [
    // Content Mode: Goal Orientation
    { value: 10, label: "殺時間", desc: "只是無聊滑手機，沒有特定目的。", color: "text-slate-400", bg: "bg-slate-300", dot: "bg-slate-300" },
    { value: 30, label: "隨意瀏覽", desc: "看看有沒有什麼有趣的新鮮事。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-400" },
    { value: 50, label: "興趣探索", desc: "對特定主題感興趣，願意花時間了解。", color: "text-indigo-500", bg: "bg-indigo-400", dot: "bg-indigo-400" },
    { value: 70, label: "尋找答案", desc: "帶著具體問題來尋找解決方案。", color: "text-amber-600", bg: "bg-amber-500", dot: "bg-amber-500" },
    { value: 90, label: "學術研究", desc: "正在進行系統性的資料蒐集與研究。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
  ] : [
    // Friend Mode: Topic Interest
    { value: 10, label: "敷衍", desc: "對話題沒興趣，只想句點你。", color: "text-slate-400", bg: "bg-slate-300", dot: "bg-slate-300" },
    { value: 30, label: "放空", desc: "聽聽而已，沒什麼反應。", color: "text-slate-500", bg: "bg-slate-400", dot: "bg-slate-400" },
    { value: 50, label: "禮貌回應", desc: "會適當回應，維持對話熱度。", color: "text-indigo-500", bg: "bg-indigo-400", dot: "bg-indigo-400" },
    { value: 70, label: "感興趣", desc: "覺得話題有趣，會主動分享看法。", color: "text-amber-600", bg: "bg-amber-500", dot: "bg-amber-500" },
    { value: 90, label: "超投入", desc: "對話題充滿熱情，會一直聊下去。", color: "text-rose-600", bg: "bg-rose-500", dot: "bg-rose-500" },
  ],
});

// Mapping for Slider Titles
const SLIDER_LABELS: Record<ScenarioMode, Record<string, string>> = {
  sales: {
    budget_anxiety: "預算敏感度",
    patience: "交易耐心",
    social_mask: "社交防備",
    purchase_intent: "購買意圖"
  },
  content: {
    budget_anxiety: "價值門檻",
    patience: "閱讀耐性",
    social_mask: "互動活躍",
    purchase_intent: "目的導向"
  },
  friend: {
    budget_anxiety: "金錢觀念",
    patience: "傾聽耐心",
    social_mask: "社交防備",
    purchase_intent: "話題興趣"
  }
};

// Helper: Find nearest tier index
const getTierIndex = (val: number) => {
  if (val <= 20) return 0;
  if (val <= 40) return 1;
  if (val <= 60) return 2;
  if (val <= 80) return 3;
  return 4;
};

// Component: 5-Step Segmented Control
const TierControl: React.FC<{
  label: string;
  icon: React.ElementType;
  value: number;
  baseline: number;
  configKey: keyof ReturnType<typeof getTierConfig>;
  mode: ScenarioMode;
  onChange: (val: number) => void;
}> = ({ label, icon: Icon, value, baseline, configKey, mode, onChange }) => {
  
  const tiers = getTierConfig(mode)[configKey];
  const currentIndex = getTierIndex(value);
  const baselineIndex = getTierIndex(baseline);
  const activeTier = tiers[currentIndex];

  const isExtreme = currentIndex === 0 || currentIndex === 4;
  const isChanged = currentIndex !== baselineIndex;

  return (
    <div className="space-y-3 pt-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
          <Icon className={`w-4 h-4 ${isChanged ? 'text-indigo-500' : 'text-slate-400'}`} />
          {label}
        </div>
        {/* Current State Label (Top Right) */}
        <div className={`text-xs font-black ${activeTier.color} transition-colors duration-300`}>
           {activeTier.label}
        </div>
      </div>

      {/* The 5-Step Track */}
      <div className="relative h-10 flex items-center justify-between px-1 bg-slate-50 rounded-xl border border-slate-100 select-none">
         {/* Baseline Marker (Ghost) */}
         <div 
            className="absolute h-full w-[20%] border-2 border-slate-300/50 rounded-lg pointer-events-none transition-all duration-300 z-0 top-0"
            style={{ left: `${baselineIndex * 20}%` }}
            title="原始分析設定 (Original)"
         >
            <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-300 rounded-full"></div>
         </div>

         {/* Steps */}
         {tiers.map((tier, idx) => {
            const isActive = idx === currentIndex;
            return (
               <button
                 key={idx}
                 onClick={() => onChange(tier.value)}
                 className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 group focus:outline-none`}
               >
                  <div className={`
                     w-3 h-3 rounded-full transition-all duration-300
                     ${isActive ? `${tier.bg} scale-150 shadow-md` : 'bg-slate-200 group-hover:bg-slate-300'}
                  `}></div>
               </button>
            );
         })}
      </div>

      {/* Impact Preview Box */}
      <div className={`
         relative p-3 rounded-lg border text-xs leading-relaxed transition-all duration-300 whitespace-pre-line
         ${isExtreme ? 'bg-amber-50/50 border-amber-100' : 'bg-white border-slate-100'}
      `}>
         {isExtreme && (
            <div className="absolute top-2 right-2 animate-pulse">
               <AlertTriangle className="w-3 h-3 text-amber-400" />
            </div>
         )}
         <div className="flex gap-2">
            <Info className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${activeTier.color}`} />
            <span className="text-slate-600">
               {activeTier.desc}
            </span>
         </div>
      </div>
    </div>
  );
};

interface ContextTunerProps {
  excludeModes?: ScenarioMode[];
}

export const ContextTuner: React.FC<ContextTunerProps> = ({ excludeModes = [] }) => {
  const { persona, simulationModifiers, resetModifiers, applyModifiers, scenarioMode, setScenarioMode } = usePersona();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Local Draft State
  const [draftModifiers, setDraftModifiers] = useState<SimulationModifiers | null>(null);
  const [draftMode, setDraftMode] = useState<ScenarioMode>(scenarioMode);

  // Sync draft with global context on mount or when context changes externally
  useEffect(() => {
    if (simulationModifiers) {
      setDraftModifiers(simulationModifiers);
    }
    setDraftMode(scenarioMode);
  }, [simulationModifiers, scenarioMode]);

  if (!persona || !draftModifiers) return null;

  const baselines = calculateBaselines(persona);

  const updateDraft = (key: keyof SimulationModifiers, val: any) => {
     setDraftModifiers(prev => prev ? ({ ...prev, [key]: val }) : null);
  };

  const activePlatform = draftModifiers.social_context?.platform || 'General';

  const handlePlatformSelect = (platform: SocialPlatform) => {
      let contextDesc = "一般社交狀態";
      let updates: Partial<SimulationModifiers> = { 
          social_context: { platform, description: contextDesc }
      };

      // PRESET LOGIC: Apply platform-specific heuristics to sliders
      if (platform === 'LINE') {
          contextDesc = "在封閉親友群組中，傾向客氣、長輩圖風、避免衝突。";
          updates = {
              ...updates,
              social_mask: 90, // Polite
              patience: 70,    // Patient listener
              social_context: { platform, description: contextDesc }
          };
      } else if (platform === 'PTT') {
          contextDesc = "在匿名論壇中，講話直白、帶刺、使用鄉民用語。";
          updates = {
              ...updates,
              social_mask: 10, // Raw/Honest
              patience: 30,    // Impatient
              social_context: { platform, description: contextDesc }
          };
      } else if (platform === 'IG') {
          contextDesc = "在公開社群中，重視人設形象、氛圍感與簡潔。";
          updates = {
              ...updates,
              social_mask: 70, // Image conscious
              budget_anxiety: Math.max(draftModifiers.budget_anxiety - 20, 10), // Spend for vibes
              social_context: { platform, description: contextDesc }
          };
      } else {
          // General / Reset to Baseline
          contextDesc = "回歸原始設定的自然互動狀態。";
          updates = {
              ...updates,
              budget_anxiety: baselines.budget_anxiety,
              patience: baselines.patience,
              social_mask: baselines.social_mask,
              purchase_intent: baselines.purchase_intent,
              social_context: undefined
          };
      }

      setDraftModifiers(prev => prev ? ({ ...prev, ...updates }) : null);
  };

  const handleApply = () => {
    if (draftModifiers) {
      const platform = draftModifiers.social_context?.platform;
      let msg = '--- 系統狀態已更新 (System Updated) ---';
      
      // Smart message logic
      if (platform && platform !== 'General') {
          msg = `--- 切換場景：${platform} ---`;
      } else if (draftMode !== scenarioMode) {
          const modeLabels: Record<string, string> = { sales: '銷售模式', content: '內容模式', friend: '閒聊模式' };
          msg = `--- 切換為：${modeLabels[draftMode]} ---`;
      }

      applyModifiers(draftModifiers, msg);
      setScenarioMode(draftMode);
    }
  };
  
  const handleReset = () => {
      resetModifiers();
      setDraftMode(scenarioMode);
  };

  const isDirty = (JSON.stringify(draftModifiers) !== JSON.stringify(simulationModifiers)) || (draftMode !== scenarioMode);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full transition-all duration-300 ease-in-out ${isCollapsed ? 'w-[70px]' : 'w-[320px]'}`}>
      
      {/* Header */}
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center h-[24px]">
            {isCollapsed ? (
            <button onClick={toggleCollapse} className="w-full flex justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                <PanelRightOpen className="w-5 h-5" />
            </button>
            ) : (
            <>
                <div className="flex items-center gap-2 text-indigo-900 font-black text-sm uppercase tracking-wide">
                <LayoutGrid className="w-4 h-4" />
                平台場景 (Context)
                </div>
                <div className="flex items-center gap-1">
                <button 
                    onClick={handleReset}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                    title="重置回原始數據"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
                <button onClick={toggleCollapse} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors">
                    <PanelRightClose className="w-4 h-4" />
                </button>
                </div>
            </>
            )}
        </div>

        {/* Platform Switcher Grid */}
        {!isCollapsed && (
            <div className="grid grid-cols-4 gap-2 mb-1">
               <button 
                  onClick={() => handlePlatformSelect('LINE')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${
                     activePlatform === 'LINE' 
                       ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
                       : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                  }`}
               >
                  <MessageCircle className={`w-5 h-5 mb-1 ${activePlatform === 'LINE' ? 'fill-emerald-200' : ''}`} />
                  <span className="text-[9px] font-bold">LINE</span>
               </button>
               <button 
                  onClick={() => handlePlatformSelect('PTT')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${
                     activePlatform === 'PTT' 
                       ? 'bg-slate-800 border-slate-900 text-white shadow-md' 
                       : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                  }`}
               >
                  <MessageSquareDashed className={`w-5 h-5 mb-1 ${activePlatform === 'PTT' ? 'text-amber-400' : ''}`} />
                  <span className="text-[9px] font-bold">PTT</span>
               </button>
               <button 
                  onClick={() => handlePlatformSelect('IG')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${
                     activePlatform === 'IG' 
                       ? 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700 shadow-sm' 
                       : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                  }`}
               >
                  <Instagram className={`w-5 h-5 mb-1 ${activePlatform === 'IG' ? 'text-fuchsia-500' : ''}`} />
                  <span className="text-[9px] font-bold">IG</span>
               </button>
               <button 
                  onClick={() => handlePlatformSelect('General')}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all border ${
                     activePlatform === 'General' 
                       ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' 
                       : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:border-slate-300'
                  }`}
               >
                  <User className="w-5 h-5 mb-1" />
                  <span className="text-[9px] font-bold">原始</span>
               </button>
            </div>
        )}
        
        {/* Narrative Feedback */}
        {!isCollapsed && activePlatform !== 'General' && draftModifiers.social_context && (
            <div className="bg-white/50 border border-slate-200/50 p-2 rounded-lg text-[10px] text-slate-500 leading-snug animate-fade-in flex gap-2">
               <Info className="w-3 h-3 shrink-0 mt-0.5 text-indigo-400" />
               {draftModifiers.social_context.description}
            </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative pb-20">
         {isCollapsed ? (
            /* MINI MODE (Icons only) */
            <div className="flex flex-col gap-4 py-4 items-center">
               <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 text-slate-400 mb-2">
                  {draftMode === 'sales' ? <ShoppingCart className="w-4 h-4"/> : draftMode === 'content' ? <BookOpen className="w-4 h-4"/> : <Coffee className="w-4 h-4" />}
               </div>
               <div className="w-8 h-px bg-slate-100"></div>
               <button onClick={toggleCollapse} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors">
                  <Wallet className="w-5 h-5" />
               </button>
            </div>
         ) : (
            /* FULL MODE */
            <div className="p-5 space-y-6">
                
                {/* 1. Mode Switcher (Moved here for better flow) */}
                <div className="space-y-2">
                   <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pl-1">目標模式</div>
                   <div className="bg-slate-50 p-1 rounded-xl flex border border-slate-100">
                      {!excludeModes.includes('sales') && (
                      <button 
                         onClick={() => setDraftMode('sales')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            draftMode === 'sales' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'
                         }`}
                      >
                         <ShoppingCart className="w-3.5 h-3.5" /> 銷售
                      </button>
                      )}
                      {!excludeModes.includes('content') && (
                      <button 
                         onClick={() => setDraftMode('content')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            draftMode === 'content' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'
                         }`}
                      >
                         <BookOpen className="w-3.5 h-3.5" /> 內容
                      </button>
                      )}
                      {!excludeModes.includes('friend') && (
                      <button 
                         onClick={() => setDraftMode('friend')}
                         className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                            draftMode === 'friend' ? 'bg-white shadow-sm text-indigo-600 ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'
                         }`}
                      >
                         <Coffee className="w-3.5 h-3.5" /> 閒聊
                      </button>
                      )}
                   </div>
                </div>

                {/* 2. Advanced Parameters (Collapsible) */}
                <div className="border-t border-slate-100 pt-4">
                   <button 
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center justify-between w-full text-left group mb-2"
                   >
                      <span className="text-xs font-bold text-slate-500 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                         <Sliders className="w-3.5 h-3.5" />
                         微調社交參數 (Advanced)
                      </span>
                      {showAdvanced ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                   </button>
                   
                   {/* Always keep Purchase Intent visible or put it outside? Let's put everything inside for cleaner look as requested by "Details-Collapsed" */}
                   {showAdvanced && (
                      <div className="space-y-8 pt-2 animate-fade-in">
                        <TierControl 
                           label={SLIDER_LABELS[draftMode].social_mask} 
                           icon={EyeOff} 
                           configKey="social_mask"
                           value={draftModifiers.social_mask} 
                           baseline={baselines.social_mask}
                           mode={draftMode}
                           onChange={(v) => updateDraft('social_mask', v)}
                        />

                        <TierControl 
                           label={SLIDER_LABELS[draftMode].purchase_intent} 
                           icon={Search} 
                           configKey="purchase_intent"
                           value={draftModifiers.purchase_intent} 
                           baseline={baselines.purchase_intent}
                           mode={draftMode}
                           onChange={(v) => updateDraft('purchase_intent', v)}
                        />

                        <TierControl 
                           label={SLIDER_LABELS[draftMode].budget_anxiety} 
                           icon={Wallet} 
                           configKey="budget_anxiety"
                           value={draftModifiers.budget_anxiety} 
                           baseline={baselines.budget_anxiety}
                           mode={draftMode}
                           onChange={(v) => updateDraft('budget_anxiety', v)}
                        />

                        <TierControl 
                           label={SLIDER_LABELS[draftMode].patience} 
                           icon={Clock} 
                           configKey="patience"
                           value={draftModifiers.patience} 
                           baseline={baselines.patience}
                           mode={draftMode}
                           onChange={(v) => updateDraft('patience', v)}
                        />
                      </div>
                   )}
                </div>
            </div>
         )}
         
         {/* Floating Apply Button */}
         {!isCollapsed && isDirty && (
             <div className="absolute bottom-4 left-4 right-4 z-20 animate-fade-in-up">
                <button 
                   onClick={handleApply}
                   className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                   <Check className="w-5 h-5" />
                   套用變更 (Apply)
                </button>
             </div>
         )}
      </div>
    </div>
  );
};