import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeRows,
  buildDashboardMetrics,
  getIndustryProfiles,
  parseCsv,
} from "../src/lib/analysis.js";

test("parseCsv reads required chat columns", () => {
  const rows = parseCsv(`user_id,message,sender,created_at
u1,請問價格多少,user,2026-05-01T10:00:00Z
u1,我們有三種方案,ai,2026-05-01T10:00:20Z`);

  assert.equal(rows.length, 2);
  assert.deepEqual(Object.keys(rows[0]), [
    "user_id",
    "message",
    "sender",
    "created_at",
  ]);
  assert.equal(rows[0].message, "請問價格多少");
});

test("analyzeRows scores purchase intent, churn risk, emotion, categories, and follow-up", () => {
  const result = analyzeRows([
    {
      user_id: "buyer-1",
      message: "請問價格和付款方式？我想了解方案，也可以留 LINE 嗎？",
      sender: "user",
      created_at: "2026-05-01T10:00:00Z",
    },
    {
      user_id: "buyer-1",
      message: "方案很多，請問要客製化怎麼做？",
      sender: "user",
      created_at: "2026-05-01T10:01:00Z",
    },
    {
      user_id: "risk-1",
      message: "太貴了，我再看看，而且物流問題一直沒有解決，很不滿意",
      sender: "user",
      created_at: "2026-05-01T11:00:00Z",
    },
  ]);

  const buyer = result.conversations.find((item) => item.userId === "buyer-1");
  const risk = result.conversations.find((item) => item.userId === "risk-1");

  assert.equal(buyer.purchaseIntent, 100);
  assert.ok(buyer.scoreReasons.purchaseIntent.some((reason) => reason.label === "詢問價格"));
  assert.ok(buyer.scoreReasons.purchaseIntent.some((reason) => reason.points === 30));
  assert.equal(buyer.requiresFollowUp, true);
  assert.equal(buyer.primaryCategory, "付款");
  assert.ok(risk.churnRisk >= 60);
  assert.ok(risk.scoreReasons.churnRisk.some((reason) => reason.label === "表示再看看"));
  assert.ok(risk.emotionScore <= 40);
  assert.equal(risk.requiresFollowUp, true);
  assert.equal(risk.primaryCategory, "物流");
});

test("analyzeRows applies industry profile keywords", () => {
  const profiles = getIndustryProfiles();
  assert.ok(profiles.some((profile) => profile.id === "medical_beauty"));

  const result = analyzeRows(
    [
      {
        user_id: "beauty-1",
        message: "想預約諮詢音波療程，請問診所可以安排嗎？",
        sender: "user",
        created_at: "2026-05-01T10:00:00Z",
      },
    ],
    { industry: "medical_beauty" },
  );

  const conversation = result.conversations[0];
  assert.equal(result.industry.id, "medical_beauty");
  assert.equal(conversation.primaryCategory, "產品");
  assert.equal(conversation.requiresFollowUp, true);
  assert.ok(conversation.scoreReasons.purchaseIntent.some((reason) => reason.label === "行業高意圖詞"));
});

test("buildDashboardMetrics aggregates analyzed conversations", () => {
  const analysis = analyzeRows([
    {
      user_id: "u1",
      message: "價格多少？可以付款嗎？我想了解方案，也可以留電話。",
      sender: "user",
      created_at: "2026-05-01T10:00:00Z",
    },
    {
      user_id: "u2",
      message: "我要退貨，客服一直沒回很生氣",
      sender: "user",
      created_at: "2026-05-01T10:05:00Z",
    },
    {
      user_id: "u2",
      message: "請問退貨流程？",
      sender: "user",
      created_at: "2026-05-01T10:06:00Z",
    },
  ]);

  const metrics = buildDashboardMetrics(analysis.conversations);

  assert.equal(metrics.totalConversations, 2);
  assert.equal(metrics.negativeEmotionCount, 1);
  assert.equal(metrics.requiresFollowUpCount, 2);
  assert.equal(metrics.topCategories[0].category, "退貨");
});
