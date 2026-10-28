// /**
//  * Query-based access middleware for the internal dashboard.
//  *
//  * Frontend sends:
//  *   GET /api/v1/events?flow_id=<events-flow-uuid>&page_id=<events-list-page-uuid>
//  *   POST /api/v1/events?flow_id=<events-flow-uuid>&page_id=<events-create-page-uuid>
//  *   DELETE /api/v1/events/:id?flow_id=...&page_id=...&component_id=...&component_value_id=...
//  *
//  * Middleware checks user's grants at those exact IDs (with inheritance):
//  *   flow grant  → covers pages, components, values inside it
//  *   page grant  → covers components, values on it
//  *   component grant → covers its values
//  *
//  * Superadmin bypasses all checks.
//  * Revoked grants (revoked_at IS NOT NULL) are treated as absent.
//  */

const knex = require("../db/sqldb").db;
const customResponse = require("../utils/responseHandler");
const responseMessages = require("../utils/responseMessages");
const logger = require("../utils/logger");

// /* ──────────────────────────────────────────────────────
//  * UUID validator
//  * ────────────────────────────────────────────────────── */
 const UUID_REGEX =
   /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// const isUUID = (v) => typeof v === "string" && UUID_REGEX.test(v);

// /* ──────────────────────────────────────────────────────
//  * Check user grants — walk up hierarchy with inheritance.
//  * Returns { allowed: true, level } or { allowed: false }.
//  * ────────────────────────────────────────────────────── */
// const checkAccess = async (
//   userId,
//   { flowId, pageId, componentId, valueId },
// ) => {
//   // Value level
//   if (valueId) {
//     const row = await knex("user_component_value_access")
//       .where({ user_id: userId, component_value_id: valueId })
//       .whereNull("revoked_at")
//       .first();
//     if (row) return { allowed: true, level: "component_value" };
//   }

//   // Component level
//   if (componentId) {
//     const row = await knex("user_component_access")
//       .where({ user_id: userId, component_id: componentId })
//       .whereNull("revoked_at")
//       .first();
//     if (row) return { allowed: true, level: "component" };
//   }

//   // Page level
//   if (pageId) {
//     const row = await knex("user_page_access")
//       .where({ user_id: userId, page_id: pageId })
//       .whereNull("revoked_at")
//       .first();
//     if (row) return { allowed: true, level: "page" };
//   }

//   // Flow level
//   if (flowId) {
//     const row = await knex("user_flow_access")
//       .where({ user_id: userId, flow_id: flowId })
//       .whereNull("revoked_at")
//       .first();
//     if (row) return { allowed: true, level: "flow" };
//   }

//   return { allowed: false };
// };

// /* ──────────────────────────────────────────────────────
//  * Main middleware
//  * Reads flow_id, page_id (required), component_id,
//  * component_value_id (optional) from req.query.
//  * ────────────────────────────────────────────────────── */
// const requireAccess = async (req, res, next) => {
//   try {
//     /* ── 1. Require auth (JWT middleware must have run) ── */
//     if (!req.user || !req.user.id) {
//       return customResponse(
//         res,
//         401,
//         responseMessages.ACCESS_DENIED_NO_TOKENS,
//         {},
//       );
//     }

//     /* ── 2. Superadmin bypass — before any query checks ── */
//     if (req.user.is_superadmin) {
//       return next();
//     }

//     /* ── 3. Read and validate query params ─────────────── */
//     const { flow_id, page_id, component_id, component_value_id } = req.query;

//     if (!flow_id || !page_id) {
//       return customResponse(
//         res,
//         400,
//         "flow_id and page_id are required in query.",
//         {},
//       );
//     }
//     if (!isUUID(flow_id)) {
//       return customResponse(res, 400, "flow_id must be a valid UUID.", {});
//     }
//     if (!isUUID(page_id)) {
//       return customResponse(res, 400, "page_id must be a valid UUID.", {});
//     }
//     if (component_id && !isUUID(component_id)) {
//       return customResponse(res, 400, "component_id must be a valid UUID.", {});
//     }
//     if (component_value_id && !isUUID(component_value_id)) {
//       return customResponse(
//         res,
//         400,
//         "component_value_id must be a valid UUID.",
//         {},
//       );
//     }

//     /* ── 4. Verify page belongs to flow (tamper check) ─── */
//     const page = await knex("pages")
//       .where({ id: page_id, flow_id, is_active: true })
//       .first();
//     if (!page) {
//       return customResponse(
//         res,
//         400,
//         "page_id does not belong to flow_id.",
//         {},
//       );
//     }

//     /* ── 5. Verify component belongs to page (if given) ── */
//     if (component_id) {
//       const comp = await knex("components")
//         .where({ id: component_id, page_id, is_active: true })
//         .first();
//       if (!comp) {
//         return customResponse(
//           res,
//           400,
//           "component_id does not belong to page_id.",
//           {},
//         );
//       }
//     }

//     /* ── 6. Verify value belongs to component (if given) ─ */
//     if (component_value_id) {
//       if (!component_id) {
//         return customResponse(
//           res,
//           400,
//           "component_id is required when component_value_id is provided.",
//           {},
//         );
//       }
//       const val = await knex("component_values")
//         .where({ id: component_value_id, component_id, is_active: true })
//         .first();
//       if (!val) {
//         return customResponse(
//           res,
//           400,
//           "component_value_id does not belong to component_id.",
//           {},
//         );
//       }
//     }

//     /* ── 7. Check grants (with inheritance) ────────────── */
//     const result = await checkAccess(req.user.id, {
//       flowId: flow_id,
//       pageId: page_id,
//       componentId: component_id || null,
//       valueId: component_value_id || null,
//     });

