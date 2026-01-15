
import Fuse from 'fuse.js';
import { TAIWAN_JOB_LEXICON, JobDefinition, LaborMode, IndustrySector, IncomeClass } from '../data/job_lexicon';

// Define the shape of our search result
export interface LexiconResult {
  matchFound: boolean;
  term: string;
  coordinates: {
    labor: LaborMode;
    sector: IndustrySector;
    income_class?: IncomeClass;
  };
  salary_key?: string; // New: Link to hard data
  confidence: number; // 0 to 1 (1 is highest confidence)
  strategy: 'ENFORCE' | 'SUGGEST' | 'IGNORE';
}

class LexiconService {
  private fuse: Fuse<JobDefinition>;

  constructor() {
    this.fuse = new Fuse(TAIWAN_JOB_LEXICON, {
      keys: ['term', 'aliases'],
      includeScore: true,
      threshold: 0.4, // Lower is stricter. 0.4 allows for some fuzziness but filters noise.
      ignoreLocation: true
    });
  }

  public analyzeInput(userInput: string): LexiconResult {
    if (!userInput || userInput.trim().length === 0) {
      return this.getEmptyResult();
    }

    // Sanitize input: take the first meaningful chunk if it's a long sentence
    // Simple heuristic: Take first 10 chars for matching if it's very long
    const query = userInput.length > 20 ? userInput.substring(0, 15) : userInput;

    const results = this.fuse.search(query);

    if (results.length > 0) {
      const topMatch = results[0];
      const item = topMatch.item;
      // Fuse score: 0 is perfect match, 1 is no match.
      // We convert this to "Confidence" (1 is perfect).
      const score = topMatch.score ?? 1;
      const confidence = 1 - score; 

      // Determine Strategy based on confidence and item weight
      let strategy: 'ENFORCE' | 'SUGGEST' | 'IGNORE' = 'IGNORE';

      if (confidence > 0.9 || (confidence > 0.7 && item.weight >= 0.9)) {
        strategy = 'ENFORCE'; // High confidence or High weight keyword (e.g. "Student")
      } else if (confidence > 0.4) {
        strategy = 'SUGGEST';
      }

      return {
        matchFound: true,
        term: item.term,
        coordinates: item.coordinates,
        salary_key: item.salary_key, // Return salary key
        confidence,
        strategy
      };
    }

    return this.getEmptyResult();
  }

  private getEmptyResult(): LexiconResult {
    return {
      matchFound: false,
      term: 'Unknown',
      coordinates: { labor: 'Standard', sector: 'General' },
      confidence: 0,
      strategy: 'IGNORE'
    };
  }
}

// Singleton Instance
export const lexiconService = new LexiconService();
