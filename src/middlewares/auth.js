// const jwt = require("jsonwebtoken");
// const config = require("../config/config");
// const secretKey = config.jwt.secret;
// const customResponse = require("../utils/responseHandler");
// const responseMessages = require("../utils/responseMessages");
// const knex = require("../db/sqldb").db;

// // auth.js

// const getUserFromDB = async (userId) => {
//   try {
//     const user = await knex("users")
//       .select("id", "email", "role", "can_access_website", "is_active")
//       .where({ id: userId, is_active: true })
//       .first();
//     return user;
//   } catch (error) {
//     console.error("Error fetching user from DB:", error);
//     throw new Error("Database query failed.");
//   }
// };

// const authenticateUser = async (req, res, next) => {
//   const accessToken = req.headers["access-token"];
//   const refreshToken = req.headers["refresh-token"];
//   if (
//     !(
//       accessToken &&
//       accessToken !== "null" &&
//       accessToken !== "undefined" &&
//       refreshToken &&
//       refreshToken !== "null" &&
//       refreshToken !== "undefined"
//     )
//   ) {
//     return customResponse(
//       res,
//       401,
//       responseMessages.ACCESS_DENIED_NO_TOKENS,
//       {},
//     );
//   }

//   try {
//     const decoded = jwt.verify(accessToken, secretKey);
//     const user = await getUserFromDB(decoded.user.id);
//     if (!user)
//       return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});

//     // ----- Website access control -----
//     if (user.can_access_website === false) {
//       const clientType = req.headers["x-client-type"] === "app" ? "app" : "web";
//       const isLeadMember = user.role === "lead_member";
//       // Allow only app requests from lead members
//       if (!(clientType === "app" && isLeadMember)) {
//         return customResponse(
//           res,
//           403,
//           responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
//           {},
//         );
//       }
//     }

//     req.user = { ...decoded.user, role: user.role }; // ensure role is attached
//     next();
//   } catch (error) {
//     // Access token expired or invalid – try refresh token
//     if (!refreshToken) {
//       return customResponse(
//         res,
//         401,
//         responseMessages.ACCESS_DENIED_NO_REFRESH_TOKEN,
//         {},
//       );
//     }

//     try {
//       const decoded = jwt.verify(refreshToken, secretKey);
//       const user = await getUserFromDB(decoded.user.id);
//       if (!user)
//         return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});

//       // Same website access control for refresh flow
//       if (user.can_access_website === false) {
//         const clientType =
//           req.headers["x-client-type"] === "app" ? "app" : "web";
//         const isLeadMember = user.role === "lead_member";
//         if (!(clientType === "app" && isLeadMember)) {
//           return customResponse(
//             res,
//             403,
//             responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
//             {},
//           );
//         }
//       }

//       const clientType = req.headers["x-client-type"] === "app" ? "app" : "web";
//       const accessExpiry = clientType === "app" ? "30d" : "24h";
//       const newAccessToken = jwt.sign(
//         {
//           user: {
//             id: user.id,
//             email: user.email,
//             role: user.role,
//             client_type: clientType,
//           },
//         },
//         secretKey,
//         { expiresIn: accessExpiry },
//       );

//       res.setHeader("refresh-token", refreshToken, {
//         httpOnly: true,
//         sameSite: "strict",
//       });
//       res.setHeader(
//         "Access-Control-Expose-Headers",
//         "Access-Token,Refresh-Token",
//       );
//       res.setHeader("access-token", newAccessToken);

//       req.user = {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         client_type: clientType,
//       };
//       next();
//     } catch (refreshError) {
//       console.log(refreshError.message);
//       return customResponse(res, 400, responseMessages.INVALID_TOKEN, {});
//     }
//   }
// };

// const optionalAuthenticateUser = async (req, res, next) => {
//   const accessToken = req.headers["access-token"];
//   const refreshToken = req.headers["refresh-token"];

//   // No tokens → continue unauthenticated
//   if (
//     (!accessToken ||
//       accessToken === "null" ||
//       accessToken === "undefined" ||
//       accessToken === "") &&
//     (!refreshToken ||
//       refreshToken === "null" ||
//       refreshToken === "undefined" ||
//       refreshToken === "")
//   ) {
//     return next();
//   }

