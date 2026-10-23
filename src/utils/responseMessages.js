// src/utils/responseMessages.js
const responseMessages = {
  SUCCESS: "Operation completed successfully",
  ERROR: "An error occurred",
  INVALID_INPUT: "Invalid input provided",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  ACCESS_AND_REFRESH_TOKEN_EXPIRED:
    "Both access and refresh tokens are expired",
  ACCESS_DENIED_NO_WEBSITE_ACCESS:
    "This is a lead member account and it cannot access the website. Please use the mobile app.",
  ACCOUNT_WITH_THIS_EMAIL_IS_INACTIVE:
    "An account with this email exists but is inactive. Please use a different email address or contact support to reactivate your account.",
  FORBIDDEN: "You do not have permission to perform this action",
  SERVER_ERROR: "Internal server error",
  DATA_FETCHED: "Data fetched successfully",
  DATA_SAVED: "Data saved successfully",
  // Website auth
  SIGNUP_SUCCESS: "Account created successfully.",
  LOGIN_SUCCESS: "Logged in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  TOKEN_REFRESHED: "Token refreshed successfully.",
  USER_FETCHED: "User fetched successfully.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  ACCOUNT_DISABLED: "Your account has been disabled.",

  // Token errors
  ACCESS_DENIED_NO_TOKENS: "Access denied. No tokens provided.",
  ACCESS_DENIED_NO_REFRESH_TOKEN: "Access denied. No refresh token provided.",
  INVALID_TOKEN: "Invalid or expired token.",
  INVALID_REFRESH_TOKEN: "Invalid or expired refresh token.",

  // Generic
  VALIDATION_FAILED: "Validation failed.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",
};

module.exports = responseMessages;
