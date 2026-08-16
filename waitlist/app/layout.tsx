import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const beVietnam = Be_Vietnam_Pro({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-be-vietnam",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OjaPaddi — Get Early Access",
  description:
    "OjaPaddi is the simple app for Nigerian market sellers — track stock, record sales, share on WhatsApp. Free forever. Join the early-access list.",
  openGraph: {
    title: "OjaPaddi — Your Market Friend",
    description:
      "The simple app for Nigerian market sellers — stock, sales and WhatsApp sharing. Get early access.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${beVietnam.variable}`}>
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
