import test from "node:test";
import assert from "node:assert/strict";

import { GET } from "../src/app/api/reports/[id]/route.js";

test("reports API returns a helpful error when database is not configured", async () => {
  const response = await GET(new Request("http://localhost/api/reports/report-1"), {
    params: Promise.resolve({ id: "report-1" }),
  });
  const payload = await response.json();

  assert.equal(response.status, 503);
  assert.match(payload.error, /尚未設定資料庫/);
});
