const jwt = require("jsonwebtoken");
const config = require("../config/config");

const extractTokens = (req) => {
  const isUsable = (t) => t && t !== "null" && t !== "undefined" && t !== "";
  const access = req.headers["access-token"];
  const refresh =
    req.headers["refresh-token"] ||
    (req.cookies && req.cookies["refresh-token"]);
  return {
    accessToken: isUsable(access) ? access : null,
    refreshToken: isUsable(refresh) ? refresh : null,
  };
};

const signTokens = (user, realm) => {
  const cfg = config.jwt[realm];

  const basePayload = {
    id: user.id,
    email: user.email,
    realm,
  };

  if (realm === "internal") {
    basePayload.user_types = user.internal_user_types;
    basePayload.is_superadmin = user.is_superadmin;
    basePayload.internal_user_id = user.internal_user_id;
  } else {
    basePayload.user_type = user.user_type;
  }

  const accessToken = jwt.sign({ ...basePayload, type: "access" }, cfg.secret, {
    expiresIn: cfg.accessExpires,
  });

  const refreshToken = jwt.sign(
    { ...basePayload, type: "refresh" },
    cfg.secret,
    { expiresIn: cfg.refreshExpires },
  );

  return { accessToken, refreshToken };
};

const setRefreshCookie = (res, refreshToken) => {
  res.cookie("refresh-token", refreshToken, {
    httpOnly: true,
    secure: config.env === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

const setAccessHeader = (res, accessToken) => {
  res.setHeader("access-token", accessToken);
  res.setHeader("Access-Control-Expose-Headers", "Access-Token");
};

module.exports = {
  extractTokens,
  signTokens,
  setRefreshCookie,
  setAccessHeader,
};
