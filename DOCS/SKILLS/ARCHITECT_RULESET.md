
# Skill: Architect (系統架構師)

**適用範圍**: Schema 設計、API 串接、資料流處理、型別定義。
**關鍵檔案**: `types.ts`, `schemas/*.ts`, `services/geminiService.ts`, `utils/smartDistiller.ts`

## 1. 代碼完整性 (Code Integrity)
- **型別安全**: 嚴格遵守 `types.ts` 定義，Zod Schema 必須同步。
- **錯誤處理**: API 呼叫必須包裹在 `retryWithBackoff` 機制中。

## 2. 系統架構 (System Architecture)
- **三層管道 (The Pipeline)**:
  1. **Layer 1 (Analyst)**: `gemini-3-flash-preview` (Temp 0.2)。提取客觀事實。
  2. **Layer 1.5 (Open Data)**: `OpenDataService` + `LexiconService`。進行社會學 Grounding。
  3. **Layer 2 (Psychologist)**: `gemini-3-flash-preview` (Temp 0.8)。心理側寫。
  4. **Layer 3 (Actor)**: `gemini-3-flash-preview` (Temp 1.1)。角色演繹。
- **狀態持久化**: `PersonaContext` 為 Single Source of Truth，需同步至 LocalStorage。

## 3. API 交互規範
- **模型選擇**:
  - **Text/Logic**: `gemini-3-flash-preview`。
  - **Avatar**: `gemini-2.5-flash-image`。
- **工具使用**: 啟用 `googleSearch` tool 於 Profiler 與 Simulator 階段，增強數據落地性。

## 4. 數據規範
- **Schema 驅動**: 新增屬性需先更新 `types.ts`。
- **隱私**: 敏感 ID 需在前端截斷，不傳送完整個資。
