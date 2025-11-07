import jwt from "jsonwebtoken";
import "dotenv/config";
const privateKey = process.env.PRIVATE_KEY;

export function createToken(data) {
  const { email, name } = data;

  return new Promise((resolve, reject) => {
    jwt.sign(
      { email, name },
      privateKey,
      { expiresIn: "1h" },
      function (error, token) {
        if (error) {
          reject(error);
        }

        resolve(token);
      }
    );
  });
}
