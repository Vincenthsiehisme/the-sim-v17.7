
/**
 * Simple Client-Side CSV Scanner
 * Performs a heuristic check on the CSV/Text content to determine data quality.
 * This is NOT an AI analysis, but a structural "Health Check".
 */

export interface DataHealthReport {
  rowCount: number;
  fileSizeKB: number;
  hasHeader: boolean;
  score: number; // 0-100
  genes: {
    time: { detected: boolean; colName?: string; warning?: string };
    action: { detected: boolean; colName?: string; warning?: string };
    context: { detected: boolean; colName?: string; warning?: string }; // Product, Price, Detail
  };
  previewRows: string[][];
  suggestion: string;
}

export const scanCsvData = (text: string, fileSize: number): DataHealthReport => {
  const lines = text.split('\n').filter(l => l.trim().length > 0);
  const rowCount = lines.length;
  
  // Basic constraints
  if (rowCount < 2) {
    return {
      rowCount,
      fileSizeKB: Math.round(fileSize / 1024),
      hasHeader: false,
      score: 5,
      genes: {
        time: { detected: false },
        action: { detected: false },
        context: { detected: false }
      },
      previewRows: [],
      suggestion: "資料筆數過少，無法進行有效分析。"
    };
  }

  const headerLine = lines[0].toLowerCase();
  const headers = headerLine.split(',').map(h => h.trim().replace(/['"]/g, ''));
  
  // Heuristic Gene Detection
  const timeKeywords = ['time', 'date', 'ts', 'created', 'at', '時間', '日期'];
  const actionKeywords = ['action', 'event', 'type', 'behavior', 'click', 'view', 'buy', '行為', '事件'];
  const contextKeywords = ['price', 'value', 'amount', 'cost', 'product', 'item', 'category', 'desc', 'detail', 'content', '價格', '金額', '產品', '內容'];

  const detectGene = (keywords: string[]) => {
    const found = headers.find(h => keywords.some(k => h.includes(k)));
    return { detected: !!found, colName: found };
  };

  const timeGene = detectGene(timeKeywords);
  const actionGene = detectGene(actionKeywords);
  const contextGene = detectGene(contextKeywords);

  // Score Calculation (The 40/60 Rule)
  // 1. Volume Score (Max 40)
  let volumeScore = 0;
  if (rowCount >= 50) volumeScore = 40;
  else if (rowCount >= 10) volumeScore = 20;
  else volumeScore = 5;

  // 2. Schema Score (Max 60)
  let schemaScore = 0;
  if (timeGene.detected) schemaScore += 20;
  if (actionGene.detected) schemaScore += 20;
  if (contextGene.detected) schemaScore += 20;
  
  const score = Math.min(100, volumeScore + schemaScore);

  // Suggestion Logic
  let suggestion = "資料結構完整，可立即開始。";
  if (!timeGene.detected) suggestion = "缺少時間欄位，將無法分析作息規律與活躍時段。";
  else if (!actionGene.detected) suggestion = "缺少行為欄位，AI 將難以區分瀏覽與購買意圖。";
  else if (!contextGene.detected) suggestion = "缺少情境欄位，將難以分析具體消費內容。";
  else if (rowCount < 20) suggestion = "資料筆數較少，建議提供更多數據以提升準確度。";

  // Preview (Top 3 rows)
  const previewRows = lines.slice(0, 4).map(line => line.split(',').slice(0, 5)); // Limit columns for UI

  return {
    rowCount,
    fileSizeKB: Math.round(fileSize / 1024),
    hasHeader: true,
    score,
    genes: {
      time: timeGene,
      action: actionGene,
      context: contextGene
    },
    previewRows,
    suggestion
  };
};
