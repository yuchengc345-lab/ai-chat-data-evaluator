# AI 聊天數據評估系統 MVP

這是一個最小可行版本，用來上傳 AI / LINE / 客服聊天 CSV，分析客戶需求、購買意圖、情緒、流失風險、常見問題與 AI 回覆品質，並產生 dashboard 和報告頁。

## 功能

- CSV 上傳
- 規則引擎分析
- 購買意圖、情緒、流失風險評分
- 問題分類：價格、付款、物流、退貨、產品、客訴、其他
- 人工跟進判斷
- Dashboard 圖表
- 聊天數據分析報告
- Sample CSV：`data/sample-chat.csv`

## CSV 格式

必要欄位：

```csv
user_id,message,sender,created_at
```

`sender` 支援：

- `user`
- `ai`
- `human`

## 啟動方式

```bash
npm install
npm run dev
```

打開：

```text
http://localhost:3000
```

如果你的系統沒有 `npm`，請先安裝 Node.js LTS。這個專案的 `dev` / `build` 腳本已內建 Next.js WASM SWC fallback，用來避開部分 macOS runtime 的原生 SWC 簽章問題。

## 測試

```bash
npm test
```

## MVP 架構

- 前端：Next.js App Router
- API：Next.js Route Handler `/api/analyze`
- UI：Tailwind CSS
- 圖表：Recharts
- 分析：`src/lib/analysis.js` 規則引擎
- 儲存：瀏覽器 `localStorage`

第一版沒有引入資料庫，避免部署和權限複雜度。後續可以把 `localStorage` 換成 SQLite、Supabase 或企業私有資料庫。

## 未來可擴充

- Excel 上傳
- SQLite / Supabase 儲存歷史報告
- OpenAI API 分析語意與摘要
- PII 偵測與遮罩
- 多品牌 / 多商家帳號
- 匯出 PDF
- 對話逐句標註與人工校正
