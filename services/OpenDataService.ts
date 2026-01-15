
import { TAX_BRACKETS_2023, mapAgeToBracket } from '../data/open_data/income_distribution';
import { OCCUPATION_TIME_PRINTS, TimeProfile } from '../data/open_data/time_patterns';
import { CONSUMPTION_ARCHETYPES } from '../data/open_data/cpi_weights';
import { OCCUPATION_SALARY_DB, SalaryProfile } from '../data/open_data/occupational_salaries';
import { lexiconService } from './LexiconService';

export interface SocioEconomicCoordinates {
  income_percentile: number; // 0-100
  wealth_label: 'Survival' | 'Tight' | 'Stable' | 'Affluent' | 'Elite';
  estimated_annual_income: number;
  likely_occupations: string[];
  consumption_archetype: string;
}

// Seniority Multipliers based on Curve Type
const SENIORITY_CURVE = {
  steep: { '18-24': 0.6, '25-29': 0.85, '30-34': 1.0, '35-39': 1.3, '40-49': 1.6, '50+': 1.5 },
  flat:  { '18-24': 0.8, '25-29': 0.9,  '30-34': 1.0, '35-39': 1.1, '40-49': 1.15, '50+': 1.1 },
  bell:  { '18-24': 0.7, '25-29': 0.9,  '30-34': 1.0, '35-39': 1.2, '40-49': 1.1,  '50+': 0.9 } // Physical labor drops with age
};

class OpenDataService {
  
  /**
   * Get estimated salary based on Job Title and Age
   */
  public getEstimatedSalary(jobKey: string, ageKey: string): number | null {
    const jobData = OCCUPATION_SALARY_DB[jobKey];
    if (!jobData) return null;

    const curve = SENIORITY_CURVE[jobData.curve_type] || SENIORITY_CURVE.flat;
    const multiplier = curve[ageKey as keyof typeof curve] || 1.0;

    return Math.round(jobData.annual_mean * multiplier);
  }

  /**
   * 根據年齡與推估收入，計算在台灣社會的 PR 值
   */
  public calculateSocialStanding(age: string, monthlyIncome: number, jobKey?: string): SocioEconomicCoordinates {
    const ageKey = mapAgeToBracket(age);
    const bracket = TAX_BRACKETS_2023[ageKey] || TAX_BRACKETS_2023['30-34'];
    
    // Default: Estimate from monthly * 13.5
    let annualIncome = monthlyIncome * 13.5; 

    // OVERRIDE: If we have a specific job key, use the Real Data
    if (jobKey) {
        const realDataIncome = this.getEstimatedSalary(jobKey, ageKey);
        if (realDataIncome) {
            annualIncome = (realDataIncome * 0.7) + (annualIncome * 0.3);
        }
    }

    let percentile = 50;
    let label: SocioEconomicCoordinates['wealth_label'] = 'Stable';

    if (annualIncome < bracket.p10) { percentile = 10; label = 'Survival'; }
    else if (annualIncome < bracket.p25) { percentile = 25; label = 'Tight'; }
    else if (annualIncome < bracket.median) { percentile = 40; label = 'Stable'; }
    else if (annualIncome < bracket.p75) { percentile = 75; label = 'Stable'; }
    else if (annualIncome < bracket.p90) { percentile = 90; label = 'Affluent'; }
    else { percentile = 99; label = 'Elite'; } 

    return {
      income_percentile: percentile,
      wealth_label: label,
      estimated_annual_income: annualIncome,
      likely_occupations: [], 
      consumption_archetype: label.toLowerCase()
    };
  }

