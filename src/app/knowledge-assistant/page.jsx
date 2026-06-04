"use client";

import { useMemo, useState } from "react";
import {
  answerKnowledgeQuestion,
  getKnowledgeSources,
  getSuggestedQuestions,
} from "../../lib/knowledge-assistant.js";

const SOURCES = getKnowledgeSources();
const SUGGESTED_QUESTIONS = getSuggestedQuestions();

export default function KnowledgeAssistantPage() {
  const [question, setQuestion] = useState(SUGGESTED_QUESTIONS[0]);
  const result = useMemo(() => answerKnowledgeQuestion(question), [question]);

  return (
    <div className="space-y-8">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
        <div>
          <p className="text-sm font-semibold text-teal">內部效率包 Demo</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-normal text-ink">
            AI 文件 / 流程助理
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
            這個頁面示範如何把公司 FAQ、SOP、表格與客服對話分析結果整理成可查詢的內部知識助理。
            員工可以直接問問題，系統回覆標準答案、引用來源、信心分數與下一步建議。
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setQuestion(item)}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-teal hover:text-teal"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-lg font-semibold text-ink">可接入的文件來源</h2>
          <div className="mt-5 space-y-3">
            {SOURCES.map((source) => (
              <div key={source.id} className="rounded-md border border-line p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-ink">{source.title}</div>
                    <div className="mt-1 text-xs text-slate-500">
                      {source.owner} · 更新 {source.updatedAt}
                    </div>
                  </div>
                  <span className="rounded-md bg-teal/10 px-2 py-1 text-xs font-semibold text-teal">
                    {source.type}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {source.tags.map((tag) => (
                    <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-600">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-line bg-white p-6">
          <label className="text-sm font-semibold text-ink" htmlFor="knowledgeQuestion">
            員工問題
          </label>
          <textarea
            id="knowledgeQuestion"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            rows={5}
            className="mt-3 block w-full resize-none rounded-md border border-line bg-white px-3 py-2 text-sm leading-6 text-ink"
            placeholder="例如：主管週報要放哪些欄位？"
          />

          <div className="mt-6 rounded-lg border border-teal/30 bg-teal/5 p-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">助理回答</h2>
              <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-teal">
                信心 {result.confidence}%
              </span>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">{result.answer}</p>
            <div className="mt-5 rounded-md bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">下一步建議</div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.nextStep}</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">引用來源</h2>
            <div className="mt-5 space-y-3">
              {result.sources.length > 0 ? (
                result.sources.map((source) => (
                  <div key={source.id} className="rounded-md border border-line p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-ink">{source.title}</div>
                      <span className="rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700">
                        命中 {source.score}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      {source.type} · {source.owner} · {source.updatedAt}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm leading-6 text-slate-600">
                  尚未找到可引用來源。這會在正式專案中列入待補 FAQ/SOP 清單。
                </p>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-6">
            <h2 className="text-lg font-semibold text-ink">主管報表草稿</h2>
            <pre className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm leading-6 text-slate-700">
              {result.reportDraft}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
