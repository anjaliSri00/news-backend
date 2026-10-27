// ...imports stay the same (internalAuthService, customResponse, etc.)

const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const internalAuthService = require("./service");
const { signTokens, setRefreshCookie, setAccessHeader } = require("../../../utils/token");

/* ──────────────────────────────────────────────────────
 * Map service codes → HTTP status + message
 * ────────────────────────────────────────────────────── */
const CODE_STATUS_MAP = {
  INVALID_CREDENTIALS: 401,
  USER_NOT_FOUND: 404,
  ALREADY_INTERNAL: 409,
  INVALID_USER_TYPES: 422,
  NOT_FOUND: 404,
  // ← NEW: access-related codes
  INVALID_LEVEL: 422,
  TARGET_NOT_FOUND: 404,
  ALREADY_GRANTED: 409,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_CREDENTIALS: responseMessages.INVALID_CREDENTIALS,
  USER_NOT_FOUND: responseMessages.USER_NOT_FOUND,
  SERVER_ERROR: responseMessages.INTERNAL_SERVER_ERROR,
};

const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  const message = CODE_MESSAGE_MAP[result.code] || result.message;
  return customResponse(res, status, message, {});
};

/* ──────────────────────────────────────────────────────
 * POST /internal/auth/add — create internal user
 * ────────────────────────────────────────────────────── */
const create = async (req, res) => {
  const { user_id, user_types } = req.body;

  const result = await internalAuthService.createInternalUser(
    { userId: user_id, userTypes: user_types },
    req.user.id,
  );

  if (!result.success) return respondFailure(res, result);

  return customResponse(res, 201, "Internal user created.", {
    internal_user: {
      id: result.data.id,
      code: result.data.code,
      user_id: result.data.user_id,
      user_types: result.data.user_types,
      is_active: result.data.is_active,
    },
  });
};

/* ──────────────────────────────────────────────────────
 * GET /internal/auth/list — list internal users
 * ────────────────────────────────────────────────────── */
const list = async (req, res) => {
  const result = await internalAuthService.listInternalUsers();
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Internal users fetched.", {
    users: result.data,
  });
};

/* ──────────────────────────────────────────────────────
 * DELETE /internal/auth/:id — revoke access
 * ────────────────────────────────────────────────────── */
const revoke = async (req, res) => {
  const result = await internalAuthService.revokeInternalUser(req.params.id);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Internal user access revoked.", {
    internal_user: result.data,
  });
};

/* ──────────────────────────────────────────────────────
 * POST /internal/auth/login
 * ────────────────────────────────────────────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await internalAuthService.internalLogin(email, password);

  if (!result.success) {
    return respondFailure(res, result);
  }

  const { user, internalUser, userTypes } = result.data;

  const tokenUser = {
    id: user.id,
    email: user.email,
    is_superadmin: user.is_superadmin,
    internal_user_id: internalUser?.id || null,
    internal_user_types: internalUser?.user_types || [],
  };

  const { accessToken, refreshToken } = signTokens(tokenUser, "internal");
  setRefreshCookie(res, refreshToken);
  setAccessHeader(res, accessToken);

  return customResponse(res, 200, responseMessages.LOGIN_SUCCESS, {
    user: {
      id: user.id,
      user_code: user?.code || null,
      internal_user_code: internalUser?.code || null,
      name: user.name,
      email: user.email,
      is_superadmin: user.is_superadmin,
      user_types: userTypes,
      access_token: accessToken,
      refresh_token: refreshToken,
    },
  });
};

/* ──────────────────────────────────────────────────────
 * POST /internal/auth/logout — unchanged
 * ────────────────────────────────────────────────────── */
const logout = async (req, res) => {
  res.clearCookie("refresh-token");
  return customResponse(res, 200, responseMessages.LOGOUT_SUCCESS, {});
};

/* ──────────────────────────────────────────────────────
 * GET /internal/auth/me
 * ────────────────────────────────────────────────────── */
const me = async (req, res) => {
  const result = await internalAuthService.getInternalMe(req.user.id);

  if (!result.success) {
    return respondFailure(res, result);
  }

  return customResponse(res, 200, responseMessages.USER_FETCHED, {
    user: result.data,
  });
};

/* ══════════════════════════════════════════════════════════
 * ACCESS — new functions below
 * ══════════════════════════════════════════════════════════ */

/* ──────────────────────────────────────────────────────
 * GET /internal/auth/access/tree
 * Returns the full flows → pages → components → values tree
 * ────────────────────────────────────────────────────── */
const accessTree = async (req, res) => {
  const result = await internalAuthService.getAccessTree();
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Access tree fetched.", {
    tree: result.data,
  });
};

/* ──────────────────────────────────────────────────────
 * POST /internal/auth/access/grant
 * Body: { user_id, level, target_id }
 * level ∈ "flow" | "page" | "component" | "component_value"
 * ────────────────────────────────────────────────────── */
const grantAccess = async (req, res) => {
  const { user_id, level, target_id } = req.body;

  const result = await internalAuthService.grantAccess({
    userId: user_id,
    level,
    targetId: target_id,
    grantedBy: req.user.id,
  });

  if (!result.success) return respondFailure(res, result);

  const status = result.already ? 200 : 201;
  const message = result.already ? "Access already existed." : "Access granted.";

  return customResponse(res, status, message, { grant: result.data });
};

/* ──────────────────────────────────────────────────────
 * POST /internal/auth/access/revoke
 * Body: { user_id, level, target_id }
 * ────────────────────────────────────────────────────── */
const revokeAccess = async (req, res) => {
  const { user_id, level, target_id } = req.body;

  const result = await internalAuthService.revokeAccess({
    userId: user_id,
    level,
    targetId: target_id,
  });

  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "Access revoked.", result.data);
};

/* ──────────────────────────────────────────────────────
 * GET /internal/auth/access/user/:userId
 * Returns everything a user currently has access to
 * ────────────────────────────────────────────────────── */
const userAccess = async (req, res) => {
  const result = await internalAuthService.getUserAccess(req.params.userId);
  if (!result.success) return respondFailure(res, result);
  return customResponse(res, 200, "User access fetched.", {
    access: result.data,
  });
};

module.exports = {
  // Auth
  login,
  logout,
  me,
  // Internal users
  create,
  list,
  revoke,
  // Access
  accessTree,
  grantAccess,
  revokeAccess,
  userAccess,
};