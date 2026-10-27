/**
 * Seeds an internal_users row for the seeded superadmin.
 *
 * Why: even though `is_superadmin = true` bypasses the internal_users check
 * at login, having a row makes the admin show up in the internal users list,
 * gives them an INT-XXXXXXXX code, and keeps the data model consistent.
 *
 * Dependencies (must run BEFORE this file):
 *   01_user_type_enums.js  → creates the 'admin' type
 *   02_admin_user.js       → creates the superadmin user
 *
 * Safe to re-run:
 *   - If the row already exists → no duplicate, only updates user_types if needed
 *   - If the admin user or type is missing → logs a warning, skips cleanly
 *   - Preserves is_active (respects admin's intent if they disabled it)
 */

const { generateInternalUserCode } = require("../../utils/codeGenerator");

// ⚠️ Must match the email used in 02_admin_user.js
const ADMIN_EMAIL = "test@example.com";

exports.seed = async function seed(knex) {
  /* ── 1. Find the admin user ───────────────────────────── */
  const admin = await knex("users")
    .where({ email: ADMIN_EMAIL })
    .whereNull("deleted_at")
    .first();

  if (!admin) {
    console.warn(
      `[seed] internal_users — admin user not found (${ADMIN_EMAIL}). ` +
        `Run 02_admin_user.js first. Skipping.`
    );
    return;
  }

  /* ── 2. Find the admin user type ──────────────────────── */
  const adminType = await knex("user_type_enums")
    .where({ name: "admin" })
    .first();

  if (!adminType) {
    console.warn(
      `[seed] internal_users — 'admin' user type not found. ` +
        `Run 01_user_type_enums.js first. Skipping.`
    );
    return;
  }

  /* ── 3. Already exists? ───────────────────────────────── */
  const existing = await knex("internal_users")
    .where({ user_id: admin.id })
    .first();

  if (existing) {
    // Ensure 'admin' is in the user_types array
    const types = existing.user_types || [];
    const hasAdmin = types.includes(adminType.id);

    if (!hasAdmin) {
      await knex("internal_users")
        .where({ id: existing.id })
        .update({
          user_types: knex.raw("array_append(user_types, ?::uuid)", [
            adminType.id,
          ]),
          updated_at: knex.fn.now(),
        });
      console.log(
        `[seed] internal_users — added 'admin' type to ${ADMIN_EMAIL} ` +
          `(code: ${existing.code})`
      );
    } else {
      console.log(
        `[seed] internal_users — ${ADMIN_EMAIL} already internal ` +
          `(code: ${existing.code}, active: ${existing.is_active})`
      );
    }

    if (existing.is_active === false) {
      console.warn(
        `[seed] ⚠️  ${ADMIN_EMAIL} internal_users row is disabled. ` +
          `Superadmin bypass still allows login, but list UI will show inactive.`
      );
    }
    return;
  }

  /* ── 4. Insert a new row ──────────────────────────────── */
  const code = generateInternalUserCode();

  const [row] = await knex("internal_users")
    .insert({
      code,
      user_id: admin.id,
      user_types: knex.raw("?::uuid[]", [[adminType.id]]),
      is_active: true,
      invited_by: null, // first internal user — no one invited them
      invited_at: knex.fn.now(),
      created_at: knex.fn.now(),
      updated_at: knex.fn.now(),
    })
    .returning("*");

  console.log(
    `[seed] internal_users — created for ${ADMIN_EMAIL} ` +
      `(user_code: ${admin.code}, int_code: ${row.code}, type: admin)`
  );
};