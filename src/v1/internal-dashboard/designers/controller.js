const service = require("./service");
const customResponse = require("../../../utils/responseHandler");
const responseMessages = require("../../../utils/responseMessages");
const logger = require("../../../utils/logger");

const CODE_STATUS_MAP = {
  INVALID_INPUT: 400,
  INVALID_STATUS: 400,
  DESIGNER_NOT_FOUND: 404,
  SLUG_EXISTS: 409,
  NO_CHANGES: 400,
  CODE_GEN_FAILED: 500,
  SERVER_ERROR: 500,
};

const CODE_MESSAGE_MAP = {
  INVALID_INPUT: responseMessages.DESIGNER_INVALID_ID,
  INVALID_STATUS: responseMessages.DESIGNER_INVALID_STATUS,
  DESIGNER_NOT_FOUND: responseMessages.DESIGNER_NOT_FOUND,
  SLUG_EXISTS: responseMessages.DESIGNER_SLUG_EXISTS,
  NO_CHANGES: responseMessages.DESIGNER_NO_CHANGES,
  CODE_GEN_FAILED: responseMessages.DESIGNER_CODE_GEN_FAILED,
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
 * GET /internal/designers — list
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
 * GET /internal/designers/:id
 * ══════════════════════════════════════════════════════════ */
const getOne = async (req, res) => {
  try {
    const result = await service.getDesignerById(req.params.id, {
      includeDeleted: req.query.include_deleted === "true",
    });
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGNER_FETCHED, {
      designer: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "getOne", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * POST /internal/designers — create
 * ══════════════════════════════════════════════════════════ */
const create = async (req, res) => {
  try {
    const result = await service.createDesigner(req.body, req.user.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 201, responseMessages.DESIGNER_CREATED, {
      designer: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "create", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * PUT /internal/designers/:id — update
 * ══════════════════════════════════════════════════════════ */
const update = async (req, res) => {
  try {
    const result = await service.updateDesigner(req.params.id, req.body);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGNER_UPDATED, {
      designer: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "update", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * DELETE /internal/designers/:id — soft delete
 * ══════════════════════════════════════════════════════════ */
const remove = async (req, res) => {
  try {
    const result = await service.deleteDesigner(req.params.id);
    if (!result.success) return respondFailure(res, result);
    return customResponse(res, 200, responseMessages.DESIGNER_DELETED, {
      designer: result.data,
    });
  } catch (error) {
    return respondUnexpected(res, "remove", error);
  }
};

/* ══════════════════════════════════════════════════════════
 * PATCH /internal/designers/:id/status
 * ══════════════════════════════════════════════════════════ */
const updateStatus = async (req, res) => {
  try {
    const { status, restore } = req.body;
    const result = await service.updateDesignerStatus(req.params.id, {
      status,
      restore: restore === true,
    });
    if (!result.success) return respondFailure(res, result);
    const message = result.unchanged
      ? responseMessages.DESIGNER_STATUS_UNCHANGED
      : responseMessages.DESIGNER_STATUS_UPDATED;
    return customResponse(res, 200, message, {
      designer: result.data,
      unchanged: result.unchanged || false,
      transitions: result.transitions || null,
    });
  } catch (error) {
    return respondUnexpected(res, "updateStatus", error);
  }
};

module.exports = { list, getOne, create, update, remove, updateStatus };
