import type { Metadata } from "next";
import Link from "next/link";
import { GlassNav } from "@/components/layout/glass-nav";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

const MCP_URL = `${SITE_URL}/api/mcp/mcp`;

export const metadata: Metadata = {
  title: "ChainWork MCP server · search crypto jobs from your AI agent",
  description:
    "Connect Claude Desktop, Cursor, Windsurf, or any MCP client to ChainWork's job database. Two tools: search_jobs, get_job. Streamable HTTP transport, no auth required.",
  alternates: { canonical: `${SITE_URL}/mcp` },
};

const claudeDesktopConfig = JSON.stringify(
  {
    mcpServers: {
      chainwork: {
        command: "npx",
        args: ["-y", "mcp-remote", MCP_URL],
      },
    },
  },
  null,
  2,
);

const streamableHttpConfig = JSON.stringify(
  {
    mcpServers: {
      chainwork: {
        url: MCP_URL,
      },
    },
  },
  null,
  2,
);

export default function McpPage() {
  return (
    <div className="min-h-dvh">
      <GlassNav />
      <main className="relative">
        <div className="cw-ambient" style={{ opacity: 0.5 }} />
        <div className="relative mx-auto max-w-[680px] px-5 pb-24 pt-6 md:pt-10">
          <header className="mb-8">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-accent-blue">
              Model Context Protocol
            </span>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.025em] text-text-primary md:text-[32px]">
              ChainWork MCP server
            </h1>
            <p className="mt-1.5 text-[14px] text-text-secondary">
              Point your AI agent at our job database. Search 120+ crypto, web3,
              and AI x crypto companies directly from Claude Desktop, Cursor,
              Windsurf, or any MCP-compatible client.
            </p>
          </header>

          <section className="mb-10">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Endpoint
            </h2>
            <div className="rounded-lg border border-border-subtle bg-surface-elevated px-4 py-3 font-mono text-[13px] text-text-primary">
              {MCP_URL}
            </div>
            <p className="mt-2 text-[13px] text-text-secondary">
              Streamable HTTP transport. No authentication. Rate-limited
              alongside the JSON API.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Tools
            </h2>
            <ul className="space-y-3">
              <li className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
                <div className="flex items-baseline gap-2">
                  <code className="font-mono text-[13px] font-semibold text-accent-blue">
                    search_jobs
                  </code>
                  <span className="text-[12px] text-text-tertiary">
                    filterable, paginated
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-text-secondary">
                  Search by free text, ecosystem (evm, sol, btc, zk…), role
                  category, seniority, location, and minimum salary. Returns up
                  to 20 jobs per call with apply URLs.
                </p>
              </li>
              <li className="rounded-lg border border-border-subtle bg-surface-elevated p-4">
                <div className="flex items-baseline gap-2">
                  <code className="font-mono text-[13px] font-semibold text-accent-blue">
                    get_job
                  </code>
                  <span className="text-[12px] text-text-tertiary">
                    by slug
                  </span>
                </div>
                <p className="mt-1.5 text-[13px] text-text-secondary">
                  Full description, responsibilities, requirements, and apply
                  URL for a single role.
                </p>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Claude Desktop / stdio clients
            </h2>
            <p className="mb-3 text-[13px] text-text-secondary">
              Add to{" "}
              <code className="font-mono text-[12px] text-text-primary">
                claude_desktop_config.json
              </code>{" "}
              (uses{" "}
              <code className="font-mono text-[12px] text-text-primary">
                mcp-remote
              </code>{" "}
              to bridge stdio ↔ HTTP):
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-elevated p-4 font-mono text-[12px] leading-relaxed text-text-primary">
              {claudeDesktopConfig}
            </pre>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Cursor / Streamable HTTP clients
            </h2>
            <p className="mb-3 text-[13px] text-text-secondary">
              Clients with native Streamable HTTP support can connect directly:
            </p>
            <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-surface-elevated p-4 font-mono text-[12px] leading-relaxed text-text-primary">
              {streamableHttpConfig}
            </pre>
          </section>

          <section className="mb-10">
            <h2 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.08em] text-text-tertiary">
              Also useful
            </h2>
            <ul className="space-y-2 text-[13px] text-text-secondary">
              <li>
                <Link
                  href="/llms.txt"
                  className="text-accent-blue hover:underline"
                >
                  /llms.txt
                </Link>
                {" — "}plain-text index of every live role, agent-readable.
              </li>
              <li>
                <Link
                  href="/api/jobs"
                  className="text-accent-blue hover:underline"
                >
                  /api/jobs
                </Link>
                {" — "}REST JSON feed, CORS-open, schema.org JobPosting on every
                row.
              </li>
              <li>
                <Link
                  href="/pulse"
                  className="text-accent-blue hover:underline"
                >
                  /pulse
                </Link>
                {" — "}live hiring trends across the database.
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
