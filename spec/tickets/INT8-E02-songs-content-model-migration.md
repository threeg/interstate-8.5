---
id: INT8-E02
title: Songs content model & migration
type: epic
status: done
milestone: 9
batch: content-model
layer: content-model
depends_on: []
implements: []
tests_required: false
estimate: 8
---

## In plain English
Create the "shape" for a song in the new site and pour every song from the old site into it — names,
lyrics, notes, quotes, videos, types, and the links between alternate versions — cleaned up on the way
in.

## Summary
Delivers the Song content type, the Song-type taxonomy, the media/text-format pieces, and the Migrate
API import from the v2 MySQL dump (with the legacy rich-text cleanup and the version self-reference).

## Scope
- **In scope:** Song node type + fields, `song_type` taxonomy, Remote-video media + Restricted HTML,
  Pathauto for songs, and the SongType + Songs migrations with verification.
- **Out of scope:** release/setlist/tab/studio entities and relationships (later slices); the UI
  (E03/E04).

## Success criteria
All children done; every active v2 song is imported and verifiable (FR-1–FR-5); the content model
matches `content-model.md`.

## Children
- INT8-008 — Song type taxonomy (vocabulary + terms)
- INT8-009 — Remote-video media type + Restricted HTML text format
- INT8-010 — Song content type + fields
- INT8-011 — Pathauto pattern for songs
- INT8-012 — Song type migration
- INT8-013 — Songs migration
- INT8-014 — Migration verification

## References
- spec/architecture/content-model.md (whole)
- spec/requirements/requirements.md §2, §4.1 (FR-1–FR-5, FR-21)
- spec/architecture/architecture.md §4.1 (migration flow)
