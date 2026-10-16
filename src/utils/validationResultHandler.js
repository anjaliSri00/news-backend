// validationResultHandler.js
const { validationResult } = require('express-validator');
const customResponse = require('./responseHandler');
const responseMessages = require('./responseMessage');

// Common function to handle validation results
const handleValidationResults = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //return res.status(400).json({ errors: errors.array() });
    return customResponse(
      res,
      400,
      responseMessages.VALIDATION_ERROR,
      { errors: errors.errors[0] },
    );
  }
  next(); // Proceed to the next middleware if no validation errors
};

module.exports = handleValidationResults;
