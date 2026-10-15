import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "デュエプレ戦績管理 | DUEL LOG",
  description: "デュエプレの対戦記録を管理するアプリです。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
