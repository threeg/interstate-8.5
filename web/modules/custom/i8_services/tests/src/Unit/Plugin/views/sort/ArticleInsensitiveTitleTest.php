<?php

declare(strict_types=1);

namespace Drupal\Tests\i8_services\Unit\Plugin\views\sort;

use Drupal\Tests\UnitTestCase;
use Drupal\i8_services\Plugin\views\sort\ArticleInsensitiveTitle;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the INT8-029 song-title bucket rule.
 *
 * Written independently of the implementation, from the ticket text alone.
 * The rule under test (ticket §1) is, for a raw title T:
 *   1. s = trim(T).
 *   2. s = stripLeadingArticle(s) — one leading a/an/the plus whitespace.
 *   3. strip the leading run of characters that are neither Unicode letters
 *      nor digits; what is left is the comparison key.
 *   4. take the key's first character, fold an accented Latin letter to its
 *      base ASCII letter, uppercase it.
 *   5. A-Z gives that letter's bucket; anything else — a digit, a script that
 *      does not fold to A-Z, or an empty key — gives the "#" bucket.
 *
 * Note on case: the ticket's worked-examples table displays comparison keys
 * in their original case, but §2 defines the method contract explicitly as
 * "returning the lowercased comparison key", and §3 orders rows by the
 * lowercased key. The explicit method contract is taken as authoritative
 * here, so the expectations below are the lowercased form of the table's
 * keys. bucket() is unaffected either way — step 4 uppercases.
 */
#[Group('i8_services')]
#[CoversClass(ArticleInsensitiveTitle::class)]
class ArticleInsensitiveTitleTest extends UnitTestCase {

  /**
   * Tests that the comparison key is derived per steps 1-3.
   */
  #[DataProvider('providerRule')]
  public function testComparisonKey(string $title, string $expected_key, string $expected_bucket): void {
    $this->assertSame($expected_key, ArticleInsensitiveTitle::comparisonKey($title));
  }

  /**
   * Tests that the bucket is derived per steps 1-5.
   */
  #[DataProvider('providerRule')]
  public function testBucket(string $title, string $expected_key, string $expected_bucket): void {
    $this->assertSame($expected_bucket, ArticleInsensitiveTitle::bucket($title));
  }

  /**
   * Data provider: title, expected comparison key, expected bucket.
   *
   * The first eight cases are the ticket's worked-examples table verbatim
   * (keys lowercased, per the note in the class docblock). The rest are
   * regression cases implied by the same rule.
   */
  public static function providerRule(): array {
    return [
      // The ticket's worked examples. The first two pull in opposite
      // directions on purpose: step 3 looks past leading punctuation, but
      // step 4 then stops at whatever it finds first — a digit sends the
      // title to the catch-all even though a letter follows later.
      '(8)copy — punctuation then a digit goes to the catch-all' => [
        '(8)copy',
        '8)copy',
        '#',
      ],
      '(No Song) — punctuation then a letter files under that letter' => [
        '(No Song)',
        'no song)',
        'N',
      ],
      'leading ellipsis is skipped' => [
        '...But Theyre Not Singing Ghosts',
        'but theyre not singing ghosts',
        'B',
      ],
      'leading "The" is stripped' => [
        'The Cold Part',
        'cold part',
        'C',
      ],
      'leading "A" is stripped' => [
        'A Different City',
        'different city',
        'D',
      ],
      'a word merely starting with the letters of an article is untouched' => [
        'AEIOU And Sometimes Why',
        'aeiou and sometimes why',
        'A',
      ],
      'a bare leading digit goes to the catch-all' => [
        '3rd Planet',
        '3rd planet',
        '#',
      ],
      'a title made entirely of punctuation has an empty key' => [
        '&',
        '',
        '#',
      ],

      // Regression cases: the happy path, and the consequences of the rule
      // as stated that are easiest to break.
      'a bare word with no article and no punctuation is unchanged' => [
        'Bukowski',
        'bukowski',
        'B',
      ],
      'surrounding whitespace is trimmed before anything else' => [
        "  Dramamine \n",
        'dramamine',
        'D',
      ],
      'a lower-case first letter is still uppercased for the bucket' => [
        '(cowboy dan)',
        'cowboy dan)',
        'C',
      ],
      'the article is stripped before the punctuation run, not after' => [
        // Step 2 runs before step 3, so the leading "(" blocks the article
        // regex and "The" survives into the key: this files under T, not G.
        '(The Good Times Are Killing Me)',
        'the good times are killing me)',
        'T',
      ],
      'an article-looking word with no trailing space is not an article' => [
        // stripLeadingArticle() requires whitespace after the article.
        'Theyll Get You',
        'theyll get you',
        'T',
      ],
      'a title that is only whitespace has an empty key' => [
        '   ',
        '',
        '#',
      ],
    ];
  }

