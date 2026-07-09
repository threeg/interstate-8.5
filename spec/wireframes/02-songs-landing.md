# Wireframe 02 — Songs landing (Songlist)

| | |
|---|---|
| **Screen** | Songs landing |
| **Route** | `/songs` (query params `type`, `alt`; `released` / `playedlive` present but disabled) |
| **Implements** | FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-16, FR-18, FR-19 |

> The complete body of work on one page: every song (except `field_exclude_from_list`, FR-6) as a text
> link, article-insensitively sorted (FR-8), no pagination (FR-7).
>
> **This lists the components and their behaviour — not a layout.** Arrangement (filters as a top bar,
> a sidebar, inline, or faceted; the list in one or several columns) is **Claude Design's to improve
> upon**; it should better v2, not copy it.

---

## Components

| Component | Behaviour | Implements |
|-----------|-----------|-----------|
| **Heading** | "Songs" / "Songlist". | — |
| **Type filter** | *All* + each Song type; **defaults to Modest Mouse**. Selecting one narrows the list. Labelled, keyboard-operable. | FR-9, NFR-1 |
| **Alternate-titles filter** | **Show** (default) lists alternates, marked; **Hide** shows only canonical songs. | FR-10 |
| **Released / Played-live filters** | Present but **disabled** in slice 1 (depend on deferred data); should read as "coming soon", not broken. | FR-11 |
| **Song list** | Every eligible song as a **text link** to its song page; the **complete** set on one page, no pagination; alternates carry a marker (e.g. `*` / a tag — Design's call). | FR-6, FR-7, FR-8, FR-16 |
| **Empty state** | When a filter combination matches nothing, an explicit "no songs match" message with a reset — never a blank area. | FR-19 |

## States

- **Populated** — the full list under the current filters.
- **Empty / no-results (FR-19)** — the empty-state component above.
- **Loading** — server-rendered; a filter change reloads the page. Keep transitions unobtrusive.
- **Error** — the site's standard error page.

## Navigation

- A song link → its **Song page** (`03-song-page.md`, FR-16).
- Changing **Type** or **Alt. titles** reloads with the new filter; filters combine (FR-18).

## Notes for Claude Design

- The value is *seeing the whole catalogue at once* — scannable and complete, not paginated or
  truncated. Improve on v2's plain two-column list if you can (grouping, jump-to-letter, density — your
  call), but keep it fast and text-first.
- Make the disabled *Released* / *Played live* controls clearly "coming soon".
