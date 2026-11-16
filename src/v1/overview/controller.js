const service = require("./service");
const customResponse = require("../../utils/responseHandler");
const logger = require("../../utils/logger");

const getOverview = async (req, res) => {
  try {
    const result = await service.getHomeOverview();
    if (!result.success) return customResponse(res, 404, result.message, {});
    return customResponse(res, 200, "Home overview fetched.", result.data);
  } catch (error) {
    logger.error("getOverview error", { error: error.message });
    return customResponse(res, 500, "Something went wrong.", {});
  }
};

module.exports = { getOverview };
