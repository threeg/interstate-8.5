# Interstate-8 — Interface Contract (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Interface contract — the read/interface surface |
| **Repository location** | `spec/architecture/api-contract.md` |
| **Status** | Binding specification — Milestone 3 signed off (2026-07-07) |

> **Purpose.** Interstate-8 v5 is a **server-rendered Drupal site**, not a custom HTTP API. For slice 1
> the "interface" is therefore the **page routes, URL aliases, and filter query parameters**, plus the
> posture on Drupal's **core JSON:API** (opt-in — kept off). Where code and this contract disagree on these shapes, the
> contract wins. There are **no custom REST/RPC endpoints** in slice 1.

---

## 1. Conventions

Server-rendered HTML over HTTPS. Clean URLs via **Pathauto**, with **Redirect** preserving the v2→v5
path map at migration (link equity). No authentication on the public read surface. No pagination on
the Songs landing (FR-7).

---

## 2. Routes (slice 1)

### 2.1 `GET /songs` — Songs landing  (FR-6–FR-11, FR-8, FR-9)

The full song list (excluding `field_exclude_from_list = true`, FR-6), article-insensitively sorted
(FR-8). Rendered by a View.

**Query parameters**

| Param | Values | Default | Effect |
|-------|--------|---------|--------|
| `type` | a Song type term (All, Modest Mouse, Ugly Casanova, Side projects, Covers) | **Modest Mouse** (FR-9) | Filter by band/group. |
| `alt` | `1` / `0` | `1` (show) | Show or hide alternate-title versions (FR-10). |
| `released` | — | — | **Present but non-functional in slice 1** (FR-11); wired in a later slice. |
| `playedlive` | — | — | **Present but non-functional in slice 1** (FR-11). |

*(Final parameter names are confirmable; they replace v2's `type` / `alttitles` / `released` /
`playedlive`.)*

### 2.2 `GET /songs/<slug>` — Song page  (FR-12–FR-17, FR-20)

A single song. Alias pattern `/songs/[node:title]` (Pathauto). Renders name, quotes, lyrics (or the
alternate-vs-normal side-by-side when the song has a parent, FR-20), notes, and the embedded video
(FR-17). Deferred sections (releases, live, tabs, studio) are omitted (FR-14). Unknown slug → Drupal
404.

---

## 3. JSON:API posture

Drupal ships a **JSON:API** module in core, but it is **not enabled by default** — it is opt-in. Since
`5.0.x-dev` builds no client and headless is explicitly deferred, **JSON:API stays disabled**:
enabling it would only add attack surface and an endpoint to maintain for no consumer. The
"keep entities clean" principle is a **content-modelling** discipline (clean fields, view modes) that
keeps the site headless-*ready* regardless — so if a headless client is ever pursued, enabling
JSON:API is a switch, not a remodel. Until then there is **no programmatic API surface** in v5.

---

## 4. Traceability

| Surface | Implements |
|---------|------------|
| `GET /songs` | FR-6, FR-7, FR-8, FR-9, FR-10, FR-11 |
| `GET /songs/<slug>` | FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-20 |
| URL aliases / redirects | (migration path-map; NFR support) |
