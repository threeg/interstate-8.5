<?php

declare(strict_types=1);

namespace Drupal\Tests\i8_services\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\i8_services\SongTypeOptions;
use Drupal\taxonomy\Entity\Term;
use Drupal\taxonomy\Entity\Vocabulary;
use Drupal\taxonomy\TermInterface;
use Drupal\user\Entity\Role;
use Drupal\user\RoleInterface;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the INT8-041 published scoping of the Songs landing's Type filter.
 *
 * Class under test: \Drupal\i8_services\SongTypeOptions — the one method that
 * builds the Type control's options:
 *
 *   getTerms(): TermInterface[]
 *     The `song_type` terms offered as filter choices — published only
 *     (INT8-041), in weight order (INT8-018, FR-9).
 *
 * Written independently of the implementation, from the ticket and the shipped
 * vocabulary config (`taxonomy.vocabulary.song_type`) alone. `status` and
 * `weight` are Term base fields, so no field config is needed here.
 *
 * The acting user throughout is the anonymous user with only 'access content'
 * — a plain visitor. That matters because the ticket leaves the access posture
 * to the implementer: core adds no query-access hook for taxonomy terms, so
 * `accessCheck(TRUE)` filters nothing by itself, while a per-entity
 * `access('view')` posture would filter on this exact permission. Granting it
 * keeps every assertion below about *publishing status*, which is what the
 * ticket specifies, and never about a permission the fixture forgot.
 *
 * Two things the ticket does not pin, and which are therefore not asserted:
 * the array's keys (order is checked through `array_values()`, since the
 * contract is "terms in weight order", not "a list keyed 0..n"), and how equal
 * weights tie-break — no fixture here gives two terms the same weight.
 */
#[Group('i8_services')]
class SongTypeOptionsTest extends KernelTestBase {

  /**
   * {@inheritdoc}
   */
  protected static $modules = [
    'system',
    'user',
    'field',
    'filter',
    'text',
    'node',
    'taxonomy',
    'i8_services',
  ];

  /**
   * The service under test.
   */
  protected SongTypeOptions $songTypeOptions;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('taxonomy_term');
    $this->installConfig(['field', 'filter', 'taxonomy', 'user']);

    // See the class docblock: without this the anonymous acting user can view
    // no term at all, and an "unpublished terms are excluded" assertion could
    // pass for the wrong reason.
    Role::load(RoleInterface::ANONYMOUS_ID)
      ->grantPermission('access content')
      ->save();

    Vocabulary::create([
      'vid' => 'song_type',
      'name' => 'Song type',
    ])->save();

    // A second vocabulary, so "only `song_type` terms are offered" is a real
    // distinction in this test site rather than a vacuous one.
    Vocabulary::create([
      'vid' => 'other_vocabulary',
      'name' => 'Other vocabulary',
    ])->save();

    // Instantiated directly rather than fetched from the container by id: the
    // ticket fixes the constructor signature (an injected
    // EntityTypeManagerInterface), so this asserts the specified contract and
    // not the service-registration wiring, which has its own coverage in the
    // rendered page.
    $this->songTypeOptions = new SongTypeOptions($this->container->get('entity_type.manager'));
  }

  /**
   * Tests that an unpublished song type is not offered as a filter choice.
   */
  public function testGetTermsExcludesUnpublishedTerms(): void {
    $this->createSongType('Modest Mouse', 0);
    $this->createSongType('Retired Type', 1, ['status' => FALSE]);
    $this->createSongType('Covers', 2);

    $this->assertSame(
      ['Modest Mouse', 'Covers'],
      $this->labels($this->songTypeOptions->getTerms()),
    );
  }

  /**
   * Tests that the published terms come back in weight order.
   */
  public function testGetTermsReturnsPublishedTermsInWeightOrder(): void {
    // Created in reverse weight order on purpose: term ids would put "Covers"
    // first, so a result in weight order can only come from the sort and not
    // from the incidental order of creation or of a multiple-load.
    $this->createSongType('Covers', 30);
    $this->createSongType('Side Projects', 20);
    $this->createSongType('Ugly Casanova', 10);
    $this->createSongType('Modest Mouse', 0);

    $terms = $this->songTypeOptions->getTerms();

    foreach ($terms as $term) {
      $this->assertInstanceOf(TermInterface::class, $term);
    }
    $this->assertSame(
      ['Modest Mouse', 'Ugly Casanova', 'Side Projects', 'Covers'],
      $this->labels($terms),
    );
  }

  /**
   * Tests that today's four published types are all still offered, in order.
   *
   * The regression guard for the ticket's "the rendered filter bar must be
   * unchanged for today's data": with every term published, scoping to
   * published terms must drop nothing and reorder nothing.
   */
  public function testGetTermsIsUnchangedWhenEveryTermIsPublished(): void {
    $this->createSongType('Modest Mouse', 0);
    $this->createSongType('Ugly Casanova', 1);
    $this->createSongType('Side Projects', 2);
    $this->createSongType('Covers', 3);

    $terms = $this->songTypeOptions->getTerms();

    $this->assertCount(4, $terms);
    $this->assertSame(
      ['Modest Mouse', 'Ugly Casanova', 'Side Projects', 'Covers'],
      $this->labels($terms),
    );
  }

  /**
   * Tests that a vocabulary with nothing published offers no choices.
   */
  public function testGetTermsReturnsEmptyArrayWhenNoTermIsPublished(): void {
    $this->createSongType('Retired Type', 0, ['status' => FALSE]);
    $this->createSongType('Draft Type', 1, ['status' => FALSE]);

    // Asserted on the names rather than the terms themselves: a failure here
    // is a term that should not be offered, and this says which one it is
    // instead of dumping the entity object.
    $this->assertSame([], $this->labels($this->songTypeOptions->getTerms()));
  }

  /**
   * Tests that a published term in another vocabulary is not offered.
   */
  public function testGetTermsExcludesTermsFromOtherVocabularies(): void {
    $this->createSongType('Modest Mouse', 0);
    $term = Term::create([
      'vid' => 'other_vocabulary',
      'name' => 'Not A Song Type',
      'weight' => -10,
      'status' => TRUE,
    ]);
    $term->save();

    $this->assertSame(['Modest Mouse'], $this->labels($this->songTypeOptions->getTerms()));
  }

  /**
   * Tests that a vocabulary with no terms at all offers no choices.
   */
  public function testGetTermsReturnsEmptyArrayWhenVocabularyIsEmpty(): void {
    $this->assertSame([], $this->songTypeOptions->getTerms());
  }

  /**
   * Creates a published song_type term.
   *
   * @param string $name
   *   The term name.
   * @param int $weight
   *   The term weight, which fixes the order the filter offers it in.
   * @param array $values
   *   Extra field values, e.g. 'status'.
   *
   * @return \Drupal\taxonomy\TermInterface
   *   The saved term.
   */
  protected function createSongType(string $name, int $weight, array $values = []): TermInterface {
    $term = Term::create($values + [
      'vid' => 'song_type',
      'name' => $name,
      'weight' => $weight,
      'status' => TRUE,
    ]);
    $term->save();
    return $term;
  }

  /**
   * The names of the given terms, in the order they were returned.
   *
   * @param \Drupal\taxonomy\TermInterface[] $terms
   *   The terms to label.
   *
   * @return string[]
   *   The term names.
   */
  protected function labels(array $terms): array {
    return array_map(
      static fn (TermInterface $term): string => (string) $term->label(),
      array_values($terms),
    );
  }

}
