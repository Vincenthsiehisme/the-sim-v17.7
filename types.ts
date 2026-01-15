
// ... existing imports

export interface ContentCategory {
  name: string;
  weight: number;
  keywords?: string[]; 
  intent?: string;     
  first_seen_at?: string; 
  last_seen_at?: string;  
  interaction_count?: number; // Total events
  estimated_span_days?: number; // NEW: Duration of interest in days
}

export type ActionType = 'view' | 'purchase' | 'click' | 'search' | 'add_to_cart' | 'checkout' | 'speak' | 'survey' | 'unknown';

export interface StandardInteraction {
  timestamp: string;       
  actor_id: string;        
  action_type: ActionType; 
  category: string;        
  subject: string;         
  value?: number;          
  content_body?: string;   
  metadata?: Record<string, any>; 
}

export interface SelfPerception {
  vibe: string;           
  temporal_sense: string; 
  spending_vibe: string;  
  fuzzy_memory: string;   
  transactional_memory?: string; 
  engagement_memory?: string;    
}

export type ScenarioMode = 'sales' | 'content' | 'friend';

export type SocialPlatform = 'LINE' | 'PTT' | 'IG' | 'General';

export interface SocialContext {
  platform: SocialPlatform;
  description: string;
}

export interface SimulationModifiers {
  budget_anxiety: number; 
  patience: number;       
  social_mask: number;    
  purchase_intent: number; 
  social_context?: SocialContext; 
}

export interface CsvConstraints {
  time_rules: string;      
  money_rules: string;     
  keyword_injection: string[]; 
}

export interface ObservedEvidence {
  maxTransaction: number; 
  totalSpending: number;  
  avgSpending: number;    
  spendingFrequency: number; 
  isCryptoOrGambling?: boolean; 
}

export type MoneyType = 'Blood_Sweat' | 'Easy_Windfall' | 'Stable_Salary' | 'Cash_Flow';
export type CopingStrategy = 'Installment_King' | 'Eat_Cheap_Wear_Rich' | 'Mom_Bank' | 'Stealth_Wealth' | 'Normal' | 'Compensatory_Consumption';

export interface SocialTension {
  moneyType: MoneyType;
  faceScore: number; 
  copingStrategy: CopingStrategy;
  narrativeOverride: string; 
}

export interface RealityCheck {
  coherence_level: 'High' | 'Medium' | 'Low' | 'Delusional' | 'Anomaly' | 'Insolvent'; 
  reality_gap_description: string; 
  correction_rules: {
    display_role: string; 
    spending_logic: string; 
  };
  social_tension?: SocialTension; 
}

export interface PersonaDNA {
  role: string;
  lifestyle: string[]; 
  anxiety: string;     
  spending_habit: string; 
  hidden_trait: string; 
  reality_check?: RealityCheck; 
  _sociology_pack?: CsvConstraints; 
  config_signature?: string; 
  _generated_resonance?: {
      product_name: string;      
      pain_point: string;        
      marketing_hook: string;    
      strategy_label: string;    
      value_layer: string;       
  };
}

export type ChronosMode = 'forensic' | 'live' | 'forecast';

export interface ChronosEvent {
  date: string; 
  type: 'weather' | 'holiday' | 'news' | 'trend' | 'disaster';
  title: string;
  impact_level: 'High' | 'Medium' | 'Low';
}

export interface TacticalAlert {
  type: 'liquidity' | 'bandwidth' | 'opportunity';
  title: string; 
  level: 'Critical' | 'Warning' | 'Info';
  symptom: string; 
  prescription: string; 
}

export interface ChronosState {
  liquidity: 'High' | 'Medium' | 'Low' | 'Crisis'; 
  bandwidth: 'Open' | 'Occupied' | 'Fragmented'; 
  liquidity_reason?: string;
  bandwidth_reason?: string;
}

export interface ChronosReport {
  mode: ChronosMode;
  analysis_date: string; 
  timeline: ChronosEvent[];
  summary: string; 
  impact_analysis?: string; 
  inner_monologue?: string; 
  current_state?: ChronosState;
  tactical_alerts?: TacticalAlert[];
  marketing_advice?: string; 
}

