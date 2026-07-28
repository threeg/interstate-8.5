<?php

declare(strict_types=1);

namespace Drupal\i8_services;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\node\NodeInterface;

/**
 * Song version-relationship lookups.
 *
 * A song's parent, and the other songs that point back at it as their
 * parent (INT8-035). Moved out of interstate_85_preprocess_node__song()
 * (INT8-020), which
 * queried the content model directly from the theme — a violation of
 * architecture.md §2.1's `content-model → services → theme` rule. Both
 * methods preserve that code's exact access semantics: getParent() is a
 * per-entity `access('view')` check because it hands back a single, already-
 * resolved reference target; getAlternates() is a query-level accessCheck()
 * because it is a search over many nodes, not a lookup of one.
 */
final class SongVersions {

  public function __construct(
    protected readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * The song's parent, if it still exists and the acting user may view it.
   */
  public function getParent(NodeInterface $song): ?NodeInterface {
    $parent = $song->get('field_parent_song')->entity;
    if ($parent instanceof NodeInterface && $parent->access('view')) {
      return $parent;
    }
    return NULL;
  }

  /**
   * The song's alternates: other songs whose parent is this one.
   *
   * Published-only, sorted by title, access-checked at the query level.
   *
   * @return \Drupal\node\NodeInterface[]
   *   The alternates, in title order.
   */
  public function getAlternates(NodeInterface $song): array {
    $storage = $this->entityTypeManager->getStorage('node');
    $ids = $storage->getQuery()
      ->condition('type', 'song')
      ->condition('field_parent_song', $song->id())
      ->condition('status', NodeInterface::PUBLISHED)
      ->sort('title')
      ->accessCheck(TRUE)
      ->execute();

    if (!$ids) {
      return [];
    }

    // loadMultiple() does not guarantee the load order follows $ids, so the
    // query's sort('title') order is re-applied explicitly.
    $nodes = $storage->loadMultiple($ids);
    return array_map(static fn (int|string $id): NodeInterface => $nodes[$id], $ids);
  }

}
