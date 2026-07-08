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
> **When to skip.** Non-UI projects, and UI projects with no distinct visual design (grey-box
> wireframes styled ad hoc in implementation), skip this milestone and remove `spec/design/`. It
> depends on the wireframes (you style the screens you have structured).
>
> **Supporting context.** Exported palettes, brand assets, and screenshots can live in `spec/design/`
> beside this file; they inform the system but the tokens and rules below are what bind.

---

## 1. Source of truth

> Where the design is authored and where the *binding* values live. This file always records the design
> **decisions**; pick how the full-fidelity design is produced. Three modes, AI-native first:
>
> - **Generated in-repo (the natural default for an AI-built project):** the agent produces the design
>   as code right here in `spec/design/` — HTML/CSS mockups (as the wireframes allow) plus a
>   machine-readable **tokens file** (`spec/design/tokens.css` or `tokens.json`) the frontend imports
>   directly. This makes the visual contract *executable*: code consumes the tokens rather than
>   eyeballing values from a table, the same way it honours `api-contract.md`.
> - **External design tool:** the visuals are authored in a dedicated tool and linked; this file
>   captures the decisions that bind, and §2–§4 mirror the tool's tokens and components.
> - **In this doc only:** for a small surface, the tables below *are* the whole design.
>
> Any AI or human design tool works — keep this file the agnostic contract, not a tool's export.

- **Design source:** <in-repo (agent-generated) | external tool + link | in this doc only>
- **Tokens file:** <path, e.g. `spec/design/tokens.css`, or n/a>
- **Brand guide:** <link, or n/a>

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
