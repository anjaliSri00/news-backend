const crypto = require("crypto");

/**
 * Generate a short unique code.
 *   USR-A1B2C3D4  (13 chars)
 *   INT-9F8E7D6C  (13 chars)
 *
 * Uses 4 bytes of cryptographic randomness → 8 hex chars → 4.3 billion combinations.
 * Collision probability is negligible; callers should still catch unique-constraint errors.
 */
const generateCode = (prefix) => {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `${prefix}-${random}`;
};

const generateUserCode = () => generateCode("USR");
const generateInternalUserCode = () => generateCode("INT");

/**
 * Event codes include the current year: EVT-2025-A1B2C3
 * 3 bytes → 6 hex chars → 16.7 million per year. More than enough for a magazine.
 */
const generateEventCode = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `EVT-${year}-${random}`;
};

const generateHomeDecorCode = () => {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `HDR-${year}-${random}`;   // HDR-2026-A1B2C3
};

module.exports = {
  generateCode,
  generateUserCode,
  generateInternalUserCode,
  generateEventCode,
  generateHomeDecorCode,
};
