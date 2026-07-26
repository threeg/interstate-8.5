<?php

declare(strict_types=1);

namespace Drupal\i8_services\MediaLibrary;

use Drupal\Core\Access\AccessResult;
use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\InvokeCommand;
use Drupal\Core\Session\AccountInterface;
use Drupal\media_library\MediaLibraryOpenerInterface;
use Drupal\media_library\MediaLibraryState;

/**
 * Opens the media library from the page-hero block's own config form.
 *
 * Core's media_library_widget field widget (Drupal\media_library\Plugin\
 * Field\FieldWidget\MediaLibraryWidget) can't be reused as-is here: it's
 * built entirely around FieldItemListInterface / a field on a fieldable
 * entity, and the hero's background-image list is plain block plugin
 * configuration (an array of media IDs), not a field. This opener + the
 * block's own blockForm() reimplement just the two moving parts a field
 * widget gets for free — opening the modal and receiving its selection —
 * without the field-specific bookkeeping (weights/tabledrag) this use case
 * doesn't need, since order has no meaning for a random pick.
 */
class PageHeroMediaLibraryOpener implements MediaLibraryOpenerInterface {

  /**
   * {@inheritdoc}
   */
  public function checkAccess(MediaLibraryState $state, AccountInterface $account) {
    return AccessResult::allowedIfHasPermission($account, 'administer blocks');
  }

  /**
   * {@inheritdoc}
   */
  public function getSelectionResponse(MediaLibraryState $state, array $selected_ids) {
    $ids = implode(',', $selected_ids);
    return (new AjaxResponse())
      ->addCommand(new InvokeCommand('[data-i8-page-hero-value]', 'val', [$ids]))
      ->addCommand(new InvokeCommand('[data-i8-page-hero-update]', 'trigger', ['mousedown']));
  }

}
