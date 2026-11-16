const service = require("./service");
const customResponse = require("../../../utils/responseHandler");

const create = async (req, res) => {
  const result = await service.createLayout(req.body);
  if (!result.success) return customResponse(res, 400, result.message, {});
  return customResponse(res, 201, "Layout created.", result.data);
};

module.exports = { create };
