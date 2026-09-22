const ApiError = require("../utils/ApiError");
const { verifyAccessToken } = require("../utils/jwt");

/** FR-11.3: anonymous use of the core analysis workflow must keep working —
 * this only *populates* req.user when a valid token is present, it never
 * requires one. Use `requireAuth` on routes that need FR-10.3 history. */
function attachUserIfPresent(req, _res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    req.user = null;
    return next();
  }
  try {
    const payload = verifyAccessToken(header.slice("Bearer ".length));
    req.user = { id: payload.sub, role: payload.role };
  } catch {
    req.user = null;
  }
  next();
}

function requireAuth(req, _res, next) {
  if (!req.user) {
    throw new ApiError(401, "Authentication required.");
  }
  next();
}

function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new ApiError(403, "You do not have permission to perform this action.");
    }
    next();
  };
}

module.exports = { attachUserIfPresent, requireAuth, requireRole };
