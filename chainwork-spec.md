## 3. 데이터 스키마 (Drizzle / Neon)

### Tables

companies {
  id              uuid pk
  slug            text unique not null   // "helix-labs"
  name            text not null
  logo_url        text
  verified        boolean default false
  size            text                   // "1-10", "10-50", "50-120", "120+"
  stage           text                   // "Pre-seed", "Seed", "Series A", "Series B+", "Public"
  hq_location     text                   // "Remote", "San Francisco", "Singapore"
  one_liner       text                   // 60자 이하
  description     text                   // markdown
  website         text
  twitter         text
  github          text
  ecosystems      text[]                 // ["evm", "op", "arbitrum"]
  created_at      timestamptz default now()
  updated_at      timestamptz default now()
}

jobs {
  id              uuid pk
  slug            text unique not null   // "cw-eng-104"
  company_id      uuid fk companies.id
  title           text not null
  role_category   text not null          // "protocol", "smart_contracts", "zk_cryptography", "ai_x_crypto", "frontend", "infra_devops", "design", "bd", "operations"
  seniority       text                   // "junior", "mid", "senior", "staff", "principal", "lead", "founding"
  employment_type text                   // "full_time", "part_time", "contract", "internship"

  description_md  text not null          // markdown
  responsibilities text[]                // 3-6개
  requirements    text[]
  nice_to_have    text[]

  salary_min      integer                // USD annual
  salary_max      integer
  salary_currency text default 'USD'
  token_comp      boolean default false
  equity          boolean default false

  location_mode   text not null          // "remote", "hybrid", "onsite"
  location_regions text[]                // ["worldwide"] | ["americas", "eu"]
  location_cities text[]

  ecosystems      text[]                 // ["evm", "op", "arb"]
  skills          text[]                 // ["rust", "solidity", "consensus"]

  apply_url       text                   // external
  apply_email     text                   // optional fallback
  referral_url    text                   // "apply with referral"

  is_featured     boolean default false
  featured_until  timestamptz
  is_sponsored    boolean default false  // 더 강한 placement (배너형)

  posted_at       timestamptz default now()
  expires_at      timestamptz            // posted_at + 30d default
  verified        boolean default false  // 큐레이션 마크
  status          text default 'active'  // "active", "expired", "filled", "draft"

  view_count      integer default 0
  apply_count     integer default 0

  // SEO/agent
  json_ld         jsonb                  // pre-computed JobPosting schema.org

  created_at      timestamptz default now()
  updated_at      timestamptz default now()
}

job_alerts {
  id              uuid pk
  email           text not null
  filters         jsonb not null         // { ecosystems: [...], roles: [...], min_salary: ..., remote_only: true }
  frequency       text default 'realtime' // "realtime" | "daily" | "weekly"
  channel         text default 'email'    // "email" | "telegram" | "webhook"
  webhook_url     text
  verified        boolean default false
  active          boolean default true
  last_sent_at    timestamptz
  created_at      timestamptz default now()
}

saved_jobs {
  user_id         uuid fk users.id
  job_id          uuid fk jobs.id
  saved_at        timestamptz default now()
  primary key (user_id, job_id)
}

candidate_profiles {
  id              uuid pk
  user_id         uuid fk users.id unique
  github_username text
  cv_url          text                   // uploaded resume in Vercel Blob
  extracted_skills text[]                // ["rust", "halo2", "solidity"]
  preferred_roles text[]
  preferred_ecosystems text[]
  min_salary      integer
  open_to_relocate boolean
  last_indexed_at timestamptz
}

// === Better-Auth tables (P8 자동 생성) ===
users / sessions / accounts / verifications

<!-- AUTO-GENERATED:START -->
## 3b. As-built schema (P10 기준)

> `src/db/schema.ts` + `drizzle/0000`~`0005`에서 정리. **이 섹션이 현재 진실** — §3는 원래 설계 의도, 3b는 실제 마이그레이션된 DB. 충돌 시 3b 우선.
>
> 생성 시점: P10 (`eb44dcf`). 마이그레이션 6개 (0000~0005) Neon 적용 완료.
> 모든 `timestamptz` = `timestamp with time zone`. `jsonb[]` = `jsonb`(`$type<string[]>`).

### companies

