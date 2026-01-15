
// ... existing imports
import { GoogleGenAI } from "@google/genai";
import type { Chat, GenerateContentResponse } from "@google/genai";
import { DigitalTwinPersona, SimulationResult, SimulationModifiers, ScenarioMode, OriginProfile, PersonaDNA, GenderOption, ObservedEvidence, PersonaCandidate, ChronosReport, ChronosMode } from '../types';
import { DigitalTwinPersonaSchema } from '../schemas/personaSchema';
import { 
  OMNISCIENT_ANALYST_INSTRUCTION,
  PSYCHOLOGIST_INSTRUCTION,
  ACTOR_INSTRUCTION,
  ARCHITECT_INSTRUCTION,
  buildArchitectPrompt,
  IMMERSIVE_ROLEPLAY_PROTOCOL,
  buildChatSystemInstruction, 
  SCHEMA_INFERENCE_INSTRUCTION, 
  MARKETING_SIMULATION_INSTRUCTION, 
  AVATAR_GENERATION_PROMPT_TEMPLATE,
  buildCsvSchemaPrompt,
  buildAnalystBasePrompt,
  buildChatContextHeaders,
  buildMarketingSimulationContext,
  buildMarketingSimulationInput,
  ENRICHMENT_INSTRUCTION,
  buildProfilerPrompt,
  PRODUCT_MIRROR_INSTRUCTION,
  buildProductMirrorPrompt,
  CHRONOS_INSTRUCTION,
  buildChronosPrompt
} from './prompts';
import { sanitizeAndNormalizePersona, trySafeJsonParse, cleanJsonString } from '../utils/normalization';
import { analyzeAvatarVisuals, getAvatarTitle } from '../utils/personaAnalytics';
import { smartDistillCsv } from '../utils/smartDistiller';
import { getSocioEconomicContext } from '../data/taiwan_sociology';
import { openDataService } from './OpenDataService';

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Helper: Strict delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Helper: Format Date YYYY/MM/DD
 */
const formatDate = (date: Date) => date.toISOString().split('T')[0].replace(/-/g, '/');

/**
 * Helper: Add Days
 */
const addDays = (date: Date, days: number) => {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
};

/**
 * Helper: Retry an async function with exponential backoff.
 */
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  retries = 3,
  baseDelay = 2000,
  stageName = "API Call",
  logFatal = true 
): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const status = error.status || error.code;
    const msg = (error.message || "").toLowerCase();

    const isRateLimit = 
      status === 429 || 
      status === 'RESOURCE_EXHAUSTED' ||
      msg.includes('429') || 
      msg.includes('quota') ||
      msg.includes('rate limit') ||
      msg.includes('exhausted');

    const isServerError = 
      status === 500 || 
      status === 503 || 
      status === 504 ||
      msg.includes('internal error') ||
      msg.includes('overloaded');

    const isRetryable = 
      retries > 0 && (
        isRateLimit ||
        isServerError ||
        msg.includes('fetch failed') ||
        msg.includes('network error') ||
        msg.includes('rpc failed') ||
        msg.includes('json') ||   
        msg.includes('syntax') || 
        error instanceof SyntaxError 
      );

    if (isRetryable) {
      let waitTime = baseDelay;
      if (isRateLimit) waitTime = Math.max(baseDelay, 10000);
      else if (isServerError) waitTime = Math.max(baseDelay, 6000);
      
      console.warn(`[${stageName}] failed (Status: ${status || 'Error'}). Retrying in ${waitTime/1000}s... (${retries} attempts left).`);
      
      await delay(waitTime);
      return retryWithBackoff(fn, retries - 1, waitTime * 1.5, stageName, logFatal);
    }
    
    if (logFatal) {
      console.error(`[${stageName}] Fatal Error:`, error);
    } else {
      console.warn(`[${stageName}] Failed after retries (Non-fatal):`, error.message || error);
    }
    throw error;
  }
};

/**
 * Helper: Map Scenario ID to English Shadow Description
 */
