import test from "node:test";
import assert from "node:assert/strict";

import { exportFollowUpCsv } from "../src/lib/export.js";

test("exportFollowUpCsv exports only conversations requiring follow-up", () => {
  const csv = exportFollowUpCsv([
    {
      userId: "buyer-1",
      primaryCategory: "付款",
      purchaseIntent: 85,
      emotionScore: 60,
      churnRisk: 20,
      requiresFollowUp: true,
    },
    {
      userId: "low-1",
      primaryCategory: "其他",
      purchaseIntent: 5,
      emotionScore: 70,
      churnRisk: 0,
      requiresFollowUp: false,
    },
  ]);

  assert.match(csv, /user_id,primary_category,purchase_intent,emotion_score,churn_risk,reason/);
  assert.match(csv, /buyer-1,付款,85,60,20,高購買意圖/);
  assert.doesNotMatch(csv, /low-1/);
});
