import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { FrameProvider } from "@/components/farcaster-provider";
import { APP_URL } from "@/lib/constants";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: "Crypto Fortune",
  description: "抽取今日交易运势，获取专属赛博箴言",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FrameProvider>{children}</FrameProvider>
      </body>
    </html>
  );
}
