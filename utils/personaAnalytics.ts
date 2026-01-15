
// ... existing imports
import { DigitalTwinPersona, TensionAnalysis, MarketingTactic, SimulationModifiers, ContentCategory } from '../types';
import { getTimeLabel } from './timeContextMap';

// ... (keep all interfaces unchanged up to generateAttentionMatrix) ...
export interface ConversionAnalysis {
  totalScore: number;
  sentiment: string;
  marketingFlavor: string; 
  drive: { score: number, label: string }; 
  resistance: { score: number, label: string, isRealityLocked: boolean }; 
  boosters: { label: string; impact: number }[];
  blockers: { label: string; impact: string }[];
}

export interface QualityReport {
  qualityScore: number;
  stabilityScore: number;
  missingFields: string[];
}

export interface DataDimensionReport {
  id: string; 
  dimension: string;
  score: number;
  missingReason?: string;
}

export interface DataCompletenessAnalysis {
  overallScore: number;
  dimensions: DataDimensionReport[];
  suggestions: string[];
}

export interface AnalyticsCard {
  decisionDrivers: { label: string; score: number; type: 'positive' | 'negative'; generated_tactic?: MarketingTactic }[];
  attentionMatrix: any[];
  tensionAnalysis: TensionAnalysis;
  conversion: ConversionAnalysis;
  qualityReport: QualityReport;
  dataCompleteness: DataCompletenessAnalysis;
  blindSpotStrategy: string;
  goldenMoments: { time: string; context: string; channel: string; icon: string; mindsetLabel: string }[]; 
  oneLiner: string;
}

export interface CrossOverAnalysis {
  label: string;
  description: string;
  intensity: number;
}

export interface AvatarVisuals {
  fashion: string;
  accessories: string;
  expression: string;
  lighting: string;
  bg_color: string;
  color_palette: string;
}

const safeString = (val: string | undefined | null, def: string): string => {
  return (val && val.trim().length > 0) ? val.trim() : def;
};

export const parseEvidence = (text: string) => {
  if (!text) return { reasoning: "無相關數據", reference: null };
  const match = text.match(/^(.*?)\[Ref:(.*?)\]$/);
  if (match) {
    return { reasoning: match[1].trim(), reference: match[2].trim() };
  }
  return { reasoning: text, reference: null };
};

export const getMarketingFlavor = (persona: DigitalTwinPersona): string => {
  const archetype = persona.context_profile?.marketing_archetype?.decision_archetype || "";
  const tone = persona.interaction_style?.tone_preference?.[0] || "";
  
  if (archetype.includes("衝動") || tone.includes("熱情")) return "感性 / 體驗導向";
  if (archetype.includes("考據") || tone.includes("理性")) return "理性 / 數據導向";
  if (archetype.includes("跟風") || tone.includes("活潑")) return "社群 / 流行導向";
  return "平衡 / 實用導向";
};

