
# UI/UX & Interaction Guidelines

## 1. 核心視覺化組件 (Core Visualizations)

### 1.1 阻力控制台 (Resistance Equalizer)
- **目的**: 展示阻礙使用者轉化的四大門檻（金錢、時間、認知、慣性）。
- **視覺**: 分段式能量條 (Segmented Bar)。
- **Ghost Indicator**: 若存在「認知偏離 (Delusion)」，顯示半透明的「幽靈指標」，代表使用者**自以為**的門檻高度（通常低於實際門檻）。

### 1.2 心智波形圖 (Dayparting Bar / Mindset Waveform)
- **目的**: 展示一週內的活躍時段與當下的心智狀態。
- **視覺**: Area Chart 波形圖。
- **心智標籤 (Mindset Tag)**:
  - **Fragmented (碎片掃描)**: 適合短標題、強視覺。
  - **Deep Focus (深度沉浸)**: 適合長文、深度溝通。
  - **Leisure Flow (休閒瀏覽)**: 適合娛樂、軟性內容。

### 1.3 現實校準卡 (Reality Anchor)
- **目的**: 具象化「主觀自我」與「客觀現實」的落差。
- **視覺**: 左側為 Perception (Self)，右側為 Reality (Fact)，中間以鏈結圖標連接。
- **狀態**: 
  - **Delusional**: 鏈結斷裂圖標，紅色警示風格。
  - **Coherent**: 綠色鏈結圖標。

### 1.4 轉換儀表板 (Conversion Gauge)
- **視覺**: 半圓形儀表板。
- **雙能量條**: 下方附帶 Drive (推力) 與 Resistance (阻力) 的對比條。
- **Reality Lock**: 當現實阻力過高（如負債）時，阻力條會顯示「鎖定」圖示，代表行銷無法突破硬性限制。

## 2. 互動反饋 (Reaction Patterns)
- **Gut Feeling (直覺反應)**: 漫畫式對話框，極短、情緒化。
- **Polygraph Panel (測謊儀表板)**: 
  - **Verbal**: 顯示 AI 的文字回應。
  - **Action**: 進度條顯示真實轉化機率。
  - **Bluff Detected**: 當 Action < 30% 但 Verbal 正面時顯示。

## 3. 控制台設計哲學 (Context Tuner)
- **Mobile-First**: 手機版預設收合，由底部或右側滑入。
- **Preset-First**: 優先展示平台場景按鈕 (LINE/PTT/IG)，點擊後自動套用複雜參數。

## 4. 認知加載 (Cognitive Loading)
- **ChatPage**: Micro-Interaction Loader (顯示「計算 CP 值中...」)。
- **SimulatorPage**: Cognitive Stream (顯示「搜尋競品...」、「比對預算...」)。
