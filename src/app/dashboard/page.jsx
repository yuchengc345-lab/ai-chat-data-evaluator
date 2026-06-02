"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "../../components/EmptyState.jsx";
import { MetricCard } from "../../components/MetricCard.jsx";
import { ScoreBadge } from "../../components/ScoreBadge.jsx";
import { loadAnalysis } from "../../lib/browser-storage.js";

export default function DashboardPage() {
  const [analysis, setAnalysis] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setAnalysis(loadAnalysis());
    setIsLoaded(true);
  }, []);

  const followUpList = useMemo(() => {
    return analysis?.conversations
      .filter((conversation) => conversation.requiresFollowUp)
      .sort((a, b) => b.purchaseIntent + b.churnRisk - (a.purchaseIntent + a.churnRisk))
      .slice(0, 8);
  }, [analysis]);

  if (!isLoaded) return null;
  if (!analysis) return <EmptyState />;

  const metrics = analysis.metrics;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-semibold text-teal">Dashboard</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">聊天數據分析儀表板</h1>
        <p className="mt-2 text-sm text-slate-600">目前行業模板：{analysis.industry?.label || "通用"}</p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="總對話數" value={metrics.totalConversations} />
        <MetricCard label="高購買意圖客戶" value={metrics.highPurchaseIntentCount} tone="teal" />
        <MetricCard label="負面情緒客戶" value={metrics.negativeEmotionCount} tone="rose" />
        <MetricCard label="需要人工跟進" value={metrics.requiresFollowUpCount} tone="amber" />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">最常見問題 Top 5</h2>
          <div className="mt-5 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.topCategories}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0f766e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">AI 最常答不好的問題</h2>
          <div className="mt-5 space-y-3">
            {metrics.poorAiAnswerCategories.length > 0 ? (
              metrics.poorAiAnswerCategories.map((item) => (
                <div key={item.category} className="flex items-center justify-between border-b border-line pb-3">
                  <span className="font-medium text-ink">{item.category}</span>
                  <ScoreBadge value={`${item.count} 次`} kind="bad" />
                </div>
              ))
            ) : (
              <p className="text-sm leading-6 text-slate-600">
                目前樣本未偵測到明確的 AI 回覆品質問題。可加入更多含 AI 回覆與追問的對話提升判斷力。
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">高價值 / 高風險跟進名單</h2>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-slate-600">
                <th className="py-3 pr-4">user_id</th>
                <th className="py-3 pr-4">分類</th>
                <th className="py-3 pr-4">購買意圖</th>
                <th className="py-3 pr-4">情緒</th>
                <th className="py-3 pr-4">流失風險</th>
                <th className="py-3 pr-4">訊息數</th>
              </tr>
            </thead>
            <tbody>
              {followUpList.map((conversation) => (
                <tr key={conversation.userId} className="border-b border-line">
                  <td className="py-3 pr-4 font-mono text-ink">{conversation.userId}</td>
                  <td className="py-3 pr-4">{conversation.primaryCategory}</td>
                  <td className="py-3 pr-4">
                    <ScoreBadge value={conversation.purchaseIntent} kind="good" />
                  </td>
                  <td className="py-3 pr-4">
                    <ScoreBadge
                      value={conversation.emotionScore}
                      kind={conversation.emotionScore <= 40 ? "bad" : "neutral"}
                    />
                  </td>
                  <td className="py-3 pr-4">
                    <ScoreBadge
                      value={conversation.churnRisk}
                      kind={conversation.churnRisk >= 60 ? "bad" : "neutral"}
                    />
                  </td>
                  <td className="py-3 pr-4">{conversation.messageCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-white p-6">
        <h2 className="text-lg font-semibold text-ink">評分原因</h2>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {followUpList.slice(0, 6).map((conversation) => (
            <div key={conversation.userId} className="rounded-md border border-line p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-mono text-sm font-semibold text-ink">{conversation.userId}</div>
                <ScoreBadge value={conversation.primaryCategory} />
              </div>
              <ReasonGroup title="購買意圖" reasons={conversation.scoreReasons?.purchaseIntent || []} />
              <ReasonGroup title="流失風險" reasons={conversation.scoreReasons?.churnRisk || []} />
              <ReasonGroup title="情緒" reasons={conversation.scoreReasons?.emotion || []} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ReasonGroup({ title, reasons }) {
  return (
    <div className="mt-4">
      <div className="text-xs font-semibold text-slate-500">{title}</div>
      {reasons.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {reasons.map((reason) => (
            <span
              key={`${reason.label}-${reason.points}`}
              className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700"
            >
              {reason.label} {reason.points > 0 ? "+" : ""}
              {reason.points}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-slate-500">未命中明確規則</p>
      )}
    </div>
  );
}
