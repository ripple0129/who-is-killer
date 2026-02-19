import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Who Is Killer",
  description: "AI 推理對決遊戲",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen bg-[#0f0f0f] text-[#e5e5e5] antialiased">
        {children}
      </body>
    </html>
  );
}