| column | type | null | default | key / FK |
|---|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` | **PK** |
| slug | text | no | — | **unique** |
| name | text | no | — | |
| logo_text | text | no | — | 모노그램 글자 |
| logo_bg | text | no | — | 모노그램 배경색 |
| logo_fg | text | no | — | 모노그램 글자색 |
| stage | text | yes | — | |
| size | text | yes | — | |
| focus | text | yes | — | 한 줄 소개 |
| hq | text | yes | — | (P7 / 0002) |
| ecosystems | jsonb `string[]` | no | `'[]'` | (P7 / 0002) |
| website | text | yes | — | |
| verified | boolean | no | `false` | |
| created_at | timestamptz | no | `now()` | |

### jobs

| column | type | null | default | key / FK |
|---|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` | **PK** |
| slug | text | no | — | **unique** |
| company_id | uuid | no | — | **FK** → companies.id `cascade` |
| title | text | no | — | |
| description_md | text | no | — | |
| responsibilities | jsonb `string[]` | no | `'[]'` | |
| requirements | jsonb `string[]` | no | `'[]'` | |
| nice_to_have | jsonb `string[]` | no | `'[]'` | (P? / 0001) |
| one_liner | text | yes | — | (0001) |
| role_category | text | no | — | 9종 (아래 Δ 참고) |
| seniority | text | no | — | Junior · Mid · Senior · Staff · Principal |
| employment_type | text | no | — | Full-time · Contract |
| location | text | no | — | 예: "Remote — Worldwide" |
| remote_scope | text | yes | — | Worldwide · Americas · Europe · APAC · EMEA |
| salary_min | integer | no | — | USD annual |
| salary_max | integer | no | — | |
| salary_currency | text | no | `'USD'` | |
| has_token_equity | boolean | no | `false` | token·equity 병합 |
| ecosystems | jsonb `string[]` | no | `'[]'` | |
| skills | jsonb `string[]` | no | `'[]'` | |
| is_featured | boolean | no | `false` | |
| featured_until | timestamptz | yes | — | 유료 슬롯 만료 (P9 / 0004) |
| is_sponsored | boolean | no | `false` | |
| is_verified | boolean | no | `false` | |
| apply_url | text | yes | — | |
| apply_email | text | yes | — | (0001) |
| apply_count | integer | no | `0` | (0001) |
| posted_by | text | yes | — | **FK** → users.id `set null` (P8 / 0003) |
| json_ld | jsonb | no | — | schema.org JobPosting |
| posted_at | timestamptz | no | — | |
| indexed_at | timestamptz | no | `now()` | |
| created_at | timestamptz | no | `now()` | |

### job_alerts

| column | type | null | default | key / FK |
|---|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` | **PK** |
| email | text | no | — | |
| user_id | text | yes | — | **FK** → users.id `cascade` (P9 / 0004) |
| query | text | yes | — | |
| filters | jsonb | no | `'{}'` | JobFilters 직렬화 |
| frequency | text | no | `'daily'` | realtime · daily · weekly (0004에서 default 변경) |
| channels | jsonb `string[]` | no | `'["email"]'` | |
| verified | boolean | no | `false` | double opt-in (0004) |
| token | text | no | — | **unique** — confirm·unsubscribe (0004) |
| last_sent_at | timestamptz | yes | — | (0004) |
| active | boolean | no | `true` | |
| created_at | timestamptz | no | `now()` | |

### saved_jobs

| column | type | null | default | key / FK |
|---|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` | **PK** |
| job_id | uuid | no | — | **FK** → jobs.id `cascade` |
| user_id | text | no | — | **FK** → users.id `cascade` (P9 / 0004) |
| created_at | timestamptz | no | `now()` | |

### candidate_profiles

| column | type | null | default | key / FK |
|---|---|---|---|---|
| id | uuid | no | `gen_random_uuid()` | **PK** |
| email | text | no | — | **unique** |
| user_id | text | yes | — | **FK** → users.id `cascade` (P10 / 0005) |
| display_name | text | yes | — | |
| github_username | text | yes | — | |
| headline | text | yes | — | |
| skills | jsonb `string[]` | no | `'[]'` | 후보 입력 skill |
| extracted_skills | jsonb `string[]` | no | `'[]'` | AI 추출 (P10 / 0005) |
| preferred_ecosystems | jsonb `string[]` | no | `'[]'` | AI 추출 (P10 / 0005) |
| index_source | text | yes | — | "github" · "cv" (0005) |
| last_indexed_at | timestamptz | yes | — | (0005) |
| resume_url | text | yes | — | Vercel Blob CV URL |
| created_at | timestamptz | no | `now()` | |
| updated_at | timestamptz | no | `now()` | |

