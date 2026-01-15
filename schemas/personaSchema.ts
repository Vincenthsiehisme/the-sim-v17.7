
import { z } from 'zod';

// Define sub-schemas matching the TypeScript interfaces in types.ts

// --- ORIGIN PROFILE (NEW) ---
const OriginProfileSchema = z.object({
  source_type: z.enum(['upload', 'synthetic']),
  skeleton: z.object({
    role: z.string(),
    age: z.string(),
    income: z.string(),
    gender: z.string().optional()
  }).optional(),
  shadow: z.object({
    id: z.string(),
    label: z.string(),
  }).optional(),
  dna: z.any().optional(),
  humanity_score: z.number().optional(),
}).optional();

// --- DEFINITIONS FOR BEHAVIORAL PATTERN ---
const DEFAULT_FREQUENCY = { visits_per_month: 0, active_days_ratio: 0 };
const DEFAULT_DEPTH = { avg_pages_per_session: 0, long_session_ratio: 0 };
const DEFAULT_BREADTH = { category_diversity: 0, topic_diversity: 0 };
const DEFAULT_TIME = { preferred_time_slots: [], weekday_vs_weekend: "balanced" };
const DEFAULT_CONTENT = { top_categories: [], top_lda_topics: [] };
const DEFAULT_AD = { click_rate: 0, campaign_variety: 0, format_preference: [] };

export const BehavioralPatternSchema = z.object({
  frequency: z.object({
    visits_per_month: z.coerce.number().default(0),
    active_days_ratio: z.coerce.number().default(0),
  }).default(DEFAULT_FREQUENCY),
  depth: z.object({
    avg_pages_per_session: z.coerce.number().default(0),
    long_session_ratio: z.coerce.number().default(0),
  }).default(DEFAULT_DEPTH),
  breadth: z.object({
    category_diversity: z.coerce.number().default(0),
    topic_diversity: z.coerce.number().default(0),
  }).default(DEFAULT_BREADTH),
  time_pattern: z.object({
    preferred_time_slots: z.array(z.string()).default([]),
    weekday_vs_weekend: z.string().default("balanced"),
  }).default(DEFAULT_TIME),
  content_preference: z.object({
    top_categories: z.array(z.object({
      name: z.string(),
      weight: z.coerce.number(),
      keywords: z.array(z.string()).optional().default([]),
      intent: z.string().optional().default(""),
      first_seen_at: z.string().optional(),
      last_seen_at: z.string().optional(),
      interaction_count: z.coerce.number().optional().default(0),
      estimated_span_days: z.coerce.number().optional().default(1),
    })).default([]),
    top_lda_topics: z.array(z.object({
      topic_id: z.coerce.number(),
      label: z.string(),
      weight: z.coerce.number(),
      keyword: z.string().optional().nullable(),
    })).default([]),
  }).default(DEFAULT_CONTENT),
  ad_interaction: z.object({
    click_rate: z.coerce.number().default(0),
    campaign_variety: z.coerce.number().default(0),
    format_preference: z.array(z.string()).default([]),
  }).default(DEFAULT_AD),
});

const ContextualShiftSchema = z.object({
  condition: z.string(),
  shift_score: z.coerce.number(),
  description: z.string(),
});

const PersonalityDimensionSchema = z.object({
  level: z.enum(['High', 'Medium', 'Low', '高', '中', '低']).or(z.string()).default("中"),
  base_score: z.coerce.number().min(0).max(100).default(50), 
  evidence: z.string().default("無相關數據"),
  contextual_shift: ContextualShiftSchema.optional().nullable(),
});

const DEFAULT_DIMENSION = {
  level: "中",
  base_score: 50,
  evidence: "無相關數據"
};

const DEFAULT_DIMENSIONS_ALL = {
  novelty_seeking: DEFAULT_DIMENSION,
  planning_vs_spontaneous: DEFAULT_DIMENSION,
  risk_attitude: DEFAULT_DIMENSION,
  social_orientation: DEFAULT_DIMENSION,
  health_concern: DEFAULT_DIMENSION,
  financial_sensitivity: DEFAULT_DIMENSION,
};

