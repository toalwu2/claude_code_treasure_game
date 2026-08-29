// Wraps an async Express handler so a rejected promise reaches next(err)
// instead of crashing the process (Express 4 doesn't do this automatically).
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
