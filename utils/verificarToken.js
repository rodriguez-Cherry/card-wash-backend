import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(400).json("No token");
  }

  jwt.verify(token, process.env.PRIVATE_KEY, function (error, decoded) {
    if (error) return res.status(400).json("Token invalido");

    req.user = decoded;

    next();
  });
};
