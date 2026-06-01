# Chainwork

Open-source web3 job board. Connects crypto-native companies with engineers, researchers, and operators across every ecosystem.

Built with Next.js 15, Drizzle ORM, and Neon Postgres. ATS integrations included out of the box.

---

## Features

- Job listings across protocol, smart contracts, ZK cryptography, AI x crypto, infrastructure, and more
- Company profiles with ecosystem tags (EVM, Optimism, Arbitrum, Solana, ...)
- ATS integrations: Ashby, Greenhouse, Lever — auto-imports and syncs listings
- AI-powered candidate-to-job matching via Claude API
- Crypto-native payment support (NowPayments) alongside Stripe
- Featured / sponsored placement system
- Email alerts for saved searches
- Full-text search with ecosystem and role filters
- JSON-LD structured data for job SEO

---

## Tech stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Database | Neon Postgres + Drizzle ORM |
| Auth | better-auth |
| Payments | Stripe + NowPayments |
| AI matching | Anthropic Claude API |
| Styling | Tailwind CSS + shadcn/ui |
| Deploy | Vercel |

---

## Getting started

```bash
pnpm install
cp .env.example .env.local
# Fill in required env vars (see .env.example)
pnpm db:migrate
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database

```bash
pnpm db:migrate      # Run migrations
pnpm db:seed         # Seed sample companies and jobs
pnpm db:studio       # Open Drizzle Studio
```

---

## Schema overview

| Table | Purpose |
|-------|---------|
| `companies` | Company profiles with ecosystem tags and stage |
| `jobs` | Listings with role category, seniority, salary, location mode |
| `applications` | Candidate applications |
| `alerts` | Saved search email alerts |

Role categories: `protocol` · `smart_contracts` · `zk_cryptography` · `ai_x_crypto` · `frontend` · `infra_devops` · `design` · `bd` · `operations`

---

## ATS integrations

Chainwork auto-imports job listings from:
- **Ashby** — `src/lib/ats/ashby.ts`
- **Greenhouse** — `src/lib/ats/greenhouse.ts`
- **Lever** — `src/lib/ats/lever.ts`

Adding a new ATS: implement the mapper interface in `src/lib/ats/mapper.ts`.

---

## Contributing

PRs welcome. Good first areas: new ATS integrations, additional ecosystem tags, improved matching logic.

## License

MIT
