import Link from "next/link";

export function EmptyState() {
  return (
    <section className="border border-dashed border-line bg-white p-8 text-center">
      <h1 className="text-2xl font-semibold text-ink">尚未有分析結果</h1>
      <p className="mt-3 text-sm text-slate-600">
        先上傳一份 CSV 聊天紀錄，系統會產生 dashboard 與商業報告。
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white hover:bg-teal/90"
      >
        前往上傳
      </Link>
    </section>
  );
}
