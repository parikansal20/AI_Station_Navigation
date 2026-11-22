/**
 * Standardized API Response Formatters
 */

const sendSuccess = (res, statusCode = 200, message = 'Success', data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...(data !== null && { data })
  });
};

const sendError = (res, statusCode = 400, message = 'Error', errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors !== null && { errors })
  });
};

module.exports = {
  sendSuccess,
  sendError
};
