
import React, { useState, useEffect, useMemo } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { usePersona } from '../context/PersonaContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Activity, Brain, Target, ShieldAlert, Clock, Wallet, BookOpen, Smartphone, 
  Zap, UserCircle, MapPin, MousePointerClick, Layout as LayoutIcon, Eye, 
  AlertTriangle, Lightbulb, Lock, TrendingUp, Tag, Search, Plus, ArrowRight, Beaker,
  CalendarRange, Quote, Users, Anchor, Sparkles, Fingerprint, Dna,
  MessageSquareWarning, HelpCircle
} from 'lucide-react';
import { 
  SectionTitle, InfoCard, TagGroup, EvidenceBadge, 
  TugOfWar, IcebergModel, ActivityThermometer, MarketingTraitsCard, DataGeneCard, QualityScores, AvatarDisplay,
  AttentionMatrix, DecisionDriversCard, ConversionGauge, DaypartingBar, ResistanceEqualizer, RealityAnchor, ChronosCard
} from '../components/dashboard';
import { 
  formatEmotionalBarrier, formatTimeConstraint, getDimensionConfig, analyzeFullPersona, analyzeEmotionalBarrier, analyzeAttentionMode, translateConstraint, getAvatarTitle
} from '../utils/personaAnalytics';
import { 
  normalizePersonaDimensions, normalizeCategoryData, normalizeRadarData, 
  safeGetChannelMix, safeGetAdFormats 
} from '../utils/normalization';
import { useAvatarGenerator } from '../hooks/useAvatarGenerator';
import { generateChronosReport } from '../services/geminiService';

// ====== 設計系統常數 ======
const DESIGN_SYSTEM = {
  container: 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  spacing: {
    section: 'space-y-6 md:space-y-8',
    card: 'space-y-4',
    element: 'gap-3',
  },
  rounded: {
    card: 'rounded-xl md:rounded-2xl',
    cardLarge: 'rounded-2xl md:rounded-3xl',
  },
  shadow: {
    card: 'shadow-sm',
    cardLarge: 'shadow-lg',
  },
  padding: {
    card: 'p-4 sm:p-5 md:p-6',
    cardLarge: 'p-6 md:p-8 lg:p-10',
  },
  minHeight: {
    chart: 'min-h-[320px]',
    card: 'min-h-[280px]',
    large: 'min-h-[400px]',
  }
} as const;

// ====== Grid 配置 ======
const GRID_CONFIG = {
  main: 'grid grid-cols-1 lg:grid-cols-12 gap-6',
  twoColumn: 'grid grid-cols-1 lg:grid-cols-2 gap-6',
  stats: 'grid grid-cols-2 lg:grid-cols-4 gap-3',
} as const;

interface CategoryData {
  name: string;
  fullName: string;
  value: number;
  keywords: string[];
  intent: string;
}

interface RadarData {
  subject: string;
  fullLabel: string;
  A: number;
  fullMark: number;
  keyword?: string; 
}

type DimensionKey = 'novelty_seeking' | 'planning_vs_spontaneous' | 'social_orientation' | 'risk_attitude' | 'financial_sensitivity';

// ====== 輔助函數 ======

