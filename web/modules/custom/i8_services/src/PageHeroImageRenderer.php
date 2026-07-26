<?php

declare(strict_types=1);

namespace Drupal\i8_services;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Security\TrustedCallbackInterface;
use Drupal\file\FileInterface;

/**
 * Picks and renders the page hero's random background image (INT8-028).
 *
 * Exists as its own service — rather than a static method on the block
 * plugin — specifically so it can be constructor-injected like any other
 * class in this codebase. A `#lazy_builder` callback can reference either a
 * static class method or a `service.id:method` pair; the service form is
 * the only one that supports real dependency injection, and a static
 * method reaching for `\Drupal::entityTypeManager()` directly is exactly
 * the pattern DrupalPractice's GlobalDrupal sniff flags elsewhere in this
 * project (see the Views filter plugins in this same module).
 */
class PageHeroImageRenderer implements TrustedCallbackInterface {

  /**
   * {@inheritdoc}
   */
  public static function trustedCallbacks(): array {
    return ['build'];
  }

  public function __construct(
    protected readonly EntityTypeManagerInterface $entityTypeManager,
  ) {}

  /**
   * The `#lazy_builder` callback: picks one configured image at random.
   *
   * Isolated behind a lazy builder (auto-placeholder) specifically so its
   * `max-age: 0` — genuinely required, since the pick must vary per request
   * (INT8-028 Scenario 2) — applies only to this fragment. Without that
   * isolation the whole page's cache metadata would inherit `max-age: 0`
   * and the surrounding page (title, filter bar, ledger, etc.) would stop
   * being render/page-cacheable for no reason connected to its own content
   * (Scenario 4).
   *
   * @param string $media_ids_csv
   *   A comma-separated list of media entity IDs (lazy builder arguments
   *   must be scalar — a real array isn't possible here). Empty when the
   *   block has no images configured.
   *
   * @return array
   *   A render array: a themed image if a usable one was picked, otherwise
   *   an empty (but still `max-age: 0`) array — never an error (Scenario 3).
   */
  public function build(string $media_ids_csv): array {
    $ids = array_values(array_filter(explode(',', $media_ids_csv), 'strlen'));
    if (!$ids) {
      return ['#cache' => ['max-age' => 0]];
    }

    $id = $ids[array_rand($ids)];
    $media = $this->entityTypeManager->getStorage('media')->load($id);
    if (!$media || !$media->hasField('field_media_image') || $media->get('field_media_image')->isEmpty()) {
      return ['#cache' => ['max-age' => 0]];
    }

    $file = $media->get('field_media_image')->entity;
    if (!$file instanceof FileInterface) {
      return ['#cache' => ['max-age' => 0]];
    }

    return [
      '#theme' => 'image',
      '#uri' => $file->getFileUri(),
      // Decorative — the hero's title carries the meaning (INT8-018's
      // established rule for this hero, unchanged here).
      '#alt' => '',
      '#cache' => ['max-age' => 0],
    ];
  }

}