export interface ProductResonance {
  value_layer: 'Functional' | 'Emotional' | 'Social';
  strategy_label?: string; 
  pain_point: string;
  product_solution: string;
  marketing_hook: string;
  is_over_interpretation: boolean;
  plausibility_score: number; 
  market_audit?: {
    estimated_real_price: string;
    price_gap_description: string;
  };
  social_radius?: string; 
}

export interface PersonaCandidate {
  id: string;
  role: string;          
  age_range: string;     
  income_level: string;  
  gender_guess?: 'Male' | 'Female' | 'General'; 
  psychological_driver?: string; 
  match_reason?: string;  
  shadow_id: string;     
  type?: 'Rational' | 'Aspirational' | 'Niche'; 
  purchase_friction?: 'Low' | 'Medium' | 'High'; 
  resonance_analysis: ProductResonance;
  source_snapshot?: {
      product_name: string;
      product_price: string;
      generated_at: number;
  };
}

export type GenderOption = 'Male' | 'Female' | 'General';

export interface OriginProfile {
  source_type: 'upload' | 'synthetic';
  parent_candidate_id?: string; 
  skeleton?: {
    role: string;
    age: string;
    income: string;
    gender?: GenderOption; 
  };
  dna?: PersonaDNA; 
  shadow?: {
    id: string;
    label: string;
  };
  humanity_score?: number; 
}

export interface SpeakingStyle {
  emoji_usage: 'high' | 'medium' | 'low' | 'none' | string;
  punctuation_style: 'strict' | 'loose' | 'expressive' | 'minimalist' | string;
  code_switching: 'none' | 'rare' | 'moderate' | 'heavy' | string; 
  common_phrases: string[]; 
}

export interface DialogueStyle {
  response_length: 'short_bursts' | 'concise' | 'elaborate' | string;
  proactivity: 'reactive' | 'balanced' | 'proactive' | string;
  digression_rate: 'focused' | 'associative' | string;
  conflict_style: 'agreeable' | 'defensive' | 'assertive' | 'passive_aggressive' | string;
}

export interface SampleDialogue {
  scenario: string; 
  intent: string; 
  text: string; 
}

export interface PsychologicalState {
  quadrant: 'High_Tension' | 'Impulse' | 'Skeptic' | 'Drifter';
  desire_source: string; 
  defense_source: string; 
  rational_alibi: string; 
}

export interface MarketingTactic {
  tactic: string; 
  copy: string;   
}

export interface NerveEnding {
  keyword: string;       
  valence: 'positive' | 'negative';
  intensity: number;     
  reaction: string;      
}

export interface ParadoxProtocol {
  public_mask: string;   
  private_self: string;  
  trigger_condition: string; 
  switch_instruction: string; 
}

export interface SystemState {
  economic_logic: {
    label: string; 
    behavior_rule: string; 
  };
  time_logic?: {
    label: string; 
    behavior_rule: string;
  };
  composite_flaw: {
    label: string; 
    description: string; 
    trigger_rule: string; 
  };
  nerve_endings?: NerveEnding[];
  paradox_protocol?: ParadoxProtocol;
  marketing_tactics?: {
    scarcity?: MarketingTactic;
    authority?: MarketingTactic;
    social_proof?: MarketingTactic;
    novelty?: MarketingTactic;
    value?: MarketingTactic;
  };
  psychological_state?: PsychologicalState;
  sample_dialogues: SampleDialogue[]; 
}

export interface MarketingArchetype {
  life_role: string;      
  financial_role: string; 
  media_role: string;     
  decision_archetype: string; 
}

export interface ContextProfile {
  life_stage: string;
  age_bucket: string;
  gender_guess: string | null;
  location_level: string;
  device_pref: string[];
  channel_mix: Record<string, number>;
  visit_recency: string;
  engagement_level: string;
  marketing_archetype?: MarketingArchetype; 
  custom_dimensions?: Record<string, string>;
}