// ... (keep calculateConversionScore and helper functions unchanged) ...
export const calculateConversionScore = (persona: DigitalTwinPersona): ConversionAnalysis => {
  const boosters = [];
  const blockers = [];

  // 1. CALCULATE DRIVE (Desire + Urgency)
  let driveScore = 50;
  
  const visits = persona.behavioral_pattern?.frequency?.visits_per_month || 0;
  if (visits > 10) { driveScore += 20; boosters.push({ label: "高頻回訪", impact: 20 }); }
  else if (visits > 5) { driveScore += 10; boosters.push({ label: "定期關注", impact: 10 }); }
  
  const archetype = persona.context_profile?.marketing_archetype?.decision_archetype || "";
  if (archetype.includes("衝動") || archetype.includes("直覺")) { 
      driveScore += 15; 
      boosters.push({ label: "衝動性格", impact: 15 }); 
  }
  else if (archetype.includes("觀望")) { 
      driveScore -= 10; 
  }

  const depth = persona.behavioral_pattern?.depth?.avg_pages_per_session || 0;
  if (depth > 8) { driveScore += 15; boosters.push({ label: "深度研究", impact: 15 }); }

  driveScore = Math.min(100, Math.max(10, driveScore));

  // 2. CALCULATE RESISTANCE (Friction * Reality Coefficient)
  let frictionScore = 30;

  const money = persona.constraints.money;
  const isPriceSensitive = money.price_sensitivity?.includes('High') || money.price_sensitivity?.includes('高');
  if (isPriceSensitive) { 
      frictionScore += 20; 
      blockers.push({ label: "價格敏感", impact: "-20" }); 
  }

  const aversion = persona.constraints.emotional?.change_aversion || "";
  if (aversion.includes("High") || aversion.includes("高")) {
      frictionScore += 15;
      blockers.push({ label: "改變慣性", impact: "-15" });
  }

  const reality = persona.origin_profile?.dna?.reality_check;
  let realityCoeff = 1.0;
  let isRealityLocked = false;

  if (reality?.coherence_level === 'Insolvent') {
      realityCoeff = 2.5; 
      isRealityLocked = true;
      blockers.push({ label: "負債風險 (Hard Lock)", impact: "CRITICAL" });
  } else if (reality?.coherence_level === 'Delusional') {
      realityCoeff = 1.8; 
      isRealityLocked = true;
      blockers.push({ label: "認知偏離 (Delusional)", impact: "HIGH" });
  } else if (money.spending_power_level?.includes('Low') || money.spending_power_level?.includes('低')) {
      realityCoeff = 1.2; 
      blockers.push({ label: "預算限制", impact: "-10" });
  }

  const finalResistance = Math.min(100, frictionScore * realityCoeff);

  // 4. NET SCORE FORMULA
  let netScore = 50 + (driveScore - finalResistance) * 0.8;
  
  if (isRealityLocked) {
      netScore = Math.min(netScore, 45);
  }

  netScore = Math.min(100, Math.max(0, Math.round(netScore)));

  let sentiment = "觀望中";
  if (netScore >= 75) sentiment = "極高 (Hot)";
  else if (netScore >= 60) sentiment = "高 (Warm)";
  else if (netScore <= 30) sentiment = "極低 (Cold)";
  else sentiment = "中立 (Neutral)";

  return {
      totalScore: netScore,
      sentiment,
      marketingFlavor: getMarketingFlavor(persona), 
      drive: { score: driveScore, label: "購買慾望 (Drive)" },
      resistance: { score: Math.round(finalResistance), label: "現實阻力 (Friction)", isRealityLocked },
      boosters,
      blockers
  };
};

export const getTraitValue = (traitString: string): number => {
    if (traitString.includes("High") || traitString.includes("高")) return 80;
    if (traitString.includes("Low") || traitString.includes("低")) return 20;
    return 50;
};

export const translateEnum = (val: string): string => {
    const map: Record<string, string> = {
        'High': '高', 'Medium': '中', 'Low': '低',
        'Novice': '新手', 'Expert': '資深',
        'Strict': '嚴格', 'Loose': '隨性',
        'Natural': '自然', 'Professional': '專業'
    };
    return map[val] || val;
};

export const getAvatarTitle = (persona: DigitalTwinPersona): string => {
  const reality = persona.origin_profile?.dna?.reality_check;
  const origin = persona.origin_profile;

  if (reality?.correction_rules?.display_role && 
     (reality.coherence_level === 'Delusional' || reality.coherence_level === 'Low')) {
      return reality.correction_rules.display_role;
  }

  if (origin?.source_type === 'synthetic' && origin.skeleton?.role) {
      const userRole = origin.skeleton.role.trim();
      return userRole.length > 15 ? userRole.substring(0, 14) + "..." : userRole;
  }

  const context = persona.context_profile;
  const marketing = context?.marketing_archetype;
  
  const lifeRole = safeString(marketing?.life_role, "");
  const lifeStage = safeString(context?.life_stage, "使用者");
  
  let displayLife = (lifeRole && lifeRole !== "一般消費者" && lifeRole !== "General Consumer") ? lifeRole : lifeStage;

  const parts = displayLife.split(/[\/／|\\·・,，、]+/);
  if (parts.length > 0) {
      displayLife = parts[0].trim();
  }
  
  return displayLife;
};

