
// SOURCE: Ministry of Labor - Occupational Wage Survey (113年7月)
// UNIT: TWD (Monthly) / 10,000 TWD (Annual) converted to TWD

export interface SalaryProfile {
  raw_title: string;
  monthly_mean: number;
  annual_mean: number;
  curve_type: 'steep' | 'flat' | 'bell'; // steep=tech/finance, flat=service, bell=labor
}

// Data extracted from the provided CSV
export const OCCUPATION_SALARY_DB: Record<string, SalaryProfile> = {
  // === TECH & ENGINEERING ===
  "software_engineer": {
    raw_title: "(250000)資訊及通訊專業人員",
    monthly_mean: 72879,
    annual_mean: 1176000,
    curve_type: "steep"
  },
  "hardware_engineer": {
    raw_title: "(215190)電機、電子工程師",
    monthly_mean: 72689,
    annual_mean: 1377000,
    curve_type: "steep"
  },
  "mechanic": {
    raw_title: "(311591)機械技術員",
    monthly_mean: 43185,
    annual_mean: 706000,
    curve_type: "bell"
  },

  // === MEDICAL & CARE ===
  "doctor": {
    raw_title: "(221090)醫師",
    monthly_mean: 180321,
    annual_mean: 2524000,
    curve_type: "steep"
  },
  "nurse": {
    raw_title: "(222090)護理人員",
    monthly_mean: 50675,
    annual_mean: 731000,
    curve_type: "flat" // Shifts make it linear
  },
  "pharmacist": {
    raw_title: "(226090)藥事人員",
    monthly_mean: 58071,
    annual_mean: 820000,
    curve_type: "flat"
  },

  // === FINANCE & SALES ===
  "trader": {
    raw_title: "(331100)證券金融交易員",
    monthly_mean: 85455,
    annual_mean: 1313000,
    curve_type: "steep"
  },
  "finance_clerk": {
    raw_title: "(331200)信用及貸款人員",
    monthly_mean: 59712,
    annual_mean: 1120000,
    curve_type: "steep"
  },
  "sales_rep": {
    raw_title: "(332290)工商業銷售代表",
    monthly_mean: 50157,
    annual_mean: 743000,
    curve_type: "steep" // Commission based
  },
  "insurance_agent": {
    raw_title: "(332100)保險代理人",
    monthly_mean: 58524,
    annual_mean: 875000,
    curve_type: "steep"
  },
  "real_estate_agent": {
    raw_title: "(333400)不動產經紀人",
    monthly_mean: 47282,
    annual_mean: 620000, // High variance in reality
    curve_type: "steep"
  },

  // === CREATIVE & ADMIN ===
  "marketing": {
    raw_title: "(243100)廣告及行銷專業人員",
    monthly_mean: 52003,
    annual_mean: 779000,
    curve_type: "bell"
  },
  "designer": {
    raw_title: "(217200)平面及多媒體設計師",
    monthly_mean: 44248,
    annual_mean: 597000,
    curve_type: "flat"
  },
  "admin_assistant": {
    raw_title: "(411090)辦公室綜合事務人員",
    monthly_mean: 37766,
    annual_mean: 526000,
    curve_type: "flat"
  },

  // === SERVICE & LABOR ===
  "restaurant_service": {
    raw_title: "(513990)餐飲服務人員",
    monthly_mean: 34337,
    annual_mean: 444000,
    curve_type: "flat"
  },
  "delivery": {
    raw_title: "(832100)機車送件駕駛人員",
    monthly_mean: 34537,
    annual_mean: 467000,
    curve_type: "flat"
  },
  "security": {
    raw_title: "(540490)保全及警衛人員",
    monthly_mean: 33429,
    annual_mean: 439000,
    curve_type: "flat"
  },
  "construction_labor": {
    raw_title: "(711300)鋼筋/模板/混凝土人員",
    monthly_mean: 41520,
    annual_mean: 538000,
    curve_type: "flat" // Physical peak
  },
  "cleaner": {
    raw_title: "(911090)清潔及家事工作人員",
    monthly_mean: 30688,
    annual_mean: 385000,
    curve_type: "flat"
  }
};
