import Link from "next/link";
import "./globals.css";

export const metadata = {
  title: "AI 聊天數據評估系統",
  description: "上傳聊天紀錄，自動分析需求、意圖、情緒與跟進機會。",
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-line bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-semibold text-ink">
                AI 聊天數據評估系統
              </Link>
              <nav className="flex items-center gap-2 text-sm">
                <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-mist" href="/">
                  上傳
                </Link>
                <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-mist" href="/dashboard">
                  Dashboard
                </Link>
                <Link className="rounded-md px-3 py-2 text-slate-700 hover:bg-mist" href="/report">
                  報告
                </Link>
              </nav>
            </div>
          </header>
          <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
