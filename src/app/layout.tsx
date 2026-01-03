import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Astra Codex - 创作星图",
  description: "从爆款中学习，在创作中积累，设定即灵感",
};

// 内联脚本：在 HTML 解析时立即应用主题，避免闪烁
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('novel-agent-theme');
    if (stored) {
      var parsed = JSON.parse(stored);
      var theme = parsed.state && parsed.state.theme;
      if (theme && ['cyberpunk', 'ink', 'bamboo'].includes(theme)) {
        document.documentElement.setAttribute('data-theme', theme);
        if (theme === 'cyberpunk') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="ink" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