  /**
   * Tests bucketing of first characters that are not plain ASCII letters.
   */
  #[DataProvider('providerBucketFolding')]
  public function testBucketFolding(string $title, string $expected_bucket): void {
    $this->assertSame($expected_bucket, ArticleInsensitiveTitle::bucket($title));
  }

  /**
   * Data provider: title, expected bucket, for step 4/5 folding only.
   */
  public static function providerBucketFolding(): array {
    return [
      // Step 4: an accented Latin letter folds to its base ASCII letter.
      'E-acute folds to E' => ['Éclair', 'E'],
      'e-acute folds to E from a lower-case title' => ['éclair', 'E'],
      'a-grave folds to A behind punctuation' => ['(Àpres)', 'A'],
      // Step 5: a script that does not fold to A-Z is the catch-all.
      'Cyrillic does not fold to A-Z' => ['Привет', '#'],
      'a digit behind an article and punctuation still hits the catch-all' => [
        'The (2) Sides',
        '#',
      ],
    ];
  }

  /**
   * Tests that the pre-existing article stripping is unchanged.
   */
  #[DataProvider('providerStripLeadingArticle')]
  public function testStripLeadingArticleIsUnchanged(string $title, string $expected): void {
    $this->assertSame($expected, ArticleInsensitiveTitle::stripLeadingArticle($title));
  }

  /**
   * Data provider: title, expected article-stripped title.
   *
   * The ticket pins stripLeadingArticle() as unchanged, and comparisonKey()
   * is specified to call it as step 2 — so guard its behaviour explicitly.
   * Note it preserves the original case and does not touch punctuation.
   */
  public static function providerStripLeadingArticle(): array {
    return [
      'the' => ['The Cold Part', 'Cold Part'],
      'a' => ['A Different City', 'Different City'],
      'an' => ['An Ocean', 'Ocean'],
      'case-insensitive' => ['THE COLD PART', 'COLD PART'],
      'only the first article goes' => ['The The Cold Part', 'The Cold Part'],
      'no article to strip' => ['Bukowski', 'Bukowski'],
      'article letters inside a longer word stay' => ['Anemone', 'Anemone'],
      'surrounding whitespace is trimmed' => ['  The Cold Part  ', 'Cold Part'],
      'punctuation blocks the article' => ['(The Cold Part)', '(The Cold Part)'],
    ];
  }

  /**
   * Tests the accent-folded ordering key (INT8-038).
   *
   * The key is comparisonKey()'s result put through the same ASCII//TRANSLIT
   * fold bucket() applies to its first character, then lowercased — so the
   * fold covers the whole key, not just its head.
   */
  #[DataProvider('providerSortKey')]
  public function testSortKey(string $title, string $expected_key): void {
    $this->assertSame($expected_key, ArticleInsensitiveTitle::sortKey($title));
  }

  /**
   * Data provider: title, expected folded sort key.
   */
  public static function providerSortKey(): array {
    return [
      // The fold reaches past the first character: every accented letter in
      // the key goes, not just the one bucket() looks at.
      'an accented first letter folds' => ['Éclair', 'eclair'],
      'the article is stripped before the fold' => ['The Éclair', 'eclair'],
      'a lower-case accented title folds the same way' => ['émile', 'emile'],
      'an accent after the first character folds too' => ['Amélie', 'amelie'],
      'an accent behind punctuation folds' => ['(Àpres)', 'apres)'],
      // A ligature transliterates to two characters. The trailing lowercase
      // is what makes this stable whether iconv yields "ae" or "AE".
      'a ligature expands to its two-letter fold' => ['Æon', 'aeon'],
      'the same ligature lower-case' => ['æon', 'aeon'],

      // Plain-ASCII spot checks: folding must be a no-op for titles the
      // existing suite already pins, so sortKey() and comparisonKey() agree
      // wherever there is nothing to fold.
      'a plain title is untouched' => ['Bukowski', 'bukowski'],
      'article stripping still applies' => ['The Cold Part', 'cold part'],
      'a leading digit survives the fold' => ['(8)copy', '8)copy'],
      'an empty key stays empty' => ['&', ''],
    ];
  }

