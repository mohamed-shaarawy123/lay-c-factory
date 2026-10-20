/**
 * Authorized admin emails for /admin and privileged APIs.
 * Prefer STAFF_EMAILS (comma-separated) in the server environment.
 * There is no public admin registration — only allowlisted emails pass.
 */
const FROM_ENV = String(process.env.STAFF_EMAILS || process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

// Fallback keep existing operators working until STAFF_EMAILS is set in production.
const FALLBACK = ["eyadellithy80@gmail.com", "eyadellithy@gmail.com"];

const STAFF = FROM_ENV.length ? FROM_ENV : FALLBACK;

function isStaffEmail(email) {
  const value = String(email || "")
    .trim()
    .toLowerCase();
  if (!value) return false;
  return STAFF.includes(value);
}

module.exports = { isStaffEmail, STAFF };
