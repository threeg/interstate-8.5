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
 *
 * INT8-029 extended the rule with a bucket for titles that lead with
 * something other than a letter (numbers, symbols) — see comparisonKey()/
 * bucket() below, the single canonical implementation the theme's rendered
 * grouping AND ordering both go through (query() below does not attempt the
 * full bucket order — see the next paragraph).
 *
 * **SQL bracket-expression limitation, verified against this stack (MariaDB
 * 10.11 via Drupal's PDO connection):** any `REGEXP`/`REGEXP_REPLACE`
 * pattern containing a character class — `[a-z]`, `[^[:alnum:]]`, even the
 * POSIX class shorthand `[[:lower:]]` — silently returns a wrong result
 * (e.g. `'b' REGEXP '[a-z]'` evaluates to `0`) when executed through
 * `\Drupal::database()->query()`, while the byte-for-byte identical query
 * run through the interactive `mysql` client returns the correct `1`.
 * Alternation (`'^(a|an|the) '`, `'^(a|b|c|…|z)'`) is unaffected — confirmed
 * by direct comparison via a one-shot script (not the interactive session,
 * to rule out shell-quoting as the cause) before this was written. Because
 * INT8-029's "strip a leading run of non-alphanumeric characters" step
 * fundamentally needs a negated character class with no practical
 * alternation-only equivalent, the full bucket rule is not attempted in SQL
 * at all — `query()` keeps the original (bracket-free) article-only order as
 * a reasonable baseline, and `interstate_85_preprocess_views_view__songs()`
 * re-sorts the fetched result set (this View has no pager, FR-7, so the
 * complete set is already in memory) by `bucket()`/`comparisonKey()` for the
 * definitive order. This keeps the "one canonical rule" guarantee INT8-018
 * set out — comparisonKey()/bucket() are now the ONLY place ordering and
 * grouping are decided, SQL included.
 */
#[ViewsSort('i8_article_insensitive_title')]
class ArticleInsensitiveTitle extends SortPluginBase {

  /**
   * {@inheritdoc}
   */
  public function query() {
    $this->ensureMyTable();
    $field = "$this->tableAlias.$this->realField";
    // The raw-expression addOrderBy()/addWhere() calls this plugin (and the
    // sibling filter plugins) rely on are Sql-specific, not declared on the
    // generic QueryPluginBase — asserting narrows the type for PHPStan and
    // documents the real assumption: this project has one query backend.
    assert($this->query instanceof Sql);

    // Case-insensitively strip a single leading "A "/"An "/"The " (FR-8).
    // Deliberately NOT attempting the fuller INT8-029 bucket-rank ordering
    // here in SQL — see the class docblock's "SQL bracket-expression
    // limitation" note. This gives a reasonable baseline order; the theme
    // layer re-sorts the fetched (unpaginated, FR-7) result set by the exact
    // same bucket()/comparisonKey() rule for the definitive order, so this
    // expression only needs to be "good enough", not bucket-aware.
    $expression = "LOWER(CASE WHEN LOWER($field) REGEXP '^(a|an|the) ' "
      . "THEN SUBSTRING($field, LOCATE(' ', $field) + 1) ELSE $field END)";
    $alias = $this->tableAlias . '_' . $this->realField . '_alpha';
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

  /**
   * The song ledger's ordering key (INT8-029).
   *
   * Article-stripped, then a leading run of non-alphanumeric characters
   * removed, lowercased: "(No Song)" → "no song)"; "(8)copy" → "8)copy";
   * "&" → "" (a title made entirely of punctuation). This — not `query()`'s
   * SQL — is the canonical rule; see the class docblock for why the SQL
   * sort can't replicate it.
   */
  public static function comparisonKey(string $title): string {
    $key = self::stripLeadingArticle($title);
    $key = preg_replace('/^[^\p{L}\p{N}]+/u', '', $key);
    return mb_strtolower($key);
  }

  /**
   * The song ledger's rail/group bucket (INT8-029).
   *
   * A single `A`–`Z` character, or `#` for anything that doesn't fold to
   * one — a leading digit, a script with no ASCII-letter equivalent, or an
   * empty key. The first character of comparisonKey() is folded via `iconv`'s
   * transliteration, which reduces an accented Latin letter to its base
   * ASCII form (e.g. "É" → "E") but leaves other scripts as a literal
   * placeholder rather than phonetically transliterating them — exactly
   * the split this rule wants: only Latin-alphabet letters get their own
   * bucket, everything else is the catch-all.
   */
  public static function bucket(string $title): string {
    $key = self::comparisonKey($title);
    if ($key === '') {
      return '#';
    }
    $first = mb_substr($key, 0, 1);
    $folded = iconv('UTF-8', 'ASCII//TRANSLIT', $first);
    $folded = strtoupper((string) $folded);
    return preg_match('/^[A-Z]$/', $folded) === 1 ? $folded : '#';
  }

}
