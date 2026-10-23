const userService = require("./service");
const customResponse = require("../../utils/responseHandler");
const responseMessages = require("../../utils/responseMessages");
const { hashPassword, verifyPassword } = require("../../utils/password");
const {
  signTokens,
  setRefreshCookie,
  setAccessHeader,
} = require("../../utils/token");

/* ──────────────────────────────────────────────────────
 * POST /api/v1/users/signup
 * ────────────────────────────────────────────────────── */
const signup = async (req, res) => {
    console.log("signup called");
  const { name, mobile, email, password } = req.body;

  // 1. Existing user?
  const existing = await userService.findUserByEmail(email);
  if (!existing.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
  if (existing.data) {
    return customResponse(res, 409, responseMessages.EMAIL_ALREADY_EXISTS, {});
  }

  // Existing mobile? (only if provided)
  if (mobile) {
    const mobileRes = await userService.findUserByMobile(mobile);
    if (!mobileRes.success)
      return customResponse(
        res,
        500,
        responseMessages.INTERNAL_SERVER_ERROR,
        {},
      );
    if (mobileRes.data)
      return customResponse(
        res,
        409,
        "This mobile number is already registered.",
        {},
      );
  }

  // 2. Resolve subscriber type
  const typeRes = await userService.findUserTypeByName("subscriber");
  if (!typeRes.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }

  // 3. Create user
  const passwordHash = await hashPassword(password);
  const created = await userService.createUser({
    name,
    mobile: mobile || null,
    email,
    password_hash: passwordHash,
    user_type: typeRes.data ? typeRes.data.id : null,
  });

  if (!created.success) {
    if (created.code === "EMAIL_EXISTS")
      return customResponse(
        res,
        409,
        responseMessages.EMAIL_ALREADY_EXISTS,
        {},
      );
    if (created.code === "MOBILE_EXISTS")
      return customResponse(
        res,
        409,
        "This mobile number is already registered.",
        {},
      );
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }

  const user = created.data;

  // 4. Issue tokens
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
};

/* ──────────────────────────────────────────────────────
 * POST /api/v1/users/login
 * ────────────────────────────────────────────────────── */
const login = async (req, res) => {
  const { email, password } = req.body;

  const result = await userService.findUserByEmail(email);
  if (!result.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
  if (!result.data) {
    return customResponse(res, 401, responseMessages.INVALID_CREDENTIALS, {});
  }

  const user = result.data;

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) {
    return customResponse(res, 401, responseMessages.INVALID_CREDENTIALS, {});
  }

  // Non-critical — ignore result
  await userService.updateLastLogin(user.id);

  const { accessToken, refreshToken } = signTokens(user, "website");
  setRefreshCookie(res, refreshToken);
  setAccessHeader(res, accessToken);

  return customResponse(res, 200, responseMessages.LOGIN_SUCCESS, {
    user: { id: user.id, code: user.code, name: user.name, email: user.email },
  });
};

/* ──────────────────────────────────────────────────────
 * POST /api/v1/users/refresh
 * Middleware already rotated tokens — return current user
 * ────────────────────────────────────────────────────── */
const refresh = async (req, res) => {
  const result = await userService.getMe(req.user.id);
  if (!result.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
  if (!result.data) {
    return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
  }
  return customResponse(res, 200, responseMessages.TOKEN_REFRESHED, {
    user: result.data,
  });
};

/* ──────────────────────────────────────────────────────
 * POST /api/v1/users/logout
 * ────────────────────────────────────────────────────── */
const logout = async (req, res) => {
  res.clearCookie("refresh-token");
  return customResponse(res, 200, responseMessages.LOGOUT_SUCCESS, {});
};

/* ──────────────────────────────────────────────────────
 * GET /api/v1/users/me
 * ────────────────────────────────────────────────────── */
const me = async (req, res) => {
  const result = await userService.getMe(req.user.id);
  if (!result.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
  if (!result.data) {
    return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
  }
  return customResponse(res, 200, responseMessages.USER_FETCHED, {
    user: result.data,
  });
};

/* ──────────────────────────────────────────────────────
 * PATCH /api/v1/users/me
 * ────────────────────────────────────────────────────── */
const updateProfile = async (req, res) => {
  const payload = req.body;
  const allowed = ["name", "mobile", "avatar", "bio", "job_title"];
  const updates = {};
  for (const key of allowed) {
    if (payload[key] !== undefined) updates[key] = payload[key];
  }

  if (Object.keys(updates).length === 0) {
    return customResponse(res, 400, "No valid fields to update.", {});
  }

  if (updates.mobile) {
    const mobileRes = await userService.findUserByMobile(updates.mobile);
    if (!mobileRes.success)
      return customResponse(
        res,
        500,
        responseMessages.INTERNAL_SERVER_ERROR,
        {},
      );
    if (mobileRes.data && mobileRes.data.id !== req.user.id) {
      return customResponse(
        res,
        409,
        "This mobile number is already registered.",
        {},
      );
    }
  }

  const result = await userService.updateUser(req.user.id, updates);
  if (!result.success) {
    if (result.code === "EMAIL_EXISTS" || result.code === "MOBILE_EXISTS") {
      return customResponse(res, 409, result.message, {});
    }
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
  if (!result.data) {
    return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
  }

  const user = result.data;
  return customResponse(res, 200, "Profile updated successfully.", {
    user: {
      id: user.id,
      code: user.code,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      avatar: user.avatar,
      bio: user.bio,
      job_title: user.job_title,
    },
  });
};

/* ──────────────────────────────────────────────────────
 * POST /api/v1/users/change-password
 * ────────────────────────────────────────────────────── */
const changePassword = async (req, res) => {
  const { old_password, new_password } = req.body;

  const findRes = await userService.findUserById(req.user.id);
  if (!findRes.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
  if (!findRes.data) {
    return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
  }

  const user = findRes.data;

  const ok = await verifyPassword(old_password, user.password_hash);
  if (!ok) {
    return customResponse(res, 401, "Current password is incorrect.", {});
  }

  const newHash = await hashPassword(new_password);
  const updateRes = await userService.updateUser(req.user.id, {
    password_hash: newHash,
  });

  if (!updateRes.success) {
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }

  return customResponse(res, 200, "Password changed successfully.", {});
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
