
# System Architecture: Digital Twin Pipeline

## 1. 核心設計哲學
本系統不直接分析大數據，而是模仿人類「形成印象」的過程：從碎片的行為記錄中，蒸餾出主觀的體感，最後形成穩定的人格。

## 2. 開發約束 (Governance)
**重要**: 系統的演進必須受到 `DOCS/DEVELOPMENT_PROTOCOL.md` 的約束。

## 3. 數據流轉路徑 (The Full Pipeline)

### Step 0: 智慧蒸餾層 (Smart Distillation)
- **實作文件**: `utils/smartDistiller.ts`
- **任務**: 
  - 將萬筆原始行為壓縮為 ~300 筆高價值樣本。
  - 生成 `PerceptionSheet`（主觀體感，如「模糊記憶」）。

### Layer 1: 全知觀察者 (Omniscient Analyst)
- **模型**: `gemini-3-flash-preview` (Temp 0.2)
- **任務**: 根據樣本提取統計事實 (Time Pattern, Categories)。

### Layer 1.5: 社會學校正 (Open Data Layer)
- **實作文件**: 
  - `services/OpenDataService.ts` (薪資/工時統計)
  - `services/LexiconService.ts` (職稱模糊搜尋)
  - `data/taiwan_sociology.ts` (社會動力學引擎)
- **任務**: 
  - **Grounding**: 將模糊的 Role 字串映射到真實的台灣就業數據 (Income Bracket, Labor Mode)。
  - **Reality Check**: 判定角色是否存在「精緻窮 (Delusional)」或「隱形富豪 (Stealth Wealth)」現象。
  - **Output**: 產出 `SocialTension` 與 `RealityCheck` 物件，強制注入下一層 Prompt。

### Layer 2: 心理側寫師 (Psychologist Profiler)
- **模型**: `gemini-3-flash-preview` (Temp 0.8)
- **任務**: 結合 Layer 1 的事實與 Layer 1.5 的社會學約束，推理行為背後的「動機冰山」與「性格特質」。

### Layer 3: 方法演技派 (Actor Simulation)
- **模型**: `gemini-3-flash-preview` (Temp 1.1)
- **任務**: 賦予分身語氣、人格瑕疵 (Composite Flaw) 與內心獨白。

## 4. 角色實驗室路徑 (Persona Lab Pipeline)
除了上傳 CSV，系統支援從零生成合成數據：
1. **User Input**: 輸入 Skeleton (Role, Age, Income)。
2. **Profiler (Enrichment)**: 使用 Google Search Tool 分析該角色在台灣網路文化中的刻板印象，生成 `PersonaDNA`。
3. **Architect (Synthesis)**: 基於 DNA 與社會學約束，反向生成合成 CSV 數據。
4. **Injection**: 將合成 CSV 注入標準 Pipeline (Step 0) 進行分析。

## 5. 狀態持久化 (Persistence Protocol)
- **Identity**: `the_sim_persona_v1` (包含完整 DNA 與 Behavior)。
- **Context**: `the_sim_modifiers_v1` (Tuner), `the_sim_scenario_v1` (Mode)。
- **Memory**: `the_sim_messages_v1` (Chat History)。
- **Workspace**: `the_sim_simulator_v1` (行銷模擬器暫存)。
- **Reset Protocol**: 當 `Twin ID` 變更時，必須強制重置 Context 與 Workspace，防止角色汙染。
