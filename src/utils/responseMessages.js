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
  HOME_DECOR_INVALID_LAYOUT:
    "Layout type must be featured, compact, or medium.",

  /* ══════════════════════════════════════════════════════════
   * NEWS
   * ══════════════════════════════════════════════════════════ */
  NEWS_CREATED: "News item created.",
  NEWS_UPDATED: "News item updated.",
  NEWS_DELETED: "News item deleted.",
  NEWS_FETCHED: "News item fetched.",
  NEWS_LIST_FETCHED: "News fetched.",
  NEWS_STATUS_UPDATED: "News status updated.",
  NEWS_STATUS_UNCHANGED: "News status unchanged.",
  NEWS_NOT_FOUND: "News item not found.",
  NEWS_NOT_FOUND_OR_DELETED: "News item not found or already deleted.",
  NEWS_SLUG_EXISTS: "A news item with this slug already exists.",
  NEWS_NO_CHANGES: "No valid fields to update.",
  NEWS_INVALID_ID: "Invalid news id.",
  NEWS_INVALID_SLUG: "Invalid slug.",
  NEWS_INVALID_NEWS_TYPE: "News type must be trending, special, or latest.",
  NEWS_INVALID_STATUS: "Status must be one of: draft, published, archived.",
  NEWS_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",
  NEWS_FAILED_FETCH: "Failed to fetch news.",
  NEWS_FAILED_CREATE: "Failed to create news.",
  NEWS_FAILED_UPDATE: "Failed to update news.",
  NEWS_FAILED_DELETE: "Failed to delete news.",
  NEWS_FAILED_STATUS: "Failed to update news status.",
  NEWS_FAILED_VIEWS: "Failed to increment views.",
  NEWS_INVALID_CATEGORY:
    "Invalid category. Must be one of: home_decor, events, trends, furniture, projects, products, designers, design_tech, decor, showroom_showcase.",

  /* ══════════════════════════════════════════════════════════
   * DESIGNERS
   * ══════════════════════════════════════════════════════════ */
  DESIGNER_CREATED: "Designer created.",
  DESIGNER_UPDATED: "Designer updated.",
  DESIGNER_DELETED: "Designer deleted.",
  DESIGNER_FETCHED: "Designer fetched.",
  DESIGNERS_FETCHED: "Designers fetched.",
  DESIGNER_STATUS_UPDATED: "Designer status updated.",
  DESIGNER_STATUS_UNCHANGED: "Designer status unchanged.",
  DESIGNER_NOT_FOUND: "Designer not found.",
  DESIGNER_NOT_FOUND_OR_DELETED: "Designer not found or already deleted.",
  DESIGNER_SLUG_EXISTS: "A designer with this slug already exists.",
  DESIGNER_NO_CHANGES: "No valid fields to update.",
  DESIGNER_INVALID_ID: "Invalid designer id.",
  DESIGNER_INVALID_SLUG: "Invalid slug.",
  DESIGNER_INVALID_STATUS: "Status must be one of: draft, published, archived.",
  DESIGNER_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",

  /* ══════════════════════════════════════════════════════════
   * DESIGN TECH
   * ══════════════════════════════════════════════════════════ */
  DESIGN_TECH_CREATED: "Design tech entry created.",
  DESIGN_TECH_UPDATED: "Design tech entry updated.",
  DESIGN_TECH_DELETED: "Design tech entry deleted.",
  DESIGN_TECH_FETCHED: "Design tech entry fetched.",
  DESIGN_TECH_LIST_FETCHED: "Design tech entries fetched.",
  DESIGN_TECH_STATUS_UPDATED: "Design tech status updated.",
  DESIGN_TECH_STATUS_UNCHANGED: "Design tech status unchanged.",
  DESIGN_TECH_VIEWS_INCREMENTED: "Views incremented.",
  DESIGN_TECH_NOT_FOUND: "Design tech entry not found.",
  DESIGN_TECH_NOT_FOUND_OR_DELETED:
    "Design tech entry not found or already deleted.",
  DESIGN_TECH_SLUG_EXISTS: "A design tech entry with this slug already exists.",
  DESIGN_TECH_NO_CHANGES: "No valid fields to update.",
  DESIGN_TECH_INVALID_ID: "Invalid design tech id.",
  DESIGN_TECH_INVALID_SLUG: "Invalid slug.",
  DESIGN_TECH_INVALID_STATUS:
    "Status must be one of: draft, published, archived.",
  DESIGN_TECH_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",

  /* ══════════════════════════════════════════════════════════
   * FURNITURE
   * ══════════════════════════════════════════════════════════ */
  FURNITURE_CREATED: "Furniture item created.",
  FURNITURE_UPDATED: "Furniture item updated.",
  FURNITURE_DELETED: "Furniture item deleted.",
  FURNITURE_FETCHED: "Furniture item fetched.",
  FURNITURE_LIST_FETCHED: "Furniture fetched.",
  FURNITURE_STATUS_UPDATED: "Furniture status updated.",
  FURNITURE_STATUS_UNCHANGED: "Furniture status unchanged.",
  FURNITURE_VIEWS_INCREMENTED: "Views incremented.",
  FURNITURE_NOT_FOUND: "Furniture item not found.",
  FURNITURE_NOT_FOUND_OR_DELETED:
    "Furniture item not found or already deleted.",
  FURNITURE_SLUG_EXISTS: "A furniture item with this slug already exists.",
  FURNITURE_NO_CHANGES: "No valid fields to update.",
  FURNITURE_INVALID_ID: "Invalid furniture id.",
  FURNITURE_INVALID_SLUG: "Invalid slug.",
  FURNITURE_INVALID_STATUS:
    "Status must be one of: draft, published, archived.",
  FURNITURE_INVALID_YEAR: "Year must be between 1900 and current year.",
  FURNITURE_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",

  /* ══════════════════════════════════════════════════════════
   * PRODUCTS
   * ══════════════════════════════════════════════════════════ */
  PRODUCT_CREATED: "Product created.",
  PRODUCT_UPDATED: "Product updated.",
  PRODUCT_DELETED: "Product deleted.",
  PRODUCT_FETCHED: "Product fetched.",
  PRODUCTS_FETCHED: "Products fetched.",
  PRODUCT_STATUS_UPDATED: "Product status updated.",
  PRODUCT_STATUS_UNCHANGED: "Product status unchanged.",
  PRODUCT_VIEWS_INCREMENTED: "Views incremented.",
  PRODUCT_NOT_FOUND: "Product not found.",
  PRODUCT_NOT_FOUND_OR_DELETED: "Product not found or already deleted.",
  PRODUCT_SLUG_EXISTS: "A product with this slug already exists.",
  PRODUCT_SKU_EXISTS: "A product with this SKU already exists.",
  PRODUCT_NO_CHANGES: "No valid fields to update.",
  PRODUCT_INVALID_ID: "Invalid product id.",
  PRODUCT_INVALID_SLUG: "Invalid slug.",
  PRODUCT_INVALID_STATUS: "Status must be one of: draft, published, archived.",
  PRODUCT_INVALID_AVAILABILITY:
    "Availability must be: in_stock, out_of_stock, preorder, or discontinued.",
  PRODUCT_INVALID_PRICE: "Price must be a non-negative number.",
  PRODUCT_INVALID_CURRENCY: "Currency must be 3 uppercase letters (ISO 4217).",
  PRODUCT_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",

  /* ══════════════════════════════════════════════════════════
   * TRENDS
   * ══════════════════════════════════════════════════════════ */
  TREND_CREATED: "Trend created.",
  TREND_UPDATED: "Trend updated.",
  TREND_DELETED: "Trend deleted.",
  TREND_FETCHED: "Trend fetched.",
  TRENDS_FETCHED: "Trends fetched.",
  TREND_STATUS_UPDATED: "Trend status updated.",
  TREND_STATUS_UNCHANGED: "Trend status unchanged.",
  TREND_VIEWS_INCREMENTED: "Views incremented.",
  TREND_NOT_FOUND: "Trend not found.",
  TREND_NOT_FOUND_OR_DELETED: "Trend not found or already deleted.",
  TREND_SLUG_EXISTS: "A trend with this slug already exists.",
  TREND_NO_CHANGES: "No valid fields to update.",
  TREND_INVALID_ID: "Invalid trend id.",
  TREND_INVALID_SLUG: "Invalid slug.",
  TREND_INVALID_STATUS: "Status must be one of: draft, published, archived.",
  TREND_INVALID_TREND_CATEGORY:
    "Trend category must be: color, material, style, technology, lifestyle, furniture, interior, or general.",
  TREND_INVALID_SEASON:
    "Season must be: spring, summer, autumn, winter, or all_year.",
  TREND_INVALID_CONFIDENCE: "Confidence level must be: low, medium, or high.",
  TREND_INVALID_REGION:
    "Region must be: global, north_america, europe, asia_pacific, latin_america, middle_east, or africa.",
  TREND_INVALID_COLOR: "Each color must be a valid hex code (#RRGGBB).",
  TREND_INVALID_YEAR: "Year must be between 2000 and 2100.",
  TREND_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",

  /* ══════════════════════════════════════════════════════════
   * PROJECTS
   * ══════════════════════════════════════════════════════════ */
  PROJECT_CREATED: "Project created.",
  PROJECT_UPDATED: "Project updated.",
  PROJECT_DELETED: "Project deleted.",
  PROJECT_FETCHED: "Project fetched.",
  PROJECTS_FETCHED: "Projects fetched.",
  PROJECT_HIGHLIGHTS_FETCHED: "Project highlights fetched.",
  PROJECT_STATUS_UPDATED: "Project status updated.",
  PROJECT_STATUS_UNCHANGED: "Project status unchanged.",
  PROJECT_VIEWS_INCREMENTED: "Views incremented.",
  PROJECT_NOT_FOUND: "Project not found.",
  PROJECT_NOT_FOUND_OR_DELETED: "Project not found or already deleted.",
  PROJECT_SLUG_EXISTS: "A project with this slug already exists.",
  PROJECT_NO_CHANGES: "No valid fields to update.",
  PROJECT_INVALID_ID: "Invalid project id.",
  PROJECT_INVALID_SLUG: "Invalid slug.",
  PROJECT_INVALID_STATUS: "Status must be one of: draft, published, archived.",
  PROJECT_INVALID_TYPE:
    "Project type must be: residential, commercial, hospitality, public, industrial, mixed_use, or other.",
  PROJECT_INVALID_PSTATUS:
    "Project status must be: concept, in_progress, completed, on_hold, or cancelled.",
  PROJECT_CODE_GEN_FAILED:
    "Could not generate unique code/slug. Please try again.",
};

module.exports = responseMessages;
