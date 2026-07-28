---
id: INT8-026
title: Hook the footer's secondary label row up to a real Drupal menu
type: task
status: in-review
milestone: 9
batch: cleanup
layer: theme
depends_on: [INT8-015]
implements: []
tests_required: false
estimate: 1
---

## In plain English
Right now the footer's "About / Contact / Support / Legal / Privacy Policy" row is five words baked
into the template. Turn it into a real, editable Drupal menu once those pages have somewhere to go.

## Background
INT8-015 built `site-footer` as a static SDC: `{{ 'About'|t|upper }}` etc., rendered as inert `<span>`s,
not links. That was a deliberate choice at the time — the hi-fi (`1B.dc.html`) itself renders this row
as plain spans (not anchors), and the wireframes' decision log explicitly defers About/Contact/Support/
Legal/Privacy ("deferred" — no such pages/routes exist in slice 1, so real links would 404). The ticket
text for INT8-015 only said "secondary menu (About/Contact/Support/Legal/Privacy) + © + disclaimer"
without specifying static-text vs. menu-driven, so this was resolved implicitly rather than as a
tracked decision — raised in review and moved here per user request.

## Technical requirements
- Once About/Contact/Support/Legal/Privacy have real routes (a later slice/ticket — not this one),
  replace `site-footer.twig`'s hardcoded labels with a real Drupal menu (e.g. a "Footer" menu, rendered
  via a `system_menu_block` placed in a new theme region, or passed into `site-footer` as a slot the
  same way `site-header`'s `nav` slot receives `page.primary_menu`).
- Until those destination pages exist, keep the current static-span rendering — do **not** wire links
  to nowhere.
- Preserve the current visual styling (`site-footer.css`) regardless of the markup source.

## Definition of done (acceptance criteria)
- [x] Footer labels render from an editable Drupal menu, not hardcoded template strings.
- [x] Only labels with a real destination page render as links; any still-undestined labels stay
      inert text (no dead links).
- [x] Ticket status + notes and BOARD.md row updated in the same commit.

## Tests / verification
`tests_required: false` — presentational/config wiring, no numbered-requirement behaviour change.
Covered incidentally by the existing `page-shell.spec.ts` footer assertions once the markup changes
(update the test's selectors if the label markup moves from `<span>` to `<a>`).

## Notes
2026-07-20 — created from ticket-review feedback on INT8-015 (the footer's five labels were flagged as
hardcoded rather than menu-driven). Depends on INT8-015 (the footer component existing) rather than on
the About/Contact/etc. pages directly, since those pages don't have tickets yet — this ticket is a
placeholder for the *mechanism*; actually wiring real links still waits on those destination pages
being built.

2026-07-27 — **implemented, in review.** Used Drupal core's own built-in `footer` menu (already present
on every install; no new menu entity needed) rather than inventing a "Footer" menu. Added the five
labels as real `MenuLinkContent` entities via the entity API (`link: route:<nolink>`, matching how an
editor would add them via Structure → Menus → Footer → Add link) — `<nolink>` renders as inert `<span>`
text with no `href`, so the DoD's "no dead links until real pages exist" holds structurally, not by
convention. Placed a `system_menu_block:footer` in the theme's existing (previously unused) `footer`
region, exported as `block.block.interstate_85_footermenu.yml`.

`site-footer.twig`'s five hardcoded `<span>` labels became a `menu` slot (mirroring `site-header`'s
`nav` slot exactly: `page.html.twig` now `{% embed %}`s the component with `{% block menu %}{{
page.footer }}{% endblock %}` instead of a plain `include`). Declared the slot in
`site-footer.component.yml`. Rebuilt `site-footer.css` for the block's real markup (`<nav><div><ul><li>`
rather than bare `<span>`s): the flex row moved from `.site-footer__menu` onto its `ul`, and the
`|upper` Twig filter became `text-transform: uppercase` on the container since the label text is now
data (menu link titles), not a Twig-controlled string. Verified pixel-for-pixel against the pre-change
screenshot at both desktop and 320px — the visual result is unchanged.

**Found and fixed a latent gap while verifying, not part of the plan going in:** the block's
accessible-name heading (`<h2 class="visually-hidden">`, needed so the `<nav>` landmark has a name even
with the block's own title hidden) rendered *visibly* — this theme has no base theme and had never
defined `.visually-hidden` anywhere, so any core markup relying on that class (this is the first ticket
to place a real menu block) would have shown raw "Footer menu" text. Added the standard definition to
`app.css`, copied verbatim from Drupal core's own (`stable9/css/system/components/hidden.module.css`),
so the class means what core markup already assumes it means anywhere else it's used.

Verified: full `lando playwright --project=chromium` (109/109, including the pre-existing footer
assertion and both axe passes) and `lando test` (default gate) both green; `lando drush cim -y` a no-op.

**Summary:** the footer's About/Contact/Support/Legal/Privacy Policy row is now a real, editable Drupal
menu (Structure → Menus → Footer) instead of template text — editors can add real links there the
moment those destination pages exist, with zero further template work, while today's inert appearance
is unchanged.

**Sanity test:** `curl -s http://interstate-8-5.lndo.site/ | grep -c 'block-interstate-85-footermenu'`
→ `2` (the block wrapper `id` and its `aria-labelledby` reference).

## QA steps
1. Visit any page and scroll to the footer — About/Contact/Support/Legal/Privacy Policy still appear as
   plain, uppercase, evenly-spaced inert text (not links), identical in position and spacing to before.
2. View source (or inspect) the footer row — the labels now come from a `<nav><ul><li>` menu structure,
   not bare `<span>` tags, and there is no visible "Footer menu" heading anywhere.
3. As an admin, go to **Structure → Menus → Footer** — the five labels are listed there as real,
   editable/reorderable menu links (currently pointing at "no link").
4. Resize to 320px — the row wraps the same way it did before this change, still centered.
