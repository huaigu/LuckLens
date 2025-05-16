import { Metadata } from "next";
import App from "@/components/pages/app";
import { APP_URL } from "@/lib/constants";

// 原应用的框架

// CyberLuck抽签组件的框架
const cyberLuckFrame = {
  version: "next",
  imageUrl: `${APP_URL}/images/share.jpg`,
  button: {
    title: "Draw",
    action: {
      type: "launch_frame",
      name: "Crypto Fortune",
      url: `${APP_URL}`,
      splashImageUrl: `${APP_URL}/images/share.jpg`,
      splashBackgroundColor: "#181c24",
    },
  },
};

export async function generateMetadata(): Promise<Metadata> {

  return {
    metadataBase: new URL(APP_URL),
    title: "Crypto Fortune",
    openGraph: {
      title: "Crypto Fortune",
      description: "draw today's trading fortune and get your own cyber proverb",
      images: [`${APP_URL}/images/share.jpg`], // 用数组包裹
    },
    other: {
      "fc:frame": JSON.stringify(cyberLuckFrame),
    },
  };
}

export default function Home() {
  return <App />;
}
