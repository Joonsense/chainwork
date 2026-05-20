import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import "./globals.css";

/* UI typeface — exposed as the --font-sans CSS variable. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

/* Mono typeface — exposed as the --font-mono CSS variable. */
const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Chainwork",
  description: "Web3 jobs, structured for humans and agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* dark-only: the `dark` class is forced, there is no theme toggle. */
    <html lang="en" className={`dark ${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-base text-text-primary font-sans antialiased">
        <NuqsAdapter>{children}</NuqsAdapter>
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
