import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Providers } from "@/components/providers";
import { routing, type Locale } from "@/i18n/routing";

// 生成静态参数，预渲染所有语言版本
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// 内联脚本：在 HTML 解析时立即应用主题，避免闪烁
const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('novel-agent-theme');
    if (stored) {
      var parsed = JSON.parse(stored);
      var theme = parsed.state && parsed.state.theme;
      if (theme && ['cyberpunk', 'ink'].includes(theme)) {
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

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // 验证语言有效性
  if (!routing.locales.includes(locale as Locale)) {
    notFound();
  }

  // 启用静态渲染
  setRequestLocale(locale);

  // 获取翻译消息
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      data-theme="ink"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