const mapScenarioToShadow = (id: string): string => {
    switch (id) {
        case 'fomo': return "FOMO Follower. Easily influenced by trends and crowd count.";
        case 'cp': return "Extreme Pragmatist. Calculates CP value, ignores emotional marketing.";
        case 'vibe': return "Aesthetic Curator. Prioritizes visuals and brand vibe over function.";
        case 'hater': return "Hostile Skeptic. Assumes marketing is a scam. Needs extreme proof.";
        case 'auto': return ""; // Return empty string to let AI infer
        default: return id;
    }
};

/**
 * NEW: Chronos Oracle (Time & Context Layer)
 * Generates environmental context based on persona mode (Forensic, Live, Forecast).
 */
export const generateChronosReport = async (
  persona: DigitalTwinPersona
): Promise<ChronosReport> => {
  return retryWithBackoff(async () => {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";

    // 1. Determine Mode (Strict Tri-State Routing)
    let mode: ChronosMode = 'live';
    const sourceType = persona.origin_profile?.source_type;
    const window = persona.data_window;

    // Logic: 
    // - Forensic: If user uploaded historical CSV data (valid start/end dates from past).
    // - Live/Forecast: If user generated a synthetic persona (Lab/Product Mirror).
    //   Synthetic personas exist in the "Present/Future", not the past.
    //   We use the combined 'live' mode prompt which covers both Now (Empathy) and Next 30 Days (Strategy).
    if (sourceType === 'upload' && window?.start_date && window?.end_date) {
        mode = 'forensic';
    } else {
        mode = 'live'; // Default for Synthetic
    }

    // 2. Calculate Precise Analysis Date String
    const today = new Date();
    let analysisDateStr = formatDate(today);

    if (mode === 'forensic' && window?.start_date && window?.end_date) {
        // Clean formatting: 2023/10/01 - 2023/10/15
        const start = window.start_date.split(' ')[0].replace(/-/g, '/');
        const end = window.end_date.split(' ')[0].replace(/-/g, '/');
        analysisDateStr = `${start} - ${end}`;
    } else {
        // Live/Forecast: Today + Next 30 Days
        const nextMonth = addDays(today, 30);
        analysisDateStr = `${formatDate(today)} - ${formatDate(nextMonth)} (Live)`;
    }

    // 3. Prepare Context Variables
    const role = persona.origin_profile?.skeleton?.role || persona.context_profile.life_stage || "User";
    const dateInfo = {
        start: window?.start_date,
        end: window?.end_date,
        role: role
    };

    // 4. Build Prompt
    const prompt = buildChronosPrompt(mode, dateInfo);

    // 5. Call AI with Search Tool
    const response = await ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: CHRONOS_INSTRUCTION }, { text: prompt }] }
        ],
        config: {
          tools: [{ googleSearch: {} }],
          temperature: 0.7, 
        }
    });

    const report = trySafeJsonParse<ChronosReport>(cleanJsonString(response.text || "{}"));
    
    // Fallback if parsing fails
    if (!report.summary) {
        return {
            mode: mode,
            analysis_date: analysisDateStr,
            timeline: [],
            summary: "無法取得時空背景資訊，請稍後再試。(System Error)",
        };
    }

    // Override AI's date with our strictly calculated system date
    report.mode = mode;
    report.analysis_date = analysisDateStr;

    return report;

  }, 2, 3000, "Chronos Oracle");
};

/**
 * NEW: Product Mirror - Reverse Engineering
 */
export const mirrorPersonaFromProduct = async (
  name: string,
  price: string,
  desc: string
): Promise<PersonaCandidate[]> => {
  return retryWithBackoff(async () => {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";

    const prompt = buildProductMirrorPrompt(name, price, desc);

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: PRODUCT_MIRROR_INSTRUCTION }, { text: prompt }] }
      ],
      config: {
        // Use Google Search to ground market reality
        tools: [{ googleSearch: {} }],
        temperature: 0.9,
      }
    });

    const result = trySafeJsonParse<{ candidates: PersonaCandidate[] }>(cleanJsonString(response.text || "{}"));
    
    // INJECT SNAPSHOT & FORCE ID
    const candidatesWithSnapshot = (result.candidates || []).map((c, index) => ({
        ...c,
        // 🛡️ 防禦機制：如果 AI 沒給 ID，我們自己用 Timestamp + Index 生成一個唯一的
        id: c.id || `candidate_auto_${Date.now()}_${index}`,
        source_snapshot: {
            product_name: name,
            product_price: price,
            generated_at: Date.now()
        }
    }));

    return candidatesWithSnapshot;

  }, 2, 3000, "Product Mirror");
};

