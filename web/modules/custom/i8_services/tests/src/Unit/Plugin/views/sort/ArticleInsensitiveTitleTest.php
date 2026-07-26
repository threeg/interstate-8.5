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

}
