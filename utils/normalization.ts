
// ... existing imports
import { PersonalityDimension, DigitalTwinPersona } from '../types';

type DimensionKey = 'novelty_seeking' | 'planning_vs_spontaneous' | 'social_orientation' | 'risk_attitude' | 'financial_sensitivity';

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

// Helper: Fix numeric scale (AI sometimes gives 0.8, sometimes 80)
const normalizeScore = (val: any): number => {
  const num = parseFloat(val);
  if (isNaN(num)) return 0;
  // If value is between 0 and 1 (exclusive of 0), assume it's a percentage ratio (e.g. 0.8 -> 80)
  if (num > 0 && num <= 1.0) return Math.round(num * 100);
  return Math.round(num);
};

// ... existing helpers (normalizeLevel, estimateBaseScore, createDefaultDimension) ...
// Helper: Normalize Level String to Traditional Chinese
const normalizeLevel = (val: string | undefined): string => {
  if (!val) return "中";
  const v = val.toLowerCase();
  
  if (v.includes('high') || v.includes('高') || v.includes('above') || v.includes('strong') || v.includes('expert') || v.includes('資深')) return "高";
  if (v.includes('low') || v.includes('低') || v.includes('below') || v.includes('weak') || v.includes('poor') || v.includes('budget')) return "低";
  
  return "中";
};

// Legacy Helper to estimate base_score from level if missing
const estimateBaseScore = (level: string, key?: string): number => {
    // level is already normalized to 高/中/低
    
    if (key === 'financial_sensitivity') {
       if (level === "高") return 85; 
       if (level === "低") return 15; 
       return 50;
    }

    if (level === "高") return 85;
    if (level === "低") return 15;
    return 50;
};

// Helper to create a default dimension structure
const createDefaultDimension = (key: string): PersonalityDimension => ({
  level: '中',
  base_score: 50,
  evidence: `系統預設 (缺乏 ${key} 數據)`,
  contextual_shift: undefined
});

// Normalize personality dimensions with safe fallbacks
export const normalizePersonaDimensions = (dimensions: Record<string, any> | undefined): Record<DimensionKey, PersonalityDimension> => {
  const dimensionKeys: DimensionKey[] = [
    'novelty_seeking', 
    'planning_vs_spontaneous', 
    'social_orientation', 
    'risk_attitude', 
    'financial_sensitivity'
  ];

  if (!dimensions) {
    return dimensionKeys.reduce((acc, key) => {
      acc[key] = createDefaultDimension(key);
      return acc;
    }, {} as Record<DimensionKey, PersonalityDimension>);
  }

  return dimensionKeys.reduce((acc, key) => {
    const val = dimensions[key];
    if (!val) {
      acc[key] = createDefaultDimension(key);
    } else {
      let shift = undefined;
      if (val.contextual_shift && typeof val.contextual_shift.shift_score === 'number') {
         shift = {
            condition: val.contextual_shift.condition || '特定情境',
            shift_score: normalizeScore(val.contextual_shift.shift_score),
            description: val.contextual_shift.description || ''
         };
      }

      acc[key] = {
        level: normalizeLevel(val.level),
        base_score: typeof val.base_score === 'number' ? normalizeScore(val.base_score) : estimateBaseScore(normalizeLevel(val.level), key),
        evidence: val.evidence || '無相關數據',
        contextual_shift: shift
      };
    }
    return acc;
  }, {} as Record<DimensionKey, PersonalityDimension>);
};

// Normalize chart data for Content Preferences
export const normalizeCategoryData = (categories: any[] | undefined): CategoryData[] => {
  if (!categories || !Array.isArray(categories)) return [];
  
  return categories
    .filter(cat => cat && cat.name)
    .map(cat => ({
      name: cat.name.length > 10 ? cat.name.substring(0, 10) + '...' : cat.name,
      fullName: cat.name,
      value: normalizeScore(cat.weight ?? 0),
      keywords: Array.isArray(cat.keywords) ? cat.keywords.filter((k: any) => typeof k === 'string') : [],
      intent: cat.intent || ""
    }))
    .slice(0, 5);
};

// Normalize data for Radar Chart
export const normalizeRadarData = (topics: any[] | undefined): RadarData[] => {
  if (!topics || !Array.isArray(topics)) return [];
  
  return topics
    .filter(topic => topic && topic.label)
    .map(topic => ({
      subject: topic.label.length > 8 ? topic.label.substring(0, 8) + '...' : topic.label,
      fullLabel: topic.label,
      A: normalizeScore(topic.weight ?? 0),
      fullMark: 100,
      keyword: topic.keyword || "" 
    }))
    .slice(0, 6);
};

