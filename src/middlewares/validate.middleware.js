const { AppError } = require('../utils/app-error');

function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      const msg = firstIssue ? firstIssue.message : 'بيانات الطلب غير صالحة';
      return next(new AppError(msg, 400, 'VALIDATION_ERROR'));
    }
    req.body = result.data;
    return next();
  };
}

module.exports = { validate };
