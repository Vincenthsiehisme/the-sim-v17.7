
// SOURCE: CPI Weights & Household Income Survey
// Logic: Define what people spend money on based on their class.

export interface ConsumptionProfile {
  id: string;
  label: string;
  food_ratio: number; // Engel's Coefficient (Lower is richer)
  discretionary_ratio: number; // Fun money
  key_categories: string[];
  avoid_categories: string[];
}

export const CONSUMPTION_ARCHETYPES: Record<string, ConsumptionProfile> = {
  "survival": {
    id: "survival",
    label: "生存優先 (Survival)",
    food_ratio: 0.45,
    discretionary_ratio: 0.1,
    key_categories: ["Food", "Groceries", "Transport", "Rent"],
    avoid_categories: ["Luxury", "Travel", "Invest"]
  },
  "stable": {
    id: "stable",
    label: "小康穩定 (Stable)",
    food_ratio: 0.30,
    discretionary_ratio: 0.25,
    key_categories: ["Food", "Dining", "Tech", "Insurance"],
    avoid_categories: ["HighEnd_Luxury"]
  },
  "affluent": {
    id: "affluent",
    label: "富裕自由 (Affluent)",
    food_ratio: 0.15,
    discretionary_ratio: 0.50,
    key_categories: ["Invest", "Travel", "Luxury", "Wellness", "Education"],
    avoid_categories: ["Cheap_FastFood"]
  },
  "delusional": {
    id: "delusional",
    label: "精緻窮 (Delusional)",
    food_ratio: 0.20, // Artificially low (skips meals)
    discretionary_ratio: 0.60, // Dangerously high
    key_categories: ["Beauty", "Fashion", "Dining", "PhotoOps"],
    avoid_categories: ["Insurance", "Savings", "Groceries"]
  }
};