export const PersonalityProfileSchema = z.object({
  summary_tags: z.array(z.string()).default([]),
  dimensions: z.object({
    novelty_seeking: PersonalityDimensionSchema.default(DEFAULT_DIMENSION),
    planning_vs_spontaneous: PersonalityDimensionSchema.default(DEFAULT_DIMENSION),
    risk_attitude: PersonalityDimensionSchema.default(DEFAULT_DIMENSION),
    social_orientation: PersonalityDimensionSchema.default(DEFAULT_DIMENSION),
    health_concern: PersonalityDimensionSchema.default(DEFAULT_DIMENSION),
    financial_sensitivity: PersonalityDimensionSchema.default(DEFAULT_DIMENSION),
  }).default(DEFAULT_DIMENSIONS_ALL),
});

const GoalSchema = z.object({
  goal: z.string(),
  priority: z.coerce.number().optional(),
  evidence: z.string().default(""),
});

const LatentNeedSchema = z.object({
  hypothesis: z.string(),
  confidence: z.coerce.number().default(50),
  evidence: z.string().default(""),
});

const DEFAULT_MOTIVATIONS = {
  primary_goals: [],
  secondary_goals: [],
  latent_needs: []
};

export const MotivationsSchema = z.object({
  primary_goals: z.array(GoalSchema).default([]),
  secondary_goals: z.array(GoalSchema).default([]),
  latent_needs: z.array(LatentNeedSchema).default([]),
});

const ConflictSchema = z.object({
  type: z.string(),
  description: z.string(),
  evidence: z.string(),
});

const InsightSchema = z.object({
  insight: z.string(),
  evidence: z.string(),
  pattern: z.string().optional(),
});

const DEFAULT_CONTRADICTIONS = {
  conflicts: [],
  non_intuitive_insights: [],
  paradoxical_behaviors: []
};

export const ContradictionsAndInsightsSchema = z.object({
  conflicts: z.array(ConflictSchema).default([]),
  non_intuitive_insights: z.array(InsightSchema).default([]),
  paradoxical_behaviors: z.array(InsightSchema).default([]),
});

const DEFAULT_CONSTRAINT_TIME = { available_time_pattern: "未知", evidence: "" };
const DEFAULT_CONSTRAINT_MONEY = { spending_power_level: "中", price_sensitivity: "中", evidence: "" };
const DEFAULT_CONSTRAINT_KNOWLEDGE = { domain_knowledge_level: "普通", evidence: "" };
const DEFAULT_CONSTRAINT_ACCESS = { tech_constraint: null, channel_constraint: null };
const DEFAULT_CONSTRAINT_EMOTIONAL = { change_aversion: "無", evidence: "" };

export const ConstraintsSchema = z.object({
  time: z.object({
    available_time_pattern: z.string().default("未知"),
    evidence: z.string().default(""),
  }).default(DEFAULT_CONSTRAINT_TIME),
  money: z.object({
    spending_power_level: z.enum(['High', 'Medium', 'Low', '高', '中', '低']).or(z.string()).default("中"),
    price_sensitivity: z.enum(['High', 'Medium', 'Low', '高', '中', '低']).or(z.string()).default("中"),
    evidence: z.string().default(""),
  }).default(DEFAULT_CONSTRAINT_MONEY),
  knowledge: z.object({
    domain_knowledge_level: z.string().default("普通"),
    evidence: z.string().default(""),
  }).default(DEFAULT_CONSTRAINT_KNOWLEDGE),
  access: z.object({
    tech_constraint: z.string().nullable().optional(),
    channel_constraint: z.string().nullable().optional(),
  }).default(DEFAULT_CONSTRAINT_ACCESS),
  emotional: z.object({
    change_aversion: z.string().default("無"),
    evidence: z.string().default(""),
  }).default(DEFAULT_CONSTRAINT_EMOTIONAL),
});

const SpeakingStyleSchema = z.object({
  emoji_usage: z.enum(['high', 'medium', 'low', 'none']).or(z.string()).default("medium"),
  punctuation_style: z.enum(['strict', 'loose', 'expressive', 'minimalist']).or(z.string()).default("loose"),
  code_switching: z.enum(['none', 'rare', 'moderate', 'heavy']).or(z.string()).default("rare"),
  common_phrases: z.array(z.string()).default([]),
});

