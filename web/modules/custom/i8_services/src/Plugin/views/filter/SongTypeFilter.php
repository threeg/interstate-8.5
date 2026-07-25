<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\views\filter;

use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Attribute\ViewsFilter;
use Drupal\views\Plugin\views\filter\FilterPluginBase;
use Drupal\views\Plugin\views\query\Sql;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Restricts the Songs landing to a Song type (band/group), by name (FR-9).
 *
 * Reads the `type` query parameter directly (api-contract.md §2.1: a Song
 * type term name — "All", "Modest Mouse", "Ugly Casanova", "Side projects",
 * "Covers" — or absent, defaulting to "Modest Mouse"). Not a Views "exposed"
 * filter: the landing's filter bar is a hand-built form (theme layer) that
 * targets these exact query-string values, so there is no Views exposed-form
 * widget to configure here — this handler only has to honour the contract.
 *
 * An unrecognised `type` value (e.g. a hand-edited URL) yields zero rows
 * rather than silently falling back to the default — a deliberate, real
 * empty-result case (FR-19), not an error.
 */
#[ViewsFilter('i8_song_type_filter')]
class SongTypeFilter extends FilterPluginBase {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected readonly RequestStack $requestStack,
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
      $container->get('request_stack'),
      $container->get('entity_type.manager'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function canExpose() {
    return FALSE;
  }

  /**
   * {@inheritdoc}
   */
  public function adminSummary() {
    return $this->t('Song type from the `type` query parameter (FR-9)');
  }

  /**
   * {@inheritdoc}
   */
  protected function operatorForm(&$form, FormStateInterface $form_state) {}

  /**
   * {@inheritdoc}
   */
  public function valueForm(&$form, FormStateInterface $form_state) {}

  /**
   * {@inheritdoc}
   */
  public function getCacheContexts() {
    $contexts = parent::getCacheContexts();
    // The result varies by this query parameter — without this, the page
    // and render caches would serve one cached response regardless of
    // `?type=`, since nothing else on the query tells them it matters.
    $contexts[] = 'url.query_args:type';
    return $contexts;
  }

  /**
   * {@inheritdoc}
   */
  public function query() {
    $type = $this->requestStack->getCurrentRequest()->query->get('type', 'Modest Mouse');

    if ($type === 'All') {
      return;
    }

    $terms = $this->entityTypeManager->getStorage('taxonomy_term')
      ->loadByProperties(['vid' => 'song_type', 'name' => $type]);
    $term = reset($terms);

    $this->ensureMyTable();
    // See ArticleInsensitiveTitle::query() for why this assertion is here.
    assert($this->query instanceof Sql);
    if (!$term) {
      // No matching Song type — a guaranteed-false condition (the node
      // title column is never NULL), not a fallback to the default, so an
      // invalid `type` value genuinely empties the list (FR-19) rather
      // than masking the bad input.
      $this->query->addWhere($this->options['group'], "$this->tableAlias.$this->realField", NULL, 'IS NULL');
      return;
    }

    $this->query->addWhere($this->options['group'], "$this->tableAlias.$this->realField", $term->id(), '=');
  }

}
