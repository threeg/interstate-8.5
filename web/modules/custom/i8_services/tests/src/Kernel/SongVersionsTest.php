<?php

declare(strict_types=1);

namespace Drupal\Tests\i8_services\Kernel;

use Drupal\KernelTests\KernelTestBase;
use Drupal\field\Entity\FieldConfig;
use Drupal\field\Entity\FieldStorageConfig;
use Drupal\i8_services\SongVersions;
use Drupal\node\Entity\Node;
use Drupal\node\Entity\NodeType;
use Drupal\node\NodeInterface;
use Drupal\user\Entity\Role;
use Drupal\user\RoleInterface;
use PHPUnit\Framework\Attributes\Group;

/**
 * Tests the INT8-035 song-version relationship service.
 *
 * Class under test: \Drupal\i8_services\SongVersions — the services-layer home
 * for the two entity questions INT8-035 moves out of
 * interstate_85_preprocess_node__song():
 *
 *   getParent(NodeInterface $song): ?NodeInterface
 *     The song's `field_parent_song` target (cardinality 1), but only when
 *     that target still exists AND the acting user may view it; otherwise
 *     NULL.
 *   getAlternates(NodeInterface $song): NodeInterface[]
 *     The reverse relationship — other `song` nodes whose `field_parent_song`
 *     points back at this one — published-only, sorted by title,
 *     access-checked at the query level.
 *
 * The move is specified as behaviour-preserving, so these expectations are
 * taken from the pre-move theme code verbatim (the `$parent->access('view')`
 * guard, and the query's `type` / `field_parent_song` / `status` conditions
 * with `sort('title')` and `accessCheck(TRUE)`).
 *
 * Written independently of the implementation, from the ticket and the
 * shipped field config (`field.storage.node.field_parent_song`,
 * `field.field.node.song.field_parent_song`, `node.type.song`) alone.
 *
 * The acting user throughout is the anonymous user with only 'access content'
 * — the same footing as a visitor browsing the site, which is what makes the
 * "unpublished parent is invisible" case a genuine access assertion rather
 * than a status assertion.
 */
