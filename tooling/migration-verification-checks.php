<?php

/**
 * @file
 * Read-only migration verification checks (INT8-014).
 *
 * Count parity (FR-5) + field-mapping spot-checks against the real `legacy`
 * DB. Safe to run at any time — makes no changes. `require`d from a
 * bootstrapped Drupal context (drush php:eval); relies on $failures being
 * defined by the caller and increments it on each failed check.
 *
 * Invoked by tooling/verify-migration.sh — see that script for the full
 * procedure (this file + the idempotency/rollback sequence around it).
 */

declare(strict_types=1);

function i8_check(string $desc, $actual, $expected): void {
  global $failures;
  if ($actual == $expected) {
    echo "  [PASS] {$desc}: " . var_export($actual, TRUE) . PHP_EOL;
  }
  else {
    echo "  [FAIL] {$desc}: expected " . var_export($expected, TRUE) . ', got ' . var_export($actual, TRUE) . PHP_EOL;
    $failures++;
  }
}

$legacy = \Drupal\Core\Database\Database::getConnection('default', 'migrate');

echo PHP_EOL . '--- Count parity (FR-5) ---' . PHP_EOL;
$sourceSongsTotal = (int) $legacy->query('SELECT COUNT(*) FROM I8_Songs')->fetchField();
$sourceSongsActive = (int) $legacy->query('SELECT COUNT(*) FROM I8_Songs WHERE Song_Active = 1')->fetchField();
$sourceTypesTotal = (int) $legacy->query('SELECT COUNT(*) FROM I8_SongType')->fetchField();
$sourceTypesActive = (int) $legacy->query('SELECT COUNT(*) FROM I8_SongType WHERE SongType_Active = 1')->fetchField();

$destSongsTotal = count(\Drupal::entityQuery('node')->condition('type', 'song')->accessCheck(FALSE)->execute());
$destSongsPublished = count(\Drupal::entityQuery('node')->condition('type', 'song')->condition('status', 1)->accessCheck(FALSE)->execute());
$destTypesTotal = count(\Drupal::entityQuery('taxonomy_term')->condition('vid', 'song_type')->accessCheck(FALSE)->execute());
$destTypesPublished = count(\Drupal::entityQuery('taxonomy_term')->condition('vid', 'song_type')->condition('status', 1)->accessCheck(FALSE)->execute());

// The migration imports every source row (lossless), mapping Song_Active /
// SongType_Active to node/term status rather than filtering the source — see
// content-model.md §9. FR-5's actual promise is about the PUBLISHED count, so
// that is checked against the ACTIVE source count; the total-vs-total
// assertion is kept alongside it so a future failure names which invariant
// broke (an import-completeness regression vs. a status-mapping regression).
i8_check('Song node count (total) == I8_Songs count (total)', $destSongsTotal, $sourceSongsTotal);
i8_check('Published song node count == I8_Songs active count (FR-5)', $destSongsPublished, $sourceSongsActive);
i8_check('Song type term count (total) == I8_SongType count (total)', $destTypesTotal, $sourceTypesTotal);
i8_check('Published song type term count == I8_SongType active count (FR-5)', $destTypesPublished, $sourceTypesActive);

echo PHP_EOL . '--- Field-mapping spot-checks ---' . PHP_EOL;
$nodeStorage = \Drupal::entityTypeManager()->getStorage('node');
$termStorage = \Drupal::entityTypeManager()->getStorage('taxonomy_term');

// PK_Song_ID 1 (Dramamine: plain lyrics + <LI> note, no parent);
// PK_Song_ID 135 (Your Life: has a parent, PK_Song_ID 66).
$sample = [1, 135];
foreach ($sample as $legacyId) {
  $ids = \Drupal::entityQuery('node')
    ->condition('type', 'song')
    ->condition('field_legacy_id', $legacyId)
    ->accessCheck(FALSE)
    ->execute();
  $nid = reset($ids);
  i8_check("song legacy_id={$legacyId} exists", (bool) $nid, TRUE);
  if (!$nid) {
    continue;
  }

  $node = $nodeStorage->load($nid);
  $sourceRow = $legacy->query('SELECT * FROM I8_Songs WHERE PK_Song_ID = :id', [':id' => $legacyId])->fetchAssoc();

  i8_check("legacy_id={$legacyId} title", $node->getTitle(), $sourceRow['Song_Name']);
  i8_check("legacy_id={$legacyId} exclude_from_list", (bool) $node->get('field_exclude_from_list')->value, (bool) $sourceRow['Song_Live']);
  i8_check("legacy_id={$legacyId} lyrics_same_as_parent", (bool) $node->get('field_lyrics_same_as_parent')->value, (bool) $sourceRow['Song_LyricsSameAsNormal']);
  i8_check("legacy_id={$legacyId} published", $node->isPublished(), (bool) $sourceRow['Song_Active']);

  $typeTerm = $termStorage->load($node->get('field_song_type')->target_id);
  i8_check("legacy_id={$legacyId} song type legacy_id", $typeTerm?->get('field_legacy_id')->value, $sourceRow['FK_SongType_ID']);

  if ((int) $sourceRow['FK_Song_ID'] !== 0) {
    $parentTarget = $node->get('field_parent_song')->target_id;
    $parentNode = $parentTarget ? $nodeStorage->load($parentTarget) : NULL;
    i8_check("legacy_id={$legacyId} parent legacy_id", $parentNode?->get('field_legacy_id')->value, $sourceRow['FK_Song_ID']);
  }
  else {
    i8_check("legacy_id={$legacyId} has no parent", $node->get('field_parent_song')->isEmpty(), TRUE);
  }

  if (!empty($sourceRow['Song_Lyrics'])) {
    i8_check("legacy_id={$legacyId} lyrics non-empty", !$node->get('field_lyrics')->isEmpty(), TRUE);
    i8_check("legacy_id={$legacyId} lyrics format", $node->get('field_lyrics')->format, 'restricted_html');
  }
  if (!empty($sourceRow['Song_Notes'])) {
    i8_check("legacy_id={$legacyId} notes non-empty", !$node->get('field_notes')->isEmpty(), TRUE);
  }
  i8_check("legacy_id={$legacyId} video left empty (descoped, INT8-013)", $node->get('field_video')->isEmpty(), TRUE);
}
