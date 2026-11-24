class AppError extends Error {
  constructor(message, statusCode = 500, code = null, extra = {}) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.extra = extra;
  }
}

module.exports = { AppError };
