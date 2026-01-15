
// SOURCE: Time Use Survey (作息調查) & Digital Footprint Analysis
// Philosophy: 12 Archetypes based on "Energy Release Time" and "Social Constraints"

export interface TimeProfile {
  id: string;
  label: string;
  description: string;
  hourly_weights: number[]; // 0-23, value 0-100
  weekend_active: boolean; // Does this role work/act on weekends?
  keywords: string[];
}

export const OCCUPATION_TIME_PRINTS: Record<string, TimeProfile> = {
  // =========================================================
  // QUADRANT 1: EARLY & MARKET (05:00 - 13:00 Peak)
  // =========================================================
  
  // 1. 晨型規律型 (Early Bird)
  "early_bird_routine": {
    id: "early_bird_routine",
    label: "晨型規律型 (Early Bird)",
    description: "極早起，活躍於清晨市場或公園，晚上極早入睡。",
    // 04-06: Wake/Peak, 07-11: High, 12-14: Nap(Low), 15-18: TV/Line, 20: Sleep
    hourly_weights: [0, 0, 0, 0, 50, 80, 90, 80, 70, 60, 50, 20, 10, 30, 50, 60, 50, 40, 30, 10, 0, 0, 0, 0],
    weekend_active: true,
    keywords: ["market", "park", "line", "health", "grandkid"]
  },

  // 2. 標準體制型 (9-to-5)
  "standard_9to5": {
    id: "standard_9to5",
    label: "標準體制型 (Standard 9-5)",
    description: "作息被組織嚴格規範。通勤活躍，上班時段受限，下班後放鬆。",
    // 07-08: Commute(High), 09-12: Work(Low), 12: Lunch(High), 13-17: Work(Low), 18: Commute(High), 19-23: Free
    hourly_weights: [0, 0, 0, 0, 0, 0, 20, 60, 80, 20, 20, 20, 90, 20, 20, 20, 30, 60, 80, 80, 70, 50, 20, 10],
    weekend_active: false,
    keywords: ["office", "meeting", "commute", "boss", "salary"]
  },

  // 3. 市場衝刺型 (Market Burst) - Finance Trader / Breakfast Owner
  "market_opening_burst": {
    id: "market_opening_burst",
    label: "市場衝刺型 (Market Burst)",
    description: "作息對齊台股/早市。上午是高壓戰鬥期，下午瞬間冷卻。",
    // 07-08: Prep, 09-13: WAR ZONE (100), 14: Cool down, 15-18: Low/Nap, 19-23: Research
    hourly_weights: [10, 0, 0, 0, 0, 10, 40, 70, 90, 100, 100, 100, 100, 80, 30, 10, 10, 20, 40, 50, 60, 40, 20, 10],
    weekend_active: false,
    keywords: ["stock", "trade", "open", "close", "breakfast"]
  },

  // =========================================================
  // QUADRANT 2: LATE & RESPONSIBILITY (10:00 - 02:00 Peak)
  // =========================================================

  // 4. 研發衝刺型 (Tech Crunch)
  "tech_crunch_dev": {
    id: "tech_crunch_dev",
    label: "研發衝刺型 (Tech Crunch)",
    description: "晚起，下午暖機，深夜進入心流狀態 (The Zone)。",
    // 10: Wake, 14-18: Focus, 22-02: Peak Flow
    hourly_weights: [90, 80, 60, 20, 0, 0, 0, 0, 0, 10, 30, 50, 50, 60, 70, 70, 60, 50, 60, 50, 60, 80, 100, 100],
    weekend_active: true,
    keywords: ["code", "bug", "deploy", "night", "quiet"]
  },

  // 5. 彈性協作型 (Freelance Flex) - Project Driven
  "freelance_flex": {
    id: "freelance_flex",
    label: "彈性協作型 (Freelance Flex)",
    description: "專案驅動。有明顯的「衝刺期」與「離線期」，波形起伏大。",
    // Irregular pulses. Not flat like Slashie.
    hourly_weights: [40, 20, 10, 0, 0, 0, 0, 0, 10, 30, 60, 80, 50, 80, 80, 50, 60, 70, 50, 60, 80, 90, 60, 50],
    weekend_active: true,
    keywords: ["client", "draft", "design", "deadline", "coffee"]
  },

  // 6. 校園雙棲型 (Student Schedule)
  "student_schedule": {
    id: "student_schedule",
    label: "校園雙棲型 (Student)",
    description: "白天被課表強制，深夜報復性娛樂/遊戲。",
    // 09-16: School(Med), 17-20: Dinner/Club, 22-03: Gaming/Social(Max)
    hourly_weights: [100, 90, 80, 40, 0, 0, 0, 10, 30, 50, 40, 60, 70, 50, 40, 50, 60, 70, 80, 90, 90, 100, 100, 100],
    weekend_active: true,
    keywords: ["class", "exam", "game", "dorm", "gossip"]
  },

  // =========================================================
  // QUADRANT 3: INVERSE & SERVICE (Inverse Peak)
  // =========================================================

  // 7. 反向服務型 (Inverse Service) - Delivery / Restaurant
  "inverse_service_peak": {
    id: "inverse_service_peak",
    label: "反向服務型 (Inverse Service)",
    description: "別人的用餐時間是我的戰場(低谷)。下午空班與深夜活躍。",
    // 11-13 & 17-19: BUSY(Low), 14-16 & 21-01: FREE(High)
    hourly_weights: [70, 50, 20, 0, 0, 0, 0, 0, 10, 30, 50, 20, 10, 30, 90, 90, 80, 30, 10, 30, 60, 90, 90, 80],
    weekend_active: true,
    keywords: ["order", "rush", "wait", "customer", "restaurant"]
  },

  // 8. 家務碎片型 (Domestic Fragmented)
  "domestic_fragmented": {
    id: "domestic_fragmented",
    label: "家務碎片型 (Domestic)",
    description: "作息被依賴者(小孩)切割。早晚接送忙碌，深夜Me Time。",
    // 07-08: Rush(Low), 09-15: Chores(Med), 16-20: Family War(Low), 21-23: MeTime(High)
    hourly_weights: [30, 10, 0, 0, 0, 0, 20, 10, 30, 50, 60, 50, 70, 50, 40, 20, 10, 10, 10, 20, 60, 90, 100, 60],
    weekend_active: true,
    keywords: ["kids", "cook", "school", "clean", "tired"]
  },

  // 9. 全時待命型 (Always On) - Slashie / Ecommerce
  "fragmented_always_on": {
    id: "fragmented_always_on",
    label: "全時待命型 (Always On)",
    description: "高原平台波形。訊息驅動，隨時都在回訊，無明顯深睡區。",
    // High plateau (60-75) all day. No deep valleys.
    hourly_weights: [50, 40, 30, 20, 20, 30, 50, 60, 70, 70, 75, 70, 75, 70, 70, 75, 70, 75, 70, 75, 80, 75, 60, 50],
    weekend_active: true,
    keywords: ["reply", "msg", "online", "shipping", "customer"]
  },

  // =========================================================
  // QUADRANT 4: NIGHT & DRIFT (Nocturnal)
  // =========================================================

  // 10. 大夜輪班型 (Night Shift Vacuum)
  "night_shift_vacuum": {
    id: "night_shift_vacuum",
    label: "大夜輪班型 (Night Shift)",
    description: "數位真空。深夜工作時完全離線，白天補眠。",
    // 23-07: WORK(0-10), 08-10: Relax, 11-18: Sleep
    hourly_weights: [10, 10, 10, 5, 5, 5, 5, 20, 90, 80, 60, 20, 0, 0, 0, 0, 10, 20, 40, 50, 40, 30, 20, 10],
    weekend_active: true,
    keywords: ["shift", "fab", "guard", "hospital", "security"]
  },

  // 11. 夜生活娛樂型 (Night Life)
  "night_life_entertainment": {
    id: "night_life_entertainment",
    label: "夜生活娛樂型 (Night Life)",
    description: "夕陽後起床，深夜高強度社交與工作混和。",
    // 06-14: Sleep, 20-04: Active
    hourly_weights: [80, 70, 60, 40, 20, 0, 0, 0, 0, 0, 0, 0, 0, 10, 20, 40, 50, 60, 70, 80, 90, 100, 90, 90],
    weekend_active: true,
    keywords: ["club", "bar", "drink", "dj", "party"]
  },

  // 12. 無序漂流型 (Drifting) - NEET
  "drifting_unstructured": {
    id: "drifting_unstructured",
    label: "無序漂流型 (Drifting)",
    description: "時間感喪失，極端晚睡晚起，整日掛網。",
    // Shifted late, random high usage.
    hourly_weights: [100, 100, 100, 90, 70, 40, 10, 0, 0, 0, 0, 20, 40, 60, 70, 70, 70, 70, 70, 80, 80, 90, 90, 100],
    weekend_active: true,
    keywords: ["game", "anime", "youtube", "sleep", "bored"]
  }
};
