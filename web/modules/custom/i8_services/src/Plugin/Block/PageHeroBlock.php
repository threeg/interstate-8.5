<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\Block;

use Drupal\Component\Utility\Tags;
use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Block\TitleBlockPluginInterface;
use Drupal\Core\Entity\Element\EntityAutocomplete;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * The page-header hero (INT8-028).
 *
 * A full-width banner, placed once, site-wide (except the homepage), showing
 * the current route's title over a background that rotates through a
 * configured set of media-library images.
 *
 * Implementing `TitleBlockPluginInterface` is what lets this block take over
 * the core page-title block's job: `BlockPageVariant::build()` calls
 * `setTitle()` on any placed block implementing this interface, using the
 * exact same resolved title core's own `page_title_block` would receive —
 * no separate title-resolution logic is needed here, and no per-route
 * suppression list, because there is nothing to suppress: this block simply
 * replaces the core one at the one placement that used to exist.
 *
 * Builds *data only* (title, chosen image); the theme owns the markup via
 * `templates/block--i8-page-hero.html.twig`, which embeds the existing
 * `interstate_85:hero` SDC — this class never names a theme component, so
 * the architecture's dependency rule (services must not import theme) holds
 * and `tooling/check-boundary.sh` stays green.
 */
#[Block(
  id: 'i8_page_hero',
  admin_label: new TranslatableMarkup('Page hero'),
)]
class PageHeroBlock extends BlockBase implements ContainerFactoryPluginInterface, TitleBlockPluginInterface {

  /**
   * The page title, set by BlockPageVariant via TitleBlockPluginInterface.
   *
   * Deliberately untyped, matching core's own PageTitleBlock::$title
   * exactly — the title core hands over can be a plain string, a render
   * array, or (as `/user/login` proved) a TranslatableMarkup object; a
   * `string|array` union rejects that last case with a TypeError.
   *
   * @var string|array|\Drupal\Component\Render\MarkupInterface
   */
  protected $title = '';

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected readonly EntityTypeManagerInterface $entityTypeManager,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new self(
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('entity_type.manager'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function setTitle($title) {
    $this->title = $title;
    return $this;
  }

  /**
   * {@inheritdoc}
   */
  public function defaultConfiguration(): array {
    return ['media_ids' => []] + parent::defaultConfiguration();
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $form = parent::blockForm($form, $form_state);

    $media_ids = $this->configuration['media_ids'];
    $entities = $media_ids
      ? $this->entityTypeManager->getStorage('media')->loadMultiple($media_ids)
      : [];

    $form['media_ids'] = [
      '#type' => 'entity_autocomplete',
      '#title' => $this->t('Background images'),
      '#description' => $this->t('One is shown at random on each page load. Leave empty to show a plain background with no photo (a valid, not-yet-configured state — no error).'),
      '#target_type' => 'media',
      '#tags' => TRUE,
      '#default_value' => array_values($entities),
      '#selection_settings' => ['target_bundles' => ['image']],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $ids = [];
    foreach (Tags::explode((string) $form_state->getValue('media_ids')) as $tag) {
      $id = EntityAutocomplete::extractEntityIdFromAutocompleteInput($tag);
      if ($id !== NULL) {
        $ids[] = (int) $id;
      }
    }
    $this->configuration['media_ids'] = $ids;
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $media_ids = $this->configuration['media_ids'];

    return [
      'title' => $this->title,
      'image' => [
        // Isolates the random pick's necessary `max-age: 0` from the rest
        // of the page — see PageHeroImageRenderer's own docblock.
        '#lazy_builder' => [
          'i8_services.page_hero_image_renderer:build',
          [implode(',', $media_ids)],
        ],
        '#create_placeholder' => TRUE,
      ],
      '#cache' => [
        // Revalidate if any currently-referenced image is replaced/deleted.
        'tags' => array_map(static fn (int $id): string => "media:$id", $media_ids),
      ],
    ];
  }

}
