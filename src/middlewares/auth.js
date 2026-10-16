const jwt = require("jsonwebtoken");
const config = require("../config/config");
const secretKey = config.jwt.secret;
const customResponse = require("../utils/responseHandler");
const responseMessages = require("../utils/responseMessages");
const knex = require("../db/sqldb").db;

// auth.js

const getUserFromDB = async (userId) => {
  try {
    const user = await knex("users")
      .select("id", "email", "role", "can_access_website", "is_active")
      .where({ id: userId, is_active: true })
      .first();
    return user;
  } catch (error) {
    console.error("Error fetching user from DB:", error);
    throw new Error("Database query failed.");
  }
};

const authenticateUser = async (req, res, next) => {
  const accessToken = req.headers["access-token"];
  const refreshToken = req.headers["refresh-token"];
  if (
    !(
      accessToken &&
      accessToken !== "null" &&
      accessToken !== "undefined" &&
      refreshToken &&
      refreshToken !== "null" &&
      refreshToken !== "undefined"
    )
  ) {
    return customResponse(
      res,
      401,
      responseMessages.ACCESS_DENIED_NO_TOKENS,
      {},
    );
  }

  try {
    const decoded = jwt.verify(accessToken, secretKey);
    const user = await getUserFromDB(decoded.user.id);
    if (!user)
      return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});

    // ----- Website access control -----
    if (user.can_access_website === false) {
      const clientType = req.headers["x-client-type"] === "app" ? "app" : "web";
      const isLeadMember = user.role === "lead_member";
      // Allow only app requests from lead members
      if (!(clientType === "app" && isLeadMember)) {
        return customResponse(
          res,
          403,
          responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
          {},
        );
      }
    }

    req.user = { ...decoded.user, role: user.role }; // ensure role is attached
    next();
  } catch (error) {
    // Access token expired or invalid – try refresh token
    if (!refreshToken) {
      return customResponse(
        res,
        401,
        responseMessages.ACCESS_DENIED_NO_REFRESH_TOKEN,
        {},
      );
    }

    try {
      const decoded = jwt.verify(refreshToken, secretKey);
      const user = await getUserFromDB(decoded.user.id);
      if (!user)
        return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});

      // Same website access control for refresh flow
      if (user.can_access_website === false) {
        const clientType =
          req.headers["x-client-type"] === "app" ? "app" : "web";
        const isLeadMember = user.role === "lead_member";
        if (!(clientType === "app" && isLeadMember)) {
          return customResponse(
            res,
            403,
            responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
            {},
          );
        }
      }

      const clientType = req.headers["x-client-type"] === "app" ? "app" : "web";
      const accessExpiry = clientType === "app" ? "30d" : "24h";
      const newAccessToken = jwt.sign(
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            client_type: clientType,
          },
        },
        secretKey,
        { expiresIn: accessExpiry },
      );

      res.setHeader("refresh-token", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      });
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Access-Token,Refresh-Token",
      );
      res.setHeader("access-token", newAccessToken);

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        client_type: clientType,
      };
      next();
    } catch (refreshError) {
      console.log(refreshError.message);
      return customResponse(res, 400, responseMessages.INVALID_TOKEN, {});
    }
  }
};

const optionalAuthenticateUser = async (req, res, next) => {
  const accessToken = req.headers["access-token"];
  const refreshToken = req.headers["refresh-token"];

  // No tokens → continue unauthenticated
  if (
    (!accessToken ||
      accessToken === "null" ||
      accessToken === "undefined" ||
      accessToken === "") &&
    (!refreshToken ||
      refreshToken === "null" ||
      refreshToken === "undefined" ||
      refreshToken === "")
  ) {
    return next();
  }

  // Try access token first
  if (
    accessToken &&
    accessToken !== "null" &&
    accessToken !== "undefined" &&
    accessToken !== ""
  ) {
    try {
      const decoded = jwt.verify(accessToken, secretKey);
      const user = await getUserFromDB(decoded.user.id);
      if (!user) {
        return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});
      }

      // ----- Website access control (same as authenticateUser) -----
      if (user.can_access_website === false) {
        const clientType =
          req.headers["x-client-type"] === "app" ? "app" : "web";
        const isLeadMember = user.role === "lead_member";
        if (!(clientType === "app" && isLeadMember)) {
          return customResponse(
            res,
            403,
            responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
            {},
          );
        }
      }

      req.user = { ...decoded.user, role: user.role };
      return next();
    } catch (error) {
      console.error("Access Token Verification Error:", error);
      // Access token invalid – fall through to refresh token handling
      if (
        !refreshToken ||
        refreshToken === "null" ||
        refreshToken === "undefined" ||
        refreshToken === ""
      ) {
        return customResponse(
          res,
          401,
          responseMessages.ACCESS_DENIED_OR_INVALID_TOKENS,
          {},
        );
      }
    }
  }

  // Refresh token handling
  if (
    refreshToken &&
    refreshToken !== "null" &&
    refreshToken !== "undefined" &&
    refreshToken !== ""
  ) {
    try {
      const decoded = jwt.verify(refreshToken, secretKey);
      const user = await getUserFromDB(decoded.user.id);
      if (!user) {
        return customResponse(res, 401, responseMessages.USER_NOT_FOUND, {});
      }

      // ----- Same access control for refresh flow -----
      if (user.can_access_website === false) {
        const clientType =
          req.headers["x-client-type"] === "app" ? "app" : "web";
        const isLeadMember = user.role === "lead_member";
        if (!(clientType === "app" && isLeadMember)) {
          return customResponse(
            res,
            403,
            responseMessages.ACCESS_DENIED_NO_WEBSITE_ACCESS,
            {},
          );
        }
      }

      const clientType = req.headers["x-client-type"] === "app" ? "app" : "web";
      const accessExpiry = clientType === "app" ? "30d" : "20m";
      const newAccessToken = jwt.sign(
        {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            client_type: clientType,
          },
        },
        secretKey,
        { expiresIn: accessExpiry },
      );

      res.header("access-token", newAccessToken);
      res.setHeader(
        "Access-Control-Expose-Headers",
        "Access-Token,Refresh-Token",
      );
      res.header("refresh-token", refreshToken, {
        httpOnly: true,
        sameSite: "strict",
      });

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        client_type: clientType,
      };
      return next();
    } catch (error) {
      return customResponse(
        res,
        401,
        responseMessages.INVALID_REFRESH_TOKEN,
        {},
      );
    }
  }

  // No valid tokens – continue unauthenticated
  return next();
};

module.exports = { authenticateUser, optionalAuthenticateUser };