  /**
   * Cosine Similarity for Distribution Matching
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
      if (vecA.length !== vecB.length) return 0;
      let dotProduct = 0;
      let normA = 0;
      let normB = 0;
      for (let i = 0; i < vecA.length; i++) {
          dotProduct += vecA[i] * vecB[i];
          normA += vecA[i] * vecA[i];
          normB += vecB[i] * vecB[i];
      }
      if (normA === 0 || normB === 0) return 0;
      return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * 根據活躍時間分佈 (0-23 Array)，推測最可能的職業作息
   * UPDATED: Uses Weighted Cosine Similarity instead of simple overlap.
   */
  public predictProfessionFromTime(hourlyCounts: number[]): { match: TimeProfile, confidence: number }[] {
    if (!hourlyCounts || hourlyCounts.length !== 24) return [];

    // Normalize input vector to 0-100 range for better scaling, although Cosine ignores magnitude
    const maxVal = Math.max(...hourlyCounts) || 1;
    const inputVector = hourlyCounts.map(v => (v / maxVal) * 100);

    const results = Object.values(OCCUPATION_TIME_PRINTS).map(profile => {
      // Compare Input Distribution vs Profile Weight Distribution
      const similarity = this.cosineSimilarity(inputVector, profile.hourly_weights);
      
      // Convert cosine (-1 to 1, but here 0 to 1 since all positive) to percentage confidence
      const score = similarity * 100;

      return { match: profile, confidence: Math.round(score) };
    });

    return results.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Helper: Map Role String to Time Archetype (For Persona Lab / Synthesis)
   * Implements the 12-Archetype logic via Keywords and Lexicon Analysis.
   */
  public getTimeProfileByRole(roleInput: string): TimeProfile {
      // 1. Analyze role to get LaborMode/Sector/IncomeClass
      const lexResult = lexiconService.analyzeInput(roleInput);
      const labor = lexResult.coordinates.labor;
      const sector = lexResult.coordinates.sector;
      const incomeClass = lexResult.coordinates.income_class;
      const roleLower = roleInput.toLowerCase();

      let profileId = "standard_9to5"; // Default fallback

      // --- ROUTING MATRIX PRIORITY 1: KEYWORD OVERRIDES (Specific Jobs) ---
      
      // 0. Parental Override (Highest Priority for Time Constraints)
      // Parents time is fragmented regardless of their job.
      if (roleLower.includes('媽') || roleLower.includes('爸') || roleLower.includes('parent') || roleLower.includes('mother') || roleLower.includes('father') || roleLower.includes('家長')) {
          profileId = "domestic_fragmented";
      }
      // A. Market/Finance (Early Burst)
      else if (roleLower.includes('操盤') || roleLower.includes('交易') || roleLower.includes('trader') || roleLower.includes('股票') || roleLower.includes('早市') || roleLower.includes('早餐')) {
          profileId = "market_opening_burst";
      }
      // B. Night Shifts - BUSY vs BORED Split
      // - Busy: Medical, Factory -> Vacuum
      // - Bored: Security, Store -> Drifting (High Usage)
      else if (roleLower.includes('夜班') || roleLower.includes('輪班') || roleLower.includes('大夜')) {
          if (roleLower.includes('保全') || roleLower.includes('警衛') || roleLower.includes('超商') || roleLower.includes('店員')) {
             profileId = "drifting_unstructured"; // Low focus, surfing the web
          } else {
             profileId = "night_shift_vacuum"; // High focus, no phone
          }
      }
      // Specific check for Security Guards who aren't explicitly "night" but often are
      else if (roleLower.includes('保全') || roleLower.includes('警衛')) {
          profileId = "drifting_unstructured";
      }
      // C. Night Life (Entertainment)
      else if (roleLower.includes('酒店') || roleLower.includes('公關') || roleLower.includes('調酒') || roleLower.includes('bartender') || roleLower.includes('dj')) {
          profileId = "night_life_entertainment";
      }
      // D. Delivery/Logistics (Inverse Peak)
      else if (roleLower.includes('外送') || roleLower.includes('司機') || roleLower.includes('uber') || roleLower.includes('物流')) {
          profileId = "inverse_service_peak";
      }
      // E. E-commerce/Slashie (Always On - Plateau)
      else if (roleLower.includes('網拍') || roleLower.includes('代購') || roleLower.includes('小編') || roleLower.includes('團購') || roleLower.includes('微商')) {
          profileId = "fragmented_always_on";
      }

      // --- ROUTING MATRIX PRIORITY 2: LABOR MODE & SECTOR ---
      
      else if (labor === 'Student') {
          profileId = "student_schedule";
      }
      else if (labor === 'Domestic') {
          profileId = "domestic_fragmented";
      }
      else if (labor === 'Inactive') {
          if (roleLower.includes('退休') || roleLower.includes('老')) profileId = "early_bird_routine";
          else profileId = "drifting_unstructured"; // NEET / Unemployed
      }
      else if (labor === 'Gig') {
          // If not caught by Delivery/Night keyword above
          if (sector === 'Shift_Civil') profileId = "night_shift_vacuum"; // Police/Fire often night shifts
          else profileId = "inverse_service_peak"; // Restaurant/Service/Logistics
      }
      else if (labor === 'Autonomous') {
          // Designers vs Sales
          if (sector === 'Sales' || sector === 'Finance') profileId = "fragmented_always_on"; // Sales/Agents (Message based)
          else profileId = "freelance_flex"; // Creative/Tech (Project based)
      }
      else if (labor === 'Standard') {
          if (sector === 'Tech' && (roleLower.includes('研發') || roleLower.includes('軟體') || roleLower.includes('dev') || roleLower.includes('rd') || roleLower.includes('工程師'))) {
              profileId = "tech_crunch_dev"; // Responsibility system
          }
          else if (sector === 'Finance') {
              profileId = "market_opening_burst"; // Market hours focus
          }
          else if (sector === 'Service' || sector === 'Care' || sector === 'Logistics') {
              // Standard service jobs often work shifts or weekends
              profileId = "inverse_service_peak"; 
          }
          else {
              // Civil, Admin, Education, General Corporate
              profileId = "standard_9to5";
          }
      }

      // --- DYNAMIC OVERRIDES (Weekend Logic) ---
      // We clone the profile to modify it without mutating the global constant
      const baseProfile = OCCUPATION_TIME_PRINTS[profileId] || OCCUPATION_TIME_PRINTS["standard_9to5"];
      const finalProfile = { ...baseProfile };

      // Rule 1: Service/Retail/Logistics/Care always active on weekends
      if (sector === 'Service' || sector === 'Logistics' || sector === 'Care' || profileId === 'inverse_service_peak') {
          finalProfile.weekend_active = true;
      }

      // Rule 2: Executives/Owners/Elite active on weekends (Social/Networking/Golf)
      // UPDATED: Check income_class from Lexicon
      if (incomeClass === 'Elite' || incomeClass === 'Affluent' || roleLower.includes('ceo') || roleLower.includes('老闆') || roleLower.includes('founder') || roleLower.includes('總經理') || roleLower.includes('董')) {
          finalProfile.weekend_active = true;
      }

      return finalProfile;
  }
}

export const openDataService = new OpenDataService();