const getArchetypeConfig = (type: string) => {
  if (type.includes("直覺") || type.includes("體驗")) return { icon: Zap, color: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100", label: "直覺派", gradient: "from-rose-50 to-white" };
  if (type.includes("邏輯") || type.includes("考據")) return { icon: Brain, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", label: "邏輯派", gradient: "from-blue-50 to-white" };
  if (type.includes("社群") || type.includes("跟風")) return { icon: Users, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100", label: "跟風派", gradient: "from-violet-50 to-white" };
  if (type.includes("慣性") || type.includes("依賴")) return { icon: Anchor, color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-100", label: "習慣派", gradient: "from-slate-100 to-white" };
  return { icon: Search, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100", label: "觀望派", gradient: "from-gray-50 to-white" };
};

// ====== 內部子組件 ======

const StatsGrid: React.FC<{
  devicePref?: string;
  totalEvents?: number;
  activeDays?: number;
  avgPages?: number;
  dataWindow?: { start_date: string; end_date: string };
  aiQualityScore?: number;
}> = ({ devicePref = "Mobile", totalEvents = 0, activeDays = 1, avgPages = 0, dataWindow, aiQualityScore = 0 }) => {
  
  const attentionMode = analyzeAttentionMode(avgPages);
  
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      {/* 1. Activity Thermometer (Prominent) */}
      <div className="flex-1 bg-white/50 rounded-xl p-3 border border-slate-100">
         <span className="text-[10px] uppercase font-bold text-slate-400 mb-2 block tracking-wider">活躍密度 (Density)</span>
         <ActivityThermometer totalEvents={totalEvents} activeDays={activeDays} dataWindow={dataWindow} />
      </div>

      {/* 2. Attention Mode */}
      <div className="flex-1 bg-white/50 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
         <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 text-indigo-500">
            <Eye className="w-5 h-5" />
         </div>
         <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">注意力 (Attention)</span>
            <div className="font-bold text-slate-700 text-sm leading-tight">{attentionMode.label.split(' ')[1]}</div>
            <div className="text-[10px] text-slate-400">{attentionMode.description}</div>
         </div>
      </div>

      {/* 3. AI Quality (Demoted) */}
      <div className="w-full sm:w-auto min-w-[120px] bg-white/30 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
         <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">AI 完整度</span>
         <div className="flex items-center gap-2">
            <Sparkles className={`w-4 h-4 ${aiQualityScore > 70 ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span className={`text-xl font-black ${aiQualityScore > 70 ? 'text-slate-700' : 'text-slate-500'}`}>
               {aiQualityScore}%
            </span>
         </div>
      </div>
    </div>
  );
};

const HumanityGauge: React.FC<{ score?: number }> = ({ score }) => {
  // If score is undefined (Upload Mode without DNA), don't render or show N/A
  if (score === undefined) return null;

  // Determine State
  let label = "一般 (Balanced)";
  let color = "bg-emerald-500";
  let textColor = "text-emerald-600";
  let icon = UserCircle;

  if (score <= 30) {
     label = "完美 (Robot)";
     color = "bg-blue-500";
     textColor = "text-blue-600";
     icon = Brain;
  } else if (score >= 70) {
     label = "混沌 (Chaos)";
     color = "bg-rose-500";
     textColor = "text-rose-600";
     icon = Zap;
  }

  const Icon = icon;

  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-white/50 shadow-sm flex flex-col gap-2">
       <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
             <Fingerprint className="w-3 h-3" /> 人性偏差
          </span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded bg-white ${textColor}`}>
             {score}%
          </span>
       </div>
       
       <div className="relative h-2 bg-slate-200 rounded-full overflow-hidden">
          <div 
             className={`absolute top-0 left-0 h-full ${color} transition-all duration-500 rounded-full`}
             style={{ width: `${score}%` }}
          ></div>
       </div>
       
       <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
          <Icon className={`w-3.5 h-3.5 ${textColor}`} />
          {label}
       </div>
    </div>
  );
};

const ShadowCard: React.FC<{ label?: string }> = ({ label }) => {
   if (!label) return null;
   return (
      <div className="bg-slate-800 text-slate-200 rounded-xl p-3 shadow-lg relative overflow-hidden group">
         <div className="absolute -right-4 -top-4 w-16 h-16 bg-indigo-500 rounded-full blur-xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
         <div className="relative z-10">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
               心理陰影 (Shadow)
            </span>
            <div className="flex items-center gap-2 font-bold text-sm text-white">
               <ShieldAlert className="w-4 h-4 text-rose-400" />
               {label}
            </div>
         </div>
      </div>
   );
};

const ContentPreferenceCard: React.FC<{ 
  data: CategoryData[]; 
  rationale?: string;
}> = ({ data, rationale }) => (
  <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} h-full flex flex-col min-w-0`}>
    <SectionTitle 
      title="內容偏好及關鍵字" 
      subtitle="關注主題與潛在意圖" 
      icon={LayoutIcon} 
      info="展示使用者關注的內容領域、具體觀看的實體關鍵字，以及 AI 判讀背後的瀏覽意圖。數值統計因樣本變異較大，僅列出主題供參考。" 
    />
    
    {/* Behavioral Rationale Injection (Sticky Note Style) */}
    {rationale && (
      <div className="mb-4 bg-yellow-50/80 p-3 rounded-sm border-l-4 border-yellow-400 text-slate-700 text-xs font-medium flex items-start gap-2 shadow-sm animate-fade-in relative">
         <Quote className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600/50" />
         <span className="italic leading-relaxed">{rationale}</span>
      </div>
    )}

    <div className="flex-1 overflow-y-auto pr-1 min-h-[240px]">
      {data && data.length > 0 ? (
        <div className="space-y-3">
          {data.map((item, index) => (
             <div key={index} className="flex flex-col gap-2 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 transition-all hover:bg-slate-50/50">
                {/* Header: Name */}
                <div className="flex items-center gap-2 mb-1">
                   <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-sm"></div>
                   <div className="font-bold text-slate-800 text-sm truncate" title={item.fullName}>
                      {item.fullName}
                   </div>
                </div>

                {/* Keywords Row */}
                <div className="flex flex-wrap gap-1.5 pl-4">
                    {item.keywords && item.keywords.length > 0 ? (
                      item.keywords.map((kw, kIdx) => (
                        <span 
                          key={kIdx} 
                          title={kw}
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-white border border-slate-200 text-slate-600 cursor-default hover:border-indigo-200 transition-colors"
                        >
                           <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                           {kw}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] text-slate-300 italic">無特定關鍵字</span>
                    )}
                 </div>
                 
                 {/* Intent Row (Simplified & Prominent) */}
                 {item.intent && (
                   <div className="ml-4 mt-1 flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{item.intent}</span>
                   </div>
                 )}
             </div>
          ))}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center">
          <div className="text-center space-y-2">
            <LayoutIcon className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-400 font-medium">暫無內容偏好數據</p>
          </div>
        </div>
      )}
    </div>
  </div>
);

// Helper for Color Mapping based on Index or Topic
const getTopicColor = (index: number) => {
    const colors = [
        { fill: '#e0e7ff', text: '#4338ca' }, // Indigo
        { fill: '#dcfce7', text: '#15803d' }, // Emerald
        { fill: '#ffe4e6', text: '#be123c' }, // Rose
        { fill: '#fef3c7', text: '#b45309' }, // Amber
        { fill: '#e0f2fe', text: '#0369a1' }, // Sky
        { fill: '#f3e8ff', text: '#7e22ce' }, // Purple
    ];
    return colors[index % colors.length];
};

// Custom Radar Tick
const CustomRadarTick: React.FC<any> = ({ payload, x, y, cx, cy, index, radarData, isMobile }) => {
    const dataItem = radarData[payload.index];
    const fullLabel = dataItem?.fullLabel || payload.value;
    const keyword = dataItem?.keyword || "";
    
    // UPDATED: More generous character limit (10 characters)
    const limit = 10;
    const isTooLong = fullLabel.length > limit;
    const displayLabel = isTooLong ? fullLabel.substring(0, limit) + '..' : fullLabel;

    // Keyword Truncation - Slightly more space (8 characters)
    const keywordLimit = 8;
    const displayKeyword = keyword.length > keywordLimit ? keyword.substring(0, keywordLimit) + '..' : keyword;

    // Vector Shift - Adjusted for better proximity
    const shiftDistance = isMobile ? 14 : 18; 
    const angle = Math.atan2(y - cy, x - cx);
    const shiftedX = x + Math.cos(angle) * shiftDistance;
    const shiftedY = y + Math.sin(angle) * shiftDistance;

    // Anchor
    let effectiveAnchor: "start" | "middle" | "end" = "middle";
    const threshold = 15;
    if (Math.abs(shiftedX - cx) < threshold) {
        effectiveAnchor = "middle";
    } else if (shiftedX > cx) {
        effectiveAnchor = "start";
    } else {
        effectiveAnchor = "end";
    }
    
    const colors = getTopicColor(index);
    const charWidth = 9;
    const tagPadding = 12;
    const tagWidth = displayKeyword ? (displayKeyword.length * charWidth) + tagPadding : 0;
    const tagHeight = 16;
    
    let tagXOffset = 0;
    if (effectiveAnchor === "middle") tagXOffset = -tagWidth / 2;
    else if (effectiveAnchor === "end") tagXOffset = -tagWidth;

    return (
      <g className="recharts-layer recharts-polar-angle-axis-tick group cursor-help transition-all duration-300">
        <text x={shiftedX} y={shiftedY - 4} textAnchor={effectiveAnchor} fill="#334155" fontSize={isMobile ? 10 : 11} fontWeight={700} className="select-none">{displayLabel}</text>
        {displayKeyword && (
           <g transform={`translate(${shiftedX + tagXOffset}, ${shiftedY + 4})`}>
              <rect width={tagWidth} height={tagHeight} rx={4} fill={colors.fill} stroke={colors.fill} strokeWidth={1} />
              <text x={tagWidth / 2} y={11} textAnchor="middle" fontSize={9} fontWeight={600} fill={colors.text} className="select-none">{displayKeyword}</text>
           </g>
        )}
        <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-75 pointer-events-none" transform={`translate(${shiftedX}, ${shiftedY - 45})`} style={{ zIndex: 9999 }}>
           <rect x={-60} y={0} width={120} height={38} rx={6} fill="#1e293b" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.1))" />
           <path d="M-5,38 L0,43 L5,38 Z" fill="#1e293b" />
           <text x={0} y={15} textAnchor="middle" fill="#f8fafc" fontSize={10} fontWeight={700}>{fullLabel}</text>
           <text x={0} y={28} textAnchor="middle" fill="#cbd5e1" fontSize={9}>{keyword ? `關鍵字: ${keyword}` : '無關鍵字'}</text>
        </g>
      </g>
    );
};

const InterestRadarCard: React.FC<{ 
  data: RadarData[]; 
}> = ({ data }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} h-full flex flex-col min-w-0`}>
      <SectionTitle 
        title="興趣雷達" 
        subtitle="興趣領域強度" 
        icon={Target} 
        info="統計口徑:基於上傳資料中的內容分類與關鍵字頻率進行加權,反映使用者明確展現的興趣強度。" 
      />
      <div className="flex-1 w-full min-h-[280px] relative">
        {data && data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart 
                cx="50%" 
                cy="50%" 
                outerRadius={isMobile ? "45%" : "60%"} 
                margin={{ top: 10, right: 40, bottom: 10, left: 40 }}
                data={data}
              >
                <PolarGrid gridType="polygon" stroke="#e2e8f0" strokeDasharray="4 4"/>
                <PolarAngleAxis dataKey="subject" tick={(props) => <CustomRadarTick {...props} radarData={data} isMobile={isMobile} />} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="興趣強度" dataKey="A" stroke="#6366f1" strokeWidth={2} fill="#818cf8" fillOpacity={0.6} isAnimationActive={true} />
                <Tooltip cursor={false} isAnimationActive={false} content={({ payload }) => {
                    if (payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100">
                          <p className="text-xs font-bold text-slate-500 mb-1">主題 Topic</p>
                          <p className="text-sm font-bold text-indigo-600">{d.fullLabel}</p>
                          {d.keyword && (
                             <div className="flex items-center gap-1 mt-1 bg-indigo-50 px-1.5 py-0.5 rounded w-fit">
                               <Tag className="w-3 h-3 text-indigo-400" />
                               <span className="text-[10px] text-indigo-700 font-medium">{d.keyword}</span>
                             </div>
                          )}
                          <div className="mt-2 text-xs text-slate-400">強度: {d.A.toFixed(0)}/100</div>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
              </RadarChart>
            </ResponsiveContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-2">
              <Target className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-400 font-medium">暫無興趣雷達數據</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AttentionMatrixCard: React.FC<{ data: any[] }> = ({ data }) => (
  <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} h-full flex flex-col min-w-0`}>
    <SectionTitle 
       title="注意力矩陣" 
       subtitle="意圖強度分析" 
       icon={Eye} 
       info="透過時間跨度 (Duration) 與 互動密度 (Intensity) 的交叉分析，區分爆發型、狂熱型與養成型需求。"
    />
    <div className="flex-1 min-h-[300px]">
       <AttentionMatrix data={data} />
    </div>
  </div>
);

// ====== 主組件 ======
const DashboardPage: React.FC = () => {
  const { persona, setPersona } = usePersona();
  const [activeTab, setActiveTab] = useState<'signal' | 'interpretation' | 'activation' | 'context'>('signal');
  
  // Chronos State
  const [isChronosLoading, setIsChronosLoading] = useState(false);

  const { isAvatarLoading, avatarError } = useAvatarGenerator(persona, setPersona);
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChronosGenerate = async () => {
      if (!persona || isChronosLoading) return;
      setIsChronosLoading(true);
      try {
          const report = await generateChronosReport(persona);
          setPersona({ ...persona, chronos_report: report });
      } catch (e) {
          console.error("Chronos Error:", e);
          alert("無法生成時空背景報告，請稍後再試。");
      } finally {
          setIsChronosLoading(false);
      }
  };

  const analyticsCard = useMemo(() => 
    persona ? analyzeFullPersona(persona) : null
  , [persona]);
  
  const categoryData = useMemo(() => 
    persona ? normalizeCategoryData(persona.behavioral_pattern?.content_preference?.top_categories) : []
  , [persona]);
  
  const ldaData = useMemo(() => 
    persona ? normalizeRadarData(persona.behavioral_pattern?.content_preference?.top_lda_topics) : []
  , [persona]);

  const emotionalBarrierStatus = useMemo(() => 
    persona ? analyzeEmotionalBarrier(persona.constraints?.emotional?.change_aversion) : { label: '', isSevere: false, marketingAdvice: '' }
  , [persona]);

  if (!persona) return <Navigate to="/" replace />;
  if (!analyticsCard) return null;

  if (!persona.behavioral_pattern || !persona.personality_profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4">
        <div className="text-center p-6 md:p-8 bg-white rounded-2xl shadow-xl border border-slate-100 max-w-md w-full animate-fade-in">
          <div className="bg-amber-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">數據結構異常</h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed">
            生成的數位雙生數據不完整,請嘗試重新上傳或使用範例數據。
          </p>
          <Link to="/" className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            返回首頁
          </Link>
        </div>
      </div>
    );
  }

  // --- Hero Section Data ---
  const archetype = persona.context_profile?.marketing_archetype?.decision_archetype || "一般觀望型";
  const financialRole = persona.context_profile?.marketing_archetype?.financial_role || "一般";
  const age = persona.context_profile?.age_bucket || "未知年齡";
  const location = persona.context_profile?.location_level || "未知地點";

  const archetypeConfig = getArchetypeConfig(archetype);
  const ArchetypeIcon = archetypeConfig.icon;

  // Reality Check Integration (Phase 3.1 & 3.2)
  const realityCheck = persona.origin_profile?.dna?.reality_check;
  const isDelusional = realityCheck?.coherence_level === 'Delusional';
  
  // Use correction rules if available, otherwise fallback to standard logic
  const displayRole = getAvatarTitle(persona);

  // Quote Logic: Use avatar_hook (Short emotional outburst)
  // If Delusional, update hook context slightly if needed, but usually DNA already handles it
  const hook = persona.interaction_style?.chart_comments?.avatar_hook || 
               persona.interaction_style?.chart_comments?.content_preference || // Legacy fallback
               "這數據看起來挺有意思的...";
  
  // Truncate if too long (failsafe)
  const displayHook = hook.length > 20 ? hook.substring(0, 19) + "..." : hook;

  // Origin Profile Data
  const humanityScore = persona.origin_profile?.humanity_score;
  const shadowLabel = persona.origin_profile?.shadow?.label;

  const renderPersonalityDimensions = () => {
    const dimensionKeys: DimensionKey[] = ['novelty_seeking', 'planning_vs_spontaneous', 'social_orientation', 'risk_attitude', 'financial_sensitivity'];
    const normalizedDimensions = normalizePersonaDimensions(persona.personality_profile?.dimensions);
    return dimensionKeys.map((key) => {
      const config = getDimensionConfig(key);
      const dim = normalizedDimensions[key];
      return <TugOfWar key={key} left={config.left} right={config.right} dimension={dim} />;
    });
  };

  return (
    // [FIX] Force remount on twin_id change to clear internal states
    <div key={persona.twin_id} className={`relative animate-fade-in pb-20 ${DESIGN_SYSTEM.container} ${DESIGN_SYSTEM.spacing.section}`}>
      
      {/* === HERO CHARACTER SECTION (REDESIGNED) === */}
      <section className={`bg-gradient-to-br ${archetypeConfig.gradient} ${DESIGN_SYSTEM.rounded.cardLarge} ${DESIGN_SYSTEM.shadow.cardLarge} border border-slate-200 overflow-hidden relative`}>
        
        {/* Subtle Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>

        <div className={`${DESIGN_SYSTEM.padding.cardLarge} relative z-10`}>
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            
            {/* Avatar Column */}
            <div className="relative group shrink-0 mt-2 lg:mt-0 flex flex-col items-center">
               
               {/* Speech Bubble (Comic Style) - UPDATED FOR SHORT HOOK */}
               <div className="relative mb-6 max-w-[240px] animate-fade-in-up">
                   <div className="absolute -top-3 left-4 text-[9px] font-bold text-slate-400 bg-white/80 backdrop-blur px-2 py-0.5 rounded-full border border-slate-100 z-30 uppercase tracking-wider">
                      HOOK
                   </div>
                   <div className="bg-white text-slate-800 text-sm font-black py-3 px-5 rounded-2xl shadow-lg border border-slate-100 relative z-20 italic leading-tight text-center transform rotate-1">
                      "{displayHook}"
                      {/* Bubble Tail */}
                      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-slate-100 transform rotate-45"></div>
                   </div>
               </div>

               {/* Circle with Delusional Effect */}
               <div className={`w-32 h-32 md:w-40 md:h-40 rounded-full bg-white shadow-2xl ring-4 ${isDelusional ? 'ring-rose-200 animate-pulse' : 'ring-white/50'} flex items-center justify-center overflow-hidden relative z-10`}>
                  <AvatarDisplay avatarUrl={persona.avatar_url} isLoading={isAvatarLoading} error={avatarError} />
               </div>
               
               {/* Archetype Badge */}
               <div className={`absolute -bottom-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full shadow-lg border-2 border-white bg-white text-slate-700 whitespace-nowrap`}>
                  <ArchetypeIcon className={`w-3.5 h-3.5 ${archetypeConfig.color}`} />
                  <span className="text-xs font-black tracking-wide">{archetypeConfig.label}</span>
               </div>
            </div>

            {/* Info Column */}
            <div className="flex-1 min-w-0 flex flex-col items-center lg:items-start text-center lg:text-left space-y-4 w-full">
               
               {/* Character Identity */}
               <div className="w-full">
                  <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight mb-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                     {displayRole}
                     
                     {/* Delusional Badge (NEW - The Irony Mark) */}
                     {isDelusional && (
                        <div className="group relative">
                           <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white text-[10px] font-black rounded-lg shadow-sm border border-rose-400 uppercase tracking-wider transform -rotate-2 cursor-help">
                              <MessageSquareWarning className="w-3 h-3" />
                              認知偏離 (Delusional)
                           </span>
                           {/* Tooltip */}
                           <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center font-medium shadow-xl">
                              系統偵測：此職稱與其實際經濟能力存在嚴重落差。
                              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 rotate-45"></div>
                           </div>
                        </div>
                     )}
                  </h1>
                  
                  {/* Clean Meta Row (No boxes) */}
                  <div className="flex wrap items-center justify-center lg:justify-start gap-4 text-sm font-bold text-slate-500">
                     <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <UserCircle className="w-4 h-4" />
                        {age}
                     </span>
                     <span className="w-px h-3 bg-slate-300"></span>
                     <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <MapPin className="w-4 h-4" />
                        {location}
                     </span>
                     <span className="w-px h-3 bg-slate-300"></span>
                     <span className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                        <Wallet className="w-4 h-4" />
                        {financialRole}
                     </span>
                  </div>
               </div>

               {/* Tags */}
               <div className="opacity-90">
                  <TagGroup tags={persona.personality_profile?.summary_tags || []} />
               </div>
               
               {/* Key Insight */}
               <div className="w-full bg-white/60 p-3 rounded-xl border border-white/50 shadow-sm flex items-start gap-3 text-left mt-2 backdrop-blur-sm">
                   <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                   <p className="text-sm text-slate-700 font-medium leading-relaxed">
                      {analyticsCard.oneLiner}
                   </p>
               </div>
               
               {/* Hero Stats (Promoted) */}
               <div className="w-full pt-4 border-t border-slate-200/50 mt-2">
                   <StatsGrid 
                      devicePref={persona.context_profile?.device_pref?.[0]} 
                      totalEvents={persona.behavioral_pattern?.frequency?.visits_per_month} 
                      activeDays={persona.behavioral_pattern?.frequency?.active_days_ratio}
                      avgPages={persona.behavioral_pattern?.depth?.avg_pages_per_session} 
                      dataWindow={persona.data_window} 
                      aiQualityScore={analyticsCard.qualityReport.qualityScore}
                    />
               </div>
            </div>

            {/* Right Column: Origin DNA Stats (If Available) */}
            {(humanityScore !== undefined || shadowLabel) && (
               <div className="hidden xl:flex flex-col gap-3 w-[200px] shrink-0 border-l border-slate-200/50 pl-6">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                     <Dna className="w-3 h-3" /> Origin DNA
                  </span>
                  
                  {humanityScore !== undefined && <HumanityGauge score={humanityScore} />}
                  {shadowLabel && <ShadowCard label={shadowLabel} />}
               </div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation Tabs */}
      <div className="sticky top-14 md:top-16 lg:top-20 z-30 bg-slate-50/95 backdrop-blur-sm py-2 -mx-4 px-4 sm:mx-0 sm:px-0 transition-all">
        <nav className="flex p-1 bg-white border border-slate-200 rounded-xl shadow-sm max-w-fit mx-auto" role="tablist">
          {[
            { id: 'signal' as const, label: '行為數據', shortLabel: 'Signal', icon: Activity }, 
            { id: 'interpretation' as const, label: '性格透視', shortLabel: 'Story', icon: Brain }, 
            { id: 'activation' as const, label: '攻略建議', shortLabel: 'Action', icon: Zap },
            { id: 'context' as const, label: '時空脈絡', shortLabel: 'Chronos', icon: CalendarRange } // NEW
          ].map((tab) => {
            const Icon = tab.icon; 
            const isActive = activeTab === tab.id;
            return (
              <button 
                key={tab.id} 
                onClick={() => setActiveTab(tab.id)} 
                role="tab" 
                aria-selected={isActive} 
                tabIndex={isActive ? 0 : -1} 
                className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-md' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-300' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.shortLabel}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[500px]">
        {activeTab === 'signal' && (
          <div className={`${DESIGN_SYSTEM.spacing.section} animate-fade-in`}>
            {/* Row 1: Content Preference + Decision Drivers */}
            <div className={GRID_CONFIG.main}>
              <div className={`lg:col-span-8 ${DESIGN_SYSTEM.minHeight.chart}`}>
                <ContentPreferenceCard 
                   data={categoryData} 
                   rationale={persona.interaction_style?.chart_comments?.behavioral_rationale}
                />
              </div>
              <div className={`lg:col-span-4 ${DESIGN_SYSTEM.minHeight.chart}`}>
                <DecisionDriversCard 
                  drivers={analyticsCard.decisionDrivers} 
                  tensionAnalysis={analyticsCard.tensionAnalysis} 
                />
              </div>
            </div>
            
            {/* Row 2: Radar + Attention Matrix */}
            <div className={GRID_CONFIG.main}>
              <div className={`lg:col-span-6 ${DESIGN_SYSTEM.minHeight.chart}`}>
                <InterestRadarCard data={ldaData} />
              </div>
              <div className={`lg:col-span-6 ${DESIGN_SYSTEM.minHeight.chart}`}>
                <AttentionMatrixCard data={analyticsCard.attentionMatrix} />
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'interpretation' && (
          <div className={`${DESIGN_SYSTEM.spacing.section} animate-fade-in`}>
            
            {/* Row 1: Iceberg + Personality (Rebalanced for better height alignment) */}
            <div className={GRID_CONFIG.main}>
                
                {/* Left: Iceberg (Col-7) */}
                <div className="lg:col-span-7 h-full flex flex-col min-w-0">
                    <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} h-full flex flex-col min-w-0`}>
                      <SectionTitle 
                        title="需求冰山圖" 
                        subtitle="顯性目標 vs 隱性渴望" 
                        icon={Target} 
                      />
                      <div className="mt-3 flex-1 min-h-[400px]">
                        <IcebergModel 
                          goals={persona.motivations?.primary_goals || []} 
                          needs={persona.motivations?.latent_needs || []} 
                        />
                      </div>
                    </div>
                </div>

                {/* Right: Personality (Col-5) - No Stacking */}
                <div className="lg:col-span-5 h-full flex flex-col min-w-0">
                    <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} flex flex-col h-full min-h-[400px]`}>
                        <SectionTitle 
                          title="性格光譜分析" 
                          subtitle="Big 5 行為性格特質維度" 
                          icon={Brain} 
                          info="基於行為數據推算的性格傾向，紅色游標代表特殊情境下的性格位移 (Contextual Shift)。" 
                        />
                        <div className="mt-4 flex-1 flex flex-col justify-center">{renderPersonalityDimensions()}</div>
                    </div>
                </div>
            </div>
            
            {/* Row 2: Contradictions + Reality Anchor (Consistent Grid 7:5) */}
            <div className={GRID_CONFIG.main}>
              
              {/* Left: Contradictions (Col-7) */}
              <div className="lg:col-span-7 h-full">
                  <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} flex flex-col h-full min-h-[250px]`}>
                    <SectionTitle 
                      title="矛盾與洞察" 
                      subtitle="行為背後的深層衝突" 
                      icon={ShieldAlert} 
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 flex-1">
                      {persona.contradictions_and_insights?.conflicts?.length > 0 ? (
                        persona.contradictions_and_insights.conflicts.map((conflict, i) => (
                          <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col h-full">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                                {conflict.type}
                              </span>
                            </div>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed mb-2 flex-1">
                              {conflict.description}
                            </p>
                            <EvidenceBadge text={conflict.evidence} />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 text-center text-slate-400 py-6 text-sm flex items-center justify-center h-full">無明顯衝突數據</div>
                      )}
                    </div>
                  </div>
              </div>

              {/* Right: Reality Anchor (Col-5) */}
              <div className="lg:col-span-5 h-full min-h-[250px]">
                 <RealityAnchor 
                    realityCheck={realityCheck} 
                    constraints={persona.constraints} 
                 />
              </div>
            </div>
          </div>
        )}

        {/* ================= ACTIVATION TAB (REDESIGNED) ================= */}
        {activeTab === 'activation' && (
          <div className={`${DESIGN_SYSTEM.spacing.section} animate-fade-in`}>
             {/* COMMAND CENTER GRID */}
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* 1. Conversion Gauge (Left) */}
                <div className="lg:col-span-4 min-h-[320px]">
                   <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} h-full flex flex-col`}>
                      <SectionTitle title="轉換潛力核心" subtitle="Conversion Core" icon={Zap} />
                      <div className="flex-1">
                        <ConversionGauge 
                           analysis={analyticsCard.conversion} 
                           label="綜合評級" 
                        />
                      </div>
                   </div>
                </div>

                {/* 2. DaypartingBar (Right) */}
                <div className="lg:col-span-8 min-h-[320px]">
                   <div className={`bg-white ${DESIGN_SYSTEM.padding.card} ${DESIGN_SYSTEM.rounded.card} border border-slate-100 ${DESIGN_SYSTEM.shadow.card} h-full flex flex-col`}>
                      <SectionTitle title="黃金時機熱點" subtitle="Timeline Heatmap" icon={Clock} />
                      <div className="flex-1 flex flex-col justify-center px-4">
                         <DaypartingBar moments={analyticsCard.goldenMoments} />
                      </div>
                   </div>
                </div>
             </div>

             {/* 3. Resistance Equalizer (Bottom) - UPDATED with Reality Check */}
             <div className="min-h-[250px]">
                 <ResistanceEqualizer 
                    blindSpot={{
                       label: persona.system_state?.composite_flaw?.label || "一般盲點",
                       strategy: analyticsCard.blindSpotStrategy
                    }}
                    constraints={persona.constraints}
                    realityCheck={realityCheck} // Pass the reality check data
                 />
             </div>
          </div>
        )}

        {/* ================= CHRONOS TAB (NEW) ================= */}
        {activeTab === 'context' && (
            <div className={`${DESIGN_SYSTEM.spacing.section} animate-fade-in`}>
                <div className="min-h-[500px]">
                    <ChronosCard 
                        report={persona.chronos_report}
                        isLoading={isChronosLoading}
                        onGenerate={handleChronosGenerate}
                    />
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
