/**
 * 3rd party libs
 */
const { validationResult, matchedData } = require('express-validator');

// sequential processing, stops running validations chain if the previous one fails.
module.exports = (validations, sanitizeRequest = false) => {
  return async (req, res, next) => {
    for (const validation of validations) {
      const result = await validation.run(req);
      if (result.errors.length) break;
    }

    const errors = validationResult(req);
    //console.log(errors);
    if (!errors.isEmpty()) {
      return res.json({
        'meta': {
          'status': 400,
          'message': errors.errors[0].msg,
        },
        'data':{},
      });
    }
    if (sanitizeRequest) {
      req.body = matchedData(req, {
        onlyValidData: true,
        locations: ['body'],
      });
      req.query = matchedData(req, {
        onlyValidData: true,
        locations: ['query'],
      });
      req.params = matchedData(req, {
        onlyValidData: true,
        locations: ['params'],
      });
    }
    return next();
  };
};
