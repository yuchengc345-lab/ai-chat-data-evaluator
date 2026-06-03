import { analyzeRows, parseCsv } from "../../../lib/analysis.js";
import { createAnalysisReport } from "../../../lib/database.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const csv = typeof body.csv === "string" ? body.csv : "";

    if (!csv.trim()) {
      return json({ error: "請上傳 CSV 內容。" }, 400);
    }

    const rows = parseCsv(csv);
    const analysis = analyzeRows(rows, { industry: body.industry });
    const report = await createAnalysisReport(analysis, { fileName: body.fileName });
    return json({ ...analysis, reportId: report?.id || null }, 200);
  } catch (error) {
    return json({ error: error.message || "分析失敗，請確認 CSV 格式。" }, 400);
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
