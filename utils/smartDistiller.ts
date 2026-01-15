
import { StandardInteraction, ActionType, SelfPerception } from '../types';

export interface DatasetStats {
  totalRows: number;
  activeDays: number;
  avgIntensity: number; // 0-100 scale
  weekdaySkew: string; // 'balanced', 'weekday_leaning', 'weekend_leaning'
  topCategories: string[];
  perceptionSheet: SelfPerception; // NEW: Subjective Perception Attachment
  // NEW: Global Time Window for Relative Analysis
  dataWindow: {
    start: string; // ISO String
    end: string;   // ISO String
  };
  // NEW PHASE 3: Hourly distribution for Open Data fingerprinting
  hourlyDistribution: number[]; // Array of 24 integers
}

export interface DistilledContext {
  fullContext: string; // The optimized SLIM string to send to AI
  stats: DatasetStats;
  standardRows?: StandardInteraction[]; 
}

// =========================================================
// 1. MAPPING CONSTANTS (HEURISTICS)
// =========================================================

const KEYWORDS_TIME = ['time', 'date', 'ts', 'created', 'at', '時間', '日期'];
const KEYWORDS_ACTION = ['action', 'event', 'type', 'activity', 'method', 'behavior', '行為'];
const KEYWORDS_CATEGORY = ['category', 'cat', 'topic', 'group', 'section', 'tag', '分類'];
const KEYWORDS_SUBJECT = ['subject', 'item', 'product', 'page', 'url', 'title', 'headline', 'article', 'name', '標題', '商品'];
const KEYWORDS_VALUE = ['price', 'cost', 'value', 'revenue', 'duration', 'amount', 'score', 'rating', '金額', '價格', '停留', '秒', 'stay'];
const KEYWORDS_CONTENT = ['detail', 'query', 'content', 'message', 'note', 'comment', 'description', 'feedback', 'review', 'answer', 'verbatim', '內容', '留言', '回饋', '深度', 'scroll'];

const normalizeAction = (raw: string): ActionType => {
  const r = raw.toLowerCase().trim();
  if (r.match(/buy|purchase|order|pay|checkout|spend|購買|下單|結帳/)) return 'purchase';
  if (r.match(/cart|basket|add|bag|加入/)) return 'add_to_cart';
  if (r.match(/abandon|remove|delete|cancel|放棄/)) return 'unknown'; // Explicitly not purchase
  if (r.match(/view|visit|read|open|see|watch|look|瀏覽|觀看/)) return 'view';
  if (r.match(/click|tap|press|hit|點擊/)) return 'click';
  if (r.match(/search|find|query|seek|搜尋/)) return 'search';
  if (r.match(/say|speak|comment|review|ask|reply|feedback|survey|interview|answer|回覆|填寫|訪談|留言/)) return 'speak';
  return 'unknown';
};

