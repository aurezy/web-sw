import { Router } from "express";
import prisma from "../config/prisma";
import requireAuth from "../middlewares/requireAuth";

const router = Router();

router.get("/conversations", requireAuth, async (req, res) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [
        { senderId: req.currentUser!.id },
        { talent: { ownerId: req.currentUser!.id } },
      ],
    },
    include: {
      talent: {
        select: { id: true, title: true, ownerId: true },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(conversations);
});

router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  const { id } = req.params;
  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(id) },
    include: {
      talent: true,
    },
  });

  if (!conversation) {
    return res.status(404).json({ message: "대화를 찾을 수 없습니다." });
  }

  if (
    conversation.senderId !== req.currentUser!.id &&
    conversation.talent.ownerId !== req.currentUser!.id
  ) {
    return res.status(403).json({ message: "대화 접근 권한이 없습니다." });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "asc" },
  });

  return res.json({ conversation, messages });
});

router.post("/talents/:id/messages", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ message: "메시지 내용을 입력해주세요." });
  }

  const talent = await prisma.talent.findUnique({ where: { id: Number(id) } });
  if (!talent) {
    return res.status(404).json({ message: "재능 정보를 찾을 수 없습니다." });
  }

  const conversation = await prisma.conversation.upsert({
    where: {
      talentId_senderId: {
        talentId: talent.id,
        senderId: req.currentUser!.id,
      },
    },
    update: {},
    create: {
      talentId: talent.id,
      senderId: req.currentUser!.id,
    },
  });

  const message = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId: req.currentUser!.id,
      content,
    },
  });

  return res.status(201).json({ conversationId: conversation.id, message });
});

router.post("/conversations/:id/notify", requireAuth, async (req, res) => {
  const { id } = req.params;

  const conversation = await prisma.conversation.findUnique({
    where: { id: Number(id) },
    include: { talent: true },
  });

  if (!conversation) {
    return res.status(404).json({ message: "대화를 찾을 수 없습니다." });
  }

  if (
    conversation.talent.ownerId !== req.currentUser!.id &&
    conversation.senderId !== req.currentUser!.id
  ) {
    return res.status(403).json({ message: "알림 권한이 없습니다." });
  }

  await prisma.reservation.updateMany({
    where: {
      talentId: conversation.talentId,
      requesterId: conversation.senderId,
      notifiedAt: null,
    },
    data: {
      notifiedAt: new Date(),
    },
  });

  return res.json({ message: "알림이 확인되었습니다." });
});

export default router;
