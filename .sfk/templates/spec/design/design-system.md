# <PROJECT> — Design System / Visual Contract

| | |
|---|---|
| **Document** | Design system (visual contract) |
| **Repository location** | `spec/design/design-system.md` |
| **Status** | Binding specification (for UI visual design) |

> **Purpose.** For projects with a visual design, this file is the **visual contract** the frontend
> binds to — the analog of `spec/architecture/api-contract.md` for the backend. It fixes the design
> *decisions* that implementation must honour (tokens, component styling, visual states); it is **not**
> the artwork itself. Keep it lean: capture what binds code; the full-fidelity design is either
> **generated in-repo** by the agent or authored in a **linked tool** (§1).
>
> **When to skip.** Projects that render **nothing a person looks at**, and projects with no distinct
> visual design (grey-box wireframes styled ad hoc in implementation), skip this milestone and remove
> `spec/design/`. It depends on the wireframes (you style the surfaces you have structured).
>
> **"No interactive UI" is not the same as "no visual output."** A project can have no screens at all and
> still render something whose appearance is specified — a generated document or report, print output, an
> email, an exported image. Those projects **need this milestone**, and their rendering work will be
> `Task`-shaped rather than `Story`-shaped (see `spec/tickets/TICKET-TEMPLATE.md`, *Design authority*).
> Judge by whether appearance is specified, not by whether there is a screen.
>
> **Supporting context.** Exported palettes, brand assets, and screenshots can live in `spec/design/`
> beside this file; they inform the system but the tokens and rules below are what bind.

---

## 1. Source of truth

> Where the design is authored and where the *binding* values live. This file always records the design
> **decisions**; pick how the full-fidelity design is produced. Three modes, AI-native first:
>
> - **Generated in-repo (the natural default for an AI-built project):** the agent produces the design
>   as code right here in `spec/design/` — renderable mockups in whatever format suits the output medium
>   (as the wireframes allow) plus a machine-readable **tokens file** the implementation imports
>   directly. This makes the visual contract *executable*: code consumes the tokens rather than
>   eyeballing values from a table, the same way it honours `api-contract.md`.
> - **External design tool:** the visuals are authored in a dedicated tool and linked; this file
>   captures the decisions that bind, and §2–§4 mirror the tool's tokens and components.
> - **In this doc only:** for a small surface, the tables below *are* the whole design.
>
> Any AI or human design tool works — keep this file the agnostic contract, not a tool's export.

- **Design source:** <in-repo (agent-generated) | external tool + link | in this doc only>
- **Tokens file:** <path, or n/a>
- **Brand guide:** <link, or n/a>

### 1.1 Artefact authority (which artefact binds which kind of fact)

> **Fill this in as soon as this milestone produces more than one artefact.** A design milestone
> typically leaves several — a structural sketch, this document, a machine-readable token source, one or
> more renderable mockups. They are **not interchangeable**, and a ticket that takes a value from the
> wrong one ships a plausible-looking error. State here, once, which is authoritative for what. Formats
> are entirely the project's choice; list whatever this project actually produced.

| Kind of fact | Authoritative artefact | Notes |
|---|---|---|
| Placement, structure, hierarchy | `<artefact + section>` | <…> |
| Component styling rules | `<artefact + section>` | <…> |
| Exact values (type, spacing, colour) | `<artefact — usually the token source>` | <…> |
| **Illustrative only — never a value source** | `<artefact(s)>` | <why: substitute assets, different output surface, …> |

> **An artefact built with substitute assets is a proportion reference, not a value source.** If a mockup
> stands in for anything not yet final — unlicensed or unavailable fonts, placeholder imagery, sample
> copy, stand-in icons — it will carry deliberate compensation for those substitutes. A value copied out
> of it ships the compensation as though it were the design. The same applies to any artefact produced at
> different dimensions from the real output surface: a coordinate lifted from it is proportionally wrong,
> by a margin small enough to survive review.
>
> Where either is true of an artefact this project produced, say so in the table's last row **and** state
> the real values' home. This is exactly the fact a ticket author cannot infer and an implementer will
> otherwise discover by shipping it.

---

## 2. Design tokens

> The named values every screen and component draws from. Tokens — not raw hex/px in components — are
> what keep the UI consistent and themeable. Fill the ones the project uses; delete the rest. If you
> keep a tokens file (§1), that file is the machine-readable source the frontend imports; the tables
> below summarise it for readers.

### Colour

| Token | Value | Used for |
|-------|-------|----------|
| `<color.bg>` | `<#…>` | page background |
| `<color.fg>` | `<#…>` | primary text |
| `<color.primary>` | `<#…>` | primary actions |
| `<color.danger>` | `<#…>` | errors / destructive |

> Note any contrast/accessibility requirement here (e.g. "body text ≥ 4.5:1"); it becomes an NFR.

### Typography

| Token | Family / size / weight | Used for |
|-------|------------------------|----------|
| `<type.body>` | `<family 16/24 400>` | body copy |
| `<type.heading>` | `<family 24/32 600>` | headings |

### Spacing, radius, elevation

> The spacing scale (e.g. `4 · 8 · 12 · 16 · 24 · 32`), corner radii, and any shadow/elevation levels.

- **Spacing scale:** <…>
- **Radius:** <…>
- **Elevation:** <…>

---

## 3. Component inventory

> The reusable UI components and the states each must support. This is the checklist the frontend
> tickets build against; a component is not specified until its states are described. Reference
> tokens (§2), never raw values.

| Component | Variants | States | Notes |
|-----------|----------|--------|-------|
| `<Button>` | primary / secondary / danger | default · hover · focus · disabled · loading | uses `color.primary` |
| `<Input>` | text / select | default · focus · error · disabled | error uses `color.danger` |
| `<Card>` | — | default | — |

---

## 4. Visual states & patterns

> How the shared states from the wireframes (`spec/wireframes/` state matrix) *look* — the visual
> treatment of empty, loading, and error, and any cross-cutting patterns (toasts, modals, focus
> rings, motion). Keep it to what binds implementation.

- **Empty:** <treatment>
- **Loading:** <treatment — skeleton / spinner>
- **Error:** <treatment — inline / banner, uses `color.danger`>
- **Focus / keyboard:** <visible focus ring token, tab order rules>
- **Motion:** <durations/easing, or "none">

---

## 5. Decisions log

> Dated record of visual-design decisions — palette choices, what was deliberately kept minimal,
> deferred visual work. Append per version.

- **<DATE>** — <decision and rationale>.