### users / sessions / accounts / verifications (Better-Auth, P8 / 0003)

Better-Auth 1.6 표준 스키마. drizzle adapter `usePlural` → 복수형 테이블명. `id`는 Better-Auth가 생성하는 **text** PK.

**users** — id `text PK` · name `text` · email `text unique` · email_verified `boolean=false` · image `text?` · created_at · updated_at

**sessions** — id `text PK` · expires_at `timestamptz` · token `text unique` · created_at · updated_at · ip_address `text?` · user_agent `text?` · user_id `text` **FK**→users.id `cascade`

**accounts** — id `text PK` · account_id `text` · provider_id `text` · user_id `text` **FK**→users.id `cascade` · access_token `text?` · refresh_token `text?` · id_token `text?` · access_token_expires_at `timestamptz?` · refresh_token_expires_at `timestamptz?` · scope `text?` · password `text?` · created_at · updated_at

**verifications** — id `text PK` · identifier `text` · value `text` · expires_at `timestamptz` · created_at · updated_at

### Indexes & constraints (drizzle 0000~0005)

| table | primary key | unique | indexes | foreign keys |
|---|---|---|---|---|
| companies | id | `companies_slug_unique` (slug) | — | — |
| jobs | id | `jobs_slug_unique` (slug) | `jobs_posted_at_idx` (posted_at DESC), `jobs_company_id_idx`, `jobs_is_featured_idx`, `jobs_role_category_idx`, `jobs_seniority_idx` | company_id→companies.id `cascade`, posted_by→users.id `set null` |
| job_alerts | id | `job_alerts_token_unique` (token) | `job_alerts_email_idx` (email) | user_id→users.id `cascade` |
| saved_jobs | id | `saved_jobs_job_user_idx` (job_id, user_id) — UNIQUE index | `saved_jobs_user_id_idx` (user_id) | job_id→jobs.id `cascade`, user_id→users.id `cascade` |
| candidate_profiles | id | `candidate_profiles_email_unique` (email) | — | user_id→users.id `cascade` |
| users | id | `users_email_unique` (email) | — | — |
| sessions | id | `sessions_token_unique` (token) | `sessions_user_id_idx` (user_id) | user_id→users.id `cascade` |
| accounts | id | — | `accounts_user_id_idx` (user_id) | user_id→users.id `cascade` |
| verifications | id | — | `verifications_identifier_idx` (identifier) | — |

> 참고: `candidate_profiles.user_id`는 FK이나 인덱스가 없음 (lookup은 그 FK 컬럼으로 발생) — 트래픽 늘면 인덱스 추가 권장.

### Δ from §3 — 원래 설계 vs 실제 빌드

| 테이블 | §3 (설계) | as-built (실제) | 사유 |
|---|---|---|---|
| companies | `logo_url` | `logo_text` + `logo_bg` + `logo_fg` | 모노그램 로고 (P7, 승인) |
| companies | `one_liner`, `description` | `focus` only | description 미구현 |
| companies | `hq_location` | `hq` | 이름만 |
| companies | `twitter`, `github`, `updated_at` | — | 미구현 |
| jobs · role_category | design / bd / operations 포함 | Protocol · Smart Contracts · ZK / Cryptography · AI x Crypto · Frontend · Infra / DevOps · Security & Audit · DevRel · Research | 9종, 값 다름 |
| jobs · location | `location_mode` + `location_regions` + `location_cities` | `location` (text) + `remote_scope` | 단일 scope |
| jobs · comp | `token_comp` + `equity` (2) | `has_token_equity` (1) | 병합 |
| jobs | `referral_url`, `expires_at`, `status`, `view_count` | — | 미구현 |
| jobs | — | `posted_by`, `one_liner`, `indexed_at`, `is_verified` | as-built 추가 |
| job_alerts | `channel` (단수), `webhook_url` | `channels` (배열) | webhook_url 미구현 |
| job_alerts | — | `token`, `user_id`, `query`, `last_sent_at` | as-built 추가 |
| saved_jobs | composite PK `(user_id, job_id)` | `id` PK + UNIQUE `(job_id, user_id)` | |
| candidate_profiles | `cv_url` | `resume_url` | 이름만 |
| candidate_profiles | `preferred_roles`, `min_salary`, `open_to_relocate` | — | 미구현 |
| candidate_profiles | — | `email` (unique), `skills`, `headline`, `display_name`, `index_source` | as-built 추가 |
| users/sessions/accounts/verifications | (P8 자동) | `id` = text PK (Better-Auth 생성), `usePlural` | 표준 BA 스키마 |
<!-- AUTO-GENERATED:END -->

