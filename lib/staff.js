const STAFF = (process.env.STAFF_EMAILS || "eyadellithy80@gmail.com")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function isStaffEmail(email) {
  return STAFF.includes(String(email || "").trim().toLowerCase());
}

module.exports = { isStaffEmail };
