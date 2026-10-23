const knex = require("../../db/sqldb").db;
const logger = require("../../utils/logger");
const { generateUserCode } = require("../../utils/codeGenerator");

/* ──────────────────────────────────────────────────────
 * Uniform return helpers — never throw
 * ────────────────────────────────────────────────────── */
const ok = (data) => ({ success: true, data });
const fail = (code, message) => ({ success: false, code, message });
const serverError = (label, error) => {
  logger.error(`${label} error`, { error: error.message });
  return fail("SERVER_ERROR", "Something went wrong. Please try again.");
};

/* ──────────────────────────────────────────────────────
 * Users
 * ────────────────────────────────────────────────────── */
const findUserById = async (userId) => {
  try {
    const user = await knex("users")
      .where({ id: userId, is_active: true })
      .whereNull("deleted_at")
      .first();
    return ok(user);
  } catch (error) {
    return serverError("findUserById", error);
  }
};

const findUserByEmail = async (email) => {
  try {
    const user = await knex("users")
      .where({ email, is_active: true })
      .whereNull("deleted_at")
      .first();
    return ok(user);
  } catch (error) {
    return serverError("findUserByEmail", error);
  }
};

const findUserByEmailWithType = async (email) => {
  try {
    const user = await knex("users as u")
      .leftJoin("user_type_enums as t", "t.id", "u.user_type")
      .select("u.*", "t.name as user_type_name")
      .where({ "u.email": email, "u.is_active": true })
      .whereNull("u.deleted_at")
      .first();
    return ok(user);
  } catch (error) {
    return serverError("findUserByEmailWithType", error);
  }
};

const createUser = async (userInfo) => {
  const MAX_RETRIES = 3;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const code = generateUserCode(); // ✅ ALWAYS generated

      const [user] = await knex("users")
        .insert({
          code, // ← server-generated, never from client
          name: userInfo.name,
          email: userInfo.email,
          mobile: userInfo.mobile || null,
          password_hash: userInfo.password_hash,
          user_type: userInfo.user_type || null,
          is_active: true,
          is_email_verified: false,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .returning("*");

      return ok(user);
    } catch (error) {
      if (error.code === "23505") {
        if (error.detail && error.detail.includes("mobile")) {
          return fail(
            "MOBILE_EXISTS",
            "This mobile number is already registered.",
          );
        }
        return fail(
          "EMAIL_EXISTS",
          "An account with this email already exists.",
        );
      }
      return serverError("createUser", error);
    }
  }
};

const updateUser = async (userId, updateData) => {
  try {
    const [user] = await knex("users")
      .where({ id: userId })
      .update({
        ...updateData,
        updated_at: knex.fn.now(),
      })
      .returning("*");
    return ok(user);
  } catch (error) {
    if (error.code === "23505") {
      if (error.detail && error.detail.includes("mobile")) {
        return fail(
          "MOBILE_EXISTS",
          "This mobile number is already registered.",
        );
      }
      return fail("EMAIL_EXISTS", "An account with this email already exists.");
    }
    return serverError("updateUser", error);
  }
};

const updateLastLogin = async (userId) => {
  try {
    await knex("users")
      .where({ id: userId })
      .update({ last_login_at: knex.fn.now() });
    return ok(null);
  } catch (error) {
    // Non-critical — log and continue
    logger.error("updateLastLogin error", { error: error.message });
    return ok(null);
  }
};

/* ──────────────────────────────────────────────────────
 * User types
 * ────────────────────────────────────────────────────── */
const findUserTypeByName = async (name) => {
  try {
    const row = await knex("user_type_enums").where({ name }).first();
    return ok(row);
  } catch (error) {
    return serverError("findUserTypeByName", error);
  }
};

/* ──────────────────────────────────────────────────────
 * Profile
 * ────────────────────────────────────────────────────── */
const getMe = async (userId) => {
  try {
    const user = await knex("users as u")
      .leftJoin("user_type_enums as t", "t.id", "u.user_type")
      .select(
        "u.id",
        "u.name",
        "u.mobile",
        "u.email",
        "u.avatar",
        "u.bio",
        "u.job_title",
        "u.is_email_verified",
        "u.created_at",
        "t.name as user_type_name",
      )
      .where({ "u.id": userId, "u.is_active": true })
      .whereNull("u.deleted_at")
      .first();
    return ok(user);
  } catch (error) {
    return serverError("getMe", error);
  }
};

const findUserByMobile = async (mobile) => {
  try {
    const user = await knex("users")
      .where({ mobile, is_active: true })
      .whereNull("deleted_at")
      .first();
    return ok(user);
  } catch (error) {
    return serverError("findUserByMobile", error);
  }
};

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByEmailWithType,
  createUser,
  updateUser,
  updateLastLogin,
  findUserTypeByName,
  getMe,
  findUserByMobile,
};
