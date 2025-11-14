import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-key";
const JWT_EXPIRES_IN = "7d";

type Payload = {
  userId: number;
  email: string;
  name: string;
};

export const signToken = (payload: Payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

export const verifyToken = (token: string) =>
  jwt.verify(token, JWT_SECRET) as Payload;
