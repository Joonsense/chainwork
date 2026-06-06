import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "sonner";
import { CommandPalette } from "@/components/command-palette";
import { SiteFooter } from "@/components/layout/site-footer";
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
  title: {
    default: "Chainwork, registry for AI × crypto engineering roles",
    template: "%s · Chainwork",
  },
  description:
    "Salary-transparent, agent-native job registry. AI × crypto engineering roles ingested daily from real ATS feeds, searchable via MCP and llms.txt.",
  applicationName: "Chainwork",
  keywords: [
    "crypto jobs",
    "web3 jobs",
    "AI crypto engineering",
    "blockchain engineer jobs",
    "smart contract jobs",
    "zero-knowledge jobs",
    "Solana jobs",
    "Ethereum jobs",
    "remote crypto jobs",
    "MCP job search",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Chainwork",
    url: SITE_URL,
    title: "Chainwork, registry for AI × crypto engineering roles",
    description:
      "Salary-transparent, agent-native job registry. AI × crypto engineering roles ingested daily, searchable via MCP and llms.txt.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chainwork, registry for AI × crypto engineering roles",
    description:
      "Salary-transparent, agent-native job registry. AI × crypto engineering roles, searchable via MCP and llms.txt.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  verification: { yandex: "e5e1320ce94d4d98" },
};

/* Mobile browser chrome tint — matches the dark base. */
export const viewport: Viewport = {
  themeColor: "#08080b",
};

/**
 * Site-level structured data — Organization + WebSite. Strengthens the
 * entity signal for Google's knowledge graph and for GEO/AEO engines that
 * resolve "who publishes this" before citing a page.
 */
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Chainwork",
      url: SITE_URL,
      description:
        "The registry for AI × crypto engineering roles, salary-transparent, agent-native, indexed daily.",
      logo: `${SITE_URL}/opengraph-image`,
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      name: "Chainwork",
      url: SITE_URL,
      publisher: { "@id": `${SITE_URL}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  /* Public GA4 measurement id; inlined at build time. Scripts render only when set. */
  const gaId = process.env.NEXT_PUBLIC_GA_ID;

  return (
    /* dark-only: the `dark` class is forced, there is no theme toggle. */
    <html lang="en" className={`dark ${inter.variable} ${jetBrainsMono.variable}`}>
      <body className="bg-base text-text-primary font-sans antialiased">
        {/* Google Analytics 4 (gtag.js), id from NEXT_PUBLIC_GA_ID; omitted if unset */}
        {gaId ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaId}');
              `}
            </Script>
          </>
        ) : null}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
        />
        <SavedJobsProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </SavedJobsProvider>
        <SiteFooter />
        <CommandPalette />
        <Toaster theme="dark" position="top-center" richColors />
        <Analytics />
      </body>
    </html>
  );
}
