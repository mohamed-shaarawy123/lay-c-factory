/** One-way photo privacy helpers for binder / family album. */

function itemsOf(row) {
  return row && row.items && typeof row.items === "object" ? row.items : {};
}

/** approved | pending | rejected. Legacy saved photos count as approved. */
function moderationStatus(items) {
  const it = items || {};
  if (it.rejected === true || it.moderation_status === "rejected") return "rejected";
  if (it.moderation_status === "pending" || it.pending === true) return "pending";
  if (it.moderated === false && it.moderation_status !== "approved") return "pending";
  return "approved";
}

/** The signed-in user's binder has been published. Irreversible. */
function isAlbumPublished(items) {
  const it = items || {};
  return it.album_published === true;
}

/** Photo is permanently public (owner cannot unpublish or delete). */
function isPublishLocked(items) {
  const it = items || {};
  if (moderationStatus(it) !== "approved") return false;
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
  if (moderationStatus(it) !== "approved") return false;
  if (it.rejected === true || it.hidden === true || it.admin_hidden === true) return false;
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
  const status = moderationStatus(items);
  const locked = isPublishLocked(items);
  if (!isOwner) {
    return {
      can_delete: false,
      can_publish: false,
      can_unpublish: false,
      can_edit: false,
      publish_locked: locked,
      pending: status === "pending",
    };
  }
  const pending = status === "pending";
  const approvedPrivate = status === "approved" && isPrivatePhoto(items) && !locked;
  return {
    can_delete: !locked && (approvedPrivate || pending),
    can_publish: approvedPrivate,
    can_unpublish: false,
    can_edit: false,
    publish_locked: locked,
    pending,
  };
}

function markPublished(items) {
  const now = new Date().toISOString();
  return Object.assign({}, items || {}, {
    shared: true,
    privacy: "public",
    privacy_status: "public",
    publish_locked: true,
    published_at: (items && items.published_at) || now,
    moderated: true,
    moderation_status: "approved",
    pending: false,
    rejected: false,
  });
}

function markPrivate(items) {
  return Object.assign({}, items || {}, {
    shared: false,
    privacy: "private",
    privacy_status: "private",
    publish_locked: false,
    pending: false,
  });
}

function markPending(items) {
  const now = new Date().toISOString();
  return Object.assign({}, markPrivate(items), {
    moderated: false,
    moderation_status: "pending",
    pending: true,
    rejected: false,
    moderation_decided_at: (items && items.moderation_decided_at) || now,
  });
}

function markAlbumPublished(items) {
  const now = new Date().toISOString();
  return Object.assign({}, items || {}, {
    private: false,
    album_published: true,
    privacy: "public",
    privacy_status: "public",
    publish_locked: true,
    published_at: (items && items.published_at) || now,
    share_preference: "public",
  });
}

module.exports = {
  itemsOf,
  moderationStatus,
  isAlbumPublished,
  isPublishLocked,
  isFamilyAlbumVisible,
  isPrivatePhoto,
  ownerCapabilities,
  markPublished,
  markPrivate,
  markPending,
  markAlbumPublished,
};