export const translateConstraint = (val: string) => {
   if (val.includes("High") || val.includes("高")) return "高門檻";
   if (val.includes("Low") || val.includes("低")) return "低門檻";
   return "一般";
};

export const analyzeAttentionMode = (avgPages: number) => {
    if (avgPages > 8) return { label: "🔍 沉浸模式 (Deep)", description: "高度專注，適合深度內容溝通" };
    if (avgPages > 3) return { label: "👀 瀏覽模式 (Browse)", description: "掃描式閱讀，需要視覺鉤子" };
    return { label: "⚡ 速食模式 (Skim)", description: "極短注意力，關鍵字決勝" };
};

export const analyzeEmotionalBarrier = (aversion: string) => {
    const isSevere = aversion.includes("High") || aversion.includes("高");
    const label = isSevere ? "高慣性阻力" : "心態開放";
    const marketingAdvice = isSevere 
        ? "建議：強調『無痛轉移』與『零風險試用』，降低改變恐懼。"
        : "建議：強調『新奇體驗』與『升級感』，激發嘗試意願。";
    return { label, isSevere, marketingAdvice };
};

export const formatEmotionalBarrier = (val: string) => translateConstraint(val);
export const formatTimeConstraint = (val: string) => val.length > 10 ? val.substring(0, 8) + "..." : val;

export const getDimensionConfig = (key: string) => {
    const map: Record<string, { left: string, right: string }> = {
        'novelty_seeking': { left: '保守依舊', right: '追求新奇' },
        'planning_vs_spontaneous': { left: '嚴謹計畫', right: '隨性衝動' },
        'social_orientation': { left: '獨立自我', right: '從眾社交' },
        'risk_attitude': { left: '規避風險', right: '擁抱風險' },
        'financial_sensitivity': { left: '價格敏感', right: '品質導向' }
    };
    return map[key] || { left: 'Low', right: 'High' };
};

export const generateOneLiner = (persona: DigitalTwinPersona): string => {
    const archetype = persona.context_profile.marketing_archetype?.decision_archetype || "一般使用者";
    const flaw = persona.system_state.composite_flaw.label;
    const goal = persona.motivations.primary_goals[0]?.goal || "尋找價值";
    return `這是一位${archetype}，雖然${flaw}，但核心渴望是${goal}。`;
};

export const analyzeAvatarVisuals = (persona: DigitalTwinPersona): AvatarVisuals => {
    // ... (keep visuals logic) ...
    const archetype = persona.context_profile?.marketing_archetype?.decision_archetype || "";
    const flaw = persona.system_state?.composite_flaw?.label || "";
    const spending = persona.constraints?.money?.spending_power_level || "中";
    const device = persona.context_profile?.device_pref?.[0] || "Mobile";

    let lighting = "Soft studio lighting, balanced";
    let bg_color = "Neutral Slate Grey";
    let color_palette = "Monochrome with one accent color";

    if (archetype.includes("直覺") || archetype.includes("體驗") || archetype.includes("衝動") || archetype.includes("享樂")) {
        lighting = "Vibrant pop lighting with neon rim light";
        bg_color = "Soft Rose Pink";
        color_palette = "Vivid Magenta, Electric Blue and White";
    } else if (archetype.includes("邏輯") || archetype.includes("考據") || archetype.includes("精算") || archetype.includes("務實")) {
        lighting = "Cool crisp daylight, high contrast";
        bg_color = "Sky Blue";
        color_palette = "Navy Blue, Cool Grey and White";
    } else if (archetype.includes("社群") || archetype.includes("跟風") || archetype.includes("流行")) {
        lighting = "Warm cozy sunlight, soft filter";
        bg_color = "Warm Orange Cream";
        color_palette = "Pastel Peach, Mint Green and Cream";
    } else if (archetype.includes("慣性") || archetype.includes("依賴") || archetype.includes("防備")) {
        lighting = "Dim dramatic lighting, side lit";
        bg_color = "Muted Olive Green";
        color_palette = "Earth tones, Brown and Forest Green";
    }

    let expression = "Neutral friendly smile, direct eye contact";
    if (flaw.includes("猶豫") || flaw.includes("困難") || flaw.includes("Paralysis")) {
        expression = "Pensive, hand touching chin, slightly furrowed brow";
    } else if (flaw.includes("衝動") || flaw.includes("Impulse") || flaw.includes("急躁")) {
        expression = "Wide-eyed excitement, mouth slightly open in awe, dynamic look";
    } else if (flaw.includes("慣性") || flaw.includes("防備") || flaw.includes("懷疑") || flaw.includes("Inertia") || flaw.includes("Skeptical")) {
        expression = "Guarded, slightly raised eyebrow, skeptical look";
    } else if (flaw.includes("焦慮") || flaw.includes("Anxiety")) {
        expression = "Nervous smile, looking slightly overwhelmed, wide eyes";
    }

    let fashion = "Smart casual, comfortable hoodie or shirt"; 
    if (spending.includes("High") || spending.includes("高") || spending.includes("Top")) {
        fashion = "High-end Streetwear, layered textures, or Quiet luxury";
    } else if (spending.includes("Low") || spending.includes("低") || spending.includes("Budget")) {
        fashion = "Functional basics, Uniqlo style, clean and simple T-shirt";
    }

    let accessories = "Minimalist, no glasses";
    if (device.toLowerCase().includes("desktop") || device.toLowerCase().includes("pc")) {
        accessories = "Blue-light glasses or headphones around neck";
    } else {
        accessories = "Minimalist ear studs or simple necklace"; 
    }

    return { fashion, accessories, expression, lighting, bg_color, color_palette };
};

