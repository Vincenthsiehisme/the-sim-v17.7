
# Prompt Engineering Contracts

## 1. 模型與語言規範
- **核心模型**: 
  - 文本生成與邏輯推理: `gemini-3-flash-preview`。
  - 圖像生成 (Avatar): `gemini-2.5-flash-image`。
- **語言**: 繁體中文（台灣習慣用語，例如使用「性價比」或「CP值」、「結帳」而非「買單」）。

## 2. 工具使用協議 (Tool Use Protocols)
### 2.1 Google Search Grounding
- **適用範圍**: `enrichPersonaRole` (Profiler), `runMarketingSimulation` (Simulator), `Chat`。
- **目的**: 
  - **Vibe Check**: 驗證角色設定是否符合台灣網路文化現狀 (如：「竹科太太」的標籤)。
  - **Price Anchor**: 在模擬購買時，查詢商品的真實市場價格，而非依賴幻覺。
  - **Information Anxiety**: 模擬使用者的資訊焦慮行為。
- **禁令**: 嚴禁直接輸出搜尋結果摘要。AI 必須將搜尋結果「內化」，使用「我看網路上說...」或「聽說...」的口吻。

## 3. 場景模式協議 (Scenario Mode Protocols)
AI 回應必須根據 `ScenarioMode` 進行性格位移：
- **Sales (銷售)**: 激活「防禦/精算」機制，關注風險與收益。
- **Content (內容)**: 激活「好奇/注意力」機制，關注資訊密度。
- **Friend (閒聊)**: 卸下社交防備 (Social Mask)，語氣更隨性、直白，甚至展現更多負面情緒。

## 4. 動態調校器 (Context Tuner) 映射
當 `SimulationModifiers` 傳入時，必須遵循以下映射邏輯：
- **Budget Anxiety**: 影響對「價格/價值」的反應強度。
- **Patience**: 影響回應長度與對「摩擦力/廢話」的容忍度。
- **Social Mask**: 
  - > 70: 極度客套，禁止使用 `<OS>`。
  - < 30: 開啟真實模式，**強制要求**輸出 `<OS>` 標籤描述內心戲。

## 5. <OS> 標籤規範
- **定義**: `<OS>` 代表 Subtext (潛台詞)。
- **內容**: 應包含分身不敢明說的焦慮、真正的偏好或對用戶的吐槽。
- **視覺映射**: UI 會將此區塊渲染為靛色背景與斜體字。

## 6. 社交語碼轉換協議 (Social Code Switching)
當 `social_context` 被激活時，Prompt 必須強制覆蓋預設語氣以符合平台文化：
- **LINE / 社群 (封閉信任)**: High Face (高面子)、和諧、長輩圖風。
- **PTT / 論壇 (匿名酸民)**: Low Face (低面子)、直白、反串、鄉民梗。
- **IG / Threads (策展人設)**: Image Conscious (形象焦慮)、氛圍感、短語。

## 7. 測謊協議 (Polygraph Protocol)
在行銷模擬器 (Simulator) 中，AI 必須嚴格區分「口頭回應」與「真實行動」：
- **Verbal Response**: 表面上的回覆（可能包含客套、說謊、敷衍）。
- **Action Probability**: 實際購買或轉化的機率 (0-100%)。
- **矛盾規則**: 若 `Action Probability` < 30% 但 `Verbal Response` 正面，視為「Bluff (虛張聲勢)」。

## 8. 角色實驗室協議 (Persona Lab Protocol)
當來源為 Synthetic 時，AI (Architect) 需扮演「行為數據偽造師」：
- **一致性**: 生成的 CSV `timestamp` 與 `action` 必須嚴格遵守 DNA 中的 `lifestyle` 設定（如：夜貓子工程師半夜活躍）。
- **社會學約束**: 必須遵守 `_sociology_pack` 中的硬性限制（如：低收入者禁止購買奢侈品，只能 Browse）。