/**
 * NEW: The Profiler (Enrichment Layer)
 * Expands a simple role into a complex DNA structure.
 * UPDATED: Now performs SOCIOLOGICAL CALIBRATION before asking AI.
 * ENABLED: Google Search Tool for Vibe Check.
 */
export const enrichPersonaRole = async (
  role: string, 
  age: string, 
  income: string,
  shadowId?: string, // New Parameter (ID)
  gender?: GenderOption, // New Parameter
  resonance?: any // NEW: PRI Protocol Payload
): Promise<PersonaDNA> => {
  return retryWithBackoff(async () => {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";
    
    // Map Scenario ID to English Description
    const shadowDesc = shadowId ? mapScenarioToShadow(shadowId) : "";

    // 1. Calculate Socio-Economic Context (Taiwan Specific - MECE Enhanced)
    // UPDATED: Now returns realityCheck object with social_tension
    const { narrative, constraints, realityCheck } = getSocioEconomicContext(age, role, income);
    console.log(">> MECE Sociological Context:", narrative);

    // 2. Build Prompt with Context and optional Resonance
    const prompt = buildProfilerPrompt(role, age, income, shadowDesc, narrative, gender, resonance);

    const response = await ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: ENRICHMENT_INSTRUCTION }, { text: prompt }] }
        ],
        config: {
          // NOTE: responseMimeType is OMITTED when using tools to comply with guidelines.
          // We rely on the prompt to enforce JSON format and cleanJsonString to parse it.
          tools: [{ googleSearch: {} }], 
          temperature: 0.9, 
        }
    });

    const dna = trySafeJsonParse<PersonaDNA>(cleanJsonString(response.text || "{}"));
    
    // Validate structural integrity
    if (!dna.lifestyle || !dna.anxiety || !dna.spending_habit) {
        throw new Error("Profiler returned incomplete DNA");
    }
    
    // Inject original role for reference
    dna.role = role;
    
    // Inject Sociology Pack if present (The hard constraints for CSV Architect)
    if (constraints) {
        dna._sociology_pack = constraints;
    }

    // Inject Resonance if present (for Architect use)
    if (resonance) {
        dna._generated_resonance = resonance;
    }

    // Inject Reality Check from Logic Layer (System of Truth) if AI didn't provide or we want to enforce it
    // We prioritize the Logic Layer's detection for coherence level
    if (realityCheck) {
        dna.reality_check = {
            ...dna.reality_check, // Keep AI's flavor text if exists
            coherence_level: realityCheck.coherence_level,
            // Allow AI to expand on description but ensure core logic matches
            correction_rules: realityCheck.correction_rules,
            // Persist social tension data for future use
            social_tension: realityCheck.social_tension
        } as any;
    }
    
    return dna;

  }, 2, 3000, "Persona Enrichment");
};

/**
 * Synthesizes a raw CSV string based on Persona inputs (Skeleton & Shadow).
 * UPDATED: Now looks up Time Profile weights and injects them.
 */
