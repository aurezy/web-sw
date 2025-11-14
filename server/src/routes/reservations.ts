import { Router } from "express";
import prisma from "../config/prisma";
import requireAuth from "../middlewares/requireAuth";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { role } = req.query as { role?: "owner" | "requester" };

  if (role === "owner") {
    const reservations = await prisma.reservation.findMany({
      where: { talent: { ownerId: req.currentUser!.id } },
      include: {
        talent: true,
        requester: { select: { id: true, name: true, email: true, avatarUrl: true } },
      },
      orderBy: { requestedAt: "desc" },
    });
    return res.json(reservations);
  }

  const reservations = await prisma.reservation.findMany({
    where: { requesterId: req.currentUser!.id },
    include: {
      talent: true,
    },
    orderBy: { requestedAt: "desc" },
  });

  return res.json(reservations);
});

router.post("/talents/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  const talent = await prisma.talent.findUnique({ where: { id: Number(id) } });
  if (!talent) {
    return res.status(404).json({ message: "재능 정보를 찾을 수 없습니다." });
  }

  if (talent.ownerId === req.currentUser!.id) {
    return res.status(400).json({ message: "본인 재능에는 예약을 신청할 수 없습니다." });
  }

  const reservation = await prisma.reservation.create({
    data: {
      talentId: talent.id,
      requesterId: req.currentUser!.id,
      message,
    },
  });

  return res.status(201).json(reservation);
});

router.patch("/:id/status", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body as { status: "ACCEPTED" | "DECLINED" };

  if (!status) {
    return res.status(400).json({ message: "상태 값을 전달해주세요." });
  }

  const reservation = await prisma.reservation.findUnique({
    where: { id: Number(id) },
    include: { talent: true },
  });

  if (!reservation) {
    return res.status(404).json({ message: "예약을 찾을 수 없습니다." });
  }

  if (reservation.talent.ownerId !== req.currentUser!.id) {
    return res.status(403).json({ message: "승인 권한이 없습니다." });
  }

  const updated = await prisma.reservation.update({
    where: { id: reservation.id },
    data: {
      status,
      notifiedAt: status === "ACCEPTED" ? new Date() : reservation.notifiedAt,
    },
  });

  return res.json(updated);
});

export default router;
