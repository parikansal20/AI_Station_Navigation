/**
 * Express Middleware for Joi Schema Validation
 * @param {import('joi').ObjectSchema} schema - Joi Schema to validate req.body against
 */
const validateSchema = (schema) => {
  return (req, res, next) => {
    if (!schema) return next();

    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Invalid request data. Server validation failed.',
        errors: errorMessages
      });
    }

    // Replace req.body with sanitized value
    req.body = value;
    next();
  };
};

module.exports = validateSchema;
