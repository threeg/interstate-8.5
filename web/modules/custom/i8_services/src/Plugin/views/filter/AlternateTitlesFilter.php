<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\views\filter;

use Drupal\Core\Form\FormStateInterface;
use Drupal\views\Attribute\ViewsFilter;
use Drupal\views\Plugin\views\filter\FilterPluginBase;
use Drupal\views\Plugin\views\query\Sql;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Shows or hides alternate-title versions on the Songs landing (FR-10).
 *
 * Reads the `alt` query parameter directly (api-contract.md §2.1: `1` show
 * — the default — or `0` hide). Not a Views "exposed" filter, for the same
 * reason as SongTypeFilter: the filter bar is hand-built in the theme and
 * the Alternate-titles control is two links (Show/Hide), not a form widget
 * Views would render — see design-system.md's segmented-toggle, which is
 * presentation-only by design and expects its consumer to wire real values.
 */
#[ViewsFilter('i8_alternate_titles_filter')]
class AlternateTitlesFilter extends FilterPluginBase {

  public function __construct(
    array $configuration,
    $plugin_id,
    $plugin_definition,
    protected readonly RequestStack $requestStack,
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
    return $this->t('Alternate-title visibility from the `alt` query parameter (FR-10)');
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
    // Same reasoning as SongTypeFilter::getCacheContexts() — the result
    // varies by this query parameter.
    $contexts[] = 'url.query_args:alt';
    return $contexts;
  }

  /**
   * {@inheritdoc}
   */
  public function query() {
    $alt = $this->requestStack->getCurrentRequest()->query->get('alt', '1');
    if ($alt === '0') {
      $this->ensureMyTable();
      // See ArticleInsensitiveTitle::query() for why this assertion is here.
      assert($this->query instanceof Sql);
      $this->query->addWhere($this->options['group'], "$this->tableAlias.$this->realField", NULL, 'IS NULL');
    }
  }

}
