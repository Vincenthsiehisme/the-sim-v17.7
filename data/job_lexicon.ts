
// TAIWAN LOCAL JOB LEXICON
// Maps colloquial terms to MECE coordinates: Labor Mode, Industry Sector, Income Class

export type LaborMode = 'Standard' | 'Gig' | 'Autonomous' | 'Domestic' | 'Inactive' | 'Student';
export type IndustrySector = 'Tech' | 'Finance' | 'Service' | 'Care' | 'Logistics' | 'Sales' | 'BlueCollar' | 'Creative' | 'Civil' | 'General' | 'Education' | 'Shift_Civil';
// UPDATED: Now aligns with OpenDataService (5 levels)
export type IncomeClass = 'Survival' | 'Tight' | 'Stable' | 'Affluent' | 'Elite';

export interface JobDefinition {
  term: string;
  aliases: string[];
  coordinates: {
    labor: LaborMode;
    sector: IndustrySector;
    income_class?: IncomeClass; // Optional override
  };
  weight: number; // 0-1, Higher means stronger constraint enforcement
  salary_key?: string; // Links to OCCUPATION_SALARY_DB
}

export const TAIWAN_JOB_LEXICON: JobDefinition[] = [
  // --- SME / BUSINESS OWNERS (Cash Flow Class) ---
  {
    term: "中小企業主",
    aliases: ["老闆", "頭家", "自營商", "開店", "創業", "負責人", "CEO", "總經理", "Founder", "攤販", "做生意的", "工作室"],
    coordinates: { labor: "Autonomous", sector: "Sales", income_class: "Elite" }, // Upgraded to Elite/Affluent potential
    weight: 0.9,
  },
  // --- RENTIER / INVESTOR (Asset Class) ---
  {
    term: "房東投資客",
    aliases: ["房東", "包租公", "包租婆", "投資客", "存股", "全職交易", "大戶", "操盤"],
    coordinates: { labor: "Inactive", sector: "Finance", income_class: "Elite" },
    weight: 0.9,
    salary_key: "trader"
  },

  // --- EDUCATION (Differentiated) ---
  {
    term: "公立教師",
    aliases: ["老師", "教師", "教授", "教書", "班導", "國小老師", "高中老師"],
    coordinates: { labor: "Standard", sector: "Education", income_class: "Stable" },
    weight: 0.9,
    salary_key: "admin_assistant" // Base proxy, boosted by multiplier
  },
  {
    term: "補教老師",
    aliases: ["補習班", "家教", "講師", "教練", "才藝老師"],
    coordinates: { labor: "Autonomous", sector: "Education", income_class: "Stable" }, 
    weight: 0.9,
    salary_key: "sales_rep" // Proxy for performance-based income
  },

  // --- CIVIL & UNIFORMED (Differentiated) ---
  {
    term: "軍警消",
    aliases: ["警察", "消防員", "軍人", "警官", "派出所", "職業軍人", "志願役"],
    coordinates: { labor: "Gig", sector: "Shift_Civil", income_class: "Stable" }, 
    weight: 0.9,
    salary_key: "security" // Proxy
  },
  {
    term: "公務員",
    aliases: ["國營", "鐵飯碗", "公家機關", "書記", "高考", "普考"],
    coordinates: { labor: "Standard", sector: "Civil", income_class: "Stable" },
    weight: 0.9,
    salary_key: "admin_assistant" 
  },

  // --- TECH (The "Engineer" Class vs Ops) ---
  {
    term: "軟體工程師",
    aliases: ["工程師", "碼農", "寫程式", "IT", "Dev", "前端", "後端", "全端", "App開發"],
    coordinates: { labor: "Standard", sector: "Tech", income_class: "Affluent" }, // Upgraded
    weight: 0.8,
    salary_key: "software_engineer"
  },
  {
    term: "硬體工程師",
    aliases: ["IC設計", "半導體", "電路", "研發", "RD"],
    coordinates: { labor: "Standard", sector: "Tech", income_class: "Affluent" }, // Upgraded
    weight: 0.8,
    salary_key: "hardware_engineer"
  },
  {
    term: "作業員",
    aliases: ["技術員", "OP", "產線", "輪班", "工廠", "包裝", "品檢", "設備"],
    coordinates: { labor: "Gig", sector: "Tech", income_class: "Stable" }, 
    weight: 0.9,
    salary_key: "mechanic"
  },

  // --- GIG & LOGISTICS (The "Uber" Economy) ---
  {
    term: "外送員",
    aliases: ["跑單", "熊貓", "UberEats", "送餐", "外送", "foodpanda"],
    coordinates: { labor: "Gig", sector: "Logistics", income_class: "Tight" }, // Refined
    weight: 1.0,
    salary_key: "delivery"
  },
  {
    term: "物流司機",
    aliases: ["運將", "貨運", "快遞", "宅配", "司機", "開車的", "小黃", "計程車", "Uber司機"],
    coordinates: { labor: "Gig", sector: "Logistics", income_class: "Tight" },
    weight: 0.9,
    salary_key: "delivery"
  },

  // --- SALES & FINANCE (The "Hustlers") ---
  {
    term: "保險業務",
    aliases: ["賣保險", "拉保險", "壽險", "保經", "理專"],
    coordinates: { labor: "Autonomous", sector: "Sales", income_class: "Stable" },
    weight: 0.9,
    salary_key: "insurance_agent"
  },
  {
    term: "房仲",
    aliases: ["賣房子", "不動產", "房屋仲介", "看房"],
    coordinates: { labor: "Autonomous", sector: "Sales", income_class: "Stable" },
    weight: 0.9,
    salary_key: "real_estate_agent"
  },
  {
    term: "金融業",
    aliases: ["銀行", "櫃員", "證券", "交易員", "分析師", "基金"],
    coordinates: { labor: "Standard", sector: "Finance", income_class: "Affluent" }, // Upgraded
    weight: 0.8,
    salary_key: "finance_clerk"
  },

  // --- SERVICE & CARE ---
  {
    term: "餐飲服務",
    aliases: ["服務生", "店員", "手搖飲", "打工", "外場", "內場", "櫃台", "超商"],
    coordinates: { labor: "Gig", sector: "Service", income_class: "Tight" }, // Refined
    weight: 0.8,
    salary_key: "restaurant_service"
  },
  {
    term: "醫護人員",
    aliases: ["護理師", "護士", "醫生", "醫師", "藥師", "長照", "看護"],
    coordinates: { labor: "Standard", sector: "Care", income_class: "Stable" },
    weight: 0.9,
    salary_key: "nurse"
  },
  {
    term: "醫師",
    aliases: ["醫生", "主治醫師", "住院醫師"],
    coordinates: { labor: "Standard", sector: "Care", income_class: "Elite" }, // Upgraded
    weight: 1.0,
    salary_key: "doctor"
  },
  {
    term: "家庭主婦/夫",
    aliases: ["全職媽媽", "全職爸爸", "家管", "帶小孩", "顧家"],
    coordinates: { labor: "Domestic", sector: "Care", income_class: "Tight" }, // Default constraint
    weight: 1.0
  },

  // --- BLUE COLLAR & CREATIVE ---
  {
    term: "營建工人",
    aliases: ["工地", "做工", "師傅", "水電", "裝潢", "搬磚", "粗工"],
    coordinates: { labor: "Gig", sector: "BlueCollar", income_class: "Stable" },
    weight: 0.9,
    salary_key: "construction_labor"
  },
  {
    term: "設計創作者",
    aliases: ["設計師", "美編", "接案", "SOHO", "插畫", "攝影", "Youtuber", "網紅", "KOL", "小編", "UI/UX", "平面設計"],
    coordinates: { labor: "Autonomous", sector: "Creative", income_class: "Stable" },
    weight: 0.8,
    salary_key: "designer"
  },
  {
    term: "行銷企劃",
    aliases: ["行銷", "企劃", "PM", "公關", "廣告", "社群經理"],
    coordinates: { labor: "Standard", sector: "Creative", income_class: "Stable" },
    weight: 0.8,
    salary_key: "marketing"
  },
  {
    term: "行政總務",
    aliases: ["秘書", "助理", "行政", "總務", "打雜", "櫃檯"],
    coordinates: { labor: "Standard", sector: "General", income_class: "Stable" },
    weight: 0.8,
    salary_key: "admin_assistant"
  },

  // --- STUDENT (New Category) ---
  {
    term: "學生",
    aliases: ["大學生", "研所", "讀書", "高中生", "實習", "研究生", "博士生"],
    coordinates: { labor: "Student", sector: "Education", income_class: "Survival" },
    weight: 1.0
  },
  {
    term: "待業/退休",
    aliases: ["沒工作", "找工作", "退休", "家裡蹲", "無業"],
    coordinates: { labor: "Inactive", sector: "General", income_class: "Survival" },
    weight: 1.0
  }
];
