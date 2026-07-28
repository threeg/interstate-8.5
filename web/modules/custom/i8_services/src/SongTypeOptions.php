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
   * The song_type terms, in weight order.
   *
   * @return \Drupal\taxonomy\TermInterface[]
   *   The song_type terms.
   */
  public function getTerms(): array {
    $storage = $this->entityTypeManager->getStorage('taxonomy_term');
    $terms = $storage->loadByProperties(['vid' => 'song_type']);
    uasort($terms, static fn (TermInterface $a, TermInterface $b): int => $a->getWeight() <=> $b->getWeight());
    return array_values($terms);
  }

}
