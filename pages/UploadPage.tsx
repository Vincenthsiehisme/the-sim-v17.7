
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, ArrowRight, Sparkles, FileSpreadsheet, Settings2, X, ShoppingCart, MessageSquare, Trash2, History, Database, HelpCircle, AlertTriangle, BrainCircuit, PenTool, FileCheck, CheckCircle2, Terminal, Plus, FileText, Quote, Eye, CreditCard, ScanLine, Lightbulb, UserCog, Dna, FlaskConical, Target, Zap, ShieldAlert, Heart, RefreshCw, Search, Fingerprint, Microscope, Atom, RotateCcw, Download, Activity, TrendingUp, DollarSign, Crown, Lock, Scale, FileBarChart, Clock, Package, ShoppingBag, ArrowDown, Info, Hammer, MapPin } from 'lucide-react';
import { usePersona } from '../context/PersonaContext';
import { analyzeDataAndCreatePersona, synthesizePersonaData, enrichPersonaRole, mirrorPersonaFromProduct } from '../services/geminiService';
import { useChatMessages } from '../context/PersonaContext';
import { getAvatarTitle } from '../utils/personaAnalytics';
import { scanCsvData, DataHealthReport } from '../utils/simpleScanner';
import { DataHealthIndicator } from '../components/upload/DataHealthIndicator';
import { OriginProfile, PersonaDNA, GenderOption, PersonaCandidate } from '../types';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB Limit

// Optimized Sample Data
const SAMPLE_CSV_DATA = `timestamp,action,category,subject,value,context,details
2023-10-01 23:15:00,search,Health,Sleep_Quality,,Mobile,"query: how to cure insomnia naturally"
2023-10-01 23:20:00,view,Health,Blog_Deep_Sleep_Tips,180,Mobile,
2023-10-01 23:45:00,view,Shopping,Weighted_Blanket_Pro,2500,Mobile,"checking specs"
2023-10-01 23:50:00,add_to_cart,Shopping,Weighted_Blanket_Pro,2500,Mobile,
2023-10-01 23:55:00,checkout_start,Shopping,Checkout_Page,,Mobile,
2023-10-01 23:56:00,abandon_cart,Shopping,Checkout_Page,,Mobile,"shipping fee 150 is too high"
2023-10-02 12:10:00,search,Finance,High_Yield_Savings,,Desktop,"query: best savings account 2023"
2023-10-02 12:15:00,view,Finance,Bank_Comparison_Table,300,Desktop,"comparing interest rates"
2023-10-02 12:25:00,sort,Shopping,Weighted_Blanket_List,,Desktop,"sort by: price low to high"
2023-10-02 12:30:00,view,Shopping,Cheap_Fleece_Blanket,499,Desktop,
2023-10-03 20:00:00,click,Ad,Supplement_Magnesium,10,Mobile,"campaign: retargeting_sleep"
2023-10-03 20:05:00,view,Health,Magnesium_Benefits,120,Mobile,
2023-10-04 09:00:00,view,News,Tech_New_iPhone_Review,60,Desktop,"just skimming"
2023-10-05 23:30:00,view,Social,Forum_Sleep_Disorders,400,Mobile,"reading comments"
2023-10-05 23:40:00,comment,Social,Forum_Post,,Mobile,"I've tried everything, nothing works."
2023-10-06 12:00:00,search,Shopping,Discount_Code_SleepWell,,Desktop,
2023-10-06 12:05:00,purchase,Shopping,Magnesium_Supplement,850,Desktop,"used coupon: WELCOME10"
2023-10-07 19:30:00,view,Entertainment,Youtube_LoFi_Music,1200,Tablet,"background music"
2023-10-08 10:00:00,survey,Feedback,NPS_Score,7,Mobile,
2023-10-08 10:05:00,survey,Feedback,Comment,,Mobile,"Good product but delivery was slow."
2023-10-10 22:15:00,view,Finance,Crypto_Bitcoin_Price,15,Mobile,"quick check"
2023-10-10 22:20:00,view,Finance,Crypto_ETH_Price,10,Mobile,
2023-10-12 23:50:00,search,Health,Melatonin_Side_Effects,,Mobile,`;

// Pipeline Steps
const PIPELINE_STEPS = [
  { id: 'init', label: '初始化', icon: Loader2 },
  { id: 'analyst', label: 'Omniscient Observer', icon: Database, desc: '全知視角：事實與意圖提取' },
  { id: 'psych', label: 'Profiler', icon: BrainCircuit, desc: '心理側寫：極端性格建模' },
  { id: 'actor', label: 'Method Actor', icon: PenTool, desc: '方法演技：缺陷與語氣注入' },
  { id: 'reviewer', label: 'Assembly', icon: FileCheck, desc: '最終審核與系統組裝' },
  { id: 'visual', label: 'Avatar Rendering', icon: Sparkles, desc: '3D 頭像與視覺生成' }
];

// Scenario Options
const SCENARIO_OPTIONS = [
  { 
    id: 'auto', 
    title: '智能託管 (Auto)', 
    desc: '由 AI 分析角色身份，自動匹配最合適的性格弱點。',
    default_chaos: 50,
    icon: BrainCircuit,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    accent: 'bg-indigo-500'
  },
  { 
    id: 'fomo', 
    title: '爆款潛力測試', 
    desc: '模擬「跟風盲從」心態，測試產品話題性。', 
    default_chaos: 60,
    icon: TrendingUp,
    color: 'text-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    accent: 'bg-rose-500'
  },
  { 
    id: 'cp', 
    title: '定價防禦測試', 
    desc: '模擬「極致比價」心態，對價格極度敏感。', 
    default_chaos: 20,
    icon: DollarSign,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    accent: 'bg-emerald-500'
  },
  { 
    id: 'vibe', 
    title: '品牌溢價測試', 
    desc: '模擬「外貌協會」心態，重視顏值與氛圍。', 
    default_chaos: 70,
    icon: Crown,
    color: 'text-violet-500',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    accent: 'bg-violet-500'
  },
  { 
    id: 'hater', 
    title: '酸民壓力測試', 
    desc: '模擬「預設懷疑」心態，進行最嚴苛的信任考驗。', 
    default_chaos: 80,
    icon: ShieldAlert,
    color: 'text-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    accent: 'bg-amber-500'
  }
];

