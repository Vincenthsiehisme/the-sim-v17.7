
import { CsvConstraints, RealityCheck, ObservedEvidence, SocialTension, MoneyType, CopingStrategy } from '../types';
import { lexiconService } from '../services/LexiconService';
import { openDataService } from '../services/OpenDataService';
import { TAX_BRACKETS_2023, mapAgeToBracket } from './open_data/income_distribution';
import { LaborMode, IndustrySector } from './job_lexicon';

// ==========================================
// TAIWAN SOCIOLOGICAL KNOWLEDGE BASE (v4.3 - Refined Roles)
// ==========================================

// 2. LABOR MODE ARCHETYPES
const LABOR_MODES: Record<LaborMode, { 
    label: string, 
    constraints: CsvConstraints,
    desc: string
}> = {
    'Standard': {
        label: '受僱體制 (Standard)',
        desc: 'Regular hours, fixed income.',
        constraints: {
            time_rules: "High regularity. Active 07:00-09:00 (Commute), 12:00-13:30 (Lunch), 18:00-24:00 (Free). Low activity during work hours 09:00-18:00.",
            money_rules: "Stable monthly spike (Payday). Predictable daily spending (Lunch/Transport). Weekend bursts.",
            keyword_injection: ["office", "meeting", "commute", "lunch", "weekend", "salary", "leave"]
        }
    },
    'Gig': {
        label: '零工/輪班 (Gig/Shift)',
        desc: 'Fragmented time, volatile income.',
        constraints: {
            time_rules: "Irregular/Shift pattern. Active late night or off-peak hours. May work on weekends. Short bursts of activity between tasks.",
            money_rules: "High frequency small transactions. Cash flow sensitivity. Instant payouts or daily earnings focus.",
            keyword_injection: ["shift", "order", "delivery", "wait", "break", "rain", "customer", "tip", "gas"]
        }
    },
    'Autonomous': {
        label: '自主/接案 (Autonomous)',
        desc: 'Blurred boundaries, project-based.',
        constraints: {
            time_rules: "No clear work/life boundary. Late night activity common. Work on weekends. Flexible wake up times.",
            money_rules: "Lumpy income (Project/Sales based). Occasional high expenses (Tools/Stock). Business expenses mixed with personal.",
            keyword_injection: ["client", "deadline", "invoice", "coffee", "inspiration", "draft", "payment", "tax", "transfer"]
        }
    },
    'Student': {
        label: '在學學生 (Student)',
        desc: 'School schedule + Late night freedom.',
        constraints: {
            time_rules: "Rigid day schedule (Class 09-16). High activity late night (22:00-03:00). Sleep deprivation common.",
            money_rules: "Low outcome, high dependency. Price sensitive for food, value insensitive for gadgets/entertainment (Mom Bank).",
            keyword_injection: ["exam", "report", "professor", "deadline", "dorm", "club", "cheap", "mid-term"]
        }
    },
    'Domestic': {
        label: '家務勞動 (Domestic)',
        desc: 'Dictated by others\' needs.',
        constraints: {
            time_rules: "Fragmented by family schedule. Active early morning (School run) and late afternoon. busy 17:00-20:00. Revenge bedtime scrolling.",
            money_rules: "Household budget manager. High volume of grocery/daily necessities. Low personal discretionary spending.",
            keyword_injection: ["kids", "school", "grocery", "sale", "recipe", "group buy", "teacher", "tired"]
        }
    },
    'Inactive': {
        label: '非勞動 (Inactive)',
        desc: 'Low structure, preservation focus.',
        constraints: {
            time_rules: "Hyper-regular or Drift. High daytime activity if retired. High late night if unemployed.",
            money_rules: "Burn rate management. Only essentials. High price sensitivity. Fear of inflation.",
            keyword_injection: ["news", "health", "park", "tv", "saving", "cheap", "job", "rent"]
        }
    }
};

