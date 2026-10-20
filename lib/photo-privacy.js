/** One-way photo privacy helpers for binder / family album. */

function itemsOf(row) {
  return row && row.items && typeof row.items === "object" ? row.items : {};
}

/** Photo is permanently public (owner cannot unpublish or delete). */
function isPublishLocked(items) {
  const it = items || {};
  if (it.publish_locked === true) return true;
  if (it.shared === true && it.published_at) return true;
  // Legacy public photos (shared missing or true) are treated as locked.
  if (it.shared === true) return true;
  if (it.shared == null && it.privacy === "public") return true;
  return false;
}

/** Visible in the shared family album for other participants. */
function isFamilyAlbumVisible(items) {
  const it = items || {};
  if (it.rejected === true || it.hidden === true || it.admin_hidden === true) return false;
  if (it.moderated === false) return false;
  if (it.shared === false) return false;
  // shared true, or legacy default shared
  return it.shared === true || (it.shared == null && it.privacy !== "private");
}

function isPrivatePhoto(items) {
  const it = items || {};
  if (it.rejected === true) return false;
  return it.shared === false || it.privacy === "private";
}

function ownerCapabilities(items, isOwner) {
  if (!isOwner) {
    return { can_delete: false, can_publish: false, can_unpublish: false, publish_locked: isPublishLocked(items) };
  }
  const locked = isPublishLocked(items);
  const priv = isPrivatePhoto(items) && !locked;
  return {
    can_delete: priv,
    can_publish: priv,
    can_unpublish: false,
    publish_locked: locked,
  };
}

function markPublished(items) {
  const now = new Date().toISOString();
  return Object.assign({}, items || {}, {
    shared: true,
    privacy: "public",
    publish_locked: true,
    published_at: (items && items.published_at) || now,
    moderated: items && items.moderated === false ? false : true,
    rejected: false,
  });
}

function markPrivate(items) {
  return Object.assign({}, items || {}, {
    shared: false,
    privacy: "private",
    publish_locked: false,
  });
}

module.exports = {
  itemsOf,
  isPublishLocked,
  isFamilyAlbumVisible,
  isPrivatePhoto,
  ownerCapabilities,
  markPublished,
  markPrivate,
};
