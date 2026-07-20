---
id: INT8-026
title: Hook the footer's secondary label row up to a real Drupal menu
type: task
status: todo
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
- [ ] Footer labels render from an editable Drupal menu, not hardcoded template strings.
- [ ] Only labels with a real destination page render as links; any still-undestined labels stay
      inert text (no dead links).
- [ ] Ticket status + notes and BOARD.md row updated in the same commit.

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
