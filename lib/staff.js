const STAFF = (process.env.STAFF_EMAILS || "eyadellithy80@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const ADMIN = ["eyadellithy@gmail.com"];

function isStaffEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  return STAFF.includes(value) || ADMIN.includes(value);
}

module.exports = { isStaffEmail };
