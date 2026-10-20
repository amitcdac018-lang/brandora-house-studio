import type { Metadata } from "next";
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
