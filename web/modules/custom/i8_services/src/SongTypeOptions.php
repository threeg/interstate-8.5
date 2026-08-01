<?php

declare(strict_types=1);

namespace Drupal\i8_services;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\taxonomy\TermInterface;

/**
 * The song_type taxonomy terms behind the Songs landing's Type filter.
 *
 * Backs the Type filter (INT8-018, FR-9); moved out of
 * interstate_85_preprocess_views_view__songs() (INT8-035) for the same
 * architecture.md §2.1 reason as SongVersions.
 */
final class SongTypeOptions {

  public function __construct(
    protected readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * The published song_type terms, in weight order (INT8-041).
   *
   * The songs the Type filter selects over are published-scoped, and
   * content-model.md §9 records that the song_type migration deliberately
   * maps activity to status — so an unpublished term must not be offered as
   * a choice. Filtered at the query level (an explicit status condition)
   * rather than by loading everything and discarding afterwards.
   *
   * accessCheck(TRUE) is the query-level posture, matching
   * SongVersions::getAlternates() (a many-entity search, unlike
   * getParent()'s single-entity access('view')) — though core registers no
   * taxonomy-term query-access hook, so it filters nothing by itself; the
   * explicit status condition below is what actually scopes the result.
   *
   * @return \Drupal\taxonomy\TermInterface[]
   *   The published song_type terms.
   */
  public function getTerms(): array {
    $storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $ids = $storage->getQuery()
      ->condition('vid', 'song_type')
      ->condition('status', 1)
      ->sort('weight')
      ->accessCheck(TRUE)
      ->execute();

    if (!$ids) {
      return [];
    }

    // loadMultiple() does not guarantee the load order follows $ids, so the
    // query's sort('weight') order is re-applied explicitly.
    $terms = $storage->loadMultiple($ids);
    return array_map(static fn (int|string $id): TermInterface => $terms[$id], $ids);
  }

}