const DialogueStyleSchema = z.object({
  response_length: z.enum(['short_bursts', 'concise', 'elaborate']).or(z.string()).default("concise"),
  proactivity: z.enum(['reactive', 'balanced', 'proactive']).or(z.string()).default("balanced"),
  digression_rate: z.enum(['focused', 'associative']).or(z.string()).default("focused"),
  conflict_style: z.enum(['agreeable', 'defensive', 'assertive', 'passive_aggressive']).or(z.string()).default("agreeable"),
});

const DEFAULT_SPEAKING = { emoji_usage: "medium", punctuation_style: "loose", code_switching: "rare", common_phrases: [] };
const DEFAULT_DIALOGUE = { response_length: "concise", proactivity: "balanced", digression_rate: "focused", conflict_style: "agreeable" };

export const InteractionStyleSchema = z.object({
  tone_preference: z.array(z.string()).default(["友善"]),
  content_format_preference: z.array(z.string()).default([]),
  length_tolerance: z.enum(['short', 'medium', 'long']).or(z.string()).default("medium"),
  ad_sensitivity: z.enum(['low', 'medium', 'high']).or(z.string()).default("中"),
  privacy_sensitivity: z.enum(['low', 'medium', 'high']).or(z.string()).default("中"),
  recommended_channels: z.array(z.string()).default(["Mobile"]),
  speaking_style: SpeakingStyleSchema.default(DEFAULT_SPEAKING),
  dialogue_style: DialogueStyleSchema.default(DEFAULT_DIALOGUE),
  chart_comments: z.object({
    avatar_hook: z.string().optional().default(""),
    behavioral_rationale: z.string().optional().default(""),
    content_preference: z.string().optional(),
    spending_habit: z.string().optional(),
    activity_pattern: z.string().optional(),
  }).optional().nullable(),
});

const DEFAULT_INTERACTION = {
  tone_preference: ["友善"],
  content_format_preference: [],
  length_tolerance: "medium",
  ad_sensitivity: "中",
  privacy_sensitivity: "中",
  recommended_channels: ["Mobile"],
  speaking_style: DEFAULT_SPEAKING,
  dialogue_style: DEFAULT_DIALOGUE,
  chart_comments: null
};

const SampleDialogueSchema = z.object({
  scenario: z.string(),
  intent: z.string(),
  text: z.string(),
});

const DEFAULT_LOGIC = { label: "預設", behavior_rule: "" };
const DEFAULT_FLAW = { label: "無", description: "", trigger_rule: "" };

const PsychologicalStateSchema = z.object({
  quadrant: z.enum(['High_Tension', 'Impulse', 'Skeptic', 'Drifter']).or(z.string()).default('Drifter'),
  desire_source: z.string().default("未知"),
  defense_source: z.string().default("未知"),
  rational_alibi: z.string().default("無"),
}).optional();

// Use preprocess to robustly handle string vs object response for MarketingTactic
const MarketingTacticSchema = z.preprocess((val) => {
  if (typeof val === 'string') return { tactic: val, copy: "AI 未提供文案範例。" };
  return val;
}, z.object({
  tactic: z.string().default(""),
  copy: z.string().default(""),
}));

const NerveEndingSchema = z.object({
  keyword: z.string(),
  valence: z.enum(['positive', 'negative']).or(z.string()),
  intensity: z.number(),
  reaction: z.string()
});

const ParadoxProtocolSchema = z.object({
  public_mask: z.string(),
  private_self: z.string(),
  trigger_condition: z.string(),
  switch_instruction: z.string()
});

export const SystemStateSchema = z.object({
  economic_logic: z.object({
    label: z.string().default("預設"),
    behavior_rule: z.string().default(""),
  }).default(DEFAULT_LOGIC).nullable(),
  time_logic: z.object({
    label: z.string().default("預設"),
    behavior_rule: z.string().default(""),
  }).default(DEFAULT_LOGIC).nullable(),
  composite_flaw: z.object({
    label: z.string().default("無"),
    description: z.string().default(""),
    trigger_rule: z.string().default(""),
  }).default(DEFAULT_FLAW).nullable(),
  
  nerve_endings: z.array(NerveEndingSchema).optional(),
  paradox_protocol: ParadoxProtocolSchema.optional(),

  marketing_tactics: z.object({
    scarcity: MarketingTacticSchema.optional(),
    authority: MarketingTacticSchema.optional(),
    social_proof: MarketingTacticSchema.optional(),
    novelty: MarketingTacticSchema.optional(),
    value: MarketingTacticSchema.optional(),
  }).optional(),
  
  psychological_state: PsychologicalStateSchema,
  sample_dialogues: z.array(SampleDialogueSchema).default([]),
});

