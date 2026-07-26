<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\Field\FieldFormatter;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\Attribute\FieldFormatter;
use Drupal\Core\Field\FieldDefinitionInterface;
use Drupal\Core\Field\FieldItemListInterface;
use Drupal\Core\Field\FormatterBase;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\file\FileInterface;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Renders one media image at random as the page hero's background (INT8-028).
 *
 * Deliberately a *field formatter* rather than block-plugin logic: the images
 * are a plain entity-reference field on the `page_hero` block content type,
 * selected with core's stock `media_library_widget`, so the only part still
 * ours is how that field turns into a background — which is exactly what a
 * formatter is for. Nothing here knows it is inside a block.
 *
 * The pick is rerolled client-side (see js/page-hero.js), not server-side:
 * Drupal's internal page cache stores anonymous responses PERMANENTLY
 * regardless of any render-array cache max-age (see
 * \Drupal\page_cache\StackMiddleware\PageCache::storeResponse()), so a
 * server-side random pick freezes for every anonymous visitor once a page is
 * cached. BigPipe does not rescue it either — it is a deliberate no-op for
 * sessionless anonymous requests (\Drupal\big_pipe\Render\Placeholder\
 * BigPipeStrategy::processPlaceholders()). So the server renders one
 * deterministic candidate (fully cacheable, tagged by the media it depends
 * on) and hands the whole candidate set to the browser, which picks on every
 * page load — working identically whether the HTML came from cache or not.
 */
#[FieldFormatter(
  id: 'i8_hero_background',
  label: new TranslatableMarkup('Page hero background (random, responsive)'),
  field_types: ['entity_reference'],
)]
class HeroBackgroundFormatter extends FormatterBase implements ContainerFactoryPluginInterface {

  /**
   * The image field on the `image` media type (INT8-028's own media type).
   */
  protected const IMAGE_FIELD = 'field_media_image';

  /**
   * The responsive image style the hero renders through.
   */
  protected const RESPONSIVE_STYLE = 'i8_hero';

  /**
   * The single-style derivatives the client-side reroll swaps between.
   *
   * These mirror the two breakpoints of the `i8_hero` responsive style, and
   * exist because the reroll has to rewrite the <picture>'s sources, which
   * means it needs a concrete URL per breakpoint per candidate.
   */
  protected const REROLL_STYLES = ['mobile' => 'hero_mobile', 'desktop' => 'hero_desktop'];

  public function __construct(
    $plugin_id,
    $plugin_definition,
    FieldDefinitionInterface $field_definition,
    array $settings,
    $label,
    $view_mode,
    array $third_party_settings,
    protected readonly EntityTypeManagerInterface $entityTypeManager,
  ) {
    parent::__construct($plugin_id, $plugin_definition, $field_definition, $settings, $label, $view_mode, $third_party_settings);
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container, array $configuration, $plugin_id, $plugin_definition) {
    return new self(
      $plugin_id,
      $plugin_definition,
      $configuration['field_definition'],
      $configuration['settings'],
      $configuration['label'],
      $configuration['view_mode'],
      $configuration['third_party_settings'],
      $container->get('entity_type.manager'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public static function isApplicable(FieldDefinitionInterface $field_definition) {
    return $field_definition->getFieldStorageDefinition()->getSetting('target_type') === 'media';
  }

  /**
   * {@inheritdoc}
   */
  public function viewElements(FieldItemListInterface $items, $langcode) {
    $uris = [];
    $tags = [];

    foreach ($items->referencedEntities() as $media) {
      if (!$media->hasField(static::IMAGE_FIELD)) {
        continue;
      }
      $image_items = $media->get(static::IMAGE_FIELD);
      if ($image_items->isEmpty()) {
        continue;
      }
      $files = $image_items->referencedEntities();
      $file = reset($files);
      if (!$file instanceof FileInterface) {
        continue;
      }
      $uris[] = $file->getFileUri();
      // Every candidate, not just the rendered one: the browser can reroll to
      // any of them, so editing any one of them must invalidate this output.
      $tags = array_merge($tags, $media->getCacheTags());
    }

    // No usable images is a valid, not-yet-configured state (Scenario 3): the
    // hero still renders, just without a photo behind its title.
    if (!$uris) {
      return [];
    }

    $element = [
      '#type' => 'responsive_image',
      '#responsive_image_style_id' => static::RESPONSIVE_STYLE,
      '#uri' => $uris[0],
      '#attributes' => ['class' => ['hero__image-picture']],
      // Decorative — the hero's <h1> carries the meaning.
      '#alt' => '',
      '#cache' => ['tags' => array_values(array_unique($tags))],
    ];

    if (count($uris) > 1) {
      $element += $this->rerollData($uris);
    }

    return [$element];
  }

  /**
   * Builds the client-side reroll payload for a multi-image selection.
   *
   * @param string[] $uris
   *   Every candidate file URI, in selection order.
   *
   * @return array
   *   Render-array properties to merge in, or an empty array when the hero's
   *   image styles are missing — in which case the hero renders its first
   *   candidate and simply does not rotate, rather than fatalling.
   */
  protected function rerollData(array $uris): array {
    $storage = $this->entityTypeManager->getStorage('image_style');

    $styles = [];
    foreach (static::REROLL_STYLES as $key => $style_id) {
      $style = $storage->load($style_id);
      if ($style === NULL) {
        return [];
      }
      $styles[$key] = $style;
    }

    return [
      '#attached' => [
        'library' => ['i8_services/page_hero'],
        'drupalSettings' => [
          'i8PageHero' => [
            'alternates' => array_map(
              static fn (string $uri): array => array_map(
                static fn ($style): string => $style->buildUrl($uri),
                $styles,
              ),
              $uris,
            ),
          ],
        ],
      ],
    ];
  }

}
