const knex = require("../../../db/sqldb").db;
const internalDashbordService = require("../users/service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessage");

const checkComponentAccess = async (req, res, next) => {
  try {
    const { flow_id, page_id } = req.query;
    console.log("checkComponentAccess middleware called with flow_id:", flow_id, "and page_id:", page_id);
    if (!flow_id || !page_id) {
      return res.status(400).json({
        meta: {
          status: "error",
          message: "flow_id and page_id are required in the query",
        },
      });
    }
    const user = req.user;
    console.log(req.user,"---------------------------------------------------------")
    if (!user || !user.id) {
      return customResponse(res, 403, responseMessages.USER_NOT_AUTHENTICATED, {});
    }
    const userId = user.id;

    // If the user is superadmin, bypass the access checks
    if (user.is_superadmin) {
      return next();
    }

    //check existing user with userId
    const existingUser = await internalDashbordService.findUserById(userId);
    if (!existingUser) {
      return customResponse(res, 404, responseMessages.USER_NOT_FOUND, {});
    }
    // Step 2: Check user access to the specified flow and page
    const flowAccess = await knex("user_flow_access")
      .select("flow_id")
      .where("user_id", userId)
      .andWhere("flow_id", flow_id)
      .andWhere("is_active", true)
      .first();

    const pageAccess = await knex("user_page_access")
      .select("page_id")
      .where("user_id", userId)
      .andWhere("page_id", page_id)
      .andWhere("is_active", true)
      .first();
    if (!flowAccess || !pageAccess) {
      return customResponse(res, 403, responseMessages.ACCESS_DENIED_TO_FLOW_OR_PAGE, {});
    }
cosnole.log(flowAccess, pageAccess, "--------------------FLOW AND PAGE ACCESS CHECK-------------------------");
    // Step 3: Fetch components the user has access to for the specified flow and page
    const userComponents = await knex("user_component_access as uca")
      .join("component as c", "uca.component_id", "c.id") // Join user_component_access with component
      .select("uca.component_id") // Select the component ID
      .where("uca.user_id", userId) // Filter by user ID
      .andWhere("c.page_id", page_id); // Filter by page ID

    // Step 4: Pass the valid component IDs to the next middleware or controller
    if (!userComponents.length) {
      return customResponse(res, 403, responseMessages.ACCESS_DENIED_NO_COMPONENT_ACCESS, {});
    }

    const componentIds = userComponents.map(
      (component) => component.component_id,
    );

    req.componentIds = componentIds; // Pass component IDs to the next step
    console.log(req.componentIds,'= CHECKING COMPONENT ACCESS-------------------------------');

    // // Step 3: Check for component_value_id in user_component_value_access table
    // const componentValueCheck = await knex("user_component_value_access")
    //   .select("component_value_id", "component_id")
    //   .whereIn("component_id", componentIds)
    //   .andWhere("user_id", userId)
    //   .andWhere("is_active", true);

    // console.log("Component value check results:", componentValueCheck); // Debugging information

    // // Step 4: If component values exist, throw an error requiring component_value_id
    // if (componentValueCheck.length > 0) {
    //   return res.status(400).json({
    //     meta: {
    //       status: 400,
    //       message: "component_value_id is required to access these components"
    //     },
    //     data: {
    //       components: componentValueCheck.map(cv => ({
    //         component_id: cv.component_id,
    //         component_value_id: cv.component_value_id
    //       }))
    //     }
    //   });
    // }

    // If no component_value_id is required, move forward
    next();
  } catch (error) {
    console.error("Error in checkComponentAccess middleware:", error);
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};

const checkComponentValueAccess = async (req, res, next) => {
  try {
    const { component_value_id } = req.query;
    const user = req.user;
    if (!user || !user.id) {
      return customResponse(res, 403, responseMessages.USER_NOT_AUTHENTICATED, {});
    }
    const userId = user.id;

    // If the user is superadmin, bypass the access checks
    if (user.is_superadmin) {
      return next();
    }

    if (!component_value_id) {
      return customResponse(res, 400, "component_value_id is required in the query", {});
    }

    // Step 1: Check if the user has access to the component value
    const componentValueAccess = await knex("user_component_value_access")
      .select("component_value_id")
      .where("component_value_id", component_value_id)
      .andWhere("user_id", userId)
      .andWhere("is_active", true)
      .first();

    // Step 2: If no access, return a 403 error
    if (!componentValueAccess) {
      return customResponse(res, 403, "Access denied to the component value", {});
    }

    // Step 3: If access is granted, proceed
    req.component_value_id = component_value_id; // Pass component_value_id to the next step
    next();
  } catch (error) {
    console.error("Error in checkComponentValueAccess middleware:", error);
    return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
  }
};

module.exports = { checkComponentAccess, checkComponentValueAccess };
