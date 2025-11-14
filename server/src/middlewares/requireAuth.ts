import type { Request, Response, NextFunction } from "express";
import prisma from "../config/prisma";
import { verifyToken } from "../utils/jwt";

export default async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user) {
      return res.status(401).json({ message: "유효하지 않은 사용자입니다." });
    }

    req.currentUser = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "토큰 검증에 실패했습니다." });
  }
}
