import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 新闻简报 | CEO Platform",
  description: "每日 AI 新闻简报，由 Claude AI 整理归纳",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className={`${geist.className} min-h-full`}>{children}</body>
    </html>
  );
}