export const analyzeCrossOver = (dim1: any, dim2: any): CrossOverAnalysis => {
    return {
        label: "交叉分析",
        description: "暫無顯著交叉特徵",
        intensity: 50
    };
};

export const getGoldenMoments = (persona: DigitalTwinPersona) => {
    const slots = persona.behavioral_pattern?.time_pattern?.preferred_time_slots || [];
    
    return slots.map((t: string) => {
        const { label, channel, icon, mindsetLabel } = getTimeLabel(t, persona);
        return {
            time: t,
            context: label, 
            channel: channel, 
            icon: icon,
            mindsetLabel: mindsetLabel 
        };
    });
};

export const getEvidenceForTrait = (trait: string) => "系統推論";

export const analyzeDataQuality = (persona: DigitalTwinPersona): QualityReport => {
    return {
        qualityScore: Math.round(persona.confidence_score || 85),
        stabilityScore: 90,
        missingFields: []
    };
};

export const analyzeDataCompleteness = (persona: DigitalTwinPersona): DataCompletenessAnalysis => {
    const dimensions: DataDimensionReport[] = [
        { id: 'time', dimension: '時間維度', score: 0 },
        { id: 'money', dimension: '金錢維度', score: 0 },
        { id: 'content', dimension: '內容維度', score: 0 },
        { id: 'psych', dimension: '性格維度', score: 0 },
        { id: 'context', dimension: '情境維度', score: 0 }
    ];

    const suggestions: string[] = [];

    const timeEvidence = persona.constraints.time.evidence;
    if (timeEvidence && timeEvidence !== "系統預設") {
        dimensions[0].score = 100;
    } else {
        dimensions[0].score = 20;
        dimensions[0].missingReason = "缺乏具體時間戳記";
        suggestions.push("建議補充帶有時間戳記的行為數據 (如 2023-10-01 10:00)");
    }

    const moneyEvidence = persona.constraints.money.evidence;
    if (moneyEvidence && moneyEvidence.includes("$") || moneyEvidence.match(/\d+/)) {
         dimensions[1].score = 100;
    } else {
         dimensions[1].score = 40;
         dimensions[1].missingReason = "缺乏具體金額數據";
         suggestions.push("建議補充消費金額或預算範圍");
    }

    const contentCount = persona.behavioral_pattern.content_preference.top_categories.length;
    if (contentCount > 2) dimensions[2].score = 90;
    else if (contentCount > 0) dimensions[2].score = 60;
    else {
        dimensions[2].score = 10;
        dimensions[2].missingReason = "缺乏內容偏好";
    }

    const overallScore = Math.round(dimensions.reduce((acc, d) => acc + d.score, 0) / 5);

    return { overallScore, dimensions, suggestions };
};

