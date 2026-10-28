// src/utils/responseMessages.js
const responseMessages = {
  /* ══════════════════════════════════════════════════════════
   * GENERIC
   * ══════════════════════════════════════════════════════════ */
  SUCCESS: "Operation completed successfully",
  ERROR: "An error occurred",
  INVALID_INPUT: "Invalid input provided",
  NOT_FOUND: "Resource not found",
  UNAUTHORIZED: "Unauthorized access",
  FORBIDDEN: "You do not have permission to perform this action",
  SERVER_ERROR: "Internal server error",
  DATA_FETCHED: "Data fetched successfully",
  DATA_SAVED: "Data saved successfully",
  VALIDATION_FAILED: "Validation failed.",
  INTERNAL_SERVER_ERROR: "Something went wrong. Please try again.",

  /* ══════════════════════════════════════════════════════════
   * AUTH — shared (website + internal)
   * ══════════════════════════════════════════════════════════ */
  SIGNUP_SUCCESS: "Account created successfully.",
  LOGIN_SUCCESS: "Logged in successfully.",
  LOGOUT_SUCCESS: "Logged out successfully.",
  TOKEN_REFRESHED: "Token refreshed successfully.",
  USER_FETCHED: "User fetched successfully.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  EMAIL_ALREADY_EXISTS: "An account with this email already exists.",
  ACCOUNT_DISABLED: "Your account has been disabled.",
  ACCOUNT_WITH_THIS_EMAIL_IS_INACTIVE:
    "An account with this email exists but is inactive. Please use a different email address or contact support to reactivate your account.",
  ACCESS_DENIED_NO_WEBSITE_ACCESS:
    "This is a lead member account and it cannot access the website. Please use the mobile app.",

  /* ── Token errors ────────────────────────────────────── */
  ACCESS_DENIED_NO_TOKENS: "Access denied. No tokens provided.",
  ACCESS_DENIED_NO_REFRESH_TOKEN: "Access denied. No refresh token provided.",
  INVALID_TOKEN: "Invalid or expired token.",
  INVALID_REFRESH_TOKEN: "Invalid or expired refresh token.",
  ACCESS_AND_REFRESH_TOKEN_EXPIRED:
    "Both access and refresh tokens are expired",

  /* ══════════════════════════════════════════════════════════
   * USERS — self-service profile
   * ══════════════════════════════════════════════════════════ */
  PROFILE_UPDATED: "Profile updated successfully.",
  PASSWORD_CHANGED: "Password changed successfully.",
  CURRENT_PASSWORD_INCORRECT: "Current password is incorrect.",
  NO_VALID_FIELDS: "No valid fields to update.",
  MOBILE_ALREADY_EXISTS: "This mobile number is already registered.",
  USER_NOT_FOUND: "User not found.",

  /* ══════════════════════════════════════════════════════════
   * INTERNAL USERS — dashboard management
   * ══════════════════════════════════════════════════════════ */
  INTERNAL_USER_CREATED: "Internal user created.",
  INTERNAL_USER_RESTORED: "Internal user access restored.",
  INTERNAL_USERS_FETCHED: "Internal users fetched.",
  INTERNAL_USER_REVOKED: "Internal user access revoked.",
  USER_ALREADY_INTERNAL: "User already has dashboard access.",
  USER_DELETED: "Cannot promote a deleted user.",
  USER_INACTIVE: "Cannot promote an inactive user.",
  INVALID_USER_ID: "Invalid user id.",
  INVALID_USER_TYPES: "One or more user types are invalid.",
  USER_TYPES_REQUIRED: "At least one user type is required.",
  USER_TYPES_NOT_FOUND: "One or more user types do not exist.",
  INTERNAL_USER_NOT_FOUND: "Internal user not found.",
  INVALID_INTERNAL_USER_ID: "Invalid internal user id.",

  /* ══════════════════════════════════════════════════════════
   * ACCESS MANAGEMENT
   * ══════════════════════════════════════════════════════════ */
  ACCESS_TREE_FETCHED: "Access tree fetched.",
  ACCESS_GRANTED: "Access granted.",
  ACCESS_ALREADY_EXISTS: "Access already existed.",
  ACCESS_REVOKED: "Access revoked.",
  ACCESS_RECORD_NOT_FOUND: "Access record not found.",
  ACCESS_ALREADY_GRANTED: "Access already granted.",
  USER_ACCESS_FETCHED: "User access fetched.",

  // Access denied at various levels
  ACCESS_DENIED: "Access denied.",
  ACCESS_DENIED_NO_PERMISSION:
    "Access denied. You do not have permission for this action.",
  ACCESS_DENIED_DASHBOARD: "You do not have access to the dashboard.",

  // Query validation
  FLOW_PAGE_REQUIRED: "flow_id and page_id are required in query.",
  INVALID_FLOW_UUID: "flow_id must be a valid UUID.",
  INVALID_PAGE_UUID: "page_id must be a valid UUID.",
  INVALID_COMPONENT_UUID: "component_id must be a valid UUID.",
  INVALID_COMPONENT_VALUE_UUID: "component_value_id must be a valid UUID.",
  PAGE_NOT_BELONG_FLOW: "page_id does not belong to flow_id.",
  COMPONENT_NOT_BELONG_PAGE: "component_id does not belong to page_id.",
  VALUE_NOT_BELONG_COMPONENT:
    "component_value_id does not belong to component_id.",
  COMPONENT_REQUIRED_FOR_VALUE:
    "component_id is required when component_value_id is provided.",

  // Grant/revoke
  INVALID_LEVEL: "Invalid access level.",
  TARGET_NOT_FOUND: "Target not found.",
  INVALID_TARGET_ID: "Invalid target id.",

  /* ══════════════════════════════════════════════════════════
   * EVENTS
   * ══════════════════════════════════════════════════════════ */
  // Success
  EVENT_CREATED: "Event created.",
  EVENT_UPDATED: "Event updated.",
  EVENT_DELETED: "Event deleted.",
  EVENT_FETCHED: "Event fetched.",
  EVENTS_FETCHED: "Events fetched.",
  EVENT_STATUS_UPDATED: "Event status updated.",
  EVENT_STATUS_UNCHANGED: "Event status unchanged.",
  VIEWS_INCREMENTED: "Views incremented.",
  LIKES_INCREMENTED: "Likes incremented.",

  // Not found / conflict
  EVENT_NOT_FOUND: "Event not found.",
  EVENT_NOT_FOUND_OR_DELETED: "Event not found or already deleted.",
  EVENT_NOT_FOUND_OR_NOT_DELETED: "Event not found or not deleted.",
  EVENT_SLUG_EXISTS: "An event with this slug already exists.",
  EVENT_NO_CHANGES: "No valid fields to update.",

  // Validation
  EVENT_INVALID_ID: "Invalid event id.",
  EVENT_INVALID_AUTHOR: "Invalid author id.",
  EVENT_INVALID_SLUG: "Invalid slug.",
  EVENT_INVALID_STATUS: "Status must be one of: draft, published, archived.",
  EVENT_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",

  // Internal failure messages
  EVENT_FAILED_FETCH: "Failed to fetch event.",
  EVENT_FAILED_FETCH_LIST: "Failed to fetch events.",
  EVENT_FAILED_CREATE: "Failed to create event.",
  EVENT_FAILED_UPDATE: "Failed to update event.",
  EVENT_FAILED_DELETE: "Failed to delete event.",
  EVENT_FAILED_STATUS: "Failed to update event status.",
  EVENT_FAILED_VIEWS: "Failed to increment views.",
  EVENT_FAILED_LIKES: "Failed to increment likes.",

  /* ══════════════════════════════════════════════════════════
   * HOME DECOR
   * ══════════════════════════════════════════════════════════ */
  HOME_DECOR_CREATED: "Home decor created.",
  HOME_DECOR_UPDATED: "Home decor updated.",
  HOME_DECOR_DELETED: "Home decor deleted.",
  HOME_DECOR_FETCHED: "Home decor fetched.",
  HOME_DECORS_FETCHED: "Home decor items fetched.",
  HOME_DECOR_STATUS_UPDATED: "Home decor status updated.",
  HOME_DECOR_STATUS_UNCHANGED: "Home decor status unchanged.",
  HOME_DECOR_NOT_FOUND: "Home decor not found.",
  HOME_DECOR_NOT_FOUND_OR_DELETED: "Home decor not found or already deleted.",
  HOME_DECOR_SLUG_EXISTS: "A home decor item with this slug already exists.",
  HOME_DECOR_NO_CHANGES: "No valid fields to update.",
  HOME_DECOR_INVALID_ID: "Invalid home decor id.",
  HOME_DECOR_INVALID_SLUG: "Invalid slug.",
  HOME_DECOR_INVALID_STATUS:
    "Status must be one of: draft, published, archived.",
  HOME_DECOR_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",
  HOME_DECOR_FAILED_FETCH: "Failed to fetch home decor.",
  HOME_DECOR_FAILED_FETCH_LIST: "Failed to fetch home decor items.",
  HOME_DECOR_FAILED_CREATE: "Failed to create home decor.",
  HOME_DECOR_FAILED_UPDATE: "Failed to update home decor.",
  HOME_DECOR_FAILED_DELETE: "Failed to delete home decor.",
  HOME_DECOR_FAILED_STATUS: "Failed to update home decor status.",
  HOME_DECOR_INVALID_LAYOUT: "Layout type must be featured, compact, or medium.",
};

module.exports = responseMessages;
