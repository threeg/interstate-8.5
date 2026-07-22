<?php

declare(strict_types=1);

namespace Drupal\i8_services\Controller;

use Drupal\Core\Controller\ControllerBase;

/**
 * Minimal stub pages for routes not yet backed by real content (INT8-017).
 */
class PageController extends ControllerBase {

  /**
   * The site's minimal front page.
   *
   * The full homepage composition is design-only in slice 1 (wireframes
   * overview.md §1) — this exists so the primary nav has somewhere real to
   * send visitors (FR-16) without building it.
   */
  public function front(): array {
    return [
      '#markup' => '<p>' . $this->t('Interstate-8 is a fan-run archive of Modest Mouse setlists, songs and releases.') . '</p>',
    ];
  }

  /**
   * A temporary stand-in for the Songs landing page.
   *
   * Replaced by the real /songs View in INT8-018 (see i8_services.routing.yml).
   */
  public function songsStub(): array {
    return [
      '#markup' => '<p>' . $this->t('The complete song catalogue is coming soon.') . '</p>',
    ];
  }

}
