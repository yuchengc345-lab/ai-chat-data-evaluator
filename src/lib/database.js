const REPORTS_TABLE = "analysis_reports";

export function isDatabaseConfigured(env = process.env) {
  return Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY);
}

export async function createAnalysisReport(analysis, options = {}) {
  const env = options.env || process.env;
  if (!isDatabaseConfigured(env)) return null;

  const fetchImpl = options.fetchImpl || fetch;
  const payload = {
    industry: analysis.industry?.id || "general",
    file_name: options.fileName || null,
    total_conversations: analysis.metrics?.totalConversations || 0,
    high_purchase_intent_count: analysis.metrics?.highPurchaseIntentCount || 0,
    negative_emotion_count: analysis.metrics?.negativeEmotionCount || 0,
    requires_follow_up_count: analysis.metrics?.requiresFollowUpCount || 0,
    analysis_json: analysis,
  };

  const response = await fetchImpl(`${normalizeUrl(env.SUPABASE_URL)}/rest/v1/${REPORTS_TABLE}`, {
    method: "POST",
    headers: buildHeaders(env, { prefer: "return=representation" }),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`資料庫寫入失敗：${await response.text()}`);
  }

  const rows = await response.json();
  return rows[0] || null;
}

export async function getAnalysisReport(id, options = {}) {
  const env = options.env || process.env;
  if (!isDatabaseConfigured(env)) return null;

  const fetchImpl = options.fetchImpl || fetch;
  const encodedId = encodeURIComponent(id);
  const response = await fetchImpl(
    `${normalizeUrl(env.SUPABASE_URL)}/rest/v1/${REPORTS_TABLE}?id=eq.${encodedId}&select=*`,
    {
      method: "GET",
      headers: buildHeaders(env),
    },
  );

  if (!response.ok) {
    throw new Error(`資料庫讀取失敗：${await response.text()}`);
  }

  const rows = await response.json();
  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    createdAt: row.created_at,
    analysis: row.analysis_json,
  };
}

function buildHeaders(env, extra = {}) {
  return {
    apikey: env.SUPABASE_SERVICE_ROLE_KEY,
    authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
    "content-type": "application/json",
    ...extra,
  };
}

function normalizeUrl(url) {
  return url.replace(/\/$/, "");
}
