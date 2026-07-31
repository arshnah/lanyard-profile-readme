import type { Metadata } from "next";
import "./globals.css";
import { CSideScript } from "@c-side/next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Head from "next/head";

// grain spine rule: every arshnah surface pairs Space Grotesk (display) with
// JetBrains Mono (the machine voice) - see project-notes/grain.md
const spaceGrotesk = Space_Grotesk({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

const jetbrainsMono = JetBrains_Mono({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
});

export const metadata: Metadata = {
  title: "Lanyard for GitHub Profile",
  description: "Display your Discord Presence anywhere, using Lanyard",
  openGraph: {
    title: "Lanyard for GitHub Profile",
    description: "Display your Discord Presence anywhere, using Lanyard",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <Head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <CSideScript />
      </Head>
      <body
        className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
