import type { Metadata } from "next";
import { Space_Grotesk, Space_Mono } from "next/font/google";
import "./globals.css";

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
  display: "swap",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spacemono",
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
    <html lang="en" className={`${grotesk.variable} ${spaceMono.variable}`}>
      <body className="font-display antialiased">{children}</body>
    </html>
  );
}
