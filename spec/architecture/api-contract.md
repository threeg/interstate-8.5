# Interstate-8 — Interface Contract (v5, `5.0.x-dev` slice 1)

| | |
|---|---|
| **Document** | Interface contract — the read/interface surface |
| **Repository location** | `spec/architecture/api-contract.md` |
| **Status** | Draft for review — Milestone 3 in progress |

> **Purpose.** Interstate-8 v5 is a **server-rendered Drupal site**, not a custom HTTP API. For slice 1
> the "interface" is therefore the **page routes, URL aliases, and filter query parameters**, plus the
> posture on Drupal's default **JSON:API**. Where code and this contract disagree on these shapes, the
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

Drupal core **JSON:API** is on by default at `/jsonapi`. The project keeps entities clean so this
surface stays coherent, but it is **not a contractual client surface in `5.0.x-dev`** and no client is
built against it in slice 1. If/when a headless client is ever pursued (explicitly deferred), this
document gains the entity resource shapes.

---

## 4. Traceability

| Surface | Implements |
|---------|------------|
| `GET /songs` | FR-6, FR-7, FR-8, FR-9, FR-10, FR-11 |
| `GET /songs/<slug>` | FR-12, FR-13, FR-14, FR-15, FR-16, FR-17, FR-20 |
| URL aliases / redirects | (migration path-map; NFR support) |
