import jwt from "jsonwebtoken";

// Protects admin-only routes. Expects `Authorization: Bearer <token>`.
// On success, attaches the decoded { id, name, email } payload to req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");

  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ message: "Admin login required" });
    return;
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (_error) {
    res.status(401).json({ message: "Session expired, please log in again" });
  }
}
