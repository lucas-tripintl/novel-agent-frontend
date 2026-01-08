import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Astra Codex - 创作星图",
  description: "从爆款中学习，在创作中积累，设定即灵感",
};

// 根布局只导入全局样式，实际的 HTML 结构在 [locale]/layout.tsx 中
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