  /**
   * Tests that INT8-038 leaves comparisonKey() and bucket() untouched.
   *
   * The new key is additive: the unfolded comparison key and the bucket rule
   * are both pinned as byte-for-byte unchanged by the ticket.
   */
  #[DataProvider('providerFoldingIsAdditive')]
  public function testFoldingIsAdditive(string $title, string $expected_key, string $expected_bucket): void {
    $this->assertSame($expected_key, ArticleInsensitiveTitle::comparisonKey($title));
    $this->assertSame($expected_bucket, ArticleInsensitiveTitle::bucket($title));
  }

  /**
   * Data provider: title, unfolded comparison key, unchanged bucket.
   */
  public static function providerFoldingIsAdditive(): array {
    return [
      'the comparison key keeps its accent' => ['Éclair', 'éclair', 'E'],
      'and so does a lower-case one' => ['émile', 'émile', 'E'],
      // A first character that folds to two letters is not a single A-Z
      // character, so it stays in the catch-all bucket.
      'a ligature still buckets to the catch-all' => ['Æon', 'æon', '#'],
      'a plain title is unaffected' => ['Bukowski', 'bukowski', 'B'],
      'the catch-all cases are unaffected' => ['3rd Planet', '3rd planet', '#'],
    ];
  }

  /**
   * Tests that no bucket can be split into two groups (INT8-038).
   *
   * The theme builds the ledger's groups by walking the sorted rows and
   * starting a new group whenever the letter changes, so a bucket that
   * reappears after being left becomes a second group with a duplicate DOM
   * id. This asserts the property directly rather than the fold that
   * currently delivers it, so it survives a refactor of either method.
   */
  #[DataProvider('providerContiguity')]
  public function testBucketsAreContiguousUnderTheLedgerSort(array $titles, array $expected_buckets): void {
    $buckets = self::sortedBuckets($titles);
    $this->assertSame($expected_buckets, $buckets);

    $runs = self::collapseRuns($buckets);
    $this->assertCount(
      count(array_unique($buckets)),
      $runs,
      'A bucket was left and re-entered, so it would render as two groups: '
      . implode(' ', $runs)
    );
  }

  /**
   * Data provider: source-order titles, expected sorted bucket sequence.
   *
   * The first case is the ticket's own reproduction; the second scatters
   * accents, a ligature and non-Latin text across the alphabet, out of
   * source order.
   */
  public static function providerContiguity(): array {
    return [
      "the ticket's reproduction" => [
        ['Em', 'Ez', 'Fa', 'The Éclair', 'Émile'],
        ['E', 'E', 'E', 'E', 'F'],
      ],
      'accents scattered across the alphabet' => [
        [
          'Zebra',
          '3rd Planet',
          'Émile',
          'Anemone',
          'Æon',
          'The Éclair',
          'Привет',
          'Àpres Vous',
          'Zed',
        ],
        ['A', 'A', 'E', 'E', 'Z', 'Z', '#', '#', '#'],
      ],
    ];
  }

  /**
   * Returns each title's bucket, in the order the ledger would render them.
   *
   * Mirrors the theme's sort: by bucket rank (a letter before the catch-all)
   * and then by the folded sort key.
   */
  private static function sortedBuckets(array $titles): array {
    $rows = [];
    foreach ($titles as $title) {
      $rows[] = [
        'bucket' => ArticleInsensitiveTitle::bucket($title),
        'sort_key' => ArticleInsensitiveTitle::sortKey($title),
      ];
    }
    usort($rows, function (array $a, array $b): int {
      $rank_a = $a['bucket'] === '#' ? 1 : 0;
      $rank_b = $b['bucket'] === '#' ? 1 : 0;
      return [$rank_a, $a['sort_key']] <=> [$rank_b, $b['sort_key']];
    });
    return array_column($rows, 'bucket');
  }

  /**
   * Collapses each run of identical adjacent buckets to a single entry.
   */
  private static function collapseRuns(array $buckets): array {
    $runs = [];
    foreach ($buckets as $bucket) {
      if (end($runs) !== $bucket) {
        $runs[] = $bucket;
      }
    }
    return $runs;
  }

}
