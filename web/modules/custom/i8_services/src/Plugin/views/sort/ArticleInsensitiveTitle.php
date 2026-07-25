<?php

declare(strict_types=1);

namespace Drupal\i8_services\Plugin\views\sort;

use Drupal\views\Attribute\ViewsSort;
use Drupal\views\Plugin\views\query\Sql;
use Drupal\views\Plugin\views\sort\SortPluginBase;

/**
 * Sorts by title, ignoring a leading "A"/"An"/"The" (FR-8).
 *
 * No contrib module covers this on Drupal 11 (Views Sort Expression tops out
 * at ^10 — verified via a composer dry-run before this was written; see
 * content-model.md §6). The content model itself carries no sort field —
 * this computes the ordering key at query time via a `CASE` expression, the
 * documented fallback.
 */
#[ViewsSort('i8_article_insensitive_title')]
class ArticleInsensitiveTitle extends SortPluginBase {

  /**
   * {@inheritdoc}
   */
  public function query() {
    $this->ensureMyTable();
    $field = "$this->tableAlias.$this->realField";
    // Case-insensitively strip a single leading "A "/"An "/"The " before
    // comparing, matching FR-8's article-insensitive, case-insensitive rule.
    $expression = "LOWER(CASE WHEN LOWER($field) REGEXP '^(a|an|the) ' "
      . "THEN SUBSTRING($field, LOCATE(' ', $field) + 1) ELSE $field END)";
    $alias = $this->tableAlias . '_' . $this->realField . '_alpha';
    // The raw-expression addOrderBy()/addWhere() calls this plugin (and the
    // sibling filter plugins) rely on are Sql-specific, not declared on the
    // generic QueryPluginBase — asserting narrows the type for PHPStan and
    // documents the real assumption: this project has one query backend.
    assert($this->query instanceof Sql);
    $this->query->addOrderBy(NULL, $expression, $this->options['order'], $alias);
  }

  /**
   * The PHP mirror of this plugin's SQL `CASE` expression.
   *
   * Used by the theme layer to group the (already SQL-sorted) rows by
   * letter for the ledger's rail — kept as one canonical rule rather than
   * a second, potentially-diverging regex in the theme.
   */
  public static function stripLeadingArticle(string $title): string {
    return preg_replace('/^(a|an|the)\s+/i', '', trim($title));
  }

}
