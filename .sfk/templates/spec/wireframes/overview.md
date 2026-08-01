# <PROJECT> — Wireframes: Overview, Navigation and Conventions

| | |
|---|---|
| **Document** | Wireframes overview |
| **Repository location** | `spec/wireframes/overview.md` |
| **Status** | Binding specification (for UI) |

> **Purpose.** For projects that render something a person looks at, this folder is the binding
> description of the surfaces, their states, and the navigation between them. The overview (this file)
> indexes them and fixes shared conventions; one file per surface (`01-<name>.md`, `02-<name>.md`, …)
> describes each in detail, optionally alongside a renderable mockup of the same name.
>
> **"Surface" is not only a screen.** If the project renders a document, a report, print output, an email
> or an exported image, each of those is a surface and belongs here — a project can have no interactive UI
> and still have its appearance specified. Judge by whether appearance is specified, not by whether there
> is a screen.
>
> **Projects that render nothing a person looks at:** skip this milestone entirely and remove
> `spec/wireframes/`.
>
> **Supporting context.** Inspiration images, competitor screenshots, and brand references can live in
> `spec/wireframes/` beside these files; they inform the screens but are *not* binding.

---

## 1. Screen index

| # | Screen | File | Purpose |
|---|--------|------|---------|
| 1 | <Screen A> | `01-<slug>.md` | <one line> |
| 2 | <Screen B> | `02-<slug>.md` | <one line> |

---

## 2. Navigation structure

> How the user moves between screens — the routes, the entry point, the back/cancel behaviour. A
> small diagram or indented tree works well.

```
<entry> ─▶ <Screen A> ─▶ <Screen B>
                └▶ <Screen C>
```

---

## 3. Shared layout

> The frame every screen sits in: header, navigation, primary actions, where errors and loading
> appear. Define shared components once here so each screen file can reference them.

### Shared components

- <Component — e.g. banner, card, toolbar> — <where used, what it does>

### <Shared vocabulary / labels>

> Any domain labels that must read identically across screens (category names, status words). List
> them once so wording stays consistent.

---

## 4. Mockup conventions

> The fidelity and notation used: grey-box vs styled, how interactive vs static elements are shown,
> how annotations are written. State whether a visual-design pass follows — the **design-system
> milestone** (`spec/design/design-system.md`) — or is deferred (e.g. "styling to emerge in
> implementation against these wireframes"), in which case that milestone is skipped.
>
> **Offer renderable mockups.** If you (the agent) can produce the project's output format, *proactively
> offer* to generate a mockup per surface alongside the Markdown, named to match (`NN-<name>.<ext>`), so
> the user can review the empty/loading/populated/error states in the medium they will ship in. Use
> whatever format fits this project's output — that is the project's choice, never the kit's. Don't wait
> to be asked.
>
> **Then say what the mockup is *not*.** A mockup standing in for anything not yet final — unavailable
> fonts, placeholder imagery, sample copy, stand-in icons — carries compensation for those substitutes, and
> a mockup drawn at other than the real output dimensions is proportionally wrong. Either way it is a
> **proportion reference, not a value source**. Record which artefact *does* hold the binding values in
> `spec/design/design-system.md` §1.1, *Artefact authority*. Offering a mockup without recording that is
> how an implementer ends up copying a compensated value and shipping it.

---

## 5. State coverage matrix

> Every screen, every state. A screen is not specified until its empty / loading / populated /
> error states are all described. This matrix is the checklist.

| Screen | Empty | Loading | Populated | Error |
|--------|:-----:|:-------:|:---------:|:-----:|
| <Screen A> | ☐ | ☐ | ☐ | ☐ |
| <Screen B> | ☐ | ☐ | ☐ | ☐ |

---

## 6. Decisions log

> Dated record of UI decisions from the wireframe interview — layout choices, what was deliberately
> left out, ordering/grouping decisions. Append per version.

- **<DATE>** — <decision and rationale>.
