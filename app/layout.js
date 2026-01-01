export const metadata = {
  title: 'MBTI API 中介層',
  description: 'Chrome 擴展 MBTI Lens 的 AI 分析 API 中介',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
