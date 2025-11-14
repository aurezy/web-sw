import { Router } from "express";
import prisma from "../config/prisma";
import requireAuth from "../middlewares/requireAuth";

const router = Router();

router.get("/", async (req, res) => {
  const { q, category, tag } = req.query as {
    q?: string;
    category?: string;
    tag?: string;
  };

  const talents = await prisma.talent.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        category ? { category: { equals: category, mode: "insensitive" } } : {},
        tag ? { tags: { contains: tag, mode: "insensitive" } } : {},
      ],
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return res.json(talents);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const talent = await prisma.talent.findUnique({
    where: { id: Number(id) },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!talent) {
    return res.status(404).json({ message: "재능 정보를 찾을 수 없습니다." });
  }

  return res.json(talent);
});

router.post("/", requireAuth, async (req, res) => {
  const { title, description, imageUrl, category, tags, available } = req.body;

  if (!title || !description || !category) {
    return res.status(400).json({ message: "필수 입력값을 채워주세요." });
  }

  const talent = await prisma.talent.create({
    data: {
      title,
      description,
      imageUrl,
      category,
      tags: Array.isArray(tags) ? tags.join(",") : tags ?? "",
      available: available ?? true,
      ownerId: req.currentUser!.id,
    },
  });

  return res.status(201).json(talent);
});

router.patch("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { title, description, imageUrl, category, tags, available } = req.body;

  const talent = await prisma.talent.findUnique({ where: { id: Number(id) } });
  if (!talent) {
    return res.status(404).json({ message: "재능 정보를 찾을 수 없습니다." });
  }

  if (talent.ownerId !== req.currentUser!.id) {
    return res.status(403).json({ message: "수정 권한이 없습니다." });
  }

  const updated = await prisma.talent.update({
    where: { id: Number(id) },
    data: {
      title,
      description,
      imageUrl,
      category,
      tags: Array.isArray(tags) ? tags.join(",") : tags,
      available,
    },
  });

  return res.json(updated);
});

router.delete("/:id", requireAuth, async (req, res) => {
  const { id } = req.params;

  const talent = await prisma.talent.findUnique({ where: { id: Number(id) } });
  if (!talent) {
    return res.status(404).json({ message: "재능 정보를 찾을 수 없습니다." });
  }

  if (talent.ownerId !== req.currentUser!.id) {
    return res.status(403).json({ message: "삭제 권한이 없습니다." });
  }

  await prisma.talent.delete({ where: { id: Number(id) } });
  return res.status(204).send();
});

export default router;