//   // Try access token first
//   if (
//     accessToken &&
//     accessToken !== "null" &&
//     accessToken !== "undefined" &&
//     accessToken !== ""
//   ) {
//     try {
//       const decoded = jwt.verify(accessToken, secretKey);
//       const user = await getUserFromDB(decoded.user.id);
//       if (!user) {
//         return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});
//       }

//       // ----- Website access control (same as authenticateUser) -----
//       if (user.can_access_website === false) {
//         const clientType =
//           req.headers["x-client-type"] === "app" ? "app" : "web";
//         const isLeadMember = user.role === "lead_member";
//         if (!(clientType === "app" && isLeadMember)) {
//           return customResponse(
//             res,
//             403,
//             responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
//             {},
//           );
//         }
//       }

//       req.user = { ...decoded.user, role: user.role };
//       return next();
//     } catch (error) {
//       console.error("Access Token Verification Error:", error);
//       // Access token invalid – fall through to refresh token handling
//       if (
//         !refreshToken ||
//         refreshToken === "null" ||
//         refreshToken === "undefined" ||
//         refreshToken === ""
//       ) {
//         return customResponse(
//           res,
//           401,
//           responseMessages.ACCESS_DENIED_OR_INVALID_TOKENS,
//           {},
//         );
//       }
//     }
//   }

//   // Refresh token handling
//   if (
//     refreshToken &&
//     refreshToken !== "null" &&
//     refreshToken !== "undefined" &&
//     refreshToken !== ""
//   ) {
//     try {
//       const decoded = jwt.verify(refreshToken, secretKey);
//       const user = await getUserFromDB(decoded.user.id);
//       if (!user) {
//         return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});
//       }

//       // ----- Same access control for refresh flow -----
//       if (user.can_access_website === false) {
//         const clientType =
//           req.headers["x-client-type"] === "app" ? "app" : "web";
//         const isLeadMember = user.role === "lead_member";
//         if (!(clientType === "app" && isLeadMember)) {
//           return customResponse(
//             res,
//             403,
//             responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
//             {},
//           );
//         }
//       }

//       const clientType = req.headers["x-client-type"] === "app" ? "app" : "web";
//       const accessExpiry = clientType === "app" ? "30d" : "20m";
//       const newAccessToken = jwt.sign(
//         {
//           user: {
//             id: user.id,
//             email: user.email,
//             role: user.role,
//             client_type: clientType,
//           },
//         },
//         secretKey,
//         { expiresIn: accessExpiry },
//       );

//       res.header("access-token", newAccessToken);
//       res.setHeader(
//         "Access-Control-Expose-Headers",
//         "Access-Token,Refresh-Token",
//       );
//       res.header("refresh-token", refreshToken, {
//         httpOnly: true,
//         sameSite: "strict",
//       });

//       req.user = {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         client_type: clientType,
//       };
//       return next();
//     } catch (error) {
//       return customResponse(
//         res,
//         401,
//         responseMessages.INVALID_REFRESH_TOKEN,
//         {},
//       );
//     }
//   }

//   // No valid tokens – continue unauthenticated
//   return next();
// };

// module.exports = { authenticateUser, optionalAuthenticateUser };

const jwt = require("jsonwebtoken");
const config = require("../config/config");
const customResponse = require("../utils/responseHandler");
const responseMessages = require("../utils/responseMessages");
const logger = require("../utils/logger");
const knex = require("../db/sqldb").db;
const {
  extractTokens,
  signTokens,
  setRefreshCookie,
} = require("../utils/token");

/* ──────────────────────────────────────────────────────
 * Load user + optional internal_users row
 * ────────────────────────────────────────────────────── */
const loadUser = async (userId) => {
  const user = await knex("users")
    .select(
      "id",
      "name",
      "email",
      "user_type",
      "is_superadmin",
      "is_active",
      "deleted_at",
    )
    .where({ id: userId })
    .first();

  if (!user || user.deleted_at) return null;

  const internalUser = await knex("internal_users")
    .select("id", "user_types", "is_active")
    .where({ user_id: userId })
    .first();

  return {
    ...user,
    internal_user_id: internalUser?.id || null,
    internal_user_types: internalUser?.user_types || [],
    internal_active: internalUser?.is_active ?? false,
  };
};

const buildReqUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  user_type: user.user_type,
  is_superadmin: user.is_superadmin,
  is_internal: Boolean(user.internal_user_id) || user.is_superadmin,
  internal_user_id: user.internal_user_id,
  internal_user_types: user.internal_user_types,
});

/* ──────────────────────────────────────────────────────
 * Core auth logic
 * ────────────────────────────────────────────────────── */
const doAuth = async (
  req,
  res,
  realm,
  { required = true, checkInternal = false },
) => {
  const cfg = config.jwt[realm];
  const { accessToken, refreshToken } = extractTokens(req);

  if (!accessToken && !refreshToken) {
    if (!required) return { ok: true, user: null };
    return {
      ok: false,
      status: 401,
      message: responseMessages.ACCESS_DENIED_NO_TOKENS,
    };
  }

  // 1. Try access token
  if (accessToken) {
    try {
      const decoded = jwt.verify(accessToken, cfg.secret);
      if (decoded.type !== "access" || decoded.realm !== realm) {
        throw new Error("Invalid token type/realm");
      }

      const user = await loadUser(decoded.id);
      if (!user || !user.is_active) {
        return {
          ok: false,
          status: 401,
          message: responseMessages.ACCOUNT_DISABLED,
        };
      }
      if (
        checkInternal &&
        !user.is_superadmin &&
        (!user.internal_user_id || !user.internal_active)
      ) {
        return {
          ok: false,
          status: 403,
          message: "Dashboard access required.",
        };
      }

      return { ok: true, user: buildReqUser(user) };
    } catch (err) {
      if (
        err.name !== "TokenExpiredError" &&
        err.name !== "JsonWebTokenError"
      ) {
        logger.error("Access token verify error", { err: err.message });
      }
    }
  }

  // 2. Try refresh token
  if (!refreshToken) {
    if (!required) return { ok: true, user: null };
    return {
      ok: false,
      status: 401,
      message: responseMessages.ACCESS_DENIED_NO_REFRESH_TOKEN,
    };
  }

  try {
    const decoded = jwt.verify(refreshToken, cfg.secret);
    if (decoded.type !== "refresh" || decoded.realm !== realm) {
      throw new Error("Invalid refresh token");
    }

    const user = await loadUser(decoded.id);
    if (!user || !user.is_active) {
      return {
        ok: false,
        status: 401,
        message: responseMessages.ACCOUNT_DISABLED,
      };
    }
    if (
      checkInternal &&
      !user.is_superadmin &&
      (!user.internal_user_id || !user.internal_active)
    ) {
      return { ok: false, status: 403, message: "Dashboard access required." };
    }

    const { accessToken: newAccess } = signTokens(user, realm);
    res.setHeader("access-token", newAccess);
    res.setHeader("Access-Control-Expose-Headers", "Access-Token");
    setRefreshCookie(res, refreshToken);

    return { ok: true, user: buildReqUser(user) };
  } catch (err) {
    return {
      ok: false,
      status: 401,
      message: responseMessages.INVALID_REFRESH_TOKEN,
    };
  }
};

/* ──────────────────────────────────────────────────────
 * Middlewares
 * ────────────────────────────────────────────────────── */
const authenticateWebsite = async (req, res, next) => {
  try {
    const result = await doAuth(req, res, "website");
    if (!result.ok)
      return customResponse(res, result.status, result.message, {});
    req.user = result.user;
    next();
  } catch (err) {
    logger.error("authenticateWebsite error", { err: err.message });
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};

const optionalAuthenticateWebsite = async (req, res, next) => {
  try {
    const result = await doAuth(req, res, "website", { required: false });
    if (result.ok && result.user) req.user = result.user;
    next();
  } catch (err) {
    logger.error("optionalAuthenticateWebsite error", { err: err.message });
    next();
  }
};

const authenticateInternal = async (req, res, next) => {
  try {
    const result = await doAuth(req, res, "internal", { checkInternal: true });
    if (!result.ok)
      return customResponse(res, result.status, result.message, {});
    req.user = result.user;
    next();
  } catch (err) {
    logger.error("authenticateInternal error", { err: err.message });
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};

module.exports = {
  authenticateWebsite,
  optionalAuthenticateWebsite,
  authenticateInternal,
};
