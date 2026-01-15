
# Skill: Designer (介面設計師)

**適用範圍**: 前端組件 (`components/`), 頁面佈局 (`pages/`), Tailwind 樣式, 視覺化圖表。
**關鍵檔案**: `UI_UX_GUIDELINES.md` (Reference)

## 1. 視覺語義系統 (Visual Semantics)
UI 的顏色與形狀必須傳遞一致的心理學意義：

### 1.1 性格拔河 (Tug of War)
- **靛色節點 (Indigo)**: 代表原始數據推論出的「基本盤 (Base Personality)」。
- **紅色/玫瑰色節點 (Rose)**: 代表受 Context Tuner 影響後的「當前狀態 (Current State)」。
- **意義**: 兩點之間的連線長度代表受環境影響的「性格偏移量 (Contextual Shift)」。

### 1.2 需求冰山 (Iceberg Model)
- **水面上 (Sky Blue)**: 顯性目標 (Goals)。應使用直觀、強烈的動詞（如：比價、購買）。
- **水面下 (Cyan/Dark Blue)**: 隱性渴望 (Latent Needs)。應使用心理學詞彙（如：認同感、安全感）。

### 1.3 模擬結果 (Simulation)
- **勝利 (Winner)**: 使用飽和度高的顏色 (Indigo/Emerald)。
- **直覺反應 (Gut Feeling)**: 必須像漫畫對話框一樣顯眼，位於卡片上方。

## 2. 互動設計原則 (Interaction Design)
- **Mobile-First**: 所有控制台 (Context Tuner) 在手機版必須預設收合 (Drawer/Overlay)，避免佔據核心視野。
- **預設優先 (Preset-First)**: 
  - `Context Tuner` 應優先展示「場景按鈕」(LINE, PTT, IG)。
  - 詳細的滑桿 (Sliders) 應收合在「進階設定」中，降低認知負荷。

## 3. 樣式規範 (Tailwind Rules)
- **圓角**: 卡片統一使用 `rounded-2xl` 或 `rounded-3xl`，營造現代與友善感。
- **陰影**: 使用 `shadow-sm` 為主，懸停時 `shadow-md`，避免過度厚重的陰影。
- **字體**: 數字與數據展示使用 `font-black` 或 `font-extrabold` 強調層級。
