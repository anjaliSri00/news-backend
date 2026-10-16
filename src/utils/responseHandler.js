// src/utils/responseHandler.js
function customResponse (res, status, message, data = {}) {
  res.status(status).json({
    meta: {
      status,
      message,
    },
    data,
  });
}

module.exports = customResponse;
