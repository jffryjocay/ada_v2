import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "ada_system_secret_key_2026";

/**
 * Middleware to verify JWT authentication token
 */
export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Access denied. Token missing or invalid." });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

/**
 * Middleware to restrict access to Admin role only
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "Admin") {
    return res.status(403).json({ success: false, message: "Access denied. Admin role required." });
  }
  next();
};
