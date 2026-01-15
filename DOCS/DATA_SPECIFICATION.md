
# Data Input & Schema Specifications

## 1. 原始數據欄位 (Standard CSV Schema)
系統雖然具備 `inferCsvSchema` 自動推論能力，但建議包含以下維度：
- `timestamp`: (必填) 格式 `YYYY-MM-DD HH:mm:ss`。影響「時空連續性」與「作息建模」。
- `action`: `view`, `purchase`, `add_to_cart`, `checkout_start`, `search`, `speak`, `abandon_cart`。
- `category`: 內容或商品分類。
- `subject`: 具體對象名稱。
- `value`: 金額 (Action=Purchase) 或 停留秒數 (Action=View)。
- `content_body`: 用戶發出的原始文本，影響「語氣模擬」。

## 2. 合成數據規範 (Synthetic Data / DNA)
在角色實驗室 (Persona Lab) 模式下，系統會生成 `PersonaDNA` 物件。
v4.3 版本新增了 `_sociology_pack`，這是由 `taiwan_sociology.ts` 根據職業類別生成的硬性約束，確保 AI 生成的 CSV 數據符合台灣社會真實面貌。

```typescript
interface PersonaDNA {
  role: string;          // 原始角色設定 (e.g. "焦慮的新手爸爸")
  lifestyle: string[];   // 生活風格標籤 (e.g. ["熬夜", "比價"])
  anxiety: string;       // 核心焦慮情境 (The 3AM thought loop)
  spending_habit: string;// 消費取捨邏輯 (Trade-off equation)
  hidden_trait: string;  // 反差萌或隱藏特質
  
  // 社會學現實校準 (Sociology Engine Output)
  reality_check: {       
      coherence_level: 'High' | 'Delusional' | 'Insolvent' | ...;
      correction_rules: {
          display_role: string; // 修正後的顯示頭銜
          spending_logic: string; // 強制行為邏輯
      };
      social_tension?: {
          moneyType: 'Blood_Sweat' | 'Cash_Flow' | ...;
          copingStrategy: 'Mom_Bank' | 'Stealth_Wealth' | ...;
      }
  };
  
  // CSV 生成器的硬性約束包 (Invisible Constraints)
  _sociology_pack?: {    
      time_rules: string;      // 作息限制 (e.g. "Strictly active 22:00-04:00")
      money_rules: string;     // 消費限制 (e.g. "Micro-transactions only (<$200)")
      keyword_injection: string[]; // 強制注入的關鍵字 (e.g. ["shift", "tired"])
  };
}
```

## 3. 品質臨界值
- **數據量**: 建議 > 20 筆。少於 5 筆時，系統應標記為「低信賴度」。
- **時間跨度**: 建議 > 7 天。跨度過短會導致「時間規律」分析失效。

## 4. 數據隱私 (Privacy)
- 系統在 `Distillation` 階段應自動截斷超過 10 個字符的識別碼（ID）。
- 原始 CSV 不會被上傳至伺服器存儲，僅在瀏覽器端進行處理與暫存。
