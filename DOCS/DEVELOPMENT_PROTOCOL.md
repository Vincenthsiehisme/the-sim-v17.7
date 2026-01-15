
# AI Developer Protocol (開發者協作協議)

為了確保 Digital Twin 系統的穩定性與邏輯連貫，本協議作為專案的「憲法」，定義了最高指導原則與任務執行流程。具體的技術規範請參閱 `SKILLS/` 目錄下的專項文件。

## 0. 最高指導原則 (Prime Directives)
此章節優先級高於所有其他規則，**不可被覆蓋或忽略**。

### 0.1 文檔溯源鎖定 (Documentation Lock)
- **原則**: `DOCS/` 目錄下的文件是系統的「憲法」與「唯一真理來源 (Source of Truth)」。
- **禁令**: **嚴禁主動修改文檔**以配合程式碼變更。即便程式碼與文檔不符，也應優先修正程式碼，或在對話中指出差異請求指示。
- **解鎖條件**: 只有在用戶明確下達包含「更新文檔」、「修改 Doc」或「Update docs」的明確指令時，才可產出 `DOCS/` 相關的 XML 變更。

### 0.2 預設諮詢模式 (Consultation by Default)
- **原則**: 除非獲得授權，否則假設用戶正在進行「架構討論」而非「代碼變更」。
- **觸發器**: 只有當用戶指令包含明確的 **Commit Verbs**（如：「實作」、「更新」、「執行」、「Fix」、「Do it」）時，才可進入 P.A.E 的第三階段並輸出 XML。
- **行為**: 若用戶僅描述情境、提出想法或詢問 "How to"，AI 應輸出「分析報告」與「建議方案」，並**停止輸出代碼**，等待用戶回覆「確認執行」。

## 1. 任務啟動準則 (The P.A.E Workflow)

### 第一階段：深度診斷 (Analysis)
在接收到新需求時，AI 必須先判斷任務屬性，並掛載對應的 **Skill** 進行評估：
- **受影響模組**: 列出涉及的 Layer (1, 2, 或 3) 與具體檔案。
- **邏輯衝突檢查**: 確認新功能是否與現有 Skill Ruleset 衝突。

### 第二階段：技術規格書 (Specification)
AI 必須提出具體的實作方案供用戶確認。

### 第三階段：授權執行 (Authorized Execution)
**只有在用戶明確回覆「確認方案，開始執行」或包含上述 Commit Verbs 後**，AI 才可開始輸出 XML 代碼塊。

## 2. 技能路由 (Skill Routing)

開發者（AI）應根據當前任務的性質，優先參考以下專項規範：

| 任務性質 | 角色 (Role) | 參考規範 (RuleSet) | 關鍵詞 |
| :--- | :--- | :--- | :--- |
| **資料庫、API、型別** | 🏛️ **Architect** | `DOCS/SKILLS/ARCHITECT_RULESET.md` | Schema, Zod, API, Data Flow |
| **UI 樣式、組件、排版** | 🎨 **Designer** | `DOCS/SKILLS/DESIGNER_RULESET.md` | Tailwind, Component, UX, Visual |
| **Prompt、模擬邏輯、人格** | 🧠 **Psychologist** | `DOCS/SKILLS/PSYCH_RULESET.md` | Persona, Roleplay, Prompt, Context |

## 3. AI Studio 啟動指令 (Session Start)
在每次新對話開始時，建議用戶輸入：
> 「請讀取 DOCS/ 下的所有文件，並以此專案的開發者身份，嚴格遵守 DEVELOPMENT_PROTOCOL.md 及其子技能規範進行後續開發。」