// 3. INDUSTRY SECTOR ARCHETYPES
const INDUSTRY_SECTORS: Record<IndustrySector, { 
    label: string,
    keywords: string[],
    stress: string,
    income_multiplier: number,
    vanity_score: number
}> = {
    'Tech': { label: '科技工程', keywords: ["code", "bug", "ai", "gadget", "3c", "monitor", "keyboard"], stress: "Cognitive Overload", income_multiplier: 1.5, vanity_score: 30 },
    'Finance': { label: '金融投資', keywords: ["stock", "market", "rate", "news", "fed", "crypto", "report"], stress: "Performance Anxiety", income_multiplier: 1.4, vanity_score: 80 },
    'Service': { label: '服務零售', keywords: ["customer", "store", "feet", "tired", "奥客", "uniform"], stress: "Emotional Labor", income_multiplier: 0.8, vanity_score: 60 },
    'Care': { label: '醫療照護', keywords: ["shift", "patient", "wash", "mask", "health", "guard"], stress: "Compassion Fatigue", income_multiplier: 1.1, vanity_score: 50 },
    'Logistics': { label: '物流運輸', keywords: ["traffic", "gps", "rain", "road", "car", "bike", "rush"], stress: "Physical Danger", income_multiplier: 1.1, vanity_score: 20 },
    'Sales': { label: '業務/商業', keywords: ["client", "call", "quota", "drink", "sign", "contract", "revenue"], stress: "Revenue Pressure", income_multiplier: 1.2, vanity_score: 90 }, 
    'BlueCollar': { label: '技術勞力', keywords: ["site", "tool", "safety", "drink", "smoke", "body", "ache"], stress: "Physical Exhaustion", income_multiplier: 1.0, vanity_score: 10 },
    'Creative': { label: '設計創作', keywords: ["adobe", "render", "client", "revision", "deadline", "portfolio"], stress: "Burnout", income_multiplier: 0.9, vanity_score: 70 },
    'Civil': { label: '軍公教', keywords: ["report", "meeting", "stamp", "audit", "policy", "office"], stress: "Bureaucracy", income_multiplier: 1.05, vanity_score: 40 },
    'Education': { label: '教育學術', keywords: ["student", "exam", "class", "parent", "teach", "school", "grade"], stress: "Emotional Labor", income_multiplier: 1.0, vanity_score: 40 },
    'Shift_Civil': { label: '軍警消', keywords: ["duty", "shift", "patrol", "emergency", "report", "tired", "station"], stress: "Physical Danger", income_multiplier: 1.15, vanity_score: 50 },
    'General': { label: '一般產業', keywords: ["work", "boss", "colleague", "lunch", "meeting"], stress: "General", income_multiplier: 1.0, vanity_score: 50 }
};

// === SOCIOLOGY ENGINE: IMPLICIT INFERENCE LOGIC ===

// 1. Money Type Detection
const detectMoneyType = (role: string, labor: LaborMode, sector: IndustrySector): MoneyType => {
    const r = role.toLowerCase();
    
    // PRIORITY 1: Asset Holders (Rentier)
    if (r.includes('二代') || r.includes('房東') || r.includes('幣') || r.includes('繼承') || r.includes('包租') || r.includes('投資')) {
        return 'Easy_Windfall';
    }
    
    // PRIORITY 2: Business Owners (Cash Flow)
    if (r.includes('老闆') || r.includes('頭家') || r.includes('自營') || r.includes('創業') || r.includes('開店') || r.includes('企業主') || r.includes('攤')) {
        return 'Cash_Flow'; 
    }
    
    // PRIORITY 3: High Performers / Performance Based (Cash Flow)
    if (sector === 'Sales' || sector === 'Creative' || (sector === 'Education' && labor === 'Autonomous')) {
        return 'Cash_Flow'; // Cram school teachers also live on cash flow/student count
    }

    // PRIORITY 4: Survival Labor (Blood Sweat)
    // Students typically fall here unless they are rich (caught by P1)
    if (labor === 'Student' || labor === 'Gig' || sector === 'Logistics' || sector === 'BlueCollar' || sector === 'Service') {
        return 'Blood_Sweat';
    }

    // Default
    return 'Stable_Salary';
};

