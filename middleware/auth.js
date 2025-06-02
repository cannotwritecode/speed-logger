const ADMIN_API_KEY = process.env.ADMIN_API_KEY;

function authenticateAdmin(req, res, next) {
  const apiKey = req.headers["x-api-key"];
  if (apiKey !== ADMIN_API_KEY) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
}

module.exports = { authenticateAdmin };
