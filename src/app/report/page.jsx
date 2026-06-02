"use client";

import { useEffect, useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { EmptyState } from "../../components/EmptyState.jsx";
import { ScoreBadge } from "../../components/ScoreBadge.jsx";
import { loadAnalysis } from "../../lib/browser-storage.js";
import { exportFollowUpCsv } from "../../lib/export.js";

const COLORS = ["#0f766e", "#b45309", "#be123c", "#475569", "#2563eb", "#7c3aed"];

export default function ReportPage() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAnalysis(loadAnalysis());
    setIsLoaded(true);
  }, []);

  const recommendations = useMemo(() => {
    if (!analysis) return [];
    const metrics = analysis.metrics;
    const notes = [];

    if (metrics.highPurchaseIntentCount > 0) {
      notes.push("優先把高購買意圖客戶交給真人銷售或顧問跟進，避免只靠 AI 自動回覆。");
    }
    if (metrics.negativeEmotionCount > 0) {
      notes.push("針對負面情緒客戶建立客服升級流程，縮短人工介入時間。");
    }
    if (metrics.topCategories[0]) {
      notes.push(`目前最常見問題是「${metrics.topCategories[0].category}」，建議優先優化 FAQ 與 AI 話術。`);
    }
    if (metrics.poorAiAnswerCategories.length > 0) {
      notes.push("AI 回覆品質問題集中在少數分類，可先補充知識庫或改寫客服提示詞。");
    }

    return notes.length > 0 ? notes : ["目前樣本風險較低，可擴大資料量後再觀察趨勢。"];
  }, [analysis]);

  if (!isLoaded) return null;
  if (!analysis) return <EmptyState />;

  const highValueCustomers = analysis.conversations
    .filter((conversation) => conversation.purchaseIntent >= 70)
    .sort((a, b) => b.purchaseIntent - a.purchaseIntent)
    .slice(0, 10);

  const riskyCustomers = analysis.conversations
    .filter((conversation) => conversation.churnRisk >= 60 || conversation.emotionScore <= 40)
    .sort((a, b) => b.churnRisk - a.churnRisk)
    .slice(0, 10);

  function handleExportFollowUp() {
    const csv = exportFollowUpCsv(analysis.conversations);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "follow-up-customers.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8">
      <section className="border-b border-line pb-6">
        <p className="text-sm font-semibold text-teal">Report</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">聊天數據分析報告</h1>
        <p className="mt-3 text-sm text-slate-600">
          報告生成時間：{new Date(analysis.generatedAt).toLocaleString("zh-TW")} · 行業模板：
          {analysis.industry?.label || "通用"}
        </p>
        <button
          type="button"
          onClick={handleExportFollowUp}
          className="mt-5 inline-flex min-h-10 items-center rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
        >
          匯出跟進名單 CSV
        </button>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">摘要</h2>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-slate-600">總對話數</dt>
              <dd className="mt-1 text-2xl font-semibold text-ink">{analysis.metrics.totalConversations}</dd>
            </div>
            <div>
              <dt className="text-slate-600">需人工跟進</dt>
              <dd className="mt-1 text-2xl font-semibold text-amber">
                {analysis.metrics.requiresFollowUpCount}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">高購買意圖</dt>
              <dd className="mt-1 text-2xl font-semibold text-teal">
                {analysis.metrics.highPurchaseIntentCount}
              </dd>
            </div>
            <div>
              <dt className="text-slate-600">負面情緒</dt>
              <dd className="mt-1 text-2xl font-semibold text-rose">
                {analysis.metrics.negativeEmotionCount}
              </dd>
            </div>
          </dl>
        </div>

        <div className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">問題分類分布</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analysis.metrics.topCategories}
                  dataKey="count"
                  nameKey="category"
                  outerRadius={100}
                  label
                >
                  {analysis.metrics.topCategories.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">商業建議</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-700">
          {recommendations.map((recommendation) => (
            <li key={recommendation} className="border-l-4 border-teal bg-teal/5 px-4 py-3">
              {recommendation}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <CustomerList title="高價值客戶名單" customers={highValueCustomers} scoreKey="purchaseIntent" />
        <CustomerList title="流失風險名單" customers={riskyCustomers} scoreKey="churnRisk" />
      </section>
    </div>
  );
}

function CustomerList({ title, customers, scoreKey }) {
  return (
    <div className="rounded-lg border border-line bg-white p-6">
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-5 space-y-3">
        {customers.length > 0 ? (
          customers.map((customer) => (
            <div key={customer.userId} className="flex items-center justify-between border-b border-line pb-3">
              <div>
                <div className="font-mono text-sm font-semibold text-ink">{customer.userId}</div>
                <div className="mt-1 text-xs text-slate-600">{customer.primaryCategory}</div>
              </div>
              <ScoreBadge value={customer[scoreKey]} kind={scoreKey === "churnRisk" ? "bad" : "good"} />
            </div>
          ))
        ) : (
          <p className="text-sm text-slate-600">目前沒有符合條件的客戶。</p>
        )}
      </div>
    </div>
  );
}