const findColumnIndex = (headers: string[], keys: string[]): number => {
  const lowerHeaders = headers.map(h => h.toLowerCase().trim().replace(/['"]/g, ''));
  for (const key of keys) {
    const idx = lowerHeaders.findIndex(h => h.includes(key));
    if (idx !== -1) return idx;
  }
  return -1;
};

// Helper to clean raw strings for human consumption
const humanizeString = (str: string): string => {
  if (!str) return "";
  // Remove underscores, reduce multiple spaces, remove ID-like patterns
  return str.replace(/_/g, ' ').replace(/\s+/g, ' ').replace(/(\w{10,})/g, '...').trim();
};

// Helper to make dates vague relative to the DATASET END DATE (not Today)
const fuzzyRelativeDate = (targetDateStr: string, referenceEndDate: Date): string => {
    try {
        const d = new Date(targetDateStr);
        const diffTime = referenceEndDate.getTime() - d.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays < 2) return "那天";
        if (diffDays < 7) return "這幾天";
        if (diffDays < 30) return "前陣子";
        if (diffDays < 90) return "幾個月前";
        if (diffDays < 365) return "去年吧";
        return "很久以前";
    } catch {
        return "之前";
    }
};

// =========================================================
// 2. PARSER & NORMALIZER
// =========================================================

export const smartDistillCsv = (rawData: string, schemaMap: Record<string, string> | null): DistilledContext => {
  try {
    const lines = rawData.split('\n').filter(l => l.trim().length > 0);
    // Initialize Hourly Counts
    const hourlyCounts = new Array(24).fill(0);

    if (lines.length < 2) {
        return {
            fullContext: rawData,
            stats: { 
                totalRows: 0, activeDays: 0, avgIntensity: 0, weekdaySkew: 'balanced', topCategories: [],
                perceptionSheet: {
                    vibe: "一片空白",
                    temporal_sense: "記憶模糊",
                    spending_vibe: "未知",
                    fuzzy_memory: "我什麼都想不起來...",
                    transactional_memory: "我什麼都想不起來...",
                    engagement_memory: "我什麼都想不起來..."
                },
                dataWindow: { start: "", end: "" },
                hourlyDistribution: hourlyCounts
            }
        };
    }

    const headerLine = lines[0];
    const headers = headerLine.split(',').map(h => h.trim());

    // 1. Detect Schema Indices
    let tsIdx = -1, actionIdx = -1, catIdx = -1, subjIdx = -1, valIdx = -1, contentIdx = -1;

    if (schemaMap) {
      if (schemaMap['Timestamp']) tsIdx = findColumnIndex(headers, [schemaMap['Timestamp'].toLowerCase()]);
      if (schemaMap['ActionType']) actionIdx = findColumnIndex(headers, [schemaMap['ActionType'].toLowerCase()]);
      if (schemaMap['Category']) catIdx = findColumnIndex(headers, [schemaMap['Category'].toLowerCase()]);
      if (schemaMap['Subject']) subjIdx = findColumnIndex(headers, [schemaMap['Subject'].toLowerCase()]);
      if (schemaMap['QuantitativeValue']) valIdx = findColumnIndex(headers, [schemaMap['QuantitativeValue'].toLowerCase()]);
      if (schemaMap['QualitativeText']) contentIdx = findColumnIndex(headers, [schemaMap['QualitativeText'].toLowerCase()]);
    }

    if (tsIdx === -1) tsIdx = findColumnIndex(headers, KEYWORDS_TIME);
    if (actionIdx === -1) actionIdx = findColumnIndex(headers, KEYWORDS_ACTION);
    if (catIdx === -1) catIdx = findColumnIndex(headers, KEYWORDS_CATEGORY);
    if (subjIdx === -1) subjIdx = findColumnIndex(headers, KEYWORDS_SUBJECT);
    if (valIdx === -1) valIdx = findColumnIndex(headers, KEYWORDS_VALUE);
    if (contentIdx === -1) contentIdx = findColumnIndex(headers, KEYWORDS_CONTENT);

    // 2. Parse Rows & CALCULATE FACTS
    const interactions: { data: StandardInteraction; originalIndex: number; score: number }[] = [];
    const categoryCounts: Record<string, number> = {};
    const uniqueDates = new Set<string>();
    let weekdayCount = 0;
    let weekendCount = 0;

    // SMART SPLIT ACCUMULATORS
    let minTimestamp = Infinity;
    let maxTimestamp = -Infinity;
    let totalMonetarySum = 0;       // For 'purchase' actions
    let totalEngagementDepth = 0;   // For 'view/read' actions (seconds/scroll)
    
    // MEMORY SLOT CANDIDATES
    let maxPurchaseRecord: { label: string; value: number; date: string } | null = null;
    let maxAbandonRecord: { label: string; value: number; date: string } | null = null;
    let maxViewRecord: { label: string; value: number; date: string } | null = null;
    
    let purchaseCount = 0;
    let viewCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const cols = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g) || [];
      const cleanCols = cols.map(c => c.trim().replace(/^"|"$|['"]/g, '').replace(/""/g, '"'));

      let actionType: ActionType = 'unknown';
      let dateObj: Date | null = null;
      let subject = '';
      let contentBody = '';
      let category = 'General';
      let value = 0;

      if (cols.length >= 2) {
          const rawAction = actionIdx !== -1 ? cleanCols[actionIdx] || '' : 'view';
          actionType = normalizeAction(rawAction);
          const timestampRaw = tsIdx !== -1 ? cleanCols[tsIdx] : '';
          dateObj = new Date(timestampRaw);
          subject = subjIdx !== -1 ? cleanCols[subjIdx] || '' : '';
          contentBody = contentIdx !== -1 ? cleanCols[contentIdx] || '' : '';
          category = catIdx !== -1 ? cleanCols[catIdx] || 'General' : 'General';
          const valRaw = valIdx !== -1 ? cleanCols[valIdx] : '0';
          value = parseFloat(valRaw.replace(/[^0-9.]/g, '')) || 0;
      } else {
          const dateMatch = line.match(/^(\d{4}[-/]\d{2}[-/]\d{2}(?:\s+\d{1,2}:\d{2})?)/);
          if (dateMatch) {
             dateObj = new Date(dateMatch[1]);
             contentBody = line.substring(dateMatch[0].length).trim();
             const tagMatch = contentBody.match(/^\[(.*?)\]/);
             if (tagMatch) {
                 actionType = normalizeAction(tagMatch[1]);
                 contentBody = contentBody.substring(tagMatch[0].length).trim();
             } else {
                 actionType = 'speak'; 
             }
             if (actionType === 'speak' || actionType === 'unknown') {
                 actionType = normalizeAction(contentBody);
             }
          }
      }

      if (!dateObj || isNaN(dateObj.getTime())) dateObj = new Date();

      // --- FACT CALCULATION (SMART SPLIT) ---
      const timeMs = dateObj.getTime();
      if (timeMs < minTimestamp) minTimestamp = timeMs;
      if (timeMs > maxTimestamp) maxTimestamp = timeMs;
      
      // Hourly Distribution (Phase 3)
      const hour = dateObj.getHours();
      if (hour >= 0 && hour < 24) {
          hourlyCounts[hour]++;
      }

      // Separate Money from Engagement Depth
      const isPurchase = actionType === 'purchase' || actionType === 'checkout';
      const isBrowsing = actionType === 'view' || actionType === 'search';

      if (isPurchase) {
          totalMonetarySum += value;
          purchaseCount++;
          if (value > 0 && (!maxPurchaseRecord || value > maxPurchaseRecord.value)) {
              maxPurchaseRecord = { label: subject || category, value, date: dateObj.toISOString() };
          }
      } else if (isBrowsing) {
          totalEngagementDepth += value; // Treating value as 'stay_sec' or 'scroll_depth'
          viewCount++;
          if (value > 0 && (!maxViewRecord || value > maxViewRecord.value)) {
              maxViewRecord = { label: subject || category, value, date: dateObj.toISOString() };
          }
      } else if (actionType === 'add_to_cart') {
          if (value > 0 && (!maxAbandonRecord || value > maxAbandonRecord.value)) {
              maxAbandonRecord = { label: subject || category, value, date: dateObj.toISOString() };
          }
      }

      if (category !== 'General') categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      const isoString = dateObj.toISOString();
      const dateStr = isoString.split('T')[0];
      const timeStr = dateObj.toTimeString().split(' ')[0].substring(0, 5); 
      uniqueDates.add(dateStr);
      const day = dateObj.getDay();
      if (day === 0 || day === 6) weekendCount++; else weekdayCount++;

      const interaction: StandardInteraction = {
        timestamp: `${dateStr} ${timeStr}`,
        actor_id: 'user',
        action_type: actionType,
        category: category,
        subject: subject,
        value: value,
        content_body: contentBody
      };

      // Scoring (Enhanced for Time/Money balance)
      let score = 0;
      if (isPurchase) score += 50;
      if (actionType === 'add_to_cart') score += 30;
      if (isBrowsing) {
          score += 10;
          if (value > 60) score += 20; // 停留超過 1 分鐘 = 高興趣
          if (value > 300) score += 40; // 停留超過 5 分鐘 = 極高興趣/認真研究
      }
      if (actionType === 'search') score += 25;
      if (actionType === 'speak' || actionType === 'survey') score += 30; 
      if (contentBody.length > 20) score += Math.min(50, contentBody.length); 

      interactions.push({ data: interaction, originalIndex: i, score });
    }

    // --- TRANSLATE STATS TO PERCEPTION (Subjective Truths) ---
    const totalRows = interactions.length;
    const activeDays = uniqueDates.size || 1;
    const durationDays = minTimestamp !== Infinity ? Math.ceil((maxTimestamp - minTimestamp) / (1000 * 60 * 60 * 24)) : 0;
    const avgIntensity = Math.min(100, Math.round((totalRows / activeDays) * 5));
    const realIntensity = totalRows / activeDays;
    const referenceEndDate = maxTimestamp !== -Infinity ? new Date(maxTimestamp) : new Date();

    let weekdaySkew = 'balanced';
    if (weekdayCount > weekendCount * 1.5) weekdaySkew = 'weekday_leaning';
    else if (weekendCount > weekdayCount * 1.5) weekdaySkew = 'weekend_leaning';

    // 1. Vibe
    let vibe = "隨性的路人";
    if (realIntensity > 10) vibe = "狂熱的愛好者";
    else if (realIntensity > 5) vibe = "活躍的參與者";
    else if (realIntensity > 2) vibe = "穩定的關注者";

    // 2. Temporal Sense
    let temporal_sense = "初來乍到的新人";
    if (durationDays > 90) temporal_sense = "這裡的熟客";
    else if (durationDays > 30) temporal_sense = "剛熟悉這裡的朋友";

    // 3. Spending Vibe (INTELLIGENT RE-MAPPING)
    let spending_vibe = "務實的精算家";
    if (totalMonetarySum > 5000) spending_vibe = "出手大方的消費者";
    else if (totalMonetarySum > 0) spending_vibe = "小資族 (有具體消費)";
    else {
        // Zero Conversion Path: Check Engagement Depth
        if (totalEngagementDepth > 3600) spending_vibe = "資深內容考據家 (投入大量時間)";
        else if (totalEngagementDepth > 600) spending_vibe = "精明的觀察家 (深度研究中)";
        else if (viewCount > 10) spending_vibe = "正在觀望的潛在讀者";
        else spending_vibe = "偶然路過的訪客";
    }

    // 4. Memory Generation (Split Pathways)
    let transactional_memory = "我好像沒買什麼特別的東西，最近手頭比較緊。";
    let engagement_memory = "我就是隨便看看，殺殺時間而已。";

    // PATH A: TRANSACTIONAL (MONEY/COMMITMENT)
    if (maxPurchaseRecord && maxPurchaseRecord.value > 0) {
        const cleanLabel = humanizeString(maxPurchaseRecord.label);
        const vagueDate = fuzzyRelativeDate(maxPurchaseRecord.date, referenceEndDate);
        transactional_memory = `記得${vagueDate}買了 "${cleanLabel}"，感覺挺實惠的。`;
    } else if (maxAbandonRecord && maxAbandonRecord.value > 0) {
        const cleanLabel = humanizeString(maxAbandonRecord.label);
        const vagueDate = fuzzyRelativeDate(maxAbandonRecord.date, referenceEndDate);
        transactional_memory = `本來想買 "${cleanLabel}" 的，${vagueDate}都在結帳頁了，但最後沒下手。`;
    }

    // PATH B: ENGAGEMENT (TIME/INTEREST)
    const topCategoriesList = Object.entries(categoryCounts).sort(([, a], [, b]) => b - a).map(([k]) => k);
    const topCat = topCategoriesList[0] || "網路資訊";

    if (totalEngagementDepth > 1800) {
        engagement_memory = `我花了很多時間在鑽研「${topCat}」相關的資訊，對這方面越來越感興趣了。`;
    } else if (maxViewRecord && maxViewRecord.value > 120) {
        const cleanLabel = humanizeString(maxViewRecord.label);
        engagement_memory = `我對 "${cleanLabel}" 印象蠻深的，在那一頁待了挺久，看得很認真。`;
    }

    const perceptionSheet: SelfPerception = {
        vibe, temporal_sense, spending_vibe,
        fuzzy_memory: totalMonetarySum > 0 ? transactional_memory : engagement_memory,
        transactional_memory, engagement_memory
    };

    // Selection Logic
    const sorted = [...interactions].sort((a, b) => b.score - a.score);
    const TARGET_COUNT = 300;
    const topIndices = new Set(sorted.slice(0, Math.floor(TARGET_COUNT * 0.7)).map(x => x.originalIndex));
    const step = Math.max(1, Math.floor(interactions.length / (TARGET_COUNT * 0.3)));
    for (let i = 0; i < interactions.length; i += step) {
      if (topIndices.size >= TARGET_COUNT) break;
      topIndices.add(interactions[i].originalIndex);
    }

    const selectedInteractions = interactions
      .filter(x => topIndices.has(x.originalIndex))
      .sort((a, b) => a.originalIndex - b.originalIndex)
      .map(x => x.data);

    const slimLines = selectedInteractions.map(row => {
      let line = `T:${row.timestamp}|A:${row.action_type}`;
      if (row.category && row.category !== 'General') line += `|C:${row.category}`;
      if (row.subject) line += `|S:${row.subject.substring(0, 40)}`;
      if (row.value) line += `|V:${row.value}`; // V is context-sensitive (money or time)
      if (row.content_body) line += `|Body:${row.content_body.substring(0, 100)}`; 
      return line;
    });

    return {
      fullContext: slimLines.join('\n'),
      stats: {
        totalRows, activeDays, avgIntensity, weekdaySkew,
        topCategories: topCategoriesList.slice(0, 5),
        perceptionSheet,
        dataWindow: {
            start: minTimestamp !== Infinity ? new Date(minTimestamp).toISOString() : "",
            end: maxTimestamp !== -Infinity ? new Date(maxTimestamp).toISOString() : ""
        },
        hourlyDistribution: hourlyCounts
      },
      standardRows: selectedInteractions
    };
  } catch (e) {
    console.error("Distillation Error", e);
    // Initialize hourlyCounts for fallback
    const hourlyCounts = new Array(24).fill(0);
    return {
      fullContext: rawData.slice(0, 20000), 
      stats: { 
          totalRows: 0, activeDays: 0, avgIntensity: 0, weekdaySkew: 'balanced', topCategories: [],
          perceptionSheet: {
            vibe: "一片空白", temporal_sense: "記憶模糊", spending_vibe: "未知",
            fuzzy_memory: "我什麼都想不起來...", transactional_memory: "", engagement_memory: ""
          },
          dataWindow: { start: "", end: "" },
          hourlyDistribution: hourlyCounts
      }
    };
  }
};