export interface BehavioralPattern {
  frequency: {
    visits_per_month: number;
    active_days_ratio: number;
  };
  depth: {
    avg_pages_per_session: number;
    long_session_ratio?: number;
  };
  breadth?: {
    category_diversity: number;
    topic_diversity: number;
  };
  time_pattern: {
    preferred_time_slots: string[];
    weekday_vs_weekend?: string;
  };
  content_preference: {
    top_categories: ContentCategory[];
    top_lda_topics: { topic_id: number; label: string; weight: number; keyword?: string }[];
  };
  ad_interaction: {
    click_rate: number;
    campaign_variety: number;
    format_preference: string[];
  };
}

export interface ContextualShift {
  condition: string; 
  shift_score: number; 
  description: string; 
}

export interface PersonalityDimension {
  level: string; 
  base_score: number; 
  evidence: string;
  contextual_shift?: ContextualShift; 
}

export interface PersonalityProfile {
  summary_tags: string[];
  dimensions: {
    novelty_seeking: PersonalityDimension;
    planning_vs_spontaneous: PersonalityDimension;
    risk_attitude: PersonalityDimension;
    social_orientation: PersonalityDimension;
    health_concern?: PersonalityDimension;
    financial_sensitivity: PersonalityDimension;
  };
}

export interface Goal {
  goal: string;
  priority?: number;
  evidence: string;
}

export interface LatentNeed {
  hypothesis: string;
  confidence: number;
  evidence: string;
}

export interface Motivations {
  primary_goals: Goal[];
  secondary_goals: Goal[];
  latent_needs: LatentNeed[];
}

export interface Conflict {
  type: string;
  description: string;
  evidence: string;
}

export interface Insight {
  insight: string;
  evidence: string;
  pattern?: string; 
}

export interface ContradictionsAndInsights {
  conflicts: Conflict[];
  non_intuitive_insights: Insight[];
  paradoxical_behaviors: Insight[];
  irrational_triggers?: string[];
  paradox_core?: string;
}

// === NEW INTERFACES (Fixing Missing Types) ===

export interface Constraints {
  time: { available_time_pattern: string; evidence: string };
  money: { spending_power_level: string; price_sensitivity: string; evidence: string };
  knowledge: { domain_knowledge_level: string; evidence: string };
  access: { tech_constraint?: string | null; channel_constraint?: string | null };
  emotional: { change_aversion: string; evidence: string };
}

export interface InteractionStyle {
  tone_preference: string[];
  content_format_preference: string[];
  length_tolerance: string;
  ad_sensitivity: string;
  privacy_sensitivity: string;
  recommended_channels: string[];
  speaking_style: SpeakingStyle;
  dialogue_style: DialogueStyle;
  chart_comments?: {
    avatar_hook?: string;
    behavioral_rationale?: string;
    content_preference?: string;
    spending_habit?: string;
    activity_pattern?: string;
  } | null;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isSystemEvent?: boolean;
}

export interface SimulationResult {
  winner: 'A' | 'B' | 'Tie';
  scores: { a: number; b: number };
  gut_feeling: string;
  verbal_response: string;
  action_probability: number;
  system_reality_check: string;
  reasoning: string;
  deep_rationale: string;
  psychological_triggers: {
    positive: string[];
    negative: string[];
  };
  blind_spot_triggered: boolean;
  suggested_refinement: string;
}

export interface TensionAnalysis {
  state: 'High_Tension' | 'Impulse' | 'Skeptic' | 'Drifter';
  label: string;
  description: string;
  strategy: string;
  advice: string;
  scores: { desire: number; defense: number };
  breakdown?: {
    desire_source: string;
    defense_source: string;
    rational_alibi: string;
  };
}

export interface DigitalTwinPersona {
  twin_id: string;
  source_user_ids: string[];
  avatar_url?: string; 
  data_window: {
    start_date: string;
    end_date: string;
  };
  confidence_score: number;
  last_updated_at: string;
  
  perception_sheet?: SelfPerception;
  origin_profile?: OriginProfile;
  chronos_report?: ChronosReport;

  context_profile: ContextProfile;
  behavioral_pattern: BehavioralPattern;
  personality_profile: PersonalityProfile;
  motivations: Motivations;
  contradictions_and_insights: ContradictionsAndInsights;
  constraints: Constraints;
  interaction_style: InteractionStyle;
  system_state: SystemState;
}
