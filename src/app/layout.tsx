import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { SavedJobsProvider } from "@/components/jobs/saved-jobs-provider";
import { SITE_URL } from "@/lib/site";
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
  /* Absolute base for OG images and other metadata URLs. */
  metadataBase: new URL(SITE_URL),
  title: "Chainwork — registry for AI × crypto engineering roles",
  description:
    "Salary-transparent, agent-native job registry. 120+ AI × crypto companies, ingested daily, searchable via MCP and llms.txt.",
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
        <SavedJobsProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </SavedJobsProvider>
        <CommandPalette />
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  );
}
