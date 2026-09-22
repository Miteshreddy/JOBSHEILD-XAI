const { validationResult } = require("express-validator");
const ApiError = require("../utils/ApiError");

/** Runs after an express-validator chain; turns validation failures into the
 * IR-11 consistent error schema instead of express-validator's own shape. */
function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    throw new ApiError(422, "Validation failed.", result.array().map((e) => ({
      field: e.path,
      message: e.msg,
    })));
  }
  next();
}

module.exports = validate;
