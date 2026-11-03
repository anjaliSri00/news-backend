const service = require("./service");
const customResponse = require("../../utils/responseHandler");
const responseMessages = require("../../utils/responseMessages");
const logger = require("../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  DESIGNER_NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.DESIGNER_INVALID_ID,
  DESIGNER_NOT_FOUND: responseMessages.DESIGNER_NOT_FOUND,
  SERVER_ERROR: responseMessages.INTERNAL_SERVER_ERROR,
};

const respondFailure = (res, result) => {
  const status = CODE_STATUS_MAP[result.code] || 500;
  const message =
    CODE_MESSAGE_MAP[result.code] ||
    result.message ||
    responseMessages.INTERNAL_SERVER_ERROR;
  return customResponse(res, status, message, {});
};

const respondUnexpected = (res, fnName, error) => {
  logger.error(`${fnName} controller error`, {
    error: error.message,
    stack: error.stack,
  });
  return customResponse(res, 500, responseMessages.INTERNAL_SERVER_ERROR, {});
};

/* ══════════════════════════════════════════════════════════
 * GET /api/v1/designers — list
 * ══════════════════════════════════════════════════════════ */
const list = async (req, res) => {
  try {
    const result = await service.listDesigners(req.query);
    if (!result.success) return respondFailure(res, result);
    return customResponse(
      res,
      200,
      responseMessages.DESIGNERS_FETCHED,
      result.data,
    );
  } catch (error) {
    return respondUnexpected(res, "list", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * GET /api/v1/designers/:id
 * ══════════════════════════════════════════════════════════ */
const getById = async (req, res) => {
  try {
    const result = await service.getDesignerById(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGNER_FETCHED, {
      designer: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getById", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * GET /api/v1/designers/slug/:slug
 * ══════════════════════════════════════════════════════════ */
const getBySlug = async (req, res) => {
  try {
    const result = await service.getDesignerBySlug(req.params.slug);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGNER_FETCHED, {
      designer: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getBySlug", error);
  }
};

module.exports = { list, getById, getBySlug };