// Safe accessors for nested objects
export const safeGetChannelMix = (channelMix: Record<string, number> | undefined): Record<string, number> => {
  if (!channelMix || typeof channelMix !== 'object') return { "Direct": 1 };
  return channelMix;
};

export const safeGetAdFormats = (formats: string[] | undefined): string[] => {
  if (!formats || !Array.isArray(formats)) return [];
  return formats.filter(f => typeof f === 'string');
};

/**
 * Safe JSON Parse Wrapper
 */
export const trySafeJsonParse = <T>(text: string, fallback?: T): T => {
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    if (fallback !== undefined) return fallback;
    throw e;
  }
};

/**
 * Helper to strip Markdown code blocks from JSON response.
 */
export const cleanJsonString = (text: string): string => {
  if (!text) return "";
  let clean = text.trim();
  // Remove markdown code blocks
  if (clean.includes('```')) {
     clean = clean.replace(/^[\s\S]*?```(?:json)?\s*/i, '').replace(/\s*```[\s\S]*$/, '');
  }
  return clean.trim();
};

/**
 * MASTER NORMALIZATION FUNCTION WITH SELF-HEALING PROTOCOL
 * Phase 4: Cognitive Evolution - Data Self-Healing
 */
export const sanitizeAndNormalizePersona = (raw: any): any => {
    // Deep copy
    const data = JSON.parse(JSON.stringify(raw));

    // =========================================================
    // 1. DATA ANALYST RECOVERY (LAYER 1)
    // =========================================================
    if (!data.behavioral_pattern) data.behavioral_pattern = {};
    
    // Recovery for new flattened Analyst Report structure
    if (data.metrics) { // Check if merging happened correctly in geminiService
        if (!data.behavioral_pattern.frequency) data.behavioral_pattern.frequency = {};
        
        if (!data.behavioral_pattern.frequency.visits_per_month) {
           data.behavioral_pattern.frequency.visits_per_month = normalizeScore(data.metrics.total_interactions);
        }
        
        if (!data.behavioral_pattern.frequency.active_days_ratio) {
           data.behavioral_pattern.frequency.active_days_ratio = normalizeScore(data.metrics.active_days_count);
        }
    }

    // Default Fallbacks
    if (!data.behavioral_pattern.frequency) {
        data.behavioral_pattern.frequency = { visits_per_month: 0, active_days_ratio: 1 };
    }
    if (!data.behavioral_pattern.depth) {
        data.behavioral_pattern.depth = { avg_pages_per_session: 5.0 }; 
    }

    if (!data.behavioral_pattern.content_preference) data.behavioral_pattern.content_preference = {};
    
    // Ensure top_categories exists
    if (!Array.isArray(data.behavioral_pattern.content_preference.top_categories)) {
        data.behavioral_pattern.content_preference.top_categories = [];
    }
    
    // Map older or malformed structure if needed
    if (Array.isArray(data.category_distribution)) {
         data.behavioral_pattern.content_preference.top_categories = data.category_distribution.map((cat: any) => ({
             name: cat.name,
             weight: normalizeScore(cat.weight),
             keywords: Array.isArray(cat.keywords) ? cat.keywords.filter((k: any) => typeof k === 'string') : [],
             intent: cat.intent || "",
             first_seen_at: cat.first_seen_at,
             last_seen_at: cat.last_seen_at,
             interaction_count: cat.event_count || cat.interaction_count ? Number(cat.event_count || cat.interaction_count) : 0, // Prefer event_count from new prompt
             estimated_span_days: cat.span_days ? Number(cat.span_days) : 1 // Map new field
         }));
    }

    if (!Array.isArray(data.behavioral_pattern.content_preference.top_lda_topics)) {
         // Fallback if topics_breakdown is present at root
         if (Array.isArray(data.topics_breakdown)) {
             data.behavioral_pattern.content_preference.top_lda_topics = data.topics_breakdown;
         } else {
             data.behavioral_pattern.content_preference.top_lda_topics = [];
         }
    }
    
    if (!data.behavioral_pattern.ad_interaction) {
        data.behavioral_pattern.ad_interaction = { click_rate: 0, campaign_variety: 0, format_preference: [] };
    }

    // =========================================================
    // 2. PSYCHOLOGIST RECOVERY (LAYER 2)
    // =========================================================
    // ... rest of validation logic ...
    
    // ... (Keep existing code for Psych, Actor, Context healing) ...
    if (!data.motivations) data.motivations = {};
    if (!Array.isArray(data.motivations.primary_goals)) {
        data.motivations.primary_goals = [{ goal: "探索感興趣的內容", evidence: "系統預設" }];
    }
    if (!Array.isArray(data.motivations.secondary_goals)) data.motivations.secondary_goals = [];
    if (!Array.isArray(data.motivations.latent_needs)) {
         data.motivations.latent_needs = [{ hypothesis: "尋求價值認同", confidence: 50, evidence: "系統預設" }];
    }

    if (!data.personality_profile) data.personality_profile = { dimensions: {} };
    if (!data.personality_profile.dimensions) data.personality_profile.dimensions = {};
    
    // Ensure context_profile exists
    if (!data.context_profile) data.context_profile = {};
    
    // Recover marketing_archetype
    if (data.marketing_archetype) {
        data.context_profile.marketing_archetype = data.marketing_archetype;
    } else if (!data.context_profile.marketing_archetype) {
        data.context_profile.marketing_archetype = {};
    }

    // --- PHASE 4: SELF-HEALING ARCHETYPE ---
    // If archetype is missing or generic, infer from behavior depth/frequency
    const ma = data.context_profile.marketing_archetype;
    if (!ma.decision_archetype || ma.decision_archetype === "一般觀望型") {
        const freq = data.behavioral_pattern.frequency.visits_per_month || 0;
        const depth = data.behavioral_pattern.depth.avg_pages_per_session || 0;
        
        if (freq > 10) ma.decision_archetype = "高頻回訪型 (Loyal)";
        else if (depth > 8) ma.decision_archetype = "深度研究型 (Researcher)";
        else if (depth < 2) ma.decision_archetype = "標題掃描型 (Skimmer)";
        else ma.decision_archetype = "一般觀望型 (Browser)";
    }

    // Default Fallbacks
    if (!ma.life_role) ma.life_role = "一般消費者";
    if (!ma.financial_role) ma.financial_role = "一般";

    if (!data.context_profile.device_pref) data.context_profile.device_pref = ["Mobile"];
    if (!data.context_profile.channel_mix) data.context_profile.channel_mix = { "Direct": 1 };
    
    if (!data.context_profile.custom_dimensions) data.context_profile.custom_dimensions = {};

    // =========================================================
    // 3. ACTOR RECOVERY (LAYER 3)
    // =========================================================
    if (!data.interaction_style) data.interaction_style = {};
    if (!data.interaction_style.tone_preference) data.interaction_style.tone_preference = ["Natural"];
    if (!data.interaction_style.recommended_channels) data.interaction_style.recommended_channels = ["Mobile"];
    
    // --- PHASE 4: SELF-HEALING SPEAKING STYLE ---
    // If speaking style is empty, infer from tone preference
    if (!data.interaction_style.speaking_style || !data.interaction_style.speaking_style.common_phrases) {
        const tone = (data.interaction_style.tone_preference[0] || "").toLowerCase();
        let phrases = ["嗯嗯", "確實", "看情況"];
        let emoji = "medium";
        
        if (tone.includes("酸") || tone.includes("鄉民") || tone.includes("cynical")) {
            phrases = ["笑死", "盤子", "智商稅", "反串嗎"];
            emoji = "low";
        } else if (tone.includes("熱情") || tone.includes("活潑") || tone.includes("high")) {
            phrases = ["真的假的！", "天啊", "好酷喔", "必須買"];
            emoji = "high";
        } else if (tone.includes("專業") || tone.includes("理性") || tone.includes("formal")) {
            phrases = ["理論上", "CP值", "數據顯示", "稍微研究一下"];
            emoji = "none";
        }

        data.interaction_style.speaking_style = {
            emoji_usage: emoji,
            punctuation_style: tone.includes("專業") ? "strict" : "loose",
            code_switching: "rare",
            common_phrases: phrases
        };
    }

    if (!data.interaction_style.chart_comments) {
        data.interaction_style.chart_comments = {
           avatar_hook: "這數據...挺有意思的。",
           behavioral_rationale: "我沒什麼特別偏好，只是隨便看看。",
           content_preference: "我沒什麼特別偏好...",
           spending_habit: "該買就買吧。",
           activity_pattern: "作息看心情囉。"
        };
    } else {
        // --- Backward Compatibility Migration ---
        const comments = data.interaction_style.chart_comments;
        
        // 1. Hook Fallback
        if (!comments.avatar_hook) {
            const old = comments.content_preference || "";
            // Use first 15 chars + "..." if old monologue exists, else generic
            comments.avatar_hook = old.length > 2 ? (old.length > 15 ? old.substring(0, 14) + "..." : old) : "唔...";
        }

        // 2. Rationale Fallback
        if (!comments.behavioral_rationale) {
             comments.behavioral_rationale = comments.content_preference || "這是我目前的關注焦點。";
        }
    }
    
    data.interaction_style.ad_sensitivity = normalizeLevel(data.interaction_style.ad_sensitivity);
    data.interaction_style.privacy_sensitivity = normalizeLevel(data.interaction_style.privacy_sensitivity);

    if (!data.constraints) data.constraints = { money: {}, time: {}, knowledge: {}, emotional: {} };
    if (!data.constraints.money) data.constraints.money = {};
    
    // --- PHASE 4: CONTEXT-AWARE SELF-HEALING (MONEY & PERSONALITY) ---
    // Extract Context from Origin Profile
    const source = data.origin_profile?.source_type || 'upload';
    const skeleton = data.origin_profile?.skeleton || {};
    const shadowId = data.origin_profile?.shadow?.id || "";

    // 1. Money Healing (Source-Dependent)
    // Rule: Lab Mode trusts User Input (Skeleton). Upload Mode trusts Behavior/Vibe.
    if (!data.constraints.money.spending_power_level || data.constraints.money.spending_power_level === "中") {
        if (source === 'synthetic' && skeleton.income) {
             // Lab Mode: Authority = Skeleton
             const income = skeleton.income;
             if (income.includes("Affluent") || income.includes("富裕")) data.constraints.money.spending_power_level = "高";
             else if (income.includes("Budget") || income.includes("拮据") || income.includes("Survival")) data.constraints.money.spending_power_level = "低";
             else data.constraints.money.spending_power_level = "中";
        } else {
             // Upload Mode: Authority = Perception Vibe
             const vibe = data.perception_sheet?.spending_vibe || "";
             if (vibe.includes("大方") || vibe.includes("享受")) data.constraints.money.spending_power_level = "高";
             else if (vibe.includes("省") || vibe.includes("精算")) data.constraints.money.spending_power_level = "中";
             else if (vibe.includes("拮据") || vibe.includes("生存")) data.constraints.money.spending_power_level = "低";
        }
    }

    data.constraints.money.spending_power_level = normalizeLevel(data.constraints.money.spending_power_level);
    data.constraints.money.price_sensitivity = normalizeLevel(data.constraints.money.price_sensitivity);

    // 2. Personality Healing (Shadow Bias for Lab Mode)
    // Rule: If Lab Mode, ensure the chosen "Shadow" actually warps the personality scores.
    if (source === 'synthetic' && shadowId) {
        // Ensure dimensions exist before modifying
        const dims = normalizePersonaDimensions(data.personality_profile.dimensions);
        
        if (shadowId === 'impulse') {
            // Force High Spontaneity, Low Risk Aversion
            dims.planning_vs_spontaneous.base_score = Math.max(dims.planning_vs_spontaneous.base_score, 75);
            dims.planning_vs_spontaneous.level = "高";
        } else if (shadowId === 'paralysis' || shadowId === 'skeptic') {
            // Force Low Spontaneity (High Planning), Low Risk Tolerance
            dims.planning_vs_spontaneous.base_score = Math.min(dims.planning_vs_spontaneous.base_score, 35);
            dims.planning_vs_spontaneous.level = "低";
            dims.risk_attitude.base_score = Math.min(dims.risk_attitude.base_score, 30);
            dims.risk_attitude.level = "低";
        } else if (shadowId === 'hunter') {
            // Force High Financial Sensitivity
            dims.financial_sensitivity.base_score = Math.max(dims.financial_sensitivity.base_score, 80);
            dims.financial_sensitivity.level = "高";
        }
        
        // Write back normalized dimensions
        data.personality_profile.dimensions = dims;
    }

    if (!data.system_state) data.system_state = {};
    
    // --- PHASE 4: SELF-HEALING FLAW ---
    // If flaw is missing or None, infer from personality extremes
    if (!data.system_state.composite_flaw || data.system_state.composite_flaw.label === "無明顯盲點") {
        const impulse = data.personality_profile?.dimensions?.planning_vs_spontaneous?.base_score || 50;
        const risk = data.personality_profile?.dimensions?.risk_attitude?.base_score || 50;
        
        if (impulse > 75) {
            data.system_state.composite_flaw = { 
                label: "衝動控制困難", 
                description: "容易受視覺刺激影響，忽略預算限制。", 
                trigger_rule: "See Sale -> Buy" 
            };
        } else if (risk < 25) {
            data.system_state.composite_flaw = { 
                label: "決策癱瘓", 
                description: "過度擔心後悔，導致無法下單。", 
                trigger_rule: "High Price -> Freeze" 
            };
        } else {
            data.system_state.composite_flaw = { label: "無明顯盲點", description: "行為模式較為平衡", trigger_rule: "None" };
        }
    }
    
    if (!data.system_state.sample_dialogues) data.system_state.sample_dialogues = [];

    return data;
};
