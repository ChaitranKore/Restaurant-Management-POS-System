// Wraps an async route/controller so rejected promises reach Express's error handler
// instead of needing a try/catch in every controller.
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
