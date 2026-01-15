
// SOURCE: Ministry of Finance (2023 Tax Statistics) & DGBAS (Earnings)
// UNIT: TWD / Year (Annual Income)

export interface IncomeBracket {
  p10: number;   // 生存線 (Survival)
  p25: number;   // 拮据線 (Tight)
  median: number;// 中位數 (Average)
  p75: number;   // 寬裕線 (Comfortable)
  p90: number;   // 富裕線 (Affluent)
  p99: number;   // 頂層 (Elite) - Renamed from top1 for statistical clarity
}

export const TAX_BRACKETS_2023: Record<string, IncomeBracket> = {
  '18-24': { p10: 250000, p25: 320000, median: 400000, p75: 550000, p90: 700000, p99: 1500000 },
  '25-29': { p10: 300000, p25: 420000, median: 580000, p75: 800000, p90: 1100000, p99: 2500000 },
  '30-34': { p10: 350000, p25: 500000, median: 750000, p75: 1100000, p90: 1600000, p99: 3500000 },
  '35-39': { p10: 380000, p25: 550000, median: 850000, p75: 1300000, p90: 2000000, p99: 4500000 },
  '40-49': { p10: 400000, p25: 600000, median: 950000, p75: 1500000, p90: 2500000, p99: 6000000 },
  '50+':   { p10: 350000, p25: 500000, median: 800000, p75: 1400000, p90: 2200000, p99: 5000000 },
};

// 用於快速查找的年齡映射
export const mapAgeToBracket = (ageInput: string): string => {
  if (ageInput.includes('18') || ageInput.includes('24') || ageInput.includes('學生')) return '18-24';
  if (ageInput.includes('25') || ageInput.includes('29')) return '25-29';
  if (ageInput.includes('30') || ageInput.includes('34')) return '30-34';
  if (ageInput.includes('35') || ageInput.includes('39')) return '35-39';
  if (ageInput.includes('40') || ageInput.includes('49')) return '40-49';
  return '50+';
};