export const analyzeDecisionDrivers = (persona: DigitalTwinPersona) => {
    const drivers = [];
    const tactics = persona.system_state.marketing_tactics;
    
    if (tactics?.scarcity) drivers.push({ label: "稀缺性 (Scarcity)", score: 85, type: 'positive' as const, generated_tactic: tactics.scarcity });
    if (tactics?.social_proof) drivers.push({ label: "網友口碑 (Social Proof)", score: 75, type: 'positive' as const, generated_tactic: tactics.social_proof });
    if (tactics?.value) drivers.push({ label: "折扣促銷 (Value)", score: 60, type: 'positive' as const, generated_tactic: tactics.value });
    
    drivers.sort((a, b) => b.score - a.score);

    return drivers;
};

export const calculateTensionMatrix = (persona: DigitalTwinPersona): TensionAnalysis => {
    const flaw = persona.system_state.composite_flaw.label;
    if (flaw.includes("Paralysis") || flaw.includes("猶豫")) {
        return {
            state: 'High_Tension',
            label: "高衝突",
            description: "想買但怕後悔",
            strategy: "提供保證",
            advice: "降低風險感",
            breakdown: {
                desire_source: "對產品功能的渴望",
                defense_source: "對價格的恐懼",
                rational_alibi: "再比價看看"
            },
            scores: { desire: 80, defense: 70 }
        };
    }
    return {
        state: 'Drifter',
        label: "低衝突",
        description: "隨意看看",
        strategy: "引起興趣",
        advice: "增加互動",
        scores: { desire: 30, defense: 20 }
    };
};

export const generateAttentionMatrix = (persona: DigitalTwinPersona) => {
    const categories = persona.behavioral_pattern?.content_preference?.top_categories || [];
    const endDate = new Date(persona.data_window?.end_date || Date.now()); // Reference date for recency

    if (categories.length === 0) {
        return [
            { x: 1, y: 1, z: 100, label: "無數據", type: "glance", opacity: 0.3, recencyLabel: "等待輸入", keywords: [], lastSeen: "N/A" }
        ];
    }

    return categories.map((cat: ContentCategory) => {
        const duration = Math.max(1, cat.estimated_span_days || 1);
        const count = cat.interaction_count || 1;
        
        // 1. Intensity Weighting: Penalize Single Event
        // If user only interacted once, force intensity low to separate from "short burst" (which implies multiple actions)
        let intensity = count / duration;
        if (count === 1) {
            intensity = 0.1; // Artificial low value for single-click noise
        }

        const weight = Math.max(100, (cat.weight || 50) * 5); 

        // 2. Time Ghosting (Recency)
        let opacity = 1.0;
        let lastSeenDate = endDate;
        if (cat.last_seen_at) {
             // Basic parse, assuming "YYYY-MM-DD HH:mm" or similar ISO
             // Replace space with T just in case
             const safeDateStr = cat.last_seen_at.replace(' ', 'T');
             const d = new Date(safeDateStr);
             if (!isNaN(d.getTime())) lastSeenDate = d;
        }
        
        const daysSince = (endDate.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysSince > 30) opacity = 0.3; // Old (Ghost)
        else if (daysSince > 7) opacity = 0.6; // Mid
        else opacity = 1.0; // Fresh (Active)

        // 3. Type Logic
        let type = "glance";
        let recencyLabel = "偶爾出現";

        const isLongDuration = duration > 7;
        const isHighIntensity = intensity >= 1.5;

        if (isHighIntensity && !isLongDuration) {
            type = "burst"; 
            recencyLabel = "短期爆發";
        } else if (isHighIntensity && isLongDuration) {
            type = "obsession"; 
            recencyLabel = "長期狂熱";
        } else if (!isHighIntensity && isLongDuration) {
            type = "habit"; 
            recencyLabel = "穩定關注";
        } else {
            type = "glance"; 
            recencyLabel = "隨意瀏覽";
        }

        // Extract Meta
        const keywords = (cat.keywords || []).slice(0, 3);
        const lastSeen = cat.last_seen_at ? cat.last_seen_at.split(' ')[0] : "未知"; 

        return {
            x: parseFloat(duration.toFixed(1)),
            y: parseFloat(intensity.toFixed(1)),
            z: weight,
            label: cat.name || "未知主題",
            type: type,
            opacity: opacity, // Use the time-based opacity
            recencyLabel: recencyLabel,
            keywords: keywords, 
            lastSeen: lastSeen 
        };
    });
};