#[Group('i8_services')]
class SongVersionsTest extends KernelTestBase {

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
    'i8_services',
  ];

  /**
   * The service under test.
   */
  protected SongVersions $songVersions;

  /**
   * {@inheritdoc}
   */
  protected function setUp(): void {
    parent::setUp();

    $this->installEntitySchema('user');
    $this->installEntitySchema('node');
    $this->installSchema('node', 'node_access');
    $this->installConfig(['field', 'filter', 'node', 'user']);

    // The acting user is anonymous, so the access checks in both methods hang
    // off this permission; without it every node is invisible and the tests
    // would pass for the wrong reason.
    Role::load(RoleInterface::ANONYMOUS_ID)
      ->grantPermission('access content')
      ->save();

    NodeType::create([
      'type' => 'song',
      'name' => 'Song',
    ])->save();

    // A second content type, so "only `song` nodes are considered" is a real
    // distinction in this test site rather than a vacuous one.
    NodeType::create([
      'type' => 'page',
      'name' => 'Basic page',
    ])->save();

    FieldStorageConfig::create([
      'field_name' => 'field_parent_song',
      'entity_type' => 'node',
      'type' => 'entity_reference',
      'cardinality' => 1,
      'settings' => ['target_type' => 'node'],
    ])->save();

    FieldConfig::create([
      'field_name' => 'field_parent_song',
      'entity_type' => 'node',
      'bundle' => 'song',
      'label' => 'Parent song',
      'required' => FALSE,
      'settings' => [
        'handler' => 'default:node',
        'handler_settings' => ['target_bundles' => ['song' => 'song']],
      ],
    ])->save();

    // Instantiated directly rather than fetched from the container by id:
    // the ticket fixes the constructor signature (an injected
    // EntityTypeManagerInterface), so this asserts the specified contract and
    // not the service-registration wiring, which has its own coverage in the
    // rendered page.
    $this->songVersions = new SongVersions($this->container->get('entity_type.manager'));
  }

  /**
   * Tests that a song's published alternates come back sorted by title.
   */
  public function testGetAlternatesReturnsPublishedAlternatesSortedByTitle(): void {
    $parent = $this->createSong('Dramamine');
    // Created in reverse title order on purpose: node ids would put "Zeta"
    // first, so a result in title order can only come from sort('title') and
    // not from the incidental order of creation or of a multiple-load.
    $this->createSong('Zeta version', ['field_parent_song' => $parent->id()]);
    $this->createSong('Alpha version', ['field_parent_song' => $parent->id()]);
    // Noise: an unrelated song, and an alternate of a different song.
    $other_parent = $this->createSong('Trailer Trash');
    $this->createSong('Beta version', ['field_parent_song' => $other_parent->id()]);

    $alternates = $this->songVersions->getAlternates($this->reload($parent));

    $this->assertCount(2, $alternates);
    foreach ($alternates as $alternate) {
      $this->assertInstanceOf(NodeInterface::class, $alternate);
    }
    $this->assertSame(
      ['Alpha version', 'Zeta version'],
      array_map(static fn (NodeInterface $node): string => $node->label(), array_values($alternates)),
    );
  }

  /**
   * Tests that a song nothing points at has no alternates.
   */
  public function testGetAlternatesReturnsEmptyArrayWhenSongHasNoAlternates(): void {
    $song = $this->createSong('Custom Concern');
    // Another song exists, but is not an alternate of this one.
    $this->createSong('Never Ending Math Equation');

    $this->assertSame([], $this->songVersions->getAlternates($this->reload($song)));
  }

  /**
   * Tests that an unpublished alternate is left out of the list.
   */
  public function testGetAlternatesExcludesUnpublishedAlternates(): void {
    $parent = $this->createSong('Doin the Cockroach');
    $this->createSong('Live version', ['field_parent_song' => $parent->id()]);
    $this->createSong('Draft version', [
      'field_parent_song' => $parent->id(),
      'status' => NodeInterface::NOT_PUBLISHED,
    ]);

    $alternates = $this->songVersions->getAlternates($this->reload($parent));

    $this->assertSame(
      ['Live version'],
      array_map(static fn (NodeInterface $node): string => $node->label(), array_values($alternates)),
    );
  }

  /**
   * Tests that a viewable parent is returned for an alternate.
   */
  public function testGetParentReturnsPublishedParent(): void {
    $parent = $this->createSong('Third Planet');
    $alternate = $this->createSong('Third Planet (acoustic)', ['field_parent_song' => $parent->id()]);

    $result = $this->songVersions->getParent($this->reload($alternate));

    $this->assertInstanceOf(NodeInterface::class, $result);
    $this->assertEquals($parent->id(), $result->id());
    $this->assertSame('Third Planet', $result->label());
  }

  /**
   * Tests that a song with an empty parent field has no parent.
   */
  public function testGetParentReturnsNullWhenNoParentIsSet(): void {
    $song = $this->createSong('Gravity Rides Everything');

    $this->assertNull($this->songVersions->getParent($this->reload($song)));
  }

  /**
   * Tests that a parent the acting user cannot view is not returned.
   */
  public function testGetParentReturnsNullWhenParentIsUnpublished(): void {
    $parent = $this->createSong('Unreleased Original', ['status' => NodeInterface::NOT_PUBLISHED]);
    $alternate = $this->createSong('Unreleased Original (live)', ['field_parent_song' => $parent->id()]);

    // Guard the premise: the anonymous acting user genuinely cannot view it,
    // so a NULL below is the access check doing its job.
    $this->assertFalse($this->reload($parent)->access('view'));

    $this->assertNull($this->songVersions->getParent($this->reload($alternate)));
  }

  /**
   * Tests that a dangling parent reference resolves to no parent.
   */
  public function testGetParentReturnsNullWhenParentHasBeenDeleted(): void {
    $parent = $this->createSong('Deleted Original');
    $alternate = $this->createSong('Deleted Original (alternate)', ['field_parent_song' => $parent->id()]);
    $parent_id = $parent->id();
    $parent->delete();

    // The reference itself survives the delete — core does not clean up
    // entity-reference targets — so the stored target id still points at a
    // node that is no longer there.
    $reloaded = $this->reload($alternate);
    $this->assertEquals($parent_id, $reloaded->get('field_parent_song')->target_id);

    $this->assertNull($this->songVersions->getParent($reloaded));
  }

  /**
   * Creates a published song node.
   *
   * @param string $title
   *   The song title.
   * @param array $values
   *   Extra field values, e.g. 'field_parent_song' or 'status'.
   *
   * @return \Drupal\node\NodeInterface
   *   The saved node.
   */
  protected function createSong(string $title, array $values = []): NodeInterface {
    $node = Node::create($values + [
      'type' => 'song',
      'title' => $title,
      'status' => NodeInterface::PUBLISHED,
      'uid' => 0,
    ]);
    $node->save();
    return $node;
  }

  /**
   * Reloads a node from storage, bypassing the static cache.
   *
   * Every method under test is handed a freshly loaded node, so no assertion
   * can be satisfied by an entity object that happens to still hold a
   * reference resolved before a later save or delete.
   *
   * @param \Drupal\node\NodeInterface $node
   *   The node to reload.
   *
   * @return \Drupal\node\NodeInterface
   *   The freshly loaded node.
   */
  protected function reload(NodeInterface $node): NodeInterface {
    $storage = $this->container->get('entity_type.manager')->getStorage('node');
    $storage->resetCache([$node->id()]);
    return $storage->load($node->id());
  }

}