## 3c. P11–P14 변경사항

> §3b는 P10 스냅샷. 그 이후 마이그레이션과 코드 변경 요약. **여전히 §3b가 schema 진실의 기본**이며, 이 섹션은 그 위의 delta.

### Migrations after 0005

| # | 이름 | 영향 |
|---|---|---|
| 0006 | `ats_viral` (P11) | `jobs`에 `source` text not null default `'manual'`, `external_id` text, `view_count` integer not null default 0 추가. ATS 인입(Greenhouse/Lever/Ashby) dedup + viral 메트릭. `jobs_view_count_idx` 인덱스 추가. |

### Role category 확장 (P12c.2)

`jobs.role_category` 가능한 값 = `Protocol` · `Smart Contracts` · `ZK / Cryptography` · `AI x Crypto` · `Frontend` · **`Backend`** · `Infra / DevOps` · `Security & Audit` · `DevRel` · `Research` (10종).

`Backend`는 P12c.2 추가된 generic engineering catch-all. `Protocol`은 `/.*/`에서 명시적 patterns(`consensus|p2p|node|chain|validator|staking|cross-chain|core (developer|engineer)|<ecosystem>×engineer`)로 좁혀짐. 매치 안 되는 engineering 잡은 `Backend`로 fallback.

### ATS 인입 필터 (P12c)

`isNonEngineeringRole(title, department)` blacklist — Sales / Marketing / Design / PM / Finance / HR / Legal / Office / Ops / Customer Success 패턴 매치 시 `mapGreenhouseJob` / `mapLeverJob` / `mapAshbyJob`이 `null` 반환 → ingest skip. `audit` 키워드는 명시적 제외 ("Smart Contract Auditor" 보호).

기존 DB rows는 P12d cleanup endpoint (`/api/cron/cleanup-non-engineering`, `CRON_SECRET` gated, 매일 06:30 UTC + dashboard "Run now")로 정리.

### MCP server (P12)

- Endpoint: `/api/mcp/[transport]/route.ts` (Streamable HTTP via `mcp-handler`).
- 외부 URL: `<SITE_URL>/api/mcp/mcp`.
- Tools: `search_jobs`(필터·페이지네이션, max 20/call), `get_job`(slug).
- Discovery page `/mcp` + `/llms.txt`에 MCP 섹션 노출.
- 두 tool 모두 기존 `searchJobs` / `getJobBySlug` queries 재사용 — 필터 shape 동일.

### Buyer-facing 페이지 (P13)

- `/about` — wedge narrative + 운영자(AEO SaaS) story.
- `/pricing` — Free ATS / `$99` Standard / `$299` Featured 3-tier. 결제는 NowPayments (BTC/ETH/USDC/...).
- `/for-companies` — recruiter value prop + 6-card differentiation + ATS self-serve CTA.
- Glass nav에 `Hire` 추가, sitemap에 5 페이지(`/about`, `/pricing`, `/for-companies`, `/mcp`, `/pulse`) 추가.
- P13b: homepage hero / layout meta / OG image / llms.txt summary 모두 "The registry for AI × crypto engineering roles" 카피로 정렬.
- P13c: `src/components/layout/site-footer.tsx` 사이트와이드 footer (4 columns: Product · For Companies · For Agents · About), root layout에 마운트.

### NowPayments 결제 (P14)

- `src/lib/nowpayments.ts` — hosted invoice + HMAC-SHA512 IPN 검증 (canonical sorted-JSON).
- `/api/payments/nowpayments-webhook` — IPN handler. `payment_status === finished | confirmed` 일 때 `jobs.is_featured = true`, `featured_until = now + 14d`.
- `src/app/post/actions.ts` — `createFeaturedCheckout` 우선순위: **NowPayments > Stripe > dev-grant**. `paymentEnabled = nowpaymentsEnabled || stripeEnabled`.
- Order ID 인코딩: `featured:<jobId>` (확장 가능: `standard:<jobId>` for paid Standard posts in P15).
- 필요한 env: `NOWPAYMENTS_API_KEY`, `NOWPAYMENTS_IPN_SECRET`. Stripe는 fallback으로 유지 (둘 다 disabled면 직접 grant — dev fallback 그대로).
