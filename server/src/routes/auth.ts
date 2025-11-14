import { Router } from "express";
import bcrypt from "bcrypt";
import prisma from "../config/prisma";
import { signToken } from "../utils/jwt";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password, name, avatarUrl } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ message: "필수 항목이 누락되었습니다." });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) {
    return res.status(409).json({ message: "이미 가입된 이메일입니다." });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashed,
      name,
      avatarUrl,
    },
  });

  const token = signToken({ userId: user.id, email: user.email, name: user.name });

  return res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "이메일과 비밀번호가 필요합니다." });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: "이메일 또는 비밀번호를 확인하세요." });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return res.status(401).json({ message: "이메일 또는 비밀번호를 확인하세요." });
  }

  const token = signToken({ userId: user.id, email: user.email, name: user.name });

  return res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
    },
  });
});

export default router;