//     if (!result.allowed) {
//       logger.warn("Access denied", {
//         userId: req.user.id,
//         method: req.method,
//         path: req.path,
//         flowId: flow_id,
//         pageId: page_id,
//         componentId: component_id,
//         valueId: component_value_id,
//       });
//       return customResponse(
//         res,
//         403,
//         "Access denied. You do not have permission for this action.",
//         {},
//       );
//     }

//     /* ── 8. Attach resolved context for controllers ────── */
//     req.accessContext = {
//       flow_id,
//       page_id,
//       component_id: component_id || null,
//       component_value_id: component_value_id || null,
//       granted_at_level: result.level,
//     };

//     next();
//   } catch (error) {
//     logger.error("requireAccess error", {
//       error: error.message,
//       path: req.path,
//     });
//     return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
//   }
// };

// module.exports = { requireAccess };


// const internalDashbordService = require("../v1/internal-dashboard/users/service");

// const checkComponentAccess = async (req, res, next) => {
//   try {
//     const { flow_id, page_id } = req.query;
//     console.log("checkComponentAccess middleware called with flow_id:", flow_id, "and page_id:", page_id);
//     if (!flow_id || !page_id) {
//       return res.status(400).json({
//         meta: {
//           status: "error",
//           message: "flow_id and page_id are required in the query",
//         },
//       });
//     }
//     const user = req.user;
//     console.log(req.user,"---------------------------------------------------------")
//     if (!user || !user.id) {
//       return customResponse(res, 403, responseMessages.USER_NOT_AUTHENTICATED, {});
//     }
//     const userId = user.id;

//     // If the user is superadmin, bypass the access checks
//     if (user.is_superadmin) {
//       return next();
//     }

//     //check existing user with userId
//     const existingUser = await internalDashbordService.findUserById(userId);
//     if (!existingUser) {
//       return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
//     }
//     // Step 2: Check user access to the specified flow and page
//     const flowAccess = await knex("user_flow_access")
//       .select("flow_id")
//       .where("user_id", userId)
//       .andWhere("flow_id", flow_id)
//       .andWhere("is_active", true)
//       .first();

//     const pageAccess = await knex("user_page_access")
//       .select("page_id")
//       .where("user_id", userId)
//       .andWhere("page_id", page_id)
//       .andWhere("is_active", true)
//       .first();
//     if (!flowAccess || !pageAccess) {
//       return customResponse(res, 403, responseMessages.ACCESS_DENIED_TO_FLOW_OR_PAGE, {});
//     }
// cosnole.log(flowAccess, pageAccess, "--------------------FLOW AND PAGE ACCESS CHECK-------------------------");
//     // Step 3: Fetch components the user has access to for the specified flow and page
//     const userComponents = await knex("user_component_access as uca")
//       .join("component as c", "uca.component_id", "c.id") // Join user_component_access with component
//       .select("uca.component_id") // Select the component ID
//       .where("uca.user_id", userId) // Filter by user ID
//       .andWhere("c.page_id", page_id); // Filter by page ID

//     // Step 4: Pass the valid component IDs to the next middleware or controller
//     if (!userComponents.length) {
//       return customResponse(res, 403, responseMessages.ACCESS_DENIED_NO_COMPONENT_ACCESS, {});
//     }

//     const componentIds = userComponents.map(
//       (component) => component.component_id,
//     );

//     req.componentIds = componentIds; // Pass component IDs to the next step
//     console.log(req.componentIds,'= CHECKING COMPONENT ACCESS-------------------------------');

//     // // Step 3: Check for component_value_id in user_component_value_access table
//     // const componentValueCheck = await knex("user_component_value_access")
//     //   .select("component_value_id", "component_id")
//     //   .whereIn("component_id", componentIds)
//     //   .andWhere("user_id", userId)
//     //   .andWhere("is_active", true);

//     // console.log("Component value check results:", componentValueCheck); // Debugging information

//     // // Step 4: If component values exist, throw an error requiring component_value_id
//     // if (componentValueCheck.length > 0) {
//     //   return res.status(400).json({
//     //     meta: {
//     //       status: 400,
//     //       message: "component_value_id is required to access these components"
//     //     },
//     //     data: {
//     //       components: componentValueCheck.map(cv => ({
//     //         component_id: cv.component_id,
//     //         component_value_id: cv.component_value_id
//     //       }))
//     //     }
//     //   });
//     // }

//     // If no component_value_id is required, move forward
//     next();
//   } catch (error) {
//     console.error("Error in checkComponentAccess middleware:", error);
//     return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
//   }
// };

// const checkComponentValueAccess = async (req, res, next) => {
//   try {
//     const { component_value_id } = req.query;
//     const user = req.user;
//     if (!user || !user.id) {
//       return customResponse(res, 403, responseMessages.USER_NOT_AUTHENTICATED, {});
//     }
//     const userId = user.id;

//     // If the user is superadmin, bypass the access checks
//     if (user.is_superadmin) {
//       return next();
//     }

//     if (!component_value_id) {
//       return customResponse(res, 400, "component_value_id is required in the query", {});
//     }

//     // Step 1: Check if the user has access to the component value
//     const componentValueAccess = await knex("user_component_value_access")
//       .select("component_value_id")
//       .where("component_value_id", component_value_id)
//       .andWhere("user_id", userId)
//       .andWhere("is_active", true)
//       .first();

//     // Step 2: If no access, return a 403 error
//     if (!componentValueAccess) {
//       return customResponse(res, 403, "Access denied to the component value", {});
//     }

//     // Step 3: If access is granted, proceed
//     req.component_value_id = component_value_id; // Pass component_value_id to the next step
//     next();
//   } catch (error) {
//     console.error("Error in checkComponentValueAccess middleware:", error);
//     return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
//   }
// };

// module.exports = { checkComponentAccess, checkComponentValueAccess };
