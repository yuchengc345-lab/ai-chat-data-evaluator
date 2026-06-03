import { getAnalysisReport, isDatabaseConfigured } from "../../../../lib/database.js";

export async function GET(_request, context) {
  try {
    if (!isDatabaseConfigured()) {
      return json({ error: "尚未設定資料庫環境變數。" }, 503);
    }

    const params = await context.params;
    const report = await getAnalysisReport(params.id);

    if (!report) {
      return json({ error: "找不到這份分析報告。" }, 404);
    }

    return json(report, 200);
  } catch (error) {
    return json({ error: error.message || "讀取報告失敗。" }, 500);
  }
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
    },
  });
}
