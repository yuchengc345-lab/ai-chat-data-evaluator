"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getIndustryProfiles } from "../lib/analysis.js";
import { saveAnalysis } from "../lib/browser-storage.js";

const INDUSTRY_OPTIONS = getIndustryProfiles();

export default function UploadPage() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [industry, setIndustry] = useState("general");
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    setError("");

    if (!file) return;
    setFileName(file.name);
    setCsvText(await file.text());
  }

  async function handleLoadSample() {
    setError("");
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/sample");
      if (!response.ok) throw new Error("範例資料載入失敗。");
      setCsvText(await response.text());
      setFileName("sample-chat.csv");
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!csvText.trim()) {
      setError("請先選擇 CSV 檔案。");
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ csv: csvText, industry, fileName }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "分析失敗。");
      }

      saveAnalysis(payload);
      router.push(payload.reportId ? `/dashboard?id=${payload.reportId}` : "/dashboard");
    } catch (caughtError) {
      setError(caughtError.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
      <section>
        <p className="text-sm font-semibold text-teal">MVP</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">
          上傳聊天紀錄，快速找出商業機會與服務風險
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          支援 LINE、AI 客服、電商與顧問服務聊天 CSV。系統會用規則引擎分析購買意圖、情緒、流失風險、常見問題與人工跟進名單。
        </p>

        <form onSubmit={handleSubmit} className="mt-8 rounded-lg border border-line bg-white p-6">
          <label className="block text-sm font-semibold text-ink" htmlFor="industry">
            行業模板
          </label>
          <select
            id="industry"
            value={industry}
            onChange={(event) => setIndustry(event.target.value)}
            className="mt-3 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink"
          >
            {INDUSTRY_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="mt-2 text-sm text-slate-600">
            不同行業會套用不同高意圖詞與問題分類，例如醫美的療程/預約、房仲的看屋/房貸。
          </p>

          <label className="mt-6 block text-sm font-semibold text-ink" htmlFor="chatCsv">
            CSV 聊天紀錄
          </label>
          <input
            id="chatCsv"
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileChange}
            className="mt-3 block w-full rounded-md border border-line bg-white px-3 py-2 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-teal file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
          <p className="mt-3 text-sm text-slate-600">
            必要欄位：<span className="font-mono">user_id, message, sender, created_at</span>。
            sender 可為 user / ai / human。
          </p>

          <button
            type="button"
            onClick={handleLoadSample}
            disabled={isAnalyzing}
            className="mt-4 inline-flex min-h-10 items-center rounded-md border border-teal px-4 py-2 text-sm font-semibold text-teal hover:bg-teal/5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            使用範例資料
          </button>

          {fileName ? (
            <div className="mt-4 rounded-md border border-teal/30 bg-teal/5 px-3 py-2 text-sm text-teal">
              已選擇：{fileName}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-md border border-rose/30 bg-rose/5 px-3 py-2 text-sm text-rose">
              {error}
            </div>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isAnalyzing}
              className="inline-flex min-h-10 items-center rounded-md bg-ink px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAnalyzing ? "分析中..." : "開始分析"}
            </button>
            <Link
              href="/knowledge-assistant"
              className="inline-flex min-h-10 items-center rounded-md border border-line px-5 py-2 text-sm font-semibold text-slate-700 hover:border-teal hover:text-teal"
            >
              查看文件助理 Demo
            </Link>
          </div>
        </form>
      </section>

      <aside className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">第一版分析項目</h2>
        <div className="mt-5 space-y-4 text-sm text-slate-700">
          <div>
            <div className="font-semibold text-ink">購買意圖</div>
            <p className="mt-1">價格、付款、方案、客製化、電話/LINE 等訊號。</p>
          </div>
          <div>
            <div className="font-semibold text-ink">流失風險</div>
            <p className="mt-1">抱怨、太貴、重複提問、再看看、負面情緒。</p>
          </div>
          <div>
            <div className="font-semibold text-ink">問題分類</div>
            <p className="mt-1">價格、付款、物流、退貨、產品、客訴、其他。</p>
          </div>
          <div>
            <div className="font-semibold text-ink">跟進建議</div>
            <p className="mt-1">自動產出需要人工處理的高價值或高風險客戶。</p>
          </div>
        </div>
      </aside>
    </div>
  );
}
