import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
});

const siteUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Brandora House Studio | Premium Shoes",
    template: "%s | Brandora House Studio",
  },
  description:
    "Brandora House Studio — premium footwear from Campus, Nike, Aqualite and Action Shoes. Discover, style, inspire.",
  openGraph: {
    title: "Brandora House Studio",
    description:
      "Premium footwear from Campus, Nike, Aqualite and Action Shoes. Discover, style, inspire.",
    siteName: "Brandora House Studio",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brandora House Studio",
    description:
      "Premium footwear from Campus, Nike, Aqualite and Action Shoes. Discover, style, inspire.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Brandora House Studio",
  },
};

export const viewport: Viewport = {
  // Required for env(safe-area-inset-*) to resolve to anything other than 0px on
  // notched/Dynamic-Island iPhones — without this, fixed/sticky elements near the
  // screen edges (toasts, the home-indicator area) ignore the safe area entirely.
  viewportFit: "cover",
  themeColor: "#f7f3ec",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-cream text-brand-ink">{children}</body>
    </html>
  );
}
