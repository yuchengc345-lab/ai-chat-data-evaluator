import test from "node:test";
import assert from "node:assert/strict";

import { POST } from "../src/app/api/analyze/route.js";
import { GET as getSampleCsv } from "../src/app/api/sample/route.js";

test("POST analyzes uploaded CSV text", async () => {
  const request = new Request("http://localhost/api/analyze", {
    method: "POST",
    body: JSON.stringify({
      industry: "ecommerce",
      csv: `user_id,message,sender,created_at
u1,請問價格和付款方式,user,2026-05-01T10:00:00Z`,
    }),
  });

  const response = await POST(request);
  const payload = await response.json();

  assert.equal(response.status, 200);
  assert.equal(payload.industry.id, "ecommerce");
  assert.equal(payload.conversations.length, 1);
  assert.equal(payload.metrics.totalConversations, 1);
});

test("GET returns bundled sample CSV", async () => {
  const response = await getSampleCsv();
  const csv = await response.text();

  assert.equal(response.status, 200);
  assert.match(csv, /user_id,message,sender,created_at/);
  assert.match(csv, /buyer_001/);
});
