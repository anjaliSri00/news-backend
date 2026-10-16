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

};

module.exports = responseMessages;