export const analyzeFullPersona = (persona: DigitalTwinPersona): AnalyticsCard => {
    return {
        decisionDrivers: analyzeDecisionDrivers(persona),
        attentionMatrix: generateAttentionMatrix(persona),
        tensionAnalysis: calculateTensionMatrix(persona),
        conversion: calculateConversionScore(persona),
        qualityReport: analyzeDataQuality(persona),
        dataCompleteness: analyzeDataCompleteness(persona),
        blindSpotStrategy: "針對痛點提供明確解決方案",
        goldenMoments: getGoldenMoments(persona),
        oneLiner: generateOneLiner(persona)
    };
};

export const calculateBaselines = (persona: DigitalTwinPersona): SimulationModifiers => {
   // ... (keep existing baseline calculation) ...
   const modifiers: SimulationModifiers = {
      budget_anxiety: 50,
      patience: 50,
      social_mask: 50,
      purchase_intent: 30,
      social_context: undefined 
   };
   
   if (!persona) return modifiers;

   const money = persona.constraints?.money || {} as any;
   const vibe = persona.perception_sheet?.spending_vibe || "";
   let budgetScore = 50;

   if ((money.price_sensitivity || "").includes("High") || (money.price_sensitivity || "").includes("高")) budgetScore += 20;
   if ((money.spending_power_level || "").includes("Low") || (money.spending_power_level || "").includes("低")) budgetScore += 20;
   if (vibe.includes("精算") || vibe.includes("務實")) budgetScore += 10;
   
   if ((money.spending_power_level || "").includes("High") || (money.spending_power_level || "").includes("高")) budgetScore -= 20;
   if (vibe.includes("享樂") || vibe.includes("投資")) budgetScore -= 10;

   modifiers.budget_anxiety = Math.min(100, Math.max(0, budgetScore));

   const depth = persona.behavioral_pattern?.depth?.avg_pages_per_session || 0;
   let patienceScore = 50;

   if (depth < 2) patienceScore -= 20; 
   if (depth > 6) patienceScore += 20; 

   const tone = (persona.interaction_style?.tone_preference || []).join("");
   if (tone.includes("急") || tone.includes("快")) patienceScore -= 10;
   if (tone.includes("耐心") || tone.includes("溫和")) patienceScore += 10;

   modifiers.patience = Math.min(100, Math.max(0, patienceScore));

   const social = persona.personality_profile?.dimensions?.social_orientation?.level || "中";
   let maskScore = 50;
   
   if (social.includes("High") || social.includes("高")) maskScore += 20; 
   if (tone.includes("禮貌") || tone.includes("客氣")) maskScore += 15;
   if (tone.includes("直率") || tone.includes("嗆")) maskScore -= 20;

   modifiers.social_mask = Math.min(100, Math.max(0, maskScore));

   const visits = persona.behavioral_pattern?.frequency?.visits_per_month || 0;
   let intentScore = 30; 

   if (visits > 5) intentScore += 10;
   const spendingVibe = persona.perception_sheet?.spending_vibe || "";
   const hasPurchase = spendingVibe.includes("享樂") || spendingVibe.includes("投資") || spendingVibe.includes("小資") || spendingVibe.includes("精算");
   
   if (hasPurchase) intentScore += 30;
   
   if (depth > 8) intentScore += 30; 
   else if (depth > 5) intentScore += 15;

   const archetype = persona.context_profile?.marketing_archetype?.decision_archetype || "";
   if (archetype.includes("觀望")) intentScore -= 10;
   if (archetype.includes("邏輯") || archetype.includes("考據")) intentScore += 10; 

   modifiers.purchase_intent = Math.min(100, Math.max(0, intentScore));

   return modifiers;
};
