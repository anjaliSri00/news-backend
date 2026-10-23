/**
 * Password hashing and verification utilities.
 *
 * Uses bcryptjs (pure JS, no native compilation needed — safe on Windows).
 *
 * Usage:
 *   const { hashPassword, verifyPassword } = require('../utils/password');
 *
 *   const hash = await hashPassword('Password1');
 *   const ok   = await verifyPassword('Password1', hash);   // true
 *   const bad  = await verifyPassword('Wrong',     hash);   // false
 *
 * Do NOT:
 *   - Store the plain password anywhere
 *   - Return the hash in any API response
 *   - Log the plain password or the hash
 */

const bcrypt = require("bcryptjs");

/* ──────────────────────────────────────────────────────
 * Salt rounds — the work factor for bcrypt.
 *
 *   10 = ~100ms per hash (good balance, production-safe)
 *   12 = ~400ms per hash (stronger but slower — good for
 *        admin-only accounts, too slow for high-volume signup)
 *
 * Keep 10 unless you have a specific reason to change it.
 * Increasing it invalidates existing hashes only if you also
 * re-hash on next login — otherwise leave it alone.
 * ────────────────────────────────────────────────────── */
const SALT_ROUNDS = 10;

/**
 * Hash a plain-text password.
 * @param   {string} plain      The password in plain text
 * @returns {Promise<string>}   bcrypt hash (60 chars, includes salt)
 * @throws  {Error}             If input is not a string or hashing fails
 */
const hashPassword = async (plain) => {
  if (typeof plain !== "string" || plain.length === 0) {
    throw new Error("hashPassword: password must be a non-empty string");
  }
  return bcrypt.hash(plain, SALT_ROUNDS);
};

/**
 * Verify a plain-text password against a bcrypt hash.
 *
 * Returns `false` on ANY failure — bad input, missing hash,
 * malformed hash, wrong password — so callers never need
 * try/catch around this.
 *
 * @param   {string} plain      The password to check
 * @param   {string} hash       The stored bcrypt hash
 * @returns {Promise<boolean>}  true if they match, false otherwise
 */
const verifyPassword = async (plain, hash) => {
  if (!plain || !hash) return false;
  if (typeof plain !== "string" || typeof hash !== "string") return false;

  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    // Malformed hash, bcrypt error, anything else → treat as mismatch
    return false;
  }
};

/**
 * Check whether a hash needs to be re-hashed because the
 * current SALT_ROUNDS is higher than what created it.
 *
 * Useful if you ever bump SALT_ROUNDS — call this in login
 * and re-hash on success:
 *
 *   if (needsRehash(user.password_hash)) {
 *     user.password_hash = await hashPassword(password);
 *     await updateUser(...);
 *   }
 *
 * @param   {string} hash       The stored bcrypt hash
 * @returns {boolean}           true if it should be re-hashed
 */
const needsRehash = (hash) => {
  if (!hash || typeof hash !== "string") return true;
  try {
    const cost = bcrypt.getRounds(hash); // extract work factor
    return cost < SALT_ROUNDS;
  } catch {
    return true; // malformed → treat as needing rehash
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  needsRehash,
};