// ... MethodologyVisualizer ...
const MethodologyVisualizer: React.FC<{ mode: 'upload' | 'lab' | 'product' }> = ({ mode }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 mb-8 relative">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
           <div className="md:w-1/3 shrink-0">
              <div className="flex items-center gap-2 mb-2">
                 <div className={`p-2 rounded-lg ${mode === 'upload' ? 'bg-indigo-100 text-indigo-600' : mode === 'lab' ? 'bg-violet-100 text-violet-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    {mode === 'upload' ? <Search className="w-5 h-5" /> : mode === 'lab' ? <FlaskConical className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />}
                 </div>
                 <h3 className="font-black text-slate-800 text-lg">
                    {mode === 'upload' ? '行為偵測模式' : mode === 'lab' ? '基因合成模式' : '產品雷達模式'}
                 </h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                 {mode === 'upload' 
                    ? '「全知觀察者」將分析您的原始數據，並透過 Open Data 進行現實校準，揪出言行不一的矛盾。' 
                    : mode === 'lab' 
                      ? '「社會工程師」將根據您的設定，注入台灣真實社會參數，從零建構具備合理缺陷的虛擬人格。'
                      : '「市場人類學家」將分析產品特徵，反向推導潛在的買家樣貌，找出您可能忽略的精緻窮或衝動型受眾。'
                 }
              </p>
           </div>
           <div className="flex-1 w-full mt-4 md:mt-0">
              <div className="flex flex-col md:flex-row items-center justify-between gap-2">
                 <div className="flex flex-col items-center gap-2 text-center w-24">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm">
                       {mode === 'upload' ? <FileSpreadsheet className="w-5 h-5" /> : mode === 'lab' ? <UserCog className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">
                       {mode === 'upload' ? '原始 Log' : mode === 'lab' ? '角色骨架' : '產品資訊'}
                    </span>
                 </div>
                 <div className="hidden md:block flex-1 h-px bg-slate-200 relative mx-2">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 bg-slate-300 rounded-full"></div>
                 </div>
                 <div className="md:hidden w-px h-8 bg-slate-200 relative my-1">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 bg-slate-300 rounded-full"></div>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-center relative group w-32">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transform group-hover:scale-110 transition-all duration-300 ${
                       mode === 'upload' 
                         ? 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-indigo-200' 
                         : mode === 'lab' 
                           ? 'bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-violet-200'
                           : 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-200'
                    }`}>
                       <Scale className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                       <span className={`text-xs font-black ${mode === 'upload' ? 'text-indigo-600' : mode === 'lab' ? 'text-violet-600' : 'text-emerald-600'}`}>
                          社會動力學校準
                       </span>
                       <span className="text-[9px] text-slate-400 font-mono mt-0.5">Sociology Engine</span>
                    </div>
                 </div>
                 <div className="hidden md:block flex-1 h-px bg-slate-200 relative mx-2">
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-slate-300 rotate-45"></div>
                 </div>
                 <div className="md:hidden w-px h-8 bg-slate-200 relative my-1">
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 border-b border-r border-slate-300 rotate-45"></div>
                 </div>
                 <div className="flex flex-col items-center gap-2 text-center w-24">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center shadow-sm ${
                       mode === 'upload' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' : mode === 'lab' ? 'bg-violet-50 border-violet-100 text-violet-500' : 'bg-emerald-50 border-emerald-100 text-emerald-500'
                    }`}>
                       {mode === 'upload' ? <Fingerprint className="w-5 h-5" /> : <Dna className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">
                       {mode === 'upload' ? '真實人格' : '合成 DNA'}
                    </span>
                 </div>
              </div>
           </div>
        </div>
    </div>
  );
};

const DnaSkeleton: React.FC = () => (
  <div className="relative w-full h-full flex flex-col bg-white rounded-3xl border border-violet-100 shadow-xl overflow-hidden p-6 md:p-8 animate-pulse">
     <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
           <div className="space-y-2">
              <div className="w-32 h-4 bg-slate-200 rounded"></div>
              <div className="w-20 h-2 bg-slate-100 rounded"></div>
           </div>
        </div>
     </div>
     <div className="space-y-6 flex-1">
        <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
        <div className="h-24 bg-slate-50 rounded-xl border border-slate-100 w-full"></div>
     </div>
  </div>
);

const HolographicDnaCard: React.FC<{ 
    dna: PersonaDNA; 
    isStale: boolean;
    onRefresh: () => void;
}> = ({ dna, isStale, onRefresh }) => {
  const level = dna.reality_check?.coherence_level || 'Analysing';
  const description = dna.reality_check?.reality_gap_description || "System checks nominal.";
  const isDelusional = level === 'Delusional';
  
  return (
  <div className={`relative w-full h-full flex flex-col bg-slate-900 rounded-3xl border shadow-xl overflow-hidden transition-all duration-500 ${isStale ? 'border-amber-500/50 grayscale-[0.3]' : 'border-violet-500/30 hover:border-violet-500/50'}`}>
     <div className="relative z-10 flex-1 flex flex-col p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
           <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 shadow-inner"><Dna className="w-5 h-5 text-violet-400 animate-pulse" /></div>
              <div>
                 <h4 className="text-white font-black tracking-wide text-lg">DNA SEQUENCE</h4>
                 <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">ID: {dna.role.substring(0, 15)}...</p>
              </div>
           </div>
           {isStale && (
              <button onClick={onRefresh} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-900 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-lg shadow-amber-500/20 animate-bounce">
                 <RefreshCw className="w-3.5 h-3.5" /> 重新解析
              </button>
           )}
        </div>
        <div className="space-y-6 flex-1 flex flex-col">
           <div className="group">
              <span className="text-[10px] text-slate-500 uppercase font-bold block mb-2 tracking-widest">Life Style</span>
              <div className="flex flex-wrap gap-2">
                 {dna.lifestyle.map((tag, i) => (
                    <span key={i} className="text-xs font-bold text-slate-200 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50 shadow-sm backdrop-blur-sm">{tag}</span>
                 ))}
              </div>
           </div>
           <div className="group bg-rose-950/20 p-4 rounded-xl border border-rose-900/30 relative overflow-hidden">
              <span className="text-[10px] text-rose-400/70 uppercase font-bold block mb-1 tracking-widest flex items-center gap-1.5"><ShieldAlert className="w-3 h-3" /> Core Anxiety</span>
              <div className="text-sm font-medium text-rose-200 leading-relaxed relative z-10 flex gap-2 items-start">{dna.anxiety}</div>
           </div>
           <div className="group bg-emerald-950/20 p-4 rounded-xl border border-emerald-900/30">
              <span className="text-[10px] text-emerald-400/70 uppercase font-bold block mb-1 tracking-widest flex items-center gap-1.5"><CreditCard className="w-3 h-3" /> Spending Logic</span>
              <div className="text-sm font-medium text-emerald-100 leading-relaxed flex items-start gap-3">{dna.spending_habit}</div>
           </div>
           {dna.reality_check && (
               <div className={`mt-auto pt-3 border-t border-slate-800 transition-colors duration-500`}>
                  <div className={`flex items-start gap-2 font-mono text-[10px] text-slate-500`}>
                     <Terminal className={`w-3.5 h-3.5 shrink-0 mt-0.5`} />
                     <div className="flex flex-col">
                        <span className="font-bold uppercase tracking-wider">SYSTEM DIAGNOSTIC: {level.toUpperCase()}</span>
                        <span className={`opacity-80 mt-0.5 font-sans leading-snug ${isDelusional ? 'text-rose-300' : 'text-slate-400'}`}>{">"} {description}</span>
                     </div>
                  </div>
               </div>
           )}
        </div>
     </div>
     {isStale && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-20 flex items-center justify-center pointer-events-none">
           <div className="bg-slate-800 text-amber-400 px-4 py-2 rounded-xl shadow-2xl border border-amber-500/50 font-bold text-sm flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> 參數已變更</div>
        </div>
     )}
  </div>
  );
};

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { persona, setPersona, setIsLoading, setChatSession, clearSession } = usePersona();
  const { clearChat } = useChatMessages();
  
  const [activeTab, setActiveTab] = useState<'upload' | 'lab' | 'product'>('upload');

  // Upload State
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'qualitative' | 'behavioral'>('qualitative');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSampleLoaded, setIsSampleLoaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Lab State
  const [labConfig, setLabConfig] = useState<{
     role: string;
     age: string;
     income: string;
     shadow: string; 
     chaos: number;
     gender: GenderOption; 
  }>({
     role: '',
     age: '25-34',
     income: '一般標準 (Standard)', 
     shadow: 'auto', 
     chaos: 50,
     gender: 'General'
  });
  
  // Product Mirror State
  const [productInput, setProductInput] = useState({
      name: '',
      price: '',
      desc: ''
  });
  const [candidates, setCandidates] = useState<PersonaCandidate[]>([]);
  const [isAnalyzingProduct, setIsAnalyzingProduct] = useState(false);
  const [processingCandidateId, setProcessingCandidateId] = useState<string | null>(null);

  // Stale State Logic
  const [isAnalyzingDNA, setIsAnalyzingDNA] = useState(false);
  const [enrichedDNA, setEnrichedDNA] = useState<PersonaDNA | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // New local state for button feedback (Instant Reaction)
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  
  // Report & Live Stats
  const [finalReport, setFinalReport] = useState<DataHealthReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [liveStats, setLiveStats] = useState({ hasTime: false, hasQuotes: false, hasAction: false, rowCount: 0 });
  const [loadingStage, setLoadingStage] = useState<string>("系統初始化中...");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [userScenario, setUserScenario] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // === GUARD: MOUNTED STATE (Fix for Zombie State Updates) ===
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Config Hash Calculation
  const currentConfigHash = useMemo(() => JSON.stringify({
      role: labConfig.role,
      age: labConfig.age,
      income: labConfig.income,
      shadow: labConfig.shadow,
      gender: labConfig.gender
  }), [labConfig]);

  // Check if current config matches the DNA's signature
  const isDnaStale = useMemo(() => {
      if (!enrichedDNA) return false;
      return enrichedDNA.config_signature !== currentConfigHash;
  }, [enrichedDNA, currentConfigHash]);

  // Sync step index
  useEffect(() => {
    if (!isProcessing) return;
    const lowerMsg = loadingStage.toLowerCase();
    if (lowerMsg.includes('schema') || lowerMsg.includes('distillation') || lowerMsg.includes('fact')) setCurrentStepIndex(1);
    else if (lowerMsg.includes('profiling') || lowerMsg.includes('psych')) setCurrentStepIndex(2);
    else if (lowerMsg.includes('actor') || lowerMsg.includes('simulation') || lowerMsg.includes('synthesis')) setCurrentStepIndex(3);
    else if (lowerMsg.includes('assembly') || lowerMsg.includes('組裝')) setCurrentStepIndex(4);
    else if (lowerMsg.includes('visual') || lowerMsg.includes('avatar') || lowerMsg.includes('頭像')) setCurrentStepIndex(5);
    else setCurrentStepIndex(0);
  }, [loadingStage, isProcessing]);

  // === CRITICAL FIX: AGGRESSIVE MOUNT RESET ===
  // Force reset all loading flags when component mounts to prevent "Zombie State"
  // from previous cancelled operations or navigation.
  useEffect(() => {
      setIsProcessing(false);
      setIsLoading(false);
      setIsButtonLoading(false); // Reset button loading state too
      setProcessingCandidateId(null);
      setLoadingStage("系統初始化中...");
      setCurrentStepIndex(0);
      setError(null);
  }, []); // Run once on mount

  // Live Check
  useEffect(() => {
    const checkLiveStats = () => {
        const text = textInput;
        const hasTime = !!text.match(/20\d{2}[-/]\d{1,2}[-/]\d{1,2}\s+\d{1,2}:\d{2}/);
        const hasQuotes = !!(text.match(/["'「」]/) || (text.length > 50 && inputMode === 'qualitative')); 
        const hasAction = !!text.match(/view|buy|click|purchase|瀏覽|購買|下單|speak|comment|訪談|留言/i);
        const rowCount = text.split('\n').filter(l => l.trim()).length;
        setLiveStats({ hasTime, hasQuotes, hasAction, rowCount });
        if (selectedFile) setLiveStats(prev => ({ ...prev, rowCount: prev.rowCount + 50, hasTime: true }));
    };
    const timer = setTimeout(checkLiveStats, 300);
    return () => clearTimeout(timer);
  }, [textInput, inputMode, selectedFile]);

  // Auto-Clear State on Tab Switch to prevent cache pollution
  useEffect(() => {
      if (activeTab !== 'lab') {
          setEnrichedDNA(null);
      }
      if (activeTab !== 'product') {
          setCandidates([]);
          setProductInput({ name: '', price: '', desc: '' });
      }
      setError(null);
  }, [activeTab]);

  // Scenario Change Handler
  const handleScenarioChange = (scenarioId: string) => {
      const selected = SCENARIO_OPTIONS.find(s => s.id === scenarioId);
      if (selected) {
          setLabConfig(prev => ({
              ...prev,
              shadow: scenarioId,
              chaos: selected.default_chaos
          }));
      }
  };

  // PRODUCT MIRROR: Handle Analysis
  const handleProductAnalysis = async () => {
      if (!productInput.name) { setError("請輸入產品名稱"); return; }
      setIsAnalyzingProduct(true);
      setError(null);
      setCandidates([]);

      try {
          const results = await mirrorPersonaFromProduct(productInput.name, productInput.price, productInput.desc);
          if (isMounted.current) {
             setCandidates(results);
          }
      } catch (e) {
          if (isMounted.current) {
             console.error("Product Mirror Failed", e);
             setError("受眾分析失敗，請稍後再試。");
          }
      } finally {
          if (isMounted.current) {
             setIsAnalyzingProduct(false);
          }
      }
  };

  /**
   * DIRECT GENERATION PIPELINE (Streamlined & Atomic)
   * Triggered by Product Mirror candidates.
   */
  const handleDirectGeneration = async (c: PersonaCandidate) => {
      // 0. Safety Check
      if (!c.resonance_analysis || !c.source_snapshot) {
          alert("此候選人資料結構不完整 (缺少快照或分析數據)，請重新分析產品。");
          return;
      }

      // 1. Check Previous Persona
      if (persona) {
          if (!window.confirm("偵測到已存在的數位分身。建立新分析將會覆蓋目前的進度與對話紀錄。\n\n確定要繼續嗎？")) return;
      }

      // 2. Immediate UI Feedback
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      setProcessingCandidateId(c.id);
      setIsProcessing(true); // Lock full screen
      setIsLoading(true);
      setError(null);
      setLoadingStage("啟動快速生成通道 (Direct Mode)...");
      setCurrentStepIndex(0);
      
      // NOTE: We do NOT clear the session here. We only clear it upon SUCCESS (Atomic Swap).

      try {
          // STEP 1: Enrich DNA
          setLoadingStage("🧬 正在解析角色基因 (DNA Analysis)...");
          
          const shadowId = SCENARIO_OPTIONS.some(s => s.id === c.shadow_id) ? c.shadow_id : 'auto';
          const gender = c.gender_guess || 'General';
          const productName = c.source_snapshot.product_name;

          const resonancePayload = {
              product_name: productName,
              pain_point: c.resonance_analysis.pain_point || "未知痛點",
              marketing_hook: c.resonance_analysis.marketing_hook || "未知行銷點",
              strategy_label: c.resonance_analysis.strategy_label || "General",
              value_layer: c.resonance_analysis.value_layer
          };

          const dna = await enrichPersonaRole(
              c.role, 
              c.age_range, 
              c.income_level, 
              shadowId, 
              gender,
              resonancePayload
          );

          // STEP 2: Synthesize Data
          setLoadingStage("📊 正在合成行為數據 (Data Synthesis)...");
          const skeleton = {
              role: c.role,
              age: c.age_range,
              income: c.income_level,
              gender: gender
          };
          
          const rawData = await synthesizePersonaData(skeleton, shadowId, 60, dna);

          // STEP 3: Create Persona
          setLoadingStage("🧠 正在初始化核心運算模組 (System Boot)...");
          
          const creationConfig: OriginProfile = {
              source_type: 'synthetic',
              parent_candidate_id: c.id, 
              skeleton: skeleton,
              dna: dna,
              shadow: { 
                  id: shadowId, 
                  label: SCENARIO_OPTIONS.find(s => s.id === shadowId)?.title || shadowId 
              },
              humanity_score: 60
          };

          const generatedPersona = await analyzeDataAndCreatePersona(rawData, {
              dataSource: 'synthetic_lab',
              scenario: `Product Mirror: ${productName}`,
              creationConfig: creationConfig
          }, (stage) => { if(isMounted.current) setLoadingStage(stage); });

          // === ATOMIC STATE SWAP ===
          // Only execute swap if component is still mounted and generation succeeded
          if (isMounted.current) {
              clearSession(); // Clean old state
              localStorage.removeItem('the_sim_persona_v1'); // Clean storage
              setEnrichedDNA(null); 

              setPersona(generatedPersona); // Write new state (triggers atomic write to storage)
              
              // Unlock UI
              setIsProcessing(false);
              setIsLoading(false);
              setProcessingCandidateId(null);

              navigate('/dashboard');
          }

      } catch (e: any) {
          if (isMounted.current) {
              console.error("Direct Generation Failed", e);
              const errorMsg = e.message || "生成失敗，請稍後再試。";
              const displayMsg = errorMsg.includes('429') 
                  ? "系統忙碌中 (API 流量限制)，請等待 10 秒後再試。" 
                  : `生成過程中斷: ${errorMsg}`;
              
              setError(displayMsg);
              window.scrollTo({ top: 0, behavior: 'smooth' });
              
              // Ensure we exit processing state but KEEP OLD DATA
              setIsProcessing(false);
              setIsLoading(false);
              setProcessingCandidateId(null);
          }
      } 
  };

  // LAB: Enriched DNA
  const handleEnrichDNA = async () => {
      if (!labConfig.role) {
          setError("請先輸入角色身份");
          return;
      }
      setIsAnalyzingDNA(true);
      setError(null);
      
      try {
          const dna = await enrichPersonaRole(
              labConfig.role, 
              labConfig.age, 
              labConfig.income, 
              labConfig.shadow,
              labConfig.gender
          );
          dna.config_signature = currentConfigHash;
          
          if (isMounted.current) {
             setEnrichedDNA(dna);
          }

      } catch (e) {
          if (isMounted.current) {
             console.error("Enrichment Failed", e);
             setError("角色解析失敗，請稍後再試。");
          }
      } finally {
          if (isMounted.current) {
             setIsAnalyzingDNA(false);
          }
      }
  };

  const runFullScan = async () => {
    setIsScanning(true);
    setFinalReport(null);
    try {
      let content = textInput;
      let size = 0;
      
      if (selectedFile) {
        content = await selectedFile.text();
        size = selectedFile.size;
        if (textInput.trim()) content += "\n" + textInput;
      } else {
        if (!content.trim() && isSampleLoaded) {
            content = SAMPLE_CSV_DATA;
        }
        size = new Blob([content]).size;
      }
      
      if (!content.trim()) {
        setError("請輸入數據或上傳檔案");
        setIsScanning(false);
        return;
      }
      
      setTimeout(() => {
        if (isMounted.current) {
            const report = scanCsvData(content, size);
            setFinalReport(report);
            setIsScanning(false);
        }
      }, 600);
    } catch (e) {
      if (isMounted.current) {
          console.error("Scan failed", e);
          setIsScanning(false);
          setError("掃描失敗，請檢查檔案格式");
      }
    }
  };

  /**
   * STANDARD PROCESS DATA (Button Trigger)
   * Handles both Upload and Lab manual generation.
   * IMPLEMENTS ATOMIC SWAP PATTERN.
   */
  const processData = async () => {
    // 1. Initial State Checks
    if (isAnalyzingDNA || isProcessing || isButtonLoading) return;

    // IMMEDIATE FEEDBACK: Lock button
    setIsButtonLoading(true);
    setError(null);

    // 2. Persona Override Check
    if (persona) {
      if (!window.confirm("偵測到已存在的數位分身。建立新分析將會覆蓋目前的進度與對話紀錄。\n\n確定要繼續嗎？")) {
          setIsButtonLoading(false); // Reset if cancelled
          return;
      }
    }

    // 3. Prepare Context
    let effectiveRawData = "";
    let effectiveDataSource = "";
    let creationConfig: OriginProfile = { source_type: 'upload' };
    
    try {
        if (activeTab === 'lab') {
            if (!labConfig.role) {
                setError("請輸入角色身份");
                setIsButtonLoading(false);
                return;
            }
            
            let currentDNA = enrichedDNA;
            
            // --- DNA STALE CHECK (Auto-Regenerate) ---
            if (!currentDNA || currentDNA.config_signature !== currentConfigHash) {
                setIsAnalyzingDNA(true);
                try {
                    currentDNA = await enrichPersonaRole(
                        labConfig.role, 
                        labConfig.age, 
                        labConfig.income, 
                        labConfig.shadow,
                        labConfig.gender
                    );
                    currentDNA.config_signature = currentConfigHash;
                    if (isMounted.current) {
                        setEnrichedDNA(currentDNA);
                    } else {
                        return; // Stop if unmounted
                    }
                } catch (e: any) { 
                    if (isMounted.current) {
                        const msg = e.message?.includes('429') 
                            ? "系統忙碌中 (429)，無法解析角色，請稍後再試。" 
                            : "背景解析失敗，無法生成數據。";
                        setError(msg);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        setIsAnalyzingDNA(false);
                        setIsButtonLoading(false);
                    }
                    return; // Stop execution
                } finally { 
                    if (isMounted.current) setIsAnalyzingDNA(false); 
                }
            }

            // Enter Processing State
            setIsProcessing(true); // Full screen loader
            setIsLoading(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoadingStage("🧬 正在合成行為基因 (Synthesizing DNA)...");
            setCurrentStepIndex(0); 

            effectiveRawData = await synthesizePersonaData(
                { 
                    role: labConfig.role, 
                    age: labConfig.age, 
                    income: labConfig.income,
                    gender: labConfig.gender 
                },
                labConfig.shadow,
                labConfig.chaos,
                currentDNA || undefined
            );
            effectiveDataSource = 'synthetic_lab';
            creationConfig = {
               source_type: 'synthetic',
               skeleton: { 
                   role: labConfig.role, 
                   age: labConfig.age, 
                   income: labConfig.income,
                   gender: labConfig.gender
               },
               dna: currentDNA || undefined,
               shadow: { 
                   id: labConfig.shadow, 
                   label: SCENARIO_OPTIONS.find(s => s.id === labConfig.shadow)?.title || labConfig.shadow 
               },
               humanity_score: labConfig.chaos
            };

        } else {
            // Upload Mode
            effectiveRawData = textInput;
            if (!effectiveRawData.trim() && isSampleLoaded) {
                effectiveRawData = SAMPLE_CSV_DATA;
            }

            if (selectedFile) {
                try {
                    const fileText = await selectedFile.text();
                    effectiveRawData = selectedFile ? (fileText + "\n" + textInput) : textInput;
                } catch (e) { 
                    setError("讀取檔案失敗"); 
                    setIsButtonLoading(false); 
                    return; 
                }
            }
            if (!effectiveRawData.trim()) { 
                setError("數據內容為空"); 
                setIsButtonLoading(false); 
                return; 
            }
            
            effectiveDataSource = inputMode === 'qualitative' ? 'qualitative_feedback' : 'transactional_data';
            creationConfig = { source_type: 'upload' };

            // Lock UI for Upload Mode
            setIsProcessing(true);
            setIsLoading(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setLoadingStage("初始化核心運算模組...");
            setCurrentStepIndex(0);
        }

        // --- COMMON PIPELINE (Analyze & Create) ---
        // Note: We have NOT cleared the session yet. Old data persists if this fails.

        const generatedPersona = await analyzeDataAndCreatePersona(effectiveRawData, {
            dataSource: effectiveDataSource,
            scenario: activeTab === 'lab' ? `Persona Lab: ${labConfig.role}` : userScenario,
            creationConfig: creationConfig 
        }, (stage) => { if(isMounted.current) setLoadingStage(stage); });
      
        // === ATOMIC STATE SWAP ===
        if (isMounted.current) {
            clearSession(); // Remove old data
            localStorage.removeItem('the_sim_persona_v1');

            if (activeTab !== 'lab') setEnrichedDNA(null);

            setPersona(generatedPersona); // Inject new data
            
            // Release locks
            setIsProcessing(false);
            setIsLoading(false);
            setIsButtonLoading(false);
            
            navigate('/dashboard');
        }

    } catch (err: any) {
      if (isMounted.current) {
          console.error(err);
          const isRateLimit = err.message?.includes('429') || err.message?.includes('quota');
          const errorMsg = isRateLimit 
              ? "系統忙碌中 (429 Too Many Requests)。請等待 10-15 秒後再試。" 
              : "無法生成數位雙生。請確認數據內容是否足夠清晰，或稍後再試。";
          
          setError(errorMsg);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          
          // Release locks, keep old data
          setIsProcessing(false);
          setIsLoading(false);
          setIsButtonLoading(false);
      }
    } 
  };

  const handleFileChange = (file: File | null) => {
    if (file) {
      if (file.size > MAX_FILE_SIZE) {
        setError(`檔案過大 (限制 5MB)`);
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setTextInput(e.target.value);
      setIsSampleLoaded(false); 
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { handleFileChange(e.target.files?.[0] || null); if (e.target) e.target.value = ''; };
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(false); if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]); };
  const removeSelectedFile = (e: React.MouseEvent) => { e.stopPropagation(); setSelectedFile(null); setFinalReport(null); };
  
  const loadSampleData = () => { 
      setIsSampleLoaded(true); 
      setSelectedFile(null); 
      setTextInput(SAMPLE_CSV_DATA); 
      setUserScenario('最近覺得體力變差，想要改善生活習慣'); 
      setFinalReport(null); 
  };
  
  const downloadTemplate = (type: 'general' | 'ecommerce' | 'qualitative') => {
    let content = "";
    let filename = "";

    if (type === 'general') {
      content = `timestamp,action,category,subject,value,content_body
2023-10-01 09:00,view,News,Tech Report,120,Reading about AI
2023-10-01 09:30,search,Shopping,Headphones,,best noise cancelling headphones
2023-10-02 20:00,purchase,Shopping,Sony WH-1000XM5,10900,Birthday gift
`;
      filename = "general_template.csv";
    } else {
      content = `timestamp,interviewer,respondent,transcript
2023-10-05 14:00,Alex,User123,"我覺得這產品最大的問題是太貴了，雖然功能不錯。"
2023-10-05 14:05,Alex,User123,"如果能有試用期，我可能會考慮購買。"
`;
      filename = "interview_template.csv";
    }

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getHumanityLabel = (val: number) => {
    if (val <= 30) return { label: "完美人設 (Stereotype)", color: "text-blue-600" };
    if (val <= 70) return { label: "真實人類 (Realistic)", color: "text-emerald-600" };
    return { label: "複雜矛盾 (Complex)", color: "text-rose-600" };
  };
  const humanityState = getHumanityLabel(labConfig.chaos);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in px-4 md:px-6 py-6 min-h-[calc(100vh-80px)]">
      
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">虛擬市民</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          {activeTab === 'lab' ? "透過 DNA 合成技術，創造具備真實性格的虛擬分身。" : 
           activeTab === 'product' ? "輸入產品特徵，逆向推導市場上潛在的買家樣貌。" :
           "將數據轉化為具備「人性瑕疵」與「獨特觀點」的數位分身。"}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-bold max-w-3xl mx-auto shadow-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />{error}
        </div>
      )}

      {isProcessing ? (
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative p-12 text-center animate-fade-in">
           <div className="mb-8">
              <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-lg border border-indigo-50">
                 <div className="absolute inset-0 border-4 border-indigo-100 rounded-full animate-ping opacity-30"></div>
                 {(() => { const StepIcon = PIPELINE_STEPS[currentStepIndex]?.icon || Loader2; return <StepIcon className="w-10 h-10 text-indigo-600 animate-pulse" />; })()}
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">{PIPELINE_STEPS[currentStepIndex]?.label}</h3>
              <p className="text-slate-500 font-medium text-sm animate-pulse">{loadingStage}</p>
           </div>
           <div className="h-1 bg-slate-100 w-full rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${Math.min(100, (currentStepIndex / 5) * 100 + 10)}%` }}></div>
           </div>
        </div>
      ) : (
        <div className={`rounded-3xl shadow-2xl border relative overflow-hidden transition-colors duration-500 bg-white ${activeTab === 'lab' ? 'border-violet-200 shadow-violet-100' : activeTab === 'product' ? 'border-emerald-200 shadow-emerald-100' : 'border-slate-200'}`}>
          
          <div className="flex border-b border-slate-100">
             <button onClick={() => setActiveTab('upload')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'upload' ? 'bg-white text-slate-800 border-b-2 border-indigo-600' : 'bg-slate-50 text-slate-400'}`}>
                <Upload className="w-4 h-4" /> 數據上傳
             </button>
             <button onClick={() => setActiveTab('lab')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'lab' ? 'bg-white text-violet-700 border-b-2 border-violet-600' : 'bg-slate-50 text-slate-400'}`}>
                <FlaskConical className="w-4 h-4" /> 角色實驗室
             </button>
             <button onClick={() => setActiveTab('product')} className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'product' ? 'bg-white text-emerald-700 border-b-2 border-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                <ShoppingBag className="w-4 h-4" /> 產品雷達
             </button>
          </div>

          <div className="p-6 md:p-8 min-h-[500px]">
            
            {/* NEW: Methodology Visualizer */}
            <MethodologyVisualizer mode={activeTab} />

            {/* === TAB 1: UPLOAD (RESTORED ORIGINAL DESIGN) === */}
            {activeTab === 'upload' && (
               <div className="max-w-3xl mx-auto">
                  {!finalReport ? (
                     <div className="space-y-6">
                        <div 
                           className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400'}`}
                           onClick={() => fileInputRef.current?.click()}
                           onDragOver={handleDrag}
                           onDragLeave={() => setDragActive(false)}
                           onDrop={handleDrop}
                        >
                           <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                           <p className="text-sm font-bold text-slate-600 mb-1">{selectedFile ? selectedFile.name : "拖曳 CSV/TXT 檔案或點擊上傳"}</p>
                           <p className="text-xs text-slate-400">支援格式: .csv, .txt (Max 5MB)</p>
                           <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".csv,.txt" />
                           
                           {selectedFile && (
                              <button 
                                 onClick={removeSelectedFile} 
                                 className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md border border-slate-100 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                 <X className="w-4 h-4"/>
                              </button>
                           )}
                        </div>
                        
                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                           <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">或直接貼上數據</span>
                              <div className="flex bg-slate-200 p-0.5 rounded-lg">
                                 <button onClick={() => setInputMode('qualitative')} className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${inputMode === 'qualitative' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>訪談內容</button>
                                 <button onClick={() => setInputMode('behavioral')} className={`text-xs font-bold px-3 py-1.5 rounded-md transition-all ${inputMode === 'behavioral' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>行為Log</button>
                              </div>
                           </div>
                           <textarea 
                              value={textInput} 
                              onChange={handleTextChange} 
                              ref={textareaRef} 
                              className="w-full p-4 min-h-[180px] outline-none text-sm font-mono text-slate-700 resize-y" 
                              placeholder={inputMode === 'qualitative' ? "Q: 你平常怎麼決定要買什麼?\nA: 我通常會先在網路上看別人的開箱文..." : "2023-10-01 10:00, view, product_A\n2023-10-01 10:05, cart, product_A"} 
                           />
                           {liveStats.rowCount > 0 && (
                              <div className="bg-slate-50 px-4 py-2 border-t border-slate-100 flex gap-4 text-[10px] font-mono text-slate-500">
                                 <span>Rows: {liveStats.rowCount}</span>
                                 <span className={liveStats.hasTime ? "text-emerald-600" : "text-amber-600"}>Time: {liveStats.hasTime ? 'DETECTED' : 'MISSING'}</span>
                                 <span className={liveStats.hasAction ? "text-emerald-600" : "text-amber-600"}>Action: {liveStats.hasAction ? 'DETECTED' : 'MISSING'}</span>
                              </div>
                           )}
                        </div>

                        <div className="flex gap-4">
                           <button onClick={loadSampleData} className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2">
                              <FileText className="w-4 h-4" /> 載入範例
                           </button>
                           
                           <div className="flex gap-2">
                              <button onClick={() => downloadTemplate('general')} className="px-3 py-3 border border-slate-200 rounded-xl text-slate-400 hover:text-indigo-600 hover:border-indigo-200 transition-all" title="下載通用模板">
                                 <Download className="w-4 h-4" />
                              </button>
                           </div>

                           <button 
                              onClick={runFullScan} 
                              disabled={(!selectedFile && !textInput && !isSampleLoaded) || isScanning} 
                              className="flex-1 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                           >
                              {isScanning ? <Loader2 className="w-5 h-5 animate-spin"/> : "開始分析"}
                              {!isScanning && <ArrowRight className="w-4 h-4" />}
                           </button>
                        </div>
                     </div>
                  ) : (
                     <div className="space-y-6 animate-fade-in">
                        <DataHealthIndicator report={finalReport} />
                        <button 
                           onClick={processData}
                           disabled={isButtonLoading}
                           className={`w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-xl shadow-xl transition-all flex items-center justify-center gap-2 hover:-translate-y-1 ${isButtonLoading ? 'opacity-70 cursor-wait' : 'hover:bg-indigo-700 hover:shadow-2xl'}`}
                        >
                           {isButtonLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 animate-pulse" />}
                           {isButtonLoading ? "讀取中..." : "生成數位分身"}
                        </button>
                        {error && (
                           <p className="text-center text-rose-500 font-bold text-xs bg-rose-50 p-2 rounded-lg border border-rose-200">
                              ⚠️ {error}
                           </p>
                        )}
                        <button onClick={() => setFinalReport(null)} className="w-full text-slate-500 text-sm hover:underline py-2">
                           返回編輯
                        </button>
                     </div>
                  )}
               </div>
            )}

            {/* === TAB 2: LAB (NEW SPLIT LAYOUT) === */}
            {activeTab === 'lab' && (
                <div className="flex flex-col lg:flex-row gap-8 h-full items-stretch">
                   
                   {/* Left Column: Control Deck (40%) */}
                   <div className="w-full lg:w-[40%] flex flex-col gap-6">
                      {/* ... (UI controls same as before) ... */}
                      {/* Identity Section */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                         <div className="flex items-center gap-2 mb-2">
                            <UserCog className="w-5 h-5 text-violet-600" />
                            <h3 className="font-black text-slate-700">社會骨架 (Skeleton)</h3>
                         </div>
                         
                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">角色設定</label>
                            <input 
                               type="text" 
                               value={labConfig.role}
                               onChange={(e) => setLabConfig(prev => ({...prev, role: e.target.value}))}
                               placeholder="e.g. 焦慮的新手爸爸"
                               className="w-full p-3 rounded-xl border border-slate-200 font-bold text-slate-700 focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                         </div>

                         <div>
                            <label className="text-xs font-bold text-slate-500 block mb-1">生理性別 (Gender)</label>
                            <div className="flex bg-slate-200 p-1 rounded-xl">
                                {['Male', 'Female', 'General'].map((g) => {
                                    const isSelected = labConfig.gender === g;
                                    let label = g === 'Male' ? '男 (Male)' : g === 'Female' ? '女 (Female)' : '不拘 (Any)';
                                    let activeClass = g === 'Male' 
                                        ? 'bg-white text-indigo-600 shadow-sm ring-1 ring-black/5' 
                                        : g === 'Female' 
                                            ? 'bg-white text-rose-600 shadow-sm ring-1 ring-black/5' 
                                            : 'bg-white text-slate-700 shadow-sm';
                                    
                                    return (
                                        <button
                                            key={g}
                                            onClick={() => setLabConfig(prev => ({...prev, gender: g as GenderOption}))}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                                isSelected ? activeClass : 'text-slate-500 hover:text-slate-700'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <div>
                               <label className="text-xs font-bold text-slate-500 block mb-1">年齡層</label>
                               <select 
                                  value={labConfig.age}
                                  onChange={(e) => setLabConfig(prev => ({...prev, age: e.target.value}))}
                                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-bold bg-white"
                               >
                                  {['18-24', '25-34', '35-44', '45-54', '55+'].map(o => <option key={o} value={o}>{o}</option>)}
                               </select>
                            </div>
                            <div>
                               <label className="text-xs font-bold text-slate-500 block mb-1">財務背景</label>
                               <select 
                                  value={labConfig.income}
                                  onChange={(e) => setLabConfig(prev => ({...prev, income: e.target.value}))}
                                  className="w-full p-2.5 rounded-lg border border-slate-200 text-sm font-bold bg-white"
                               >
                                  {['高負擔/負債 (High Burden)', '一般標準 (Standard)', '家境優渥/業外收入 (Wealthy)'].map(o => <option key={o} value={o}>{o}</option>)}
                               </select>
                            </div>
                         </div>
                      </div>

                      {/* Tuning Section */}
                      <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex-1 flex flex-col gap-4">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Fingerprint className="w-5 h-5 text-violet-600" />
                                <h3 className="font-black text-slate-700">壓力測試場景</h3>
                            </div>
                            <span className="text-[10px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded-full font-bold">
                               {SCENARIO_OPTIONS.find(s => s.id === labConfig.shadow)?.title || "自訂"}
                            </span>
                         </div>

                         <div className="flex flex-col gap-2">
                            {SCENARIO_OPTIONS.map((option) => (
                               <button 
                                 key={option.id}
                                 onClick={() => handleScenarioChange(option.id)}
                                 className={`group relative flex items-start gap-3 p-3 rounded-xl border text-left transition-all overflow-hidden ${
                                    labConfig.shadow === option.id 
                                      ? `bg-white ${option.border} shadow-md ring-1 ring-black/5` 
                                      : 'bg-white/50 border-slate-200 hover:bg-white hover:border-slate-300'
                                 }`}
                               >
                                  {labConfig.shadow === option.id && (
                                      <div className={`absolute left-0 top-0 bottom-0 w-1 ${option.accent}`}></div>
                                  )}

                                  <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 transition-colors ${
                                      labConfig.shadow === option.id ? option.bg : 'bg-slate-100 group-hover:bg-slate-200'
                                  }`}>
                                     <option.icon className={`w-4 h-4 ${labConfig.shadow === option.id ? option.color : 'text-slate-400'}`} />
                                  </div>
                                  <div className="flex-1 min-w-0 pl-1">
                                     <div className={`text-sm font-bold flex justify-between items-center ${
                                         labConfig.shadow === option.id ? 'text-slate-800' : 'text-slate-600'
                                     }`}>
                                        {option.title}
                                        {labConfig.shadow === option.id && <CheckCircle2 className={`w-4 h-4 ${option.color}`} />}
                                     </div>
                                     <p className="text-xs text-slate-400 leading-snug mt-0.5 truncate opacity-80">
                                        {option.desc}
                                     </p>
                                  </div>
                               </button>
                            ))}
                         </div>

                         <div className="pt-4 border-t border-slate-200/50 mt-2">
                            <div className="flex justify-between items-center mb-3">
                               <label className="text-xs font-bold text-slate-500">人性偏差 (Chaos)</label>
                               <span className={`text-xs font-black ${humanityState.color}`}>
                                  {labConfig.chaos}% - {humanityState.label.split(' ')[0]}
                               </span>
                            </div>
                            
                            <div className="relative h-2 rounded-full w-full bg-gradient-to-r from-blue-200 via-emerald-200 to-rose-200">
                               <input 
                                  type="range" 
                                  min="0" max="100" step="10"
                                  value={labConfig.chaos}
                                  onChange={(e) => setLabConfig(prev => ({...prev, chaos: parseInt(e.target.value)}))}
                                  className="absolute w-full h-full opacity-0 cursor-pointer z-20"
                               />
                               <div 
                                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-slate-400 rounded-full shadow-md z-10 pointer-events-none transition-all duration-700"
                                  style={{ left: `calc(${labConfig.chaos}% - 8px)` }}
                               ></div>
                            </div>

                            <div className="flex justify-between mt-2 text-[9px] font-bold text-slate-400 select-none">
                               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-blue-500 transition-colors" onClick={() => setLabConfig(prev => ({...prev, chaos: 10}))}>
                                  <div className="w-px h-1 bg-slate-300"></div>
                                  完美人設
                               </div>
                               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-emerald-500 transition-colors" onClick={() => setLabConfig(prev => ({...prev, chaos: 50}))}>
                                  <div className="w-px h-1 bg-slate-300"></div>
                                  真實人類
                               </div>
                               <div className="flex flex-col items-center gap-1 cursor-pointer hover:text-rose-500 transition-colors" onClick={() => setLabConfig(prev => ({...prev, chaos: 90}))}>
                                  <div className="w-px h-1 bg-slate-300"></div>
                                  極端混亂
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-3">
                         <button
                           onClick={handleEnrichDNA}
                           disabled={!labConfig.role || isAnalyzingDNA}
                           className="w-full py-3 bg-white border-2 border-violet-100 text-violet-700 font-bold rounded-xl hover:bg-violet-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                         >
                            {isAnalyzingDNA ? <Loader2 className="w-4 h-4 animate-spin"/> : <Microscope className="w-4 h-4"/>}
                            {enrichedDNA ? "重新解析 DNA" : "解析角色基因 (Analyze)"}
                         </button>
                         <button
                           onClick={processData}
                           disabled={!labConfig.role || isButtonLoading}
                           className="w-full py-4 bg-violet-600 text-white font-bold rounded-xl shadow-lg hover:bg-violet-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:-translate-y-1"
                         >
                            {isButtonLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 animate-pulse" />}
                            生成行為數據 (Synthesize)
                         </button>
                         {error && (
                            <p className="text-center text-rose-500 font-bold text-xs bg-rose-50 p-2 rounded-lg border border-rose-200">
                               ⚠️ {error}
                            </p>
                         )}
                         <p className="text-center text-[10px] text-slate-400">
                            {isDnaStale ? "⚠️ 注意：左側參數已變更，系統將在背景重新解析 DNA。" : "系統將根據 DNA 特徵生成 30 筆行為數據。"}
                         </p>
                      </div>
                   </div>

                   <div className="w-full lg:w-[60%] flex flex-col min-h-[400px]">
                      {isAnalyzingDNA ? (
                         <DnaSkeleton />
                      ) : enrichedDNA ? (
                         <HolographicDnaCard 
                            dna={enrichedDNA} 
                            isStale={isDnaStale}
                            onRefresh={handleEnrichDNA}
                         />
                      ) : (
                         <div className="h-full border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
                               <Atom className="w-10 h-10 text-slate-300" />
                            </div>
                            <h4 className="text-lg font-bold text-slate-600 mb-2">等待樣本注入</h4>
                            <p className="text-sm text-slate-400 max-w-xs">
                               請在左側填寫角色骨架，並點擊「解析角色基因」以啟動賽博實驗室。
                            </p>
                         </div>
                      )}
                   </div>

                </div>
            )}

            {/* ... (Tab 3: Product Mirror remains mostly the same, ensuring creationConfig is correctly set in handleDirectGeneration) ... */}
            {activeTab === 'product' && (
               <div className="flex flex-col gap-8 animate-fade-in">
                  
                  {/* Input Form */}
                  <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                     
                     <div className="relative z-10 flex flex-col md:flex-row gap-6 items-end">
                        <div className="flex-1 space-y-4 w-full">
                           <div className="grid grid-cols-3 gap-4">
                              <div className="col-span-2">
                                 <label className="text-xs font-bold text-slate-500 block mb-1">產品名稱</label>
                                 <input 
                                    type="text" 
                                    value={productInput.name}
                                    onChange={(e) => setProductInput({...productInput, name: e.target.value})}
                                    placeholder="e.g. Dyson Airwrap 捲髮器"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                 />
                              </div>
                              <div>
                                 <label className="text-xs font-bold text-slate-500 block mb-1">售價 (NT$)</label>
                                 <input 
                                    type="text" 
                                    value={productInput.price}
                                    onChange={(e) => setProductInput({...productInput, price: e.target.value})}
                                    placeholder="e.g. 17600"
                                    className="w-full p-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                                 />
                              </div>
                           </div>
                           <div>
                              <label className="text-xs font-bold text-slate-500 block mb-1">產品描述 / 核心賣點</label>
                              <textarea 
                                 value={productInput.desc}
                                 onChange={(e) => setProductInput({...productInput, desc: e.target.value})}
                                 placeholder="e.g. 快速造型不傷髮質，適合忙碌上班族，送禮首選..."
                                 className="w-full p-3 rounded-xl border border-slate-200 text-sm h-20 resize-none focus:ring-2 focus:ring-emerald-500 outline-none"
                              />
                           </div>
                        </div>
                        
                        <button 
                           onClick={handleProductAnalysis}
                           disabled={!productInput.name || isAnalyzingProduct}
                           className="w-full md:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap h-full max-h-[140px]"
                        >
                           {isAnalyzingProduct ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                           {isAnalyzingProduct ? "分析市場信號..." : "反推潛在受眾"}
                        </button>
                     </div>
                  </div>

                  {/* Results Grid */}
                  {candidates.length > 0 && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                        {candidates.map((c) => {
                           const isProcessingThis = processingCandidateId === c.id;
                           const resonance = c.resonance_analysis;
                           const isOverInterpret = resonance?.is_over_interpretation;
                           const plausibility = resonance?.plausibility_score || 100;
                           
                           // Determine Type Badge Style
                           let badgeStyle = "bg-slate-100 text-slate-600";
                           let typeLabel = c.type || "Candidate";
                           let borderClass = "border-slate-200";
                           let TypeIcon = UserCog; // Default
                           
                           if (c.type === 'Rational') {
                               badgeStyle = "bg-indigo-100 text-indigo-700";
                               typeLabel = "Rational (理性型)";
                               borderClass = "border-indigo-200";
                               TypeIcon = Scale;
                           } else if (c.type === 'Aspirational') {
                               badgeStyle = "bg-rose-100 text-rose-700";
                               typeLabel = "Aspirational (越級型)";
                               borderClass = "border-rose-200";
                               TypeIcon = Sparkles;
                           } else if (c.type === 'Niche') {
                               badgeStyle = "bg-amber-100 text-amber-700";
                               typeLabel = "Niche (非典型)";
                               borderClass = "border-amber-200";
                               TypeIcon = Lightbulb;
                           }

                           // Value Layer Styling
                           let layerColor = "text-slate-600";
                           let layerBg = "bg-slate-50";
                           let LayerIcon = Hammer; // Default Functional
                           const layer = resonance?.value_layer || 'Functional';

                           if (layer === 'Emotional') {
                               layerColor = "text-rose-600";
                               layerBg = "bg-rose-50";
                               LayerIcon = Heart;
                           } else if (layer === 'Social') {
                               layerColor = "text-amber-600";
                               layerBg = "bg-amber-50";
                               LayerIcon = Crown;
                           } else {
                               LayerIcon = Zap;
                           }

                           // Social Radius Styling
                           let radiusColor = "text-slate-400";
                           let radiusBg = "bg-slate-50";
                           const radius = resonance?.social_radius;
                           let radiusLabel = radius; // Default

                           if (radius?.includes("R3")) {
                               radiusColor = "text-fuchsia-600";
                               radiusBg = "bg-fuchsia-50";
                               radiusLabel = "大眾 (Square)";
                           } else if (radius?.includes("R2")) {
                               radiusColor = "text-blue-600";
                               radiusBg = "bg-blue-50";
                               radiusLabel = "圈子 (Tribe)";
                           } else if (radius?.includes("R1")) {
                               radiusColor = "text-orange-600";
                               radiusBg = "bg-orange-50";
                               radiusLabel = "居家 (Hearth)";
                           } else if (radius?.includes("R0")) {
                               radiusColor = "text-slate-600";
                               radiusBg = "bg-slate-100";
                               radiusLabel = "私密 (Private)";
                           }

                           return (
                           <div key={c.id} className={`bg-white rounded-2xl border ${borderClass} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden group relative`}>
                              {/* Top Bar */}
                              <div className={`h-1.5 w-full ${c.type === 'Aspirational' ? 'bg-rose-400' : c.type === 'Niche' ? 'bg-amber-400' : 'bg-indigo-400'}`}></div>
                              
                              <div className="p-5 flex-1 flex flex-col">
                                 <div className="flex justify-between items-start mb-3">
                                    <div className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wide flex items-center gap-1 ${badgeStyle}`}>
                                       <TypeIcon className="w-3 h-3" />
                                       {typeLabel}
                                    </div>
                                    
                                    {/* Friction Indicator */}
                                    {c.purchase_friction === 'High' && (
                                        <div className="flex items-center gap-1 text-[10px] text-rose-500 font-bold bg-rose-50 px-2 py-1 rounded-full border border-rose-100 animate-pulse">
                                            <ShieldAlert className="w-3 h-3" /> 高阻力
                                        </div>
                                    )}
                                    {c.purchase_friction === 'Medium' && (
                                        <div className="flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-2 py-1 rounded-full border border-amber-100">
                                            <Activity className="w-3 h-3" /> 觀望中
                                        </div>
                                    )}
                                    {c.purchase_friction === 'Low' && (
                                        <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded-full border border-emerald-100">
                                            <CheckCircle2 className="w-3 h-3" /> 高意願
                                        </div>
                                    )}
                                 </div>
                                 
                                 <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-emerald-700 transition-colors">
                                    {c.role}
                                 </h3>
                                 <div className="flex items-center gap-2 mb-4">
                                     <span className="text-xs text-slate-400 font-bold">{c.age_range} 歲</span>
                                     <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                     <span className="text-xs text-slate-400 font-bold">{c.income_level}</span>
                                 </div>
                                 
                                 <div className="space-y-4 mb-6 flex-1">
                                    {/* Resonance Chip - UPDATED to show Strategy Label & Radius */}
                                    {resonance && (
                                        <div className="flex flex-wrap gap-2">
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${layerBg} border border-transparent group-hover:border-current transition-colors ${layerColor}`}>
                                                <LayerIcon className="w-4 h-4 shrink-0" />
                                                <span className="text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                                                    {layer} 
                                                    {resonance.strategy_label && (
                                                        <>
                                                            <span className="opacity-40">/</span>
                                                            <span className="text-[10px] bg-white/50 px-1.5 py-0.5 rounded border border-current/20">{resonance.strategy_label}</span>
                                                        </>
                                                    )}
                                                </span>
                                            </div>
                                            {radius && (
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${radiusBg} ${radiusColor} border border-transparent`}>
                                                    <MapPin className="w-3 h-3" />
                                                    <span className="text-[10px] font-bold">{radiusLabel}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Marketing Hook */}
                                    {resonance?.marketing_hook && (
                                        <div className="relative pl-3 border-l-2 border-slate-300 italic text-sm font-medium text-slate-700 leading-snug">
                                            "{resonance.marketing_hook}"
                                        </div>
                                    )}

                                    {/* Deep Analysis */}
                                    {resonance && (
                                        <div className="text-xs space-y-2 bg-slate-50 p-3 rounded-xl">
                                            <div>
                                                <span className="font-bold text-slate-400 block mb-0.5 text-[10px] uppercase">Pain Point (痛點)</span>
                                                <span className="text-slate-600">{resonance.pain_point}</span>
                                            </div>
                                            <div>
                                                <span className="font-bold text-slate-400 block mb-0.5 text-[10px] uppercase">Solution (解法)</span>
                                                <span className="text-slate-600">{resonance.product_solution}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Market Audit Alert (NEW) */}
                                    {resonance?.market_audit && (
                                        <div className="text-[10px] bg-indigo-50/50 p-2 rounded mb-2 border border-indigo-100 flex flex-col gap-1">
                                            <div className="flex justify-between font-bold text-indigo-400 uppercase tracking-wider">
                                                <span className="flex items-center gap-1"><Search className="w-3 h-3"/> 市價檢核</span>
                                                <span>{resonance.market_audit.estimated_real_price}</span>
                                            </div>
                                            <div className="text-slate-600 font-medium leading-snug">{resonance.market_audit.price_gap_description}</div>
                                        </div>
                                    )}

                                    {/* Reality Check Footer */}
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                        {(isOverInterpret || plausibility < 60) ? (
                                            <div className="flex items-center gap-1.5 text-[10px] text-amber-500 font-bold bg-amber-50 px-2 py-1 rounded">
                                                <Info className="w-3 h-3" /> 推測性高 (Speculative)
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 font-bold">
                                                <CheckCircle2 className="w-3 h-3" /> 邏輯合理
                                            </div>
                                        )}
                                        <span className="text-[10px] text-slate-300 font-mono">Score: {plausibility}</span>
                                    </div>
                                 </div>

                                 <button 
                                    onClick={() => handleDirectGeneration(c)}
                                    disabled={isProcessing}
                                    className={`w-full py-3 border-2 font-bold rounded-xl flex items-center justify-center gap-2 group/btn transition-colors
                                       ${isProcessing 
                                          ? 'border-slate-100 text-slate-300 cursor-not-allowed' 
                                          : 'border-slate-100 text-slate-600 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200'
                                       }
                                    `}
                                 >
                                    {isProcessingThis ? (
                                       <>
                                          <Loader2 className="w-4 h-4 animate-spin" /> 生成中...
                                       </>
                                    ) : (
                                       <>
                                          <Zap className="w-4 h-4" /> 立即生成 (Direct)
                                       </>
                                    )}
                                 </button>
                              </div>
                           </div>
                           );
                        })}
                     </div>
                  )}
                  
                  {!isAnalyzingProduct && candidates.length === 0 && (
                     <div className="text-center py-12 opacity-50">
                        <ArrowDown className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                        <p className="text-sm text-slate-400 font-medium">輸入產品資訊以開始分析</p>
                     </div>
                  )}
               </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