export const synthesizePersonaData = async (
  skeleton: { role: string, age: string, income: string, gender?: GenderOption },
  shadowId: string,
  chaos: number,
  dna?: PersonaDNA // New Optional Input
): Promise<string> => {
  return retryWithBackoff(async () => {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";

    // Map Scenario ID to English Description
    const shadowDesc = mapScenarioToShadow(shadowId);

    // 1. Resolve Time Schedule based on Role
    // This connects the Role string to the Open Data Time Patterns (Plan A)
    const timeProfile = openDataService.getTimeProfileByRole(skeleton.role);
    
    // Format the weights for the prompt
    let scheduleSummary = "";
    if (timeProfile) {
        scheduleSummary = `Role Type: ${timeProfile.label}\n`;
        scheduleSummary += "Hourly Activity Weights (0-100):\n";
        
        // Group by blocks to save tokens and make it readable
        // e.g. "00-06: 0 (Sleep), 07-08: 20 (Wake)..."
        const weights = timeProfile.hourly_weights;
        let currentBlockStart = 0;
        let currentWeight = weights[0];
        
        for (let i = 1; i <= 24; i++) {
            const w = (i < 24) ? weights[i] : -1; // -1 forces end at 24
            // Check delta tolerance (allow small variations to be grouped)
            if (Math.abs(w - currentWeight) > 15 || i === 24) {
               const range = currentBlockStart === i - 1 ? `${currentBlockStart}:00` : `${currentBlockStart}:00-${i-1}:59`;
               let intensity = "Zero";
               if (currentWeight > 80) intensity = "High Intensity (Focus/Peak)";
               else if (currentWeight > 40) intensity = "Medium (Routine)";
               else if (currentWeight > 10) intensity = "Low (Fragmented/Background)";
               else if (currentWeight > 0) intensity = "Minimal";
               
               scheduleSummary += `- ${range}: Weight ${Math.round(currentWeight)} (${intensity})\n`;
               
               currentBlockStart = i;
               currentWeight = w;
            }
        }

        // NEW: Inject Weekend Strategy from Time Routing Matrix
        const weekendNote = timeProfile.weekend_active 
            ? "[WEEKEND STRATEGY]: Active Mode (Work/Social) - Do NOT reduce activity on Sat/Sun. Treat them as high-engagement days." 
            : "[WEEKEND STRATEGY]: Resting Mode - Significant drop in activity on Sat/Sun.";
            
        scheduleSummary += `\n${weekendNote}\n`;
    }

    // 2. Build Prompt
    const prompt = buildArchitectPrompt(
        skeleton.role, 
        skeleton.age, 
        skeleton.income, 
        shadowDesc, 
        chaos, 
        dna, 
        skeleton.gender,
        scheduleSummary // INJECTED SCHEDULE
    );

    const response = await ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: ARCHITECT_INSTRUCTION }, { text: prompt }] }
        ],
        config: {
          temperature: 0.9, // High creativity for variation
        }
    });

    const csvText = cleanJsonString(response.text || "");
    if (!csvText || csvText.length < 50) {
       throw new Error("Synthetic data generation failed: Output too short.");
    }
    
    // Ensure header integrity just in case AI missed it
    if (!csvText.includes('timestamp')) {
       return `timestamp,action,category,subject,value,content_body\n${csvText}`;
    }

    return csvText;

  }, 2, 3000, "Persona Synthesis");
};

/**
 * Uses a lightweight AI call to infer the semantic roles of CSV columns.
 */
export const inferCsvSchema = async (csvText: string): Promise<Record<string, string> | null> => {
  return retryWithBackoff(async () => {
    try {
      const ai = getAiClient();
      // Use gemini-3-flash-preview for text tasks following coding guidelines
      const model = "gemini-3-flash-preview";

      const lines = csvText.split('\n');
      const header = lines[0] || '';
      const sampleRows = lines.slice(1, 6).join('\n'); 

      if (!header.trim() || !sampleRows.trim()) return null;

      const prompt = buildCsvSchemaPrompt(header, sampleRows);

      const response = await ai.models.generateContent({
        model: model,
        contents: [
          { role: 'user', parts: [{ text: SCHEMA_INFERENCE_INSTRUCTION }, { text: prompt }] }
        ],
        config: {
          responseMimeType: 'application/json'
        }
      });

      const text = response.text;
      if (!text) return null;

      const schemaMap = trySafeJsonParse<Record<string, string> | null>(cleanJsonString(text), null);
      console.log("Inferred CSV Schema:", schemaMap);
      return schemaMap;

    } catch (error) {
      if ((error as any).status || (error as any).code) throw error;
      console.error("Error during CSV schema inference logic:", error);
      return null;
    }
  }, 2, 5000, "Schema Inference", false);
};

/**
 * TRI-LAYER FUNNEL PIPELINE
 * Step 1: Fact Extractor (Omniscient Analyst) - Temp 0.2
 * Step 2: Profiler (Psychologist) - Temp 0.8
 * Step 3: Actor (Copywriter/Sim) - Temp 1.1
 */
