const userService = require("./service");
const customResponse = require("../../utils/responseHandler");
const responseMessages = require("../../utils/responseMessages");
const logger = require("../../utils/logger");
const { hashPassword, verifyPassword } = require("../../utils/password");
const {
  signTokens,
  setRefreshCookie,
  setAccessHeader,
} = require("../../utils/token");

/* ──────────────────────────────────────────────────────
 * Code maps
 * ────────────────────────────────────────────────────── */
const CODE_STATUS_MAP = {
  INVALID_CREDENTIALS: 401,
  EMAIL_EXISTS: 409,
  MOBILE_EXISTS: 409,
  USER_NOT_FOUND: 404,
  WRONG_PASSWORD: 401,
  NO_FIELDS: 400,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_CREDENTIALS: responseMessages.INVALID_CREDENTIALS,
  EMAIL_EXISTS: responseMessages.EMAIL_ALREADY_EXISTS,
  MOBILE_EXISTS: responseMessages.MOBILE_ALREADY_EXISTS,
  USER_NOT_FOUND: responseMessages.USER_NOT_FOUND,
  WRONG_PASSWORD: responseMessages.CURRENT_PASSWORD_INCORRECT,
  NO_FIELDS: responseMessages.NO_VALID_FIELDS,
  SERVER_ERROR: responseMessages.INTERNAL_SERVER_ERROR,
};

const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  const message =
    CODE_MESSAGE_MAP[result.code] ||
    result.message ||
    responseMessages.INTERNAL_SERVER_ERROR;
  return customResponse(res, status, message, {});
};

const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} controller error`, {
    error: error.message,
    stack: error.stack,
  });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

/* ══════════════════════════════════════════════════════════
 * SIGNUP
 * ══════════════════════════════════════════════════════════ */
const signup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    // Check existing email
    const existing = await userService.findUserByEmail(email);
    if (!existing.success) return respondFailure(res, existing);
    if (existing.data) {
      return customResponse(
        res,
        409,
        responseMessages.EMAIL_ALREADY_EXISTS,
        {},
      );
    }

    // Check existing mobile (if provided)
    if (mobile) {
      const mobileRes = await userService.findUserByMobile(mobile);
      if (!mobileRes.success) return respondFailure(res, mobileRes);
      if (mobileRes.data) {
        return customResponse(
          res,
          409,
          responseMessages.MOBILE_ALREADY_EXISTS,
          {},
        );
      }
    }

    // Resolve subscriber type
    const typeRes = await userService.findUserTypeByName("subscriber");
    if (!typeRes.success) return respondFailure(res, typeRes);

    // Create
    const passwordHash = await hashPassword(password);
    const created = await userService.createUser({
      name,
      email,
      mobile: mobile || null,
      password_hash: passwordHash,
      user_type: typeRes.data ? typeRes.data.id : null,
    });

    if (!created.success) return respondFailure(res, created);

    const user = created.data;
    const { accessToken, refreshToken } = signTokens(user, "website");
    setRefreshCookie(res, refreshToken);
    setAccessHeader(res, accessToken);

    return customResponse(res, 201, responseMessages.SIGNUP_SUCCESS, {
      user: {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
      },
    });
  } catch (error) {
    return respondUnexpected(res, "signup", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * LOGIN
 * ══════════════════════════════════════════════════════════ */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await userService.findUserByEmail(email);
    if (!result.success) return respondFailure(res, result);
    if (!result.data) {
      return customResponse(
        res,
        401,
        responseMessages.INVALID_CREDENTIALS,
        {},
      );
    }

    const user = result.data;
    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      return customResponse(res, 401, responseMessages.INVALID_CREDENTIALS, {});
    }

    await userService.updateLastLogin(user.id);

    const { accessToken, refreshToken } = signTokens(user, "website");
    setRefreshCookie(res, refreshToken);
    setAccessHeader(res, accessToken);

    return customResponse(res, 200, responseMessages.LOGIN_SUCCESS, {
      user: {
        id: user.id,
        code: user.code,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    return respondUnexpected(res, "login", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * REFRESH
 * ══════════════════════════════════════════════════════════ */
const refresh = async (req, res) => {
  try {
    const result = await userService.getMe(req.user.id);
    if (!result.success) return respondFailure(res, result);
    if (!result.data) {
      return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
    }
    return customResponse(res, 200, responseMessages.TOKEN_REFRESHED, {
      user: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "refresh", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * LOGOUT
 * ══════════════════════════════════════════════════════════ */
const logout = async (req, res) => {
  try {
    res.clearCookie("refresh-token");
    return customResponse(res, 200, responseMessages.LOGOUT_SUCCESS, {});
  } catch (error) {
    return respondUnexpected(res, "logout", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * ME
 * ══════════════════════════════════════════════════════════ */
const me = async (req, res) => {
  try {
    const result = await userService.getMe(req.user.id);
    if (!result.success) return respondFailure(res, result);
    if (!result.data) {
      return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
    }
    return customResponse(res, 200, responseMessages.USER_FETCHED, {
      user: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "me", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * UPDATE PROFILE
 * ══════════════════════════════════════════════════════════ */
const updateProfile = async (req, res) => {
  try {
    const allowed = ["name", "mobile", "avatar", "bio", "job_title"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    if (Object.keys(updates).length === 0) {
      return customResponse(res, 400, responseMessages.NO_VALID_FIELDS, {});
    }

    if (updates.mobile) {
      const mobileRes = await userService.findUserByMobile(updates.mobile);
      if (!mobileRes.success) return respondFailure(res, mobileRes);
      if (mobileRes.data && mobileRes.data.id !== req.user.id) {
        return customResponse(
          res,
          409,
          responseMessages.MOBILE_ALREADY_EXISTS,
          {},
        );
      }
    }

    const result = await userService.updateUser(req.user.id, updates);
    if (!result.success) return respondFailure(res, result);
    if (!result.data) {
      return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
    }

    return customResponse(res, 200, responseMessages.PROFILE_UPDATED, {
      user: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "updateProfile", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * CHANGE PASSWORD
 * ══════════════════════════════════════════════════════════ */
const changePassword = async (req, res) => {
  try {
    const { old_password, new_password } = req.body;

    const findRes = await userService.findUserById(req.user.id);
    if (!findRes.success) return respondFailure(res, findRes);
    if (!findRes.data) {
      return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
    }

    const user = findRes.data;
    const ok = await verifyPassword(old_password, user.password_hash);
    if (!ok) {
      return customResponse(
        res,
        401,
        responseMessages.CURRENT_PASSWORD_INCORRECT,
        {},
      );
    }

    const newHash = await hashPassword(new_password);
    const updateRes = await userService.updateUser(req.user.id, {
      password_hash: newHash,
    });

    if (!updateRes.success) return respondFailure(res, updateRes);

    return customResponse(res, 200, responseMessages.PASSWORD_CHANGED, {});
  } catch (error) {
    return respondUnexpected(res, "changePassword", error);
  }
};

module.exports = {
  signup,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  changePassword,
};