const analyzeSocialTension = (
    role: string,
    ageKey: string,
    disposableIncome: number,
    incomeLabel: string, 
    labor: LaborMode,
    sector: IndustrySector
): SocialTension => {
    
    // Auto-detect Money Type based on Role String + Sector
    const moneyType = detectMoneyType(role, labor, sector);
    const sectorInfo = INDUSTRY_SECTORS[sector];
    
    let faceScore = sectorInfo.vanity_score;
    // Adjust Face Score
    if (ageKey === '18-24' || ageKey === '25-29') faceScore += 10;
    if (role.includes('網紅') || role.includes('KOL') || role.includes('模')) faceScore = 100;
    // Owners usually have high face needs for business image
    if (moneyType === 'Cash_Flow' && (role.includes('老闆') || role.includes('企業'))) faceScore = Math.max(faceScore, 85); 
    
    let copingStrategy: CopingStrategy = 'Normal';
    let narrativeOverride = "";

    const isPoor = incomeLabel === 'Survival' || incomeLabel === 'Tight';
    const isRich = incomeLabel === 'Affluent' || incomeLabel === 'Elite';

    // === STRATEGY INFERENCE LOGIC ===

    // 1. The "Poor Boss" (SME Owner + Low Income)
    if (moneyType === 'Cash_Flow' && isPoor) {
        if (role.includes('老闆') || role.includes('自營')) {
            copingStrategy = 'Installment_King'; // or 'Bootstrap'
            narrativeOverride = `[STRATEGY: POOR_BOSS] 雖然現金流吃緊，但為了生意門面(車/錶)敢於負債投入，私底下吃超商便當。會頻繁計算CP值與投報率。`;
        } else {
            copingStrategy = 'Eat_Cheap_Wear_Rich'; // Sales/Creative
            narrativeOverride = `[STRATEGY: SHOW_OFF] 收入不穩但必須維持光鮮亮麗的人設。`;
        }
    }
    // 2. The "Rich Worker" / Rentier (Stealth Wealth)
    else if ((faceScore < 40 && isRich) || moneyType === 'Easy_Windfall') {
        copingStrategy = 'Stealth_Wealth'; 
        narrativeOverride = `[STRATEGY: STEALTH_WEALTH] 資產豐厚但不在乎外在名牌，重視實用性與隱私。對價格不敏感，但對"被當盤子"很敏感。`;
    }
    // 3. The "Exhausted Spender" (High Labor)
    else if ((moneyType === 'Blood_Sweat' || sector === 'Shift_Civil') && disposableIncome > 35000) {
        copingStrategy = 'Compensatory_Consumption'; 
        narrativeOverride = `[STRATEGY: COMPENSATORY] Works hard physically/shift. Spends impulsively on massages, good food, or gaming to decompress.`;
    }
    // 4. The "Mom Bank" (Young + Poor + High Face) - Common for Students
    else if (faceScore > 60 && isPoor && (ageKey === '18-24' || labor === 'Student')) {
        copingStrategy = 'Mom_Bank'; 
        narrativeOverride = `[STRATEGY: MOM_BANK] High taste, no money. "Buy first, worry later." Likely relies on parents or credit.`;
    }
    else {
        narrativeOverride = `[STRATEGY: BALANCED] Standard consumption behavior based on disposable income.`;
    }

    return { moneyType, faceScore: Math.min(100, Math.max(0, faceScore)), copingStrategy, narrativeOverride };
};

const detectRealityCheck = (
    ageBucket: string, 
    roleInput: string, 
    disposableLabel: string, 
    labor: LaborMode, 
    stats: { p25: number, median: number, p90: number },
    evidence?: ObservedEvidence
): RealityCheck => {
    
    let coherence_level: RealityCheck['coherence_level'] = 'High';
    let description = "角色設定符合一般社會常態。";
    let display_role = roleInput;
    let spending_logic = "根據收入水平進行合理消費。";

    const isYoung = ageBucket.includes('18') || ageBucket.includes('24');
    const isRich = disposableLabel === 'Affluent' || disposableLabel === 'Elite';
    const isPoor = disposableLabel === 'Survival' || disposableLabel === 'Tight';
    const roleLower = roleInput.toLowerCase();
    
    const isHighStatusRole = roleLower.includes('ceo') || roleLower.includes('總經理') || roleLower.includes('創辦人') || roleLower.includes('董') || roleLower.includes('president');
    const isOwner = roleLower.includes('老闆') || roleLower.includes('自營');

    // Simple Evidence Check
    let evidenceVerdict: 'ConfirmRich' | 'ConfirmPoor' | 'None' = 'None';
    if (evidence) {
        if (evidence.maxTransaction > stats.median) evidenceVerdict = 'ConfirmRich'; 
        else if (evidence.totalSpending < stats.p25 * 0.1 && evidence.spendingFrequency > 0) evidenceVerdict = 'ConfirmPoor';
    }

    // === RULE 1: THE STRUGGLING BOSS (Implicit Logic) ===
    if (isOwner && isPoor) {
        coherence_level = 'Medium'; 
        description = "中小企業主/自營商，但目前現金流吃緊。";
        display_role = `${roleInput} (現金流焦慮)`;
        spending_logic = "公帳大方(投資/門面)，私帳小氣(便當/日用)。會頻繁計算CP值與投報率。";
    }
    // === RULE 2: THE INSOLVENT (DATA-DRIVEN) ===
    else if (isPoor && evidenceVerdict === 'ConfirmRich') {
        coherence_level = 'Insolvent';
        description = "支出遠超推估收入，疑似依賴信貸、啃老或非典型收入來源 (High Financial Risk)。";
        display_role = `${roleInput} (負債風險)`;
        spending_logic = "非理性高消費，伴隨強烈的財務焦慮、分期付款或事後節省行為。";
    }
    // === RULE 3: THE ANOMALY (RICH KID) ===
    else if (isYoung && isHighStatusRole) {
        if (evidenceVerdict === 'ConfirmRich' || isRich) {
            coherence_level = 'Anomaly';
            description = "年齡與職位不符，但財力驚人 (新貴/幣圈/二代)。";
            display_role = `${roleInput} (新貴)`;
            spending_logic = "消費毫不手軟，不受一般薪資結構限制。";
        } else {
            coherence_level = 'Delusional';
            description = "年齡與高階職位不符，且無高額消費支撐 (創業家家酒/幻想)。";
            display_role = `${roleInput} (?)`;
            spending_logic = "表面維持高姿態，實際行為偏向低價替代品。";
        }
    }
    // === RULE 4: THE DELUSIONAL SOCIALITE ===
    else if (isPoor && (roleLower.includes('名媛') || roleLower.includes('貴婦'))) {
        coherence_level = 'Delusional';
        description = "經濟能力無法支撐其宣稱的社交地位 (精緻窮)。";
        display_role = `${roleInput} (自稱)`;
        spending_logic = "只買看得到的配件(可展示)，私下生活極度節省。";
    }

    return { coherence_level, reality_gap_description: description, correction_rules: { display_role, spending_logic } };
};

/**
 * Calculates the "Sociological Coordinates" using the new Open Data Layer.
 * UPDATED: Uses Relative Income Modifiers (Burden/Standard/Wealthy) instead of absolute income labels.
 */
