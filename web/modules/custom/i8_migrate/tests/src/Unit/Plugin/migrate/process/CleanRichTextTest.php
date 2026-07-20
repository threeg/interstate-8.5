<?php

declare(strict_types=1);

namespace Drupal\Tests\i8_migrate\Unit\Plugin\migrate\process;

use Drupal\i8_migrate\Plugin\migrate\process\CleanRichText;
use Drupal\Tests\migrate\Unit\process\MigrateProcessTestCase;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the FR-21 legacy rich-text cleanup transform.
 *
 * Fixtures are drawn from real I8_Songs rows (PK_Song_ID noted per case);
 * see spec/architecture/content-model.md §5 for the target allow-list this
 * transform's output must stay within.
 */
#[Group('i8_migrate')]
#[CoversClass(CleanRichText::class)]
class CleanRichTextTest extends MigrateProcessTestCase {

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();
    $this->plugin = new CleanRichText([], 'i8_clean_rich_text', []);
  }

  /**
   * Tests the transform against the provided fixtures.
   */
  #[DataProvider('providerTransform')]
  public function testTransform(?string $input, string $expected): void {
    $actual = $this->plugin->transform($input, $this->migrateExecutable, $this->row, 'value');
    $this->assertSame($expected, $actual);
  }

  /**
   * Data provider for testTransform().
   */
  public static function providerTransform(): array {
    return [
      'null value stays empty' => [NULL, ''],
      'empty string stays empty' => ['', ''],
      'whitespace-only collapses to empty' => ["   \r\n  ", ''],
      'tagged: uppercase P/BR, CRLF between paragraphs (PK_Song_ID 1 shape)' => [
        "<P>Line one<BR>Line two</P>\r\n<P>Line three<BR>Line four</P>",
        "<p>Line one<br />\nLine two</p><p>Line three<br />\nLine four</p>",
      ],
      'tagged: raw whitespace next to a tag boundary is insignificant' => [
        "Intro line before any tag.\r\n<p>First real paragraph with &quot;quotes&quot; and it's got an apostrophe.</p>",
        "<p>Intro line before any tag. First real paragraph with &quot;quotes&quot; and it&#039;s got an apostrophe.</p>",
      ],
      'tagged: LI wraps to a single paragraph (PK_Song_ID 1, notes)' => [
        '<LI>Lyrics from the "This Is A Long Drive For Someone With Nothing To Think About" booklet.</LI>',
        '<p>Lyrics from the &quot;This Is A Long Drive For Someone With Nothing To Think About&quot; booklet.</p>',
      ],
      'untagged: no markup at all' => [
        'Just a plain quote, no tags.',
        '<p>Just a plain quote, no tags.</p>',
      ],
      'untagged: raw CRLF-separated lines are significant (PK_Song_ID 159 shape)' => [
        "Early Modest Mouse demo\r\nIsaac - Vox, Zeb - Drums, Sam - Vox and Spacetrus(?)",
        "<p>Early Modest Mouse demo<br />\nIsaac - Vox, Zeb - Drums, Sam - Vox and Spacetrus(?)</p>",
      ],
      'untagged: excess blank lines collapse to one paragraph break' => [
        "First paragraph.\n\n\n\n\nSecond paragraph.",
        "<p>First paragraph.</p><p>Second paragraph.</p>",
      ],
      'disallowed tags (script/img) are stripped, their content removed too' => [
        '<script>alert(1)</script><p>Safe text<img src="x.png"></p>',
        '<p>Safe text</p>',
      ],
    ];
  }

}
