<?php

declare(strict_types=1);

namespace Drupal\i8_migrate\Plugin\migrate\process;

use Drupal\migrate\Attribute\MigrateProcess;
use Drupal\migrate\MigrateExecutableInterface;
use Drupal\migrate\ProcessPluginBase;
use Drupal\migrate\Row;

/**
 * Normalizes legacy v2 rich-text markup to a clean, consistent representation.
 *
 * FR-21: inconsistent legacy HTML (mixed-case <P>/<BR>/<LI> tags, raw CRLF
 * formatting artifacts, stray entities) is removed while line and paragraph
 * breaks are preserved, producing output within the `restricted_html` format's
 * allow-list (`<p> <br> <em> <strong> <a href hreflang>` — this plugin never
 * emits `<em>`/`<strong>`/`<a>` itself, only `<p>`/`<br>`, since the legacy
 * source carries no reliable emphasis/link markup to preserve).
 *
 * When the source has structural tags (`<br>`/`<p>`/`<li>`), they are treated
 * as the sole source of line/paragraph structure and all raw whitespace
 * (including any incidental newlines) is collapsed as insignificant — matching
 * how a browser would have rendered the original markup. When the source has
 * no structural tags at all, its raw newlines are themselves the only
 * structural signal and are preserved (single newline → line break, blank
 * line → paragraph break) — the "nl2br" half of the reference v3 approach
 * (`stripOldHtml`: strip tags → nl2br).
 */
#[MigrateProcess('i8_clean_rich_text')]
class CleanRichText extends ProcessPluginBase {

  /**
   * {@inheritdoc}
   */
  public function transform($value, MigrateExecutableInterface $migrate_executable, Row $row, $destination_property) {
    return self::clean($value);
  }

  /**
   * The pure transform, split out for direct unit testing.
   */
  public static function clean(?string $raw): string {
    if ($raw === NULL || trim($raw) === '') {
      return '';
    }

    // Remove <script>/<style> blocks entirely — content included, never just
    // the tags — before anything else touches the markup.
    $html = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', '', $raw);

    $hasStructuralTags = (bool) preg_match('#<(br|p|li)[\s/>]#i', $html);
    if ($hasStructuralTags) {
      // Tags define the structure; any raw whitespace/newlines are noise.
      $html = preg_replace('/\s+/', ' ', $html);
    }
    else {
      // No tags: the raw newlines are the only structural signal.
      $html = str_replace("\r\n", "\n", $html);
    }

    // Convert structural tags to newline markers before stripping the rest.
    $html = preg_replace('#<br\s*/?>#i', "\n", $html);
    $html = preg_replace('#</p>#i', "\n\n", $html);
    $html = preg_replace('#</li>#i', "\n", $html);
    $html = preg_replace('#<(p|li)\b[^>]*>#i', '', $html);

    // Strip any remaining markup (links, spans, stray tags — inner text kept).
    $html = strip_tags($html);
    $html = html_entity_decode($html, ENT_QUOTES | ENT_HTML5);

    // Normalize excess blank lines to a single paragraph break.
    $html = preg_replace('/\n{3,}/', "\n\n", $html);

    $lines = array_map('trim', explode("\n", $html));
    $text = trim(implode("\n", $lines));
    if ($text === '') {
      return '';
    }

    $paragraphs = preg_split('/\n{2,}/', $text);
    $out = '';
    foreach ($paragraphs as $paragraph) {
      $paragraph = trim($paragraph);
      if ($paragraph === '') {
        continue;
      }
      $out .= '<p>' . nl2br(htmlspecialchars($paragraph, ENT_QUOTES)) . '</p>';
    }
    return $out;
  }

}
