<?php

declare(strict_types=1);

namespace Drupal\Tests\i8_services\Unit\Plugin\Field\FieldFormatter;

use Drupal\Core\Entity\EntityStorageInterface;
use Drupal\Core\Entity\EntityTypeManagerInterface;
use Drupal\Core\Field\EntityReferenceFieldItemListInterface;
use Drupal\Tests\UnitTestCase;
use Drupal\file\FileInterface;
use Drupal\i8_services\Plugin\Field\FieldFormatter\HeroBackgroundFormatter;
use Drupal\image\ImageStyleInterface;
use Drupal\media\MediaInterface;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the hero background formatter (INT8-028).
 *
 * This is the piece of INT8-028 that survives the move to a block_content
 * type: the media field itself is now stock core (a plain entity-reference
 * field with core's media_library_widget), so nothing about *selecting* the
 * images is ours to test — but *how one of the selected images becomes the
 * hero's background* still is, and that is what this formatter owns.
 *
 * The behaviour under test comes from the ticket, not the code:
 *  - Scenario 2 — one of the configured images is shown, decorative
 *    (`alt=""`), and where there is more than one the client-side reroll data
 *    is attached so the pick actually varies per page load.
 *  - Scenario 3 — an empty or unusable selection is a *valid* state and must
 *    produce no output rather than an error or an <img> with no source.
 *  - Scenario 4 — the render output stays cacheable, tagged by the media it
 *    depends on, so editing an image invalidates the hero instead of forcing
 *    the page uncacheable.
 */
#[Group('i8_services')]
#[CoversClass(HeroBackgroundFormatter::class)]
class HeroBackgroundFormatterTest extends UnitTestCase {

  /**
   * The image styles the client-side reroll swaps between.
   */
  private const STYLES = ['hero_mobile', 'hero_desktop'];

  /**
   * Builds the formatter with an entity-type manager serving image styles.
   *
   * @param bool $styles_exist
   *   Whether hero_mobile / hero_desktop resolve. When FALSE the storage
   *   returns NULL, standing in for a site whose image styles have not been
   *   created (or have been deleted) — the formatter must not fatal on it.
   */
  private function formatter(bool $styles_exist = TRUE): HeroBackgroundFormatter {
    $storage = $this->createMock(EntityStorageInterface::class);
    $storage->method('load')->willReturnCallback(
      function (string $id) use ($styles_exist): ?ImageStyleInterface {
        if (!$styles_exist || !in_array($id, self::STYLES, TRUE)) {
          return NULL;
        }
        $style = $this->createMock(ImageStyleInterface::class);
        $style->method('buildUrl')->willReturnCallback(
          static fn (string $uri): string => "/files/styles/$id/" . basename($uri),
        );
        return $style;
      },
    );

    $entity_type_manager = $this->createMock(EntityTypeManagerInterface::class);
    $entity_type_manager->method('getStorage')->with('image_style')->willReturn($storage);

    return new HeroBackgroundFormatter(
      'i8_hero_background',
      [],
      $this->createMock('Drupal\Core\Field\FieldDefinitionInterface'),
      [],
      'hidden',
      'default',
      [],
      $entity_type_manager,
    );
  }

  /**
   * Builds a media item whose image field references a file at $uri.
   *
   * @param string|null $uri
   *   The file URI, or NULL for a media item that has an image field with
   *   nothing usable behind it.
   * @param bool $has_field
   *   Whether the media item has the image field at all — a media type other
   *   than "image" would not.
   */
  private function media(?string $uri, bool $has_field = TRUE): MediaInterface {
    $media = $this->createMock(MediaInterface::class);
    $media->method('hasField')->willReturnCallback(
      static fn (string $name): bool => $has_field && $name === 'field_media_image',
    );
    $media->method('getCacheTags')->willReturn(['media:' . abs(crc32((string) $uri)) % 100]);

    $files = [];
    if ($uri !== NULL) {
      $file = $this->createMock(FileInterface::class);
      $file->method('getFileUri')->willReturn($uri);
      $files[] = $file;
    }
    $image_items = $this->createMock(EntityReferenceFieldItemListInterface::class);
    $image_items->method('isEmpty')->willReturn($files === []);
    $image_items->method('referencedEntities')->willReturn($files);
    $media->method('get')->with('field_media_image')->willReturn($image_items);

    return $media;
  }

  /**
   * Builds the formatter's own field item list over the given media items.
   *
   * @param \Drupal\media\MediaInterface[] $media
   *   The referenced media items.
   */
  private function items(array $media): EntityReferenceFieldItemListInterface {
    $items = $this->createMock(EntityReferenceFieldItemListInterface::class);
    $items->method('referencedEntities')->willReturn($media);
    return $items;
  }

  /**
   * An empty selection renders nothing at all, and does not error.
   */
  public function testEmptySelectionRendersNothing(): void {
    $this->assertSame([], $this->formatter()->viewElements($this->items([]), 'en'));
  }

  /**
   * Media with no usable image is skipped rather than rendered empty.
   *
   * Scenario 3's real failure mode: an <img> with an empty src is worse than
   * no image at all, so a media item with an empty image field, or one of a
   * type that has no image field, must drop out of the candidate set.
   */
  public function testUnusableMediaAreSkipped(): void {
    $elements = $this->formatter()->viewElements(
      $this->items([
        $this->media(NULL),
        $this->media(NULL, has_field: FALSE),
      ]),
      'en',
    );

    $this->assertSame([], $elements);
  }

  /**
   * A single image renders as a responsive image, decorative, with no reroll.
   */
  public function testSingleImageRendersResponsiveAndDecorative(): void {
    $elements = $this->formatter()->viewElements(
      $this->items([$this->media('public://one.jpg')]),
      'en',
    );

    $this->assertCount(1, $elements);
    $element = $elements[0];

    // The responsive_image module's element — not a hand-rolled srcset.
    $this->assertSame('responsive_image', $element['#type']);
    $this->assertSame('i8_hero', $element['#responsive_image_style_id']);
    $this->assertSame('public://one.jpg', $element['#uri']);
    // Decorative: the hero's own <h1> carries the meaning.
    $this->assertSame('', $element['#alt']);

    // Nothing to reroll between, so no JS and no settings payload.
    $this->assertArrayNotHasKey('library', $element['#attached'] ?? []);
  }

  /**
   * Two or more images attach the client-side reroll for every candidate.
   *
   * The pick has to vary per page *load*, not per server render, because
   * Drupal's internal page cache stores anonymous responses permanently — so
   * the server renders one deterministic candidate and hands the full set to
   * the browser. Every configured image must appear in that set, or the
   * rotation silently covers only some of them.
   */
  public function testMultipleImagesAttachRerollDataForEveryCandidate(): void {
    $elements = $this->formatter()->viewElements(
      $this->items([
        $this->media('public://one.jpg'),
        $this->media('public://two.jpg'),
        $this->media('public://three.jpg'),
      ]),
      'en',
    );

    $element = $elements[0];
    $this->assertContains('i8_services/page_hero', $element['#attached']['library']);

    $alternates = $element['#attached']['drupalSettings']['i8PageHero']['alternates'];
    $this->assertCount(3, $alternates, 'every configured image must be a reroll candidate');
    $this->assertSame(
      [
        ['mobile' => '/files/styles/hero_mobile/one.jpg', 'desktop' => '/files/styles/hero_desktop/one.jpg'],
        ['mobile' => '/files/styles/hero_mobile/two.jpg', 'desktop' => '/files/styles/hero_desktop/two.jpg'],
        ['mobile' => '/files/styles/hero_mobile/three.jpg', 'desktop' => '/files/styles/hero_desktop/three.jpg'],
      ],
      array_values($alternates),
    );

    // The server-rendered pick is one of the candidates, not something else.
    $this->assertSame('public://one.jpg', $element['#uri']);
  }

  /**
   * Missing image styles degrade to a plain hero instead of fatalling.
   */
  public function testMissingImageStylesStillRenderTheHero(): void {
    $elements = $this->formatter(styles_exist: FALSE)->viewElements(
      $this->items([
        $this->media('public://one.jpg'),
        $this->media('public://two.jpg'),
      ]),
      'en',
    );

    $this->assertCount(1, $elements);
    $this->assertSame('responsive_image', $elements[0]['#type']);
    $this->assertArrayNotHasKey('library', $elements[0]['#attached'] ?? []);
  }

  /**
   * The output is tagged by the media it renders, so edits invalidate it.
   *
   * Scenario 4: the hero must stay page-cacheable. That only works if the
   * cached output knows what it depends on — every candidate's tags, not just
   * the one that happened to be rendered, since the reroll can show any of
   * them.
   */
  public function testOutputIsTaggedByEveryReferencedMedia(): void {
    $one = $this->media('public://one.jpg');
    $two = $this->media('public://two.jpg');

    $elements = $this->formatter()->viewElements($this->items([$one, $two]), 'en');

    $tags = $elements[0]['#cache']['tags'];
    foreach (array_merge($one->getCacheTags(), $two->getCacheTags()) as $tag) {
      $this->assertContains($tag, $tags);
    }
  }

}
