const knex = require("../../db/knex");
const logger = require("../../utils/logger");
const { verifyPassword } = require("../../utils/password");
const { generateInternalUserCode } = require("../../utils/codeGenerator");
/* ──────────────────────────────────────────────────────
 * Resolve user_types UUIDs → { id, name, display_name }
 * ────────────────────────────────────────────────────── */
const resolveUserTypes = async (typeIds) => {
  try {
    if (!typeIds || typeIds.length === 0) return [];
    return await knex("user_type_enums")
      .select("id", "name", "display_name")
      .whereIn("id", typeIds);
  } catch (error) {
    logger.error("resolveUserTypes error", { error: error.message });
    return [];
  }
};

/* ──────────────────────────────────────────────────────
 * Update login timestamps (non-critical)
 * ────────────────────────────────────────────────────── */
const updateLoginTimestamps = async (userId, internalUserId) => {
  try {
    await knex("users")
      .where({ id: userId })
      .update({ last_login_at: knex.fn.now() });

    if (internalUserId) {
      await knex("internal_users").where({ id: internalUserId }).update({
        last_dashboard_login_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
    }
  } catch (error) {
    logger.error("updateLoginTimestamps error", { error: error.message });
    // non-critical — ignore
  }
};

/* ──────────────────────────────────────────────────────
 * Internal login
 * ALWAYS returns an object: { success, data | code | message }
 * NEVER throws.
 * ────────────────────────────────────────────────────── */
const internalLogin = async (email, password) => {
  try {
    // 1. Find user
    const user = await knex("users")
      .where({ email, is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!user) {
      // Same generic message — no info leak
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      };
    }

    // 2. Verify password
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      };
    }

    // 3. Check dashboard access
    const internalUser = await knex("internal_users")
      .where({ user_id: user.id, is_active: true })
      .first();

    const canAccess = user.is_superadmin || Boolean(internalUser);
    if (!canAccess) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      };
    }

    // 4. Bump timestamps (non-critical)
    await updateLoginTimestamps(user.id, internalUser?.id);

    // 5. Resolve user_types names
    const userTypes = await resolveUserTypes(internalUser?.user_types || []);

    return { success: true, data: { user, internalUser, userTypes } };
  } catch (error) {
    logger.error("internalLogin unexpected error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }
};

/* ──────────────────────────────────────────────────────
 * Get internal user profile
 * ────────────────────────────────────────────────────── */
const getInternalMe = async (userId) => {
  try {
    const user = await knex("users")
      .select(
        "id",
        "code", // ← ADDED (was missing)
        "name",
        "email",
        "is_superadmin",
        "avatar",
        "job_title",
        "last_login_at",
      )
      .where({ id: userId, is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!user) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      };
    }

    const internalUser = await knex("internal_users")
      .where({ user_id: userId, is_active: true })
      .first();

    const userTypes = await resolveUserTypes(internalUser?.user_types || []);

    return {
      success: true,
      data: {
        ...user,
        internal_user_id: internalUser?.id || null,
        internal_user_code: internalUser?.code || null, // ← ADDED
        internal_user_types: userTypes,
        last_dashboard_login_at: internalUser?.last_dashboard_login_at || null,
      },
    };
  } catch (error) {
    logger.error("getInternalMe unexpected error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Something went wrong. Please try again.",
    };
  }
};

/* ──────────────────────────────────────────────────────
 * Create internal user (promote existing user)
 * ────────────────────────────────────────────────────── */
const createInternalUser = async ({ userId, userTypes }, invitedBy) => {
  try {
    // 1. Verify user exists
    const user = await knex("users")
      .where({ id: userId })
      .whereNull("deleted_at")
      .first();
    if (!user) {
      return {
        success: false,
        code: "USER_NOT_FOUND",
        message: "User not found.",
      };
    }

    // 2. Already internal?
    const existing = await knex("internal_users")
      .where({ user_id: userId })
      .first();
    if (existing) {
      return {
        success: false,
        code: "ALREADY_INTERNAL",
        message: "User already has dashboard access.",
      };
    }

    // 3. Validate userTypes
    if (!Array.isArray(userTypes) || userTypes.length === 0) {
      return {
        success: false,
        code: "INVALID_USER_TYPES",
        message: "At least one user type is required.",
      };
    }

    const validTypes = await knex("user_type_enums")
      .whereIn("id", userTypes)
      .select("id");
    if (validTypes.length !== userTypes.length) {
      return {
        success: false,
        code: "INVALID_USER_TYPES",
        message: "One or more user types do not exist.",
      };
    }

    // 4. Insert
    const code = generateInternalUserCode();
    const [row] = await knex("internal_users")
      .insert({
        code,
        user_id: userId,
        user_types: knex.raw("?::uuid[]", [userTypes]),
        is_active: true,
        invited_by: invitedBy,
        invited_at: knex.fn.now(),
      })
      .returning("*");

    return { success: true, data: row };
  } catch (error) {
    logger.error("createInternalUser error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to create internal user.",
    };
  }
};

/* ──────────────────────────────────────────────────────
 * List all internal users
 * ────────────────────────────────────────────────────── */
const listInternalUsers = async () => {
  try {
    const rows = await knex("internal_users as iu")
      .join("users as u", "u.id", "iu.user_id")
      .select(
        "iu.id",
        "iu.code",
        "iu.user_types",
        "iu.is_active",
        "iu.invited_at",
        "iu.last_dashboard_login_at",
        "u.id as user_id",
        "u.name as user_name",
        "u.email as user_email",
        "u.code as user_code",
      )
      .orderBy("iu.created_at", "desc");

    return { success: true, data: rows };
  } catch (error) {
    logger.error("listInternalUsers error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to list internal users.",
    };
  }
};

/* ──────────────────────────────────────────────────────
 * Revoke (soft) — set is_active = false
 * ────────────────────────────────────────────────────── */
const revokeInternalUser = async (internalUserId) => {
  try {
    const [row] = await knex("internal_users")
      .where({ id: internalUserId })
      .update({ is_active: false, updated_at: knex.fn.now() })
      .returning("*");

    if (!row) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Internal user not found.",
      };
    }

    return { success: true, data: row };
  } catch (error) {
    logger.error("revokeInternalUser error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to revoke access.",
    };
  }
};

module.exports = {
  internalLogin,
  getInternalMe,
  createInternalUser,
  listInternalUsers,
  revokeInternalUser,
};
