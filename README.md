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
- 儲存：未設定資料庫時使用瀏覽器 `localStorage`；設定 Supabase 後會保存分析報告

## Supabase 資料庫

這個專案支援 Supabase PostgreSQL。未設定環境變數時，網站會維持原本的 `localStorage` 行為；設定後，每次分析會寫入 `analysis_reports`，並產生可分享的 `reportId` URL。

### 1. 建立資料表

在 Supabase SQL Editor 執行：

```sql
create extension if not exists "pgcrypto";

create table if not exists public.analysis_reports (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  industry text not null,
  file_name text,
  total_conversations integer not null default 0,
  high_purchase_intent_count integer not null default 0,
  negative_emotion_count integer not null default 0,
  requires_follow_up_count integer not null default 0,
  analysis_json jsonb not null
);

create index if not exists analysis_reports_created_at_idx
  on public.analysis_reports (created_at desc);

create index if not exists analysis_reports_industry_idx
  on public.analysis_reports (industry);
```

同一份 SQL 也放在 `supabase/schema.sql`。

### 2. 設定 Vercel Environment Variables

在 Vercel Project Settings → Environment Variables 新增：

```text
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

`SUPABASE_SERVICE_ROLE_KEY` 只能放在 Vercel 後端環境變數，不要放到前端程式碼或公開聊天裡。

設定後重新部署，`/api/analyze` 會自動把分析結果寫進資料庫，Dashboard / Report 會支援 `?id=<reportId>` 讀取歷史報告。

## 未來可擴充

- Excel 上傳
- SQLite / Supabase 儲存歷史報告
- OpenAI API 分析語意與摘要
- PII 偵測與遮罩
- 多品牌 / 多商家帳號
- 匯出 PDF
- 對話逐句標註與人工校正
