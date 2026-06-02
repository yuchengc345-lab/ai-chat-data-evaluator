import { readFile } from "node:fs/promises";
import path from "node:path";

export async function GET() {
  const samplePath = path.join(process.cwd(), "data", "sample-chat.csv");
  const csv = await readFile(samplePath, "utf8");

  return new Response(csv, {
    status: 200,
    headers: {
      "content-type": "text/csv; charset=utf-8",
    },
  });
}
