<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\Block;

use Drupal\Component\Utility\NestedArray;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\OpenModalDialogCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Block\Attribute\Block;
use Drupal\Core\Block\BlockBase;
use Drupal\Core\Block\TitleBlockPluginInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\Core\StringTranslation\TranslatableMarkup;
use Drupal\file\FileInterface;
use Drupal\media_library\MediaLibraryState;
use Drupal\media_library\MediaLibraryUiBuilder;
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
 *
 * The background rotates client-side (see js/page-hero.js), not via a
 * server-side #lazy_builder: Drupal's internal page cache caches responses
 * PERMANENTLY regardless of any render-array cache max-age (see
 * \Drupal\page_cache\StackMiddleware\PageCache::storeResponse()), so a
 * server-side-only random pick freezes solid for every anonymous visitor
 * once a page is cached — confirmed live (curl and a real browser both saw
 * a frozen image on repeat requests to the same URL). BigPipe doesn't
 * rescue this either: it's a deliberate no-op for anonymous requests with
 * no session (\Drupal\big_pipe\Render\Placeholder\BigPipeStrategy::
 * processPlaceholders()), which is the normal case for anonymous visitors
 * to a public archive. Rendering is therefore fully cacheable server-side
 * (one deterministic candidate, tagged by the referenced media), and a tiny
 * JS behaviour rerolls to a true random pick on every page LOAD instead —
 * this works identically whether the served HTML came from cache or not.
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
   * Gets the media IDs as edited in this form session, defaulting to config.
   *
   * Mirrors core's field-widget state pattern (WidgetBase::getWidgetState())
   * so add/remove AJAX rebuilds accumulate correctly before the block config
   * form is finally submitted, without needing a real field/widget state API
   * for what is plain block plugin configuration.
   */
  protected function getWorkingMediaIds(FormStateInterface $form_state): array {
    $ids = $form_state->get('i8_page_hero_media_ids');
    if ($ids === NULL) {
      $ids = $this->configuration['media_ids'];
      $form_state->set('i8_page_hero_media_ids', $ids);
    }
    return $ids;
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    $form = parent::blockForm($form, $form_state);

    $media_ids = $this->getWorkingMediaIds($form_state);
    $wrapper_id = 'i8-page-hero-media-wrapper';

    $form['media_ids'] = [
      '#type' => 'container',
      '#tree' => TRUE,
      '#attributes' => ['id' => $wrapper_id],
    ];

    $entities = $media_ids ? $this->entityTypeManager->getStorage('media')->loadMultiple($media_ids) : [];
    $view_builder = $this->entityTypeManager->getViewBuilder('media');

    $form['media_ids']['selection'] = [
      '#type' => 'container',
      '#attributes' => ['class' => ['i8-page-hero-selection']],
    ];
    if (!$entities) {
      $form['media_ids']['selection']['empty'] = [
        '#markup' => $this->t('No background images are selected. One is shown at random on each page load; leave empty to show a plain background with no photo (a valid, not-yet-configured state — no error).'),
      ];
    }
    foreach ($entities as $id => $media) {
      $form['media_ids']['selection'][$id] = [
        '#type' => 'container',
        '#attributes' => ['class' => ['i8-page-hero-selection__item']],
        'preview' => $media->access('view')
          ? $view_builder->view($media, 'media_library')
          : ['#markup' => $media->label()],
        'remove' => [
          '#type' => 'submit',
          '#name' => 'i8-page-hero-remove-' . $id,
          '#value' => $this->t('Remove'),
          '#media_id' => $id,
          '#submit' => [[static::class, 'removeItem']],
          '#ajax' => [
            'callback' => [static::class, 'updateWidget'],
            'wrapper' => $wrapper_id,
          ],
          '#limit_validation_errors' => [],
        ],
      ];
    }

    $state = MediaLibraryState::create('i8_services.media_library_opener.page_hero', ['image'], 'image', -1);

    $form['media_ids']['open_button'] = [
      '#type' => 'button',
      '#value' => $this->t('Add background images'),
      '#name' => 'i8-page-hero-open',
      '#media_library_state' => $state,
      '#ajax' => [
        'callback' => [static::class, 'openMediaLibrary'],
      ],
      '#limit_validation_errors' => [],
    ];

    $form['media_ids']['selected'] = [
      '#type' => 'hidden',
      '#attributes' => ['data-i8-page-hero-value' => TRUE],
    ];

    $form['media_ids']['update'] = [
      '#type' => 'submit',
      '#value' => $this->t('Update selection'),
      '#name' => 'i8-page-hero-update',
      '#submit' => [[static::class, 'addItems']],
      '#ajax' => [
        'callback' => [static::class, 'updateWidget'],
        'wrapper' => $wrapper_id,
      ],
      '#attributes' => ['data-i8-page-hero-update' => TRUE, 'class' => ['js-hide']],
      '#limit_validation_errors' => [],
    ];

    return $form;
  }

  /**
   * AJAX callback: opens the media library modal.
   */
  public static function openMediaLibrary(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $library_ui = \Drupal::service('media_library.ui_builder')->buildUi($triggering_element['#media_library_state']);
    $dialog_options = MediaLibraryUiBuilder::dialogOptions();
    return (new AjaxResponse())
      ->addCommand(new OpenModalDialogCommand($dialog_options['title'], $library_ui, $dialog_options));
  }

  /**
   * AJAX callback: replaces the selection wrapper after an add/remove.
   */
  public static function updateWidget(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $wrapper_id = $triggering_element['#ajax']['wrapper'];
    $element = NestedArray::getValue($form, array_slice($triggering_element['#array_parents'], 0, -1));
    $element['selected']['#value'] = '';
    return (new AjaxResponse())->addCommand(new ReplaceCommand("#$wrapper_id", $element));
  }

  /**
   * Submit callback: adds media selected in the library modal.
   */
  public static function addItems(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $element = NestedArray::getValue($form, array_slice($triggering_element['#array_parents'], 0, -1));
    $input = NestedArray::getValue($form_state->getUserInput(), $element['#parents']);
    $new_ids = array_map('intval', array_filter(explode(',', $input['selected'] ?? ''), 'is_numeric'));

    if ($new_ids) {
      $current = $form_state->get('i8_page_hero_media_ids') ?? [];
      $form_state->set('i8_page_hero_media_ids', array_values(array_unique(array_merge($current, $new_ids))));
    }
    $form_state->setRebuild();
  }

  /**
   * Submit callback: removes one media item from the working selection.
   */
  public static function removeItem(array $form, FormStateInterface $form_state) {
    $triggering_element = $form_state->getTriggeringElement();
    $remove_id = (int) $triggering_element['#media_id'];
    $current = $form_state->get('i8_page_hero_media_ids') ?? [];
    $form_state->set('i8_page_hero_media_ids', array_values(array_diff($current, [$remove_id])));
    $form_state->setRebuild();
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $this->configuration['media_ids'] = $form_state->get('i8_page_hero_media_ids') ?? $this->configuration['media_ids'];
  }

  /**
   * {@inheritdoc}
   */
  public function build(): array {
    $media_ids = $this->configuration['media_ids'];
    $entities = $media_ids ? $this->entityTypeManager->getStorage('media')->loadMultiple($media_ids) : [];

    $candidates = [];
    foreach ($entities as $media) {
      if (!$media->hasField('field_media_image') || $media->get('field_media_image')->isEmpty()) {
        continue;
      }
      $file = $media->get('field_media_image')->entity;
      if (!$file instanceof FileInterface) {
        continue;
      }
      $uri = $file->getFileUri();
      $image_styles = $this->entityTypeManager->getStorage('image_style');
      $mobile = $image_styles->load('hero_mobile')->buildUrl($uri);
      $desktop = $image_styles->load('hero_desktop')->buildUrl($uri);
      $candidates[] = [
        'src' => $desktop,
        'srcset' => "$mobile 760w, $desktop 1440w",
      ];
    }

    $image = [];
    if ($candidates) {
      $shown = $candidates[0];
      $image = [
        '#type' => 'html_tag',
        '#tag' => 'img',
        '#attributes' => [
          'class' => ['hero__image-picture'],
          'src' => $shown['src'],
          'srcset' => $shown['srcset'],
          'sizes' => '(max-width: 1440px) 100vw, 1440px',
          // Decorative — the hero's title carries the meaning (INT8-018's
          // established rule for this hero, unchanged here).
          'alt' => '',
        ],
      ];
      if (count($candidates) > 1) {
        $image['#attached']['library'][] = 'i8_services/page_hero';
        $image['#attached']['drupalSettings']['i8PageHero']['alternates'] = $candidates;
      }
    }

    return [
      'title' => $this->title,
      'image' => $image,
      '#cache' => [
        'tags' => array_map(static fn (int $id): string => "media:$id", $media_ids),
      ],
    ];
  }

}
