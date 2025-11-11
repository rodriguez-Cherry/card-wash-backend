import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    return res.json("No token");
  }

  jwt.verify(token, process.env.PRIVATE_KEY, function (error, decoded) {
    if (error) return res.json("Token invalido");

    req.user = decoded;

    next();
  });
};
