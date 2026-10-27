const knex = require("../../../db/sqldb").db;
const logger = require("../../../utils/logger"); // ✅ FIXED: uncommented + correct path
const { verifyPassword } = require("../../../utils/password");
const { generateInternalUserCode } = require("../../../utils/codeGenerator"); // ✅ FIXED: was password.js

/* ══════════════════════════════════════════════════════════
 * Helper — UUID validation
 * Postgres throws 22P02 on bad UUID input, which would surface as
 * a 500. Validate first and return a clean 400.
 * ══════════════════════════════════════════════════════════ */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUUID = (v) => typeof v === "string" && UUID_REGEX.test(v);

/* ══════════════════════════════════════════════════════════
 * Resolve user_types UUIDs → { id, name, display_name }
 * ══════════════════════════════════════════════════════════ */
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

/* ══════════════════════════════════════════════════════════
 * Update login timestamps (non-critical)
 * ══════════════════════════════════════════════════════════ */
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
  }
};

/* ══════════════════════════════════════════════════════════
 * AUTH — internal login
 * ✅ ADDED: input guards (trim email, non-empty password)
 * ══════════════════════════════════════════════════════════ */
const internalLogin = async (email, password) => {
  try {
    // ── Input guards ──
    if (typeof email !== "string" || !email.trim()) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      };
    }
    if (typeof password !== "string" || !password) {
      return {
        success: false,
        code: "INVALID_CREDENTIALS",
        message: "Invalid email or password.",
      };
    }

    const trimmedEmail = email.trim();

    // 1. Find user
    const user = await knex("users")
      .where({ email: trimmedEmail, is_active: true })
      .whereNull("deleted_at")
      .first();

    if (!user) {
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

/* ══════════════════════════════════════════════════════════
 * Get internal user profile
 * ══════════════════════════════════════════════════════════ */
const getInternalMe = async (userId) => {
  try {
    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid user id.",
      };
    }

    const user = await knex("users")
      .select(
        "id",
        "code",
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
        internal_user_code: internalUser?.code || null,
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

/* ══════════════════════════════════════════════════════════
 * Create internal user (promote existing user)
 * ✅ ADDED: UUID validation for userId + each userType id
 * ══════════════════════════════════════════════════════════ */
const createInternalUser = async ({ userId, userTypes }, invitedBy) => {
  try {
    // ── Input guards ──
    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid user id.",
      };
    }
    if (!Array.isArray(userTypes) || userTypes.length === 0) {
      return {
        success: false,
        code: "INVALID_USER_TYPES",
        message: "At least one user type is required.",
      };
    }
    if (!userTypes.every(isUUID)) {
      return {
        success: false,
        code: "INVALID_USER_TYPES",
        message: "One or more user type IDs are invalid.",
      };
    }
    // Dedupe in case the client sends the same id twice
    const uniqueUserTypes = [...new Set(userTypes)];

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

    // 3. Validate user types exist
    const validTypes = await knex("user_type_enums")
      .whereIn("id", uniqueUserTypes)
      .select("id");
    if (validTypes.length !== uniqueUserTypes.length) {
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
        user_types: knex.raw("?::uuid[]", [uniqueUserTypes]),
        is_active: true,
        invited_by: invitedBy || null,
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

/* ══════════════════════════════════════════════════════════
 * List all internal users
 * ✅ ADDED: resolve user_types UUIDs → names in one batch query
 * ══════════════════════════════════════════════════════════ */
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

    // Collect every user_type id across all rows, then fetch them once
    const allTypeIds = new Set();
    for (const row of rows) {
      (row.user_types || []).forEach((id) => allTypeIds.add(id));
    }

    let typeMap = new Map();
    if (allTypeIds.size > 0) {
      const types = await knex("user_type_enums")
        .whereIn("id", [...allTypeIds])
        .select("id", "name", "display_name");
      typeMap = new Map(types.map((t) => [t.id, t]));
    }

    const data = rows.map((row) => ({
      ...row,
      user_types: (row.user_types || []).map(
        (id) =>
          typeMap.get(id) || { id, name: "unknown", display_name: "Unknown" },
      ),
    }));

    return { success: true, data };
  } catch (error) {
    logger.error("listInternalUsers error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to list internal users.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * Revoke (soft) — set is_active = false
 * ✅ ADDED: UUID validation
 * ══════════════════════════════════════════════════════════ */
const revokeInternalUser = async (internalUserId) => {
  try {
    if (!isUUID(internalUserId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid internal user id.",
      };
    }

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

/* ══════════════════════════════════════════════════════════
 * ACCESS — full tree (unchanged)
 * ══════════════════════════════════════════════════════════ */
const getAccessTree = async () => {
  try {
    const flows = await knex("flows")
      .where({ is_active: true })
      .orderBy("sort_order");
    const pages = await knex("pages")
      .where({ is_active: true })
      .orderBy("sort_order");
    const components = await knex("components")
      .where({ is_active: true })
      .orderBy("sort_order");
    const values = await knex("component_values")
      .where({ is_active: true })
      .orderBy("sort_order");

    const valuesByComp = new Map();
    for (const v of values) {
      if (!valuesByComp.has(v.component_id))
        valuesByComp.set(v.component_id, []);
      valuesByComp.get(v.component_id).push(v);
    }

    const compsByPage = new Map();
    for (const c of components) {
      if (!compsByPage.has(c.page_id)) compsByPage.set(c.page_id, []);
      compsByPage.get(c.page_id).push({
        id: c.id,
        name: c.name,
        display_name: c.display_name,
        component_type: c.component_type,
        values: valuesByComp.get(c.id) || [],
      });
    }

    const pagesByFlow = new Map();
    for (const p of pages) {
      if (!pagesByFlow.has(p.flow_id)) pagesByFlow.set(p.flow_id, []);
      pagesByFlow.get(p.flow_id).push({
        id: p.id,
        name: p.name,
        display_name: p.display_name,
        page_type: p.page_type,
        components: compsByPage.get(p.id) || [],
      });
    }

    const tree = flows.map((f) => ({
      id: f.id,
      name: f.name,
      display_name: f.display_name,
      section: f.section,
      icon: f.icon,
      pages: pagesByFlow.get(f.id) || [],
    }));

    return { success: true, data: tree };
  } catch (error) {
    logger.error("getAccessTree error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to load access tree.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * ACCESS — grant
 * ✅ ADDED: UUID validation for userId + targetId
 * ══════════════════════════════════════════════════════════ */
const LEVEL_TABLE_MAP = {
  flow: { table: "user_flow_access", fk: "flow_id", source: "flows" },
  page: { table: "user_page_access", fk: "page_id", source: "pages" },
  component: {
    table: "user_component_access",
    fk: "component_id",
    source: "components",
  },
  component_value: {
    table: "user_component_value_access",
    fk: "component_value_id",
    source: "component_values",
  },
};

const grantAccess = async ({ userId, level, targetId, grantedBy }) => {
  try {
    const cfg = LEVEL_TABLE_MAP[level];
    if (!cfg) {
      return {
        success: false,
        code: "INVALID_LEVEL",
        message: `Level must be one of: ${Object.keys(LEVEL_TABLE_MAP).join(", ")}`,
      };
    }

    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid user id.",
      };
    }
    if (!isUUID(targetId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid target id.",
      };
    }

    // Verify user
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

    // Verify target exists
    const target = await knex(cfg.source).where({ id: targetId }).first();
    if (!target) {
      return {
        success: false,
        code: "TARGET_NOT_FOUND",
        message: `${level} not found.`,
      };
    }

    // Already granted (not revoked)?
    const existing = await knex(cfg.table)
      .where({ user_id: userId, [cfg.fk]: targetId })
      .whereNull("revoked_at")
      .first();
    if (existing) {
      return { success: true, data: existing, already: true };
    }

    // Insert new grant
    const [row] = await knex(cfg.table)
      .insert({
        user_id: userId,
        [cfg.fk]: targetId,
        granted_by: grantedBy || null,
        granted_at: knex.fn.now(),
      })
      .returning("*");

    return { success: true, data: row };
  } catch (error) {
    if (error.code === "23505") {
      return {
        success: false,
        code: "ALREADY_GRANTED",
        message: "Access already granted.",
      };
    }
    logger.error("grantAccess error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to grant access.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * ACCESS — revoke
 * ✅ ADDED: UUID validation
 * ══════════════════════════════════════════════════════════ */
const revokeAccess = async ({ userId, level, targetId }) => {
  try {
    const cfg = LEVEL_TABLE_MAP[level];
    if (!cfg) {
      return {
        success: false,
        code: "INVALID_LEVEL",
        message: "Invalid level.",
      };
    }

    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid user id.",
      };
    }
    if (!isUUID(targetId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid target id.",
      };
    }

    const deleted = await knex(cfg.table)
      .where({ user_id: userId, [cfg.fk]: targetId })
      .del();

    if (deleted === 0) {
      return {
        success: false,
        code: "NOT_FOUND",
        message: "Access record not found.",
      };
    }

    return { success: true, data: { deleted } };
  } catch (error) {
    logger.error("revokeAccess error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to revoke access.",
    };
  }
};

/* ══════════════════════════════════════════════════════════
 * ACCESS — get user's current grants
 * ✅ ADDED: UUID validation
 * ══════════════════════════════════════════════════════════ */
const getUserAccess = async (userId) => {
  try {
    if (!isUUID(userId)) {
      return {
        success: false,
        code: "INVALID_INPUT",
        message: "Invalid user id.",
      };
    }

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

    const flows = await knex("user_flow_access as ufa")
      .join("flows as f", "f.id", "ufa.flow_id")
      .where({ "ufa.user_id": userId })
      .whereNull("ufa.revoked_at")
      .select(
        "ufa.id as grant_id",
        "ufa.flow_id as target_id",
        "f.name",
        "f.display_name",
        "ufa.granted_at",
      );

    const pages = await knex("user_page_access as upa")
      .join("pages as p", "p.id", "upa.page_id")
      .join("flows as f", "f.id", "p.flow_id")
      .where({ "upa.user_id": userId })
      .whereNull("upa.revoked_at")
      .select(
        "upa.id as grant_id",
        "upa.page_id as target_id",
        "p.name",
        "p.display_name",
        "f.name as flow_name",
        "upa.granted_at",
      );

    const components = await knex("user_component_access as uca")
      .join("components as c", "c.id", "uca.component_id")
      .join("pages as p", "p.id", "c.page_id")
      .join("flows as f", "f.id", "p.flow_id")
      .where({ "uca.user_id": userId })
      .whereNull("uca.revoked_at")
      .select(
        "uca.id as grant_id",
        "uca.component_id as target_id",
        "c.name",
        "c.display_name",
        "p.name as page_name",
        "f.name as flow_name",
        "uca.granted_at",
      );

    const componentValues = await knex("user_component_value_access as ucva")
      .join("component_values as cv", "cv.id", "ucva.component_value_id")
      .join("components as c", "c.id", "cv.component_id")
      .join("pages as p", "p.id", "c.page_id")
      .join("flows as f", "f.id", "p.flow_id")
      .where({ "ucva.user_id": userId })
      .whereNull("ucva.revoked_at")
      .select(
        "ucva.id as grant_id",
        "ucva.component_value_id as target_id",
        "cv.name",
        "cv.display_name",
        "c.name as component_name",
        "p.name as page_name",
        "f.name as flow_name",
        "ucva.granted_at",
      );

    return {
      success: true,
      data: {
        user_id: userId,
        is_superadmin: user.is_superadmin,
        flows,
        pages,
        components,
        component_values: componentValues,
      },
    };
  } catch (error) {
    logger.error("getUserAccess error", { error: error.message });
    return {
      success: false,
      code: "SERVER_ERROR",
      message: "Failed to fetch user access.",
    };
  }
};

module.exports = {
  internalLogin,
  getInternalMe,
  createInternalUser,
  listInternalUsers,
  revokeInternalUser,
  getAccessTree,
  grantAccess,
  revokeAccess,
  getUserAccess,
};
