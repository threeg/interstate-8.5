<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\Block;

use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Cache\Cache;
use Drupal\Core\StringTranslation\TranslatableMarkup;

/**
 * The song page's "more about this song" rail (INT8-019 review round 2).
 *
 * Reserved space for releases / last-played-live / tour-stats (FR-14
 * spirit) — no real data behind any of it, so unlike INT8-028's page hero
 * there is nothing here for an editor to configure. That is what makes this
 * a plain block *plugin* rather than a block_content type: block_content
 * exists to hold editable content, and this block holds none.
 *
 * Composed entirely from existing SDC components via the `component` render
 * element, so no bespoke block template is needed
 * (Drupal\Core\Render\Element\ComponentElement — core, not contrib).
 */
#[Block(
  id: 'i8_song_sidebar',
  admin_label: new TranslatableMarkup('Song sidebar ("coming soon" rail)'),
)]
class SongSidebarBlock extends BlockBase {

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    return [
      '#type' => 'container',
      '#attributes' => ['class' => ['song-sidebar']],
      'label' => [
        '#type' => 'component',
        '#component' => 'interstate_85:section-label',
        '#props' => ['variant' => 'muted'],
        '#slots' => ['label' => ['#plain_text' => $this->t('More about this song')]],
      ],
      'releases' => [
        '#type' => 'component',
        '#component' => 'interstate_85:coming-soon-stub',
        '#props' => ['label' => $this->t('Releases')],
      ],
      'last_played_live' => [
        '#type' => 'component',
        '#component' => 'interstate_85:coming-soon-stub',
        '#props' => ['label' => $this->t('Last played live')],
      ],
      'tour_stats' => [
        '#type' => 'component',
        '#component' => 'interstate_85:coming-soon-stub',
        '#props' => ['label' => $this->t('Times played / tour stats')],
      ],
      // No field content, no per-request state — no data to invalidate on.
      '#cache' => ['max-age' => Cache::PERMANENT],
    ];
  }

}
