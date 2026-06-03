import test from "node:test";
import assert from "node:assert/strict";

import {
  createAnalysisReport,
  getAnalysisReport,
  isDatabaseConfigured,
} from "../src/lib/database.js";

test("isDatabaseConfigured is false when Supabase env vars are missing", () => {
  const env = {};
  assert.equal(isDatabaseConfigured(env), false);
});

test("createAnalysisReport skips persistence when database is not configured", async () => {
  const result = await createAnalysisReport(
    {
      industry: { id: "general", label: "通用" },
      metrics: {
        totalConversations: 1,
        highPurchaseIntentCount: 1,
        negativeEmotionCount: 0,
        requiresFollowUpCount: 1,
      },
      conversations: [],
    },
    { env: {} },
  );

  assert.equal(result, null);
});

test("createAnalysisReport posts report summary and analysis JSON to Supabase REST", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json([{ id: "report-123" }], { status: 201 });
  };

  const result = await createAnalysisReport(
    {
      industry: { id: "education", label: "教育" },
      metrics: {
        totalConversations: 2,
        highPurchaseIntentCount: 1,
        negativeEmotionCount: 1,
        requiresFollowUpCount: 2,
      },
      conversations: [{ userId: "u1" }],
    },
    {
      env: {
        SUPABASE_URL: "https://example.supabase.co",
        SUPABASE_SERVICE_ROLE_KEY: "service-key",
      },
      fetchImpl: fakeFetch,
      fileName: "sample.csv",
    },
  );

  assert.equal(result.id, "report-123");
  assert.equal(calls[0].url, "https://example.supabase.co/rest/v1/analysis_reports");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.apikey, "service-key");

  const body = JSON.parse(calls[0].options.body);
  assert.equal(body.industry, "education");
  assert.equal(body.file_name, "sample.csv");
  assert.equal(body.total_conversations, 2);
  assert.equal(body.analysis_json.conversations[0].userId, "u1");
});

test("getAnalysisReport fetches one report by id from Supabase REST", async () => {
  const calls = [];
  const fakeFetch = async (url, options) => {
    calls.push({ url, options });
    return Response.json(
      [
        {
          id: "report-123",
          analysis_json: { industry: { id: "general", label: "通用" }, conversations: [] },
        },
      ],
      { status: 200 },
    );
  };

  const report = await getAnalysisReport("report-123", {
    env: {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-key",
    },
    fetchImpl: fakeFetch,
  });

  assert.equal(report.id, "report-123");
  assert.deepEqual(report.analysis.industry, { id: "general", label: "通用" });
  assert.match(calls[0].url, /id=eq\.report-123/);
});