export const analyzeDataAndCreatePersona = async (
  rawData: string, 
  contextOptions?: { 
      dataSource?: string; 
      scenario?: string; 
      totalRows?: number;
      // NEW: Creation Config to inject into final DNA
      creationConfig?: OriginProfile;
  },
  onProgress?: (stage: string) => void
): Promise<DigitalTwinPersona> => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";

  // --- STEP 1: Schema Inference ---
  if (onProgress) onProgress("解析數據結構中 (Schema Inference)...");
  
  let inferredSchema = null;
  // If data source is synthetic (from Persona Lab), we skip inference as we know the schema.
  if (contextOptions?.dataSource !== 'synthetic_lab') {
      try {
         inferredSchema = await inferCsvSchema(rawData);
         await delay(1000); 
      } catch (e) {
         console.warn("Schema inference skipped due to error, proceeding with raw headers.");
      }
  }
  
  // --- STEP 2: DISTILLATION ---
  if (onProgress) onProgress("智慧資料蒸餾中 (Adaptive Distillation)...");
  const { fullContext: distilledData, stats: datasetStats, standardRows } = smartDistillCsv(rawData, inferredSchema);
  
  console.log(">> Distillation Stats:", datasetStats);

  const basePrompt = buildAnalystBasePrompt(distilledData, contextOptions);

  try {
    // --- LAYER 1: OMNISCIENT ANALYST (FACTS) ---
    // Objective truth extraction. Low Temp.
    if (onProgress) onProgress("全知觀察者解析中 (Layer 1: Fact Extraction)...");
    
    let analystReport: any = await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
          model: model,
          contents: [{ role: 'user', parts: [{ text: OMNISCIENT_ANALYST_INSTRUCTION }, { text: basePrompt }] }],
          config: { responseMimeType: 'application/json', temperature: 0.2 }
        });
        return trySafeJsonParse<any>(cleanJsonString(response.text || "{}"));
    }, 3, 3000, "Omniscient Analyst");

    // Add Computed Metrics
    analystReport.metrics = {
        total_interactions: datasetStats.totalRows,
        active_days_count: datasetStats.activeDays,
        avg_intensity_score: datasetStats.avgIntensity
    };

    console.log(">> Layer 1 Report:", analystReport);
    await delay(1500);

    // --- PHASE 3: OPEN DATA INJECTION (The Missing Link) ---
    // 1. Detect Active Hours from Distiller
    // UPDATED: Pass the full hourly distribution (24-int array) to OpenDataService
    // instead of just the top active hours. This allows for Cosine Similarity matching.
    const hourlyCounts = datasetStats.hourlyDistribution; // Array(24)

    // 2. Call OpenDataService
    const timePredictions = openDataService.predictProfessionFromTime(hourlyCounts);
    const topTimeMatch = timePredictions[0];

    // 3. Construct Time Evidence Block
    let timeEvidence = "";
    if (topTimeMatch) {
        // Also get top hours for display
        const activeHours = hourlyCounts
            .map((count, hour) => ({ hour, count }))
            .filter(h => h.count > 0)
            .sort((a, b) => b.count - a.count)
            .slice(0, 10)
            .map(h => h.hour)
            .sort((a,b)=>a-b);

        timeEvidence = `
        [OPEN DATA TIME FINGERPRINT]
        - Observed Peak Hours: ${activeHours.join(', ')}
        - Statistical Match: ${topTimeMatch.match.label} (Similarity: ${topTimeMatch.confidence.toFixed(0)}%)
        - Description: ${topTimeMatch.match.description}
        - INSTRUCTION: Consider this routine when profiling the user's occupation.
        `;
    }

    // --- LOGIC GATE: KNOWN CONTEXT INJECTION (GOD MODE) ---
    const isSynthetic = contextOptions?.creationConfig?.source_type === 'synthetic';
    const explicitGender = contextOptions?.creationConfig?.skeleton?.gender;
    const inputDna = contextOptions?.creationConfig?.dna; // Extract DNA from Config
    
    let knownContext = "";
    
    // 1. GENDER LOCK (Fix for Gender Consistency)
    if (isSynthetic && explicitGender && explicitGender !== 'General') {
        knownContext += `[BIOLOGICAL FACT] The user IS biologically ${explicitGender}. Treat this as a hard constraint. If behavioral data conflicts, analyze it as a "Niche Interest" or "Social Role", do NOT change the gender.\n`;
    } 

    // 2. RESONANCE HARD INJECTION (Fix for Signal Decay)
    if (inputDna && inputDna._generated_resonance) {
        const r = inputDna._generated_resonance;
        knownContext += `
        [KNOWN PSYCHOLOGICAL FIXATION (PRI)]
        **CRITICAL INSTRUCTION**: This user has a confirmed obsession with "${r.product_name}".
        - Even if the CSV data contains noise (e.g. news, random browsing), you MUST identify this product as their core latent desire.
        - **Pain Point**: ${r.pain_point}
        - **Motivation**: ${r.marketing_hook}
        - **Constraint**: Do NOT generate generic motivations. Anchor the analysis on this specific product obsession.
        `;
    }

    // --- LAYER 1.5: SOCIOLOGICAL EVIDENCE OVERRIDE (CRITICAL FIX) ---
    // We must invoke the Sociology Engine HERE for Upload Mode to ensure Reality Check is accurate based on DATA.
    
    // 1. Extract Statistical Evidence from the distillation/analyst phase
    // We can infer financial evidence from standardRows if possible, or rough heuristics
    let maxTx = 0;
    let totalTx = 0;
    let txCount = 0;
    
    if (standardRows) {
        for (const r of standardRows) {
            if (r.action_type === 'purchase' || r.action_type === 'checkout') {
                const val = r.value || 0;
                totalTx += val;
                txCount++;
                if (val > maxTx) maxTx = val;
            }
        }
    }

    const observedEvidence: ObservedEvidence = {
        maxTransaction: maxTx,
        totalSpending: totalTx,
        avgSpending: txCount > 0 ? totalTx / txCount : 0,
        spendingFrequency: txCount,
        isCryptoOrGambling: false // Could be inferred from categories if needed
    };

    // 2. Inject financial evidence into the prompt
    const evidenceBlock = `
    [HARD EVIDENCE FROM DATA]
    - Max Single Transaction: $${maxTx}
    - Total Observed Spending: $${totalTx}
    - Purchase Count: ${txCount}
    
    **INSTRUCTION**: Use this evidence to Validate or Override the "Income Status". 
    If Role is "Student" but Spending is High -> They are "Wealthy Student".
    If Role is "CEO" but Spending is Low -> They are "Delusional/Poor".

    ${timeEvidence}
    `;

    // --- LAYER 2: PSYCHOLOGIST (PROFILER) ---
    // Subjective interpretation. High Temp.
    if (onProgress) onProgress("心理學家建模中 (Layer 2: Profiling)...");

    let psychProfile = await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: model,
            contents: [
              { role: 'user', parts: [
                { text: PSYCHOLOGIST_INSTRUCTION }, 
                // Inject Known Context (if any) and Objective Facts + EVIDENCE + OPEN DATA
                { text: `${knownContext}\n\nOBJECTIVE FACTS: ${JSON.stringify(analystReport)}\n\n${evidenceBlock}` }
              ]}
            ],
            config: { responseMimeType: 'application/json', temperature: 0.8 }
        });
        return trySafeJsonParse<any>(cleanJsonString(response.text || "{}"));
    }, 3, 3000, "Psychologist Agent");

    // Fallback if Psych fails to produce structure
    if (!psychProfile.personality_profile) {
        psychProfile = { 
            demographics_inference: { age_bucket: "25-34", gender_guess: "Neutral", life_stage: "一般使用者" }, 
            marketing_archetype: { decision_archetype: "一般觀望型" },
            personality_profile: { dimensions: {} },
            motivations: { primary_goals: [] },
            constraints: { money: {} }
        };
    }

    // --- LAYER 2.5: RE-RUN SOCIOLOGY CHECK (The Final Truth) ---
    // Now that we have AI's inferred age/role, and we have the Evidence, let's generate the authoritative Reality Check
    const inferredAge = psychProfile.demographics_inference?.age_bucket || "30-34";
    const inferredRole = psychProfile.demographics_inference?.life_stage || "User";
    const inferredIncome = psychProfile.constraints?.money?.spending_power_level || "Medium";
    
    const { narrative: socioNarrative, realityCheck } = getSocioEconomicContext(inferredAge, inferredRole, inferredIncome, observedEvidence);
    
    // Inject this calculated Reality Check into the Origin Profile later
    console.log(">> Sociology Reality Check:", realityCheck);

    console.log(">> Layer 2 Profile:", psychProfile);
    await delay(1500);

    // --- DATA PRUNING FOR LAYER 3 ---
    // Prevent Context Overflow by trimming the bulky "Evidence Bank"
    const slimFacts = {
        categories: (analystReport.category_distribution || []).slice(0, 5),
        time: analystReport.time_pattern,
        topics: (analystReport.topics_breakdown || []).slice(0, 5),
        metrics: analystReport.metrics
    };

    // --- LAYER 3: ACTOR (SIMULATOR) ---
    // Voice & Flaw Simulation. Very High Temp.
    if (onProgress) onProgress("數位分身演繹中 (Layer 3: Actor Simulation)...");

    let actorProfile = await retryWithBackoff(async () => {
        const response = await ai.models.generateContent({
            model: model,
            contents: [
              { role: 'user', parts: [
                { text: ACTOR_INSTRUCTION }, 
                { text: `PSYCH PROFILE: ${JSON.stringify(psychProfile)}\nCONTEXT FACTS: ${JSON.stringify(slimFacts)}\nSOCIOLOGY CONTEXT: ${socioNarrative}` }
              ]}
            ],
            config: { responseMimeType: 'application/json', temperature: 1.1 }
        });
        return trySafeJsonParse<any>(cleanJsonString(response.text || "{}"));
    }, 3, 3000, "Actor Agent");

    // Fallback if Actor fails
    if (!actorProfile.interaction_style) {
        actorProfile = {
            interaction_style: { tone_preference: ["Natural"] },
            system_state: { composite_flaw: { label: "None" } },
            context_profile_enrichment: {}
        };
    }

    // --- FINAL ASSEMBLY ---
    if (onProgress) onProgress("系統組裝中 (Final Assembly)...");

    // Construct the DNA object to store the reality check
    const finalDNA: PersonaDNA = {
        role: inferredRole,
        lifestyle: psychProfile.personality_profile.summary_tags || [],
        anxiety: psychProfile.contradictions_and_insights?.paradox_core || "General Anxiety",
        spending_habit: psychProfile.constraints?.money?.evidence || "Normal",
        hidden_trait: "Generated from Analysis",
        reality_check: {
            ...realityCheck,
            social_tension: realityCheck.social_tension // Ensure persistence
        } as any
    };

    // Preserve resonance in final DNA if present in input
    if (inputDna?._generated_resonance) {
        finalDNA._generated_resonance = inputDna._generated_resonance;
    }

    // Force unique ID generation to ensure cache busting on new generation
    const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `twin_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const compositeData = {
      // 0. Identity (CRITICAL FIX: Ensure Unique ID to prevent React Diffing issues)
      twin_id: uniqueId,
      
      source_user_ids: [], // Placeholder

      // Data Window (Critical for charts)
      data_window: {
        start_date: datasetStats.dataWindow.start,
        end_date: datasetStats.dataWindow.end
      },
      // Subjective Perception
      perception_sheet: datasetStats.perceptionSheet,
      
      // DNA Injection (Origin Profile) - Inject calculated DNA if not provided (Upload Mode)
      origin_profile: {
          ...contextOptions?.creationConfig,
          source_type: contextOptions?.creationConfig?.source_type || 'upload',
          dna: contextOptions?.creationConfig?.dna || finalDNA 
      },

      // 1. Behavioral (From Layer 1)
      behavioral_pattern: {
        frequency: {
          visits_per_month: datasetStats.totalRows,
          active_days_ratio: datasetStats.activeDays
        },
        depth: {
           avg_pages_per_session: parseFloat((datasetStats.avgIntensity / 10).toFixed(1))
        },
        content_preference: {
          top_categories: analystReport.category_distribution || [],
          top_lda_topics: analystReport.topics_breakdown || []
        },
        time_pattern: analystReport.time_pattern || {}
      },

      // 2. Psych (From Layer 2)
      personality_profile: psychProfile.personality_profile || {},
      motivations: psychProfile.motivations || {},
      constraints: psychProfile.constraints || {},
      contradictions_and_insights: psychProfile.contradictions_and_insights || {},
      
      // 3. Style & Context (From Layer 3)
      interaction_style: actorProfile.interaction_style || {},
      system_state: actorProfile.system_state || {},
      
      context_profile: {
        ...(actorProfile.context_profile_enrichment || {}),
        
        // MAP DEMOGRAPHICS FROM LAYER 2
        life_stage: psychProfile.demographics_inference?.life_stage || "未知階段",
        age_bucket: psychProfile.demographics_inference?.age_bucket || "未知年齡",
        gender_guess: psychProfile.demographics_inference?.gender_guess || "Neutral",

        marketing_archetype: psychProfile.marketing_archetype || {},
        custom_dimensions: analystReport.dynamic_attributes || {}
      }
    };

    console.log(">> COMPOSITE DATA:", compositeData);

    // Sanitize & Validate
    const normalizedData = sanitizeAndNormalizePersona(compositeData);
    const result = DigitalTwinPersonaSchema.safeParse(normalizedData);

    if (!result.success) {
      console.warn("Schema Validation Failed (using normalized data):", result.error);
      return normalizedData as DigitalTwinPersona;
    }

    return result.data as DigitalTwinPersona;

  } catch (error: any) {
    console.error("Pipeline Error:", error);
    throw error;
  }
};

/**
 * Creates a chat session for the Digital Twin.
 */
export const createChatSession = (persona: DigitalTwinPersona): Chat => {
  const ai = getAiClient();
  const model = "gemini-3-flash-preview";

  const systemInstruction = buildChatSystemInstruction(persona);

  const chat = ai.chats.create({
    model: model,
    config: {
      systemInstruction: systemInstruction,
      temperature: 1.2, // High creativity for chat
    }
  });

  return chat;
};

/**
 * Sends a message to the Digital Twin stream.
 */
export const sendMessageToTwinStream = async function* (
  message: string,
  chatSession: Chat,
  modifiers: SimulationModifiers | null,
  scenarioMode: ScenarioMode
) {
  // Construct the full message with context
  const fullMessage = buildChatContextHeaders(message, modifiers, scenarioMode);

  // Send message
  const result = await chatSession.sendMessageStream({ message: fullMessage });

  for await (const chunk of result) {
    yield chunk.text || "";
  }
};

/**
 * Runs a marketing simulation (A/B Test).
 */
export const runMarketingSimulation = async (
  persona: DigitalTwinPersona,
  campaignName: string,
  copyA: string,
  copyB: string,
  modifiers: SimulationModifiers | null,
  scenarioMode: ScenarioMode
): Promise<SimulationResult> => {
  return retryWithBackoff(async () => {
    const ai = getAiClient();
    const model = "gemini-3-flash-preview";

    const context = buildMarketingSimulationContext(persona, modifiers, scenarioMode);
    const input = buildMarketingSimulationInput(campaignName, copyA, copyB);

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: MARKETING_SIMULATION_INSTRUCTION }, { text: context }, { text: input }] }
      ],
      config: {
        tools: [{ googleSearch: {} }], // Enable search for price grounding
        temperature: 0.5, // Lower temp for logic
      }
    });

    const result = trySafeJsonParse<SimulationResult>(cleanJsonString(response.text || "{}"));
    
    // Basic validation
    if (!result.winner || !result.scores) {
        throw new Error("Simulation output invalid");
    }

    return result;

  }, 2, 3000, "Marketing Simulation");
};

/**
 * Generates a 3D Avatar for the persona.
 */
export const generateAvatarFromPersona = async (persona: DigitalTwinPersona): Promise<string | null> => {
  return retryWithBackoff(async () => {
    const ai = getAiClient();
    const model = "gemini-2.5-flash-image"; // Standard image generation

    const visuals = analyzeAvatarVisuals(persona);
    const prompt = AVATAR_GENERATION_PROMPT_TEMPLATE(
        persona.context_profile.age_bucket,
        persona.context_profile.gender_guess || "Neutral",
        getAvatarTitle(persona),
        visuals.fashion,
        visuals.accessories,
        visuals.expression,
        visuals.lighting,
        visuals.bg_color,
        visuals.color_palette
    );

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: {
        // No specific config needed for flash-image unless we want aspectRatio, which defaults to 1:1
      }
    });

    // Check for image parts
    for (const part of response.candidates?.[0]?.content?.parts || []) {
       if (part.inlineData) {
           return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
       }
    }
    
    return null;

  }, 2, 5000, "Avatar Generation");
};