export const getSocioEconomicContext = (
    ageBucket: string, 
    roleInput: string, 
    incomeModifierLabel: string, // Changed from incomeLabel (absolute) to modifier
    evidence?: ObservedEvidence
) => {
    
    // 1. Lexicon Analysis
    const lexResult = lexiconService.analyzeInput(roleInput);
    
    let labor: LaborMode = 'Standard';
    let sector: IndustrySector = 'General';
    let salaryKey: string | undefined = undefined;

    if (lexResult.matchFound && lexResult.strategy !== 'IGNORE') {
        labor = lexResult.coordinates.labor;
        sector = lexResult.coordinates.sector;
        salaryKey = lexResult.salary_key;
    }

    const laborDef = LABOR_MODES[labor];
    const sectorDef = INDUSTRY_SECTORS[sector];

    // 2. Open Data Integration (Income)
    const ageKey = mapAgeToBracket(ageBucket);
    const bracket = TAX_BRACKETS_2023[ageKey];
    
    const stats = {
        p25: Math.round(bracket.p25 / 13.5),
        median: Math.round(bracket.median / 13.5),
        p90: Math.round(bracket.p90 / 13.5)
    };

    const multiplier = sectorDef.income_multiplier || 1.0;
    const baseAmount = Math.round(stats.median * multiplier);

    // 3. HARD DATA OVERRIDE
    let annualGross = baseAmount * 13.5;
    if (salaryKey) {
        const realAnnual = openDataService.getEstimatedSalary(salaryKey, ageKey);
        if (realAnnual) {
            annualGross = (realAnnual * 0.8) + (annualGross * 0.2);
        }
    }

    // 4. APPLY USER MODIFIER (Relative Financial Background)
    let disposableMultiplier = 1.0;
    let burdenDescription = "Standard burden.";

    // UPDATED: Support both Chinese Modifiers (from Lab) and English Keys (from Product Mirror)
    if (
        incomeModifierLabel.includes('Burden') || 
        incomeModifierLabel.includes('負債') ||
        incomeModifierLabel === 'Survival' ||
        incomeModifierLabel === 'Tight'
    ) {
        disposableMultiplier = 0.4; // High Debt / Burden
        burdenDescription = "High financial burden (Debt/Family).";
    } else if (
        incomeModifierLabel.includes('Wealthy') || 
        incomeModifierLabel.includes('優渥') ||
        incomeModifierLabel === 'Affluent' ||
        incomeModifierLabel === 'Elite'
    ) {
        disposableMultiplier = 1.5; // Windfall / Family Support
        burdenDescription = "Low burden or external support.";
    }

    const effectiveBurden = 0.4 + (1 - disposableMultiplier);
    const disposableIncome = Math.max(5000, Math.round((annualGross / 12) * (1 - Math.min(0.9, effectiveBurden))));
    
    let disposableLabel = "Stable";
    if (disposableIncome < 20000) disposableLabel = "Survival";
    else if (disposableIncome < 35000) disposableLabel = "Tight";
    else if (disposableIncome > 80000) disposableLabel = "Affluent";
    if (disposableIncome > 150000) disposableLabel = "Elite";

    // 5. Social Dynamics
    const socialTension = analyzeSocialTension(roleInput, ageKey, disposableIncome, disposableLabel, labor, sector);

    // 6. Reality Check
    const realityCheck = detectRealityCheck(ageBucket, roleInput, disposableLabel, labor, stats, evidence);
    realityCheck.social_tension = socialTension;

    const narrative = `
    [MECE SOCIOLOGICAL PROFILE v4.3 (Implicit Inference)]
    - **Role**: ${roleInput} (${ageBucket})
    - **Detected Mode**: ${labor} / ${sector}
    - **Implicit Money Type**: ${socialTension.moneyType}
    - **Modifier**: ${incomeModifierLabel}
    - **Financials**:
      - Est. Gross Annual: NT$${(annualGross/10000).toFixed(1)}萬
      - **Effective Monthly Disposable**: ~NT$${disposableIncome.toLocaleString()} (${disposableLabel})
    
    [SOCIAL DYNAMICS]
    - **Strategy**: ${socialTension.copingStrategy}
    - **Narrative**: ${socialTension.narrativeOverride}
    
    [REALITY DIAGNOSTIC]
    - **Coherence**: ${realityCheck.coherence_level}
    - **Description**: ${realityCheck.reality_gap_description}
    `;

    const combinedKeywords = [...new Set([
        ...laborDef.constraints.keyword_injection, 
        ...sectorDef.keywords
    ])];

    const constraints: CsvConstraints = {
        time_rules: laborDef.constraints.time_rules,
        money_rules: realityCheck.coherence_level === 'Delusional' || realityCheck.coherence_level === 'Insolvent'
            ? realityCheck.correction_rules.spending_logic 
            : `User has ${disposableLabel} disposable income. Strategy: ${socialTension.copingStrategy}. ${laborDef.constraints.money_rules}`,
        keyword_injection: combinedKeywords
    };

    return { narrative, constraints, realityCheck };
};
