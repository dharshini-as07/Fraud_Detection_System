/**
 * Restrict access to users with the 'admin' role
 */
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required to view or modify this resource'
    });
  }
};

module.exports = { requireAdmin };
