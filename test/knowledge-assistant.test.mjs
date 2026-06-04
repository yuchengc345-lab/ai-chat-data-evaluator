import test from "node:test";
import assert from "node:assert/strict";

import {
  answerKnowledgeQuestion,
  buildReportDraft,
  getKnowledgeSources,
  getSuggestedQuestions,
} from "../src/lib/knowledge-assistant.js";

test("getKnowledgeSources returns safe source metadata without full document bodies", () => {
  const sources = getKnowledgeSources();

  assert.ok(sources.length >= 3);
  assert.equal(sources[0].content, undefined);
  assert.ok(sources.some((source) => source.type === "SOP"));
  assert.ok(sources.some((source) => source.type === "FAQ"));
});

test("answerKnowledgeQuestion answers pricing questions with source attribution", () => {
  const result = answerKnowledgeQuestion("內部效率包應該怎麼報價？月費包含什麼？");

  assert.match(result.answer, /一次性建置費/);
  assert.match(result.answer, /月費/);
  assert.ok(result.confidence >= 70);
  assert.equal(result.sources[0].id, "faq-pricing");
  assert.match(result.nextStep, /盤點/);
});

test("answerKnowledgeQuestion detects handoff SOP questions", () => {
  const result = answerKnowledgeQuestion("客戶退款或客訴時，什麼情況要轉人工？");

  assert.match(result.answer, /轉人工/);
  assert.equal(result.sources[0].type, "SOP");
  assert.match(result.reportDraft, /內部知識助理摘要/);
});

test("answerKnowledgeQuestion gives a useful fallback when no document matches", () => {
  const result = answerKnowledgeQuestion("公司冰箱要怎麼清潔？");

  assert.equal(result.sources.length, 0);
  assert.ok(result.confidence < 50);
  assert.match(result.answer, /沒有直接命中/);
});

test("getSuggestedQuestions and buildReportDraft support the demo UI", () => {
  assert.ok(getSuggestedQuestions().includes("主管每週報表要包含哪些欄位？"));
  assert.match(buildReportDraft(), /常見問題/);
  assert.match(buildReportDraft(), /SOP/);
});