const DEFAULT_SYSTEM = {
  economic_logic: DEFAULT_LOGIC,
  time_logic: DEFAULT_LOGIC,
  composite_flaw: DEFAULT_FLAW,
  sample_dialogues: []
};

const DEFAULT_BEHAVIORAL = {
    frequency: DEFAULT_FREQUENCY,
    depth: DEFAULT_DEPTH,
    breadth: DEFAULT_BREADTH,
    time_pattern: DEFAULT_TIME,
    content_preference: DEFAULT_CONTENT,
    ad_interaction: DEFAULT_AD
};

const DEFAULT_CONSTRAINTS = {
    time: DEFAULT_CONSTRAINT_TIME,
    money: DEFAULT_CONSTRAINT_MONEY,
    knowledge: DEFAULT_CONSTRAINT_KNOWLEDGE,
    access: DEFAULT_CONSTRAINT_ACCESS,
    emotional: DEFAULT_CONSTRAINT_EMOTIONAL
};

// --- NEW SCHEMAS FOR DIGITAL TWIN PERSONA ---

const SelfPerceptionSchema = z.object({
  vibe: z.string().default(""),
  temporal_sense: z.string().default(""),
  spending_vibe: z.string().default(""),
  fuzzy_memory: z.string().default(""),
  transactional_memory: z.string().optional(),
  engagement_memory: z.string().optional(),
});

const MarketingArchetypeSchema = z.object({
  life_role: z.string().default(""),
  financial_role: z.string().default(""),
  media_role: z.string().default(""),
  decision_archetype: z.string().default(""),
});

const ContextProfileSchema = z.object({
  life_stage: z.string().default(""),
  age_bucket: z.string().default(""),
  gender_guess: z.string().nullable().default(null),
  location_level: z.string().default(""),
  device_pref: z.array(z.string()).default([]),
  channel_mix: z.record(z.number()).default({}),
  visit_recency: z.string().default(""),
  engagement_level: z.string().default(""),
  marketing_archetype: MarketingArchetypeSchema.optional(),
  custom_dimensions: z.record(z.string()).optional(),
});

const DEFAULT_CONTEXT_PROFILE = {
  life_stage: "未知階段",
  age_bucket: "未知年齡",
  gender_guess: "Neutral",
  location_level: "未知地點",
  device_pref: ["Mobile"],
  channel_mix: { "Direct": 1 },
  visit_recency: "未知",
  engagement_level: "低",
  marketing_archetype: {
      life_role: "一般消費者",
      financial_role: "一般",
      media_role: "一般",
      decision_archetype: "一般觀望型"
  },
  custom_dimensions: {}
};

export const DigitalTwinPersonaSchema = z.object({
  twin_id: z.string().optional(),
  source_user_ids: z.array(z.string()).default([]),
  avatar_url: z.string().optional(),
  data_window: z.object({
    start_date: z.string().default(""),
    end_date: z.string().default(""),
  }).optional(),
  confidence_score: z.coerce.number().default(0),
  last_updated_at: z.string().optional(),
  perception_sheet: SelfPerceptionSchema.optional(),
  origin_profile: OriginProfileSchema,
  context_profile: ContextProfileSchema.default(DEFAULT_CONTEXT_PROFILE),
  behavioral_pattern: BehavioralPatternSchema.default(DEFAULT_BEHAVIORAL),
  personality_profile: PersonalityProfileSchema.default({
      summary_tags: [],
      dimensions: DEFAULT_DIMENSIONS_ALL
  }),
  motivations: MotivationsSchema.default(DEFAULT_MOTIVATIONS),
  contradictions_and_insights: ContradictionsAndInsightsSchema.default(DEFAULT_CONTRADICTIONS),
  constraints: ConstraintsSchema.default(DEFAULT_CONSTRAINTS),
  interaction_style: InteractionStyleSchema.default(DEFAULT_INTERACTION),
  system_state: SystemStateSchema.default(DEFAULT_SYSTEM),
});
