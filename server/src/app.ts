import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth";
import talentRoutes from "./routes/talents";
import messageRoutes from "./routes/messages";
import reservationRoutes from "./routes/reservations";

const app = express();

app.use(cors());
app.use(express.json({ limit: "5mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/talents", talentRoutes);
app.use("/messages", messageRoutes);
app.use("/reservations", reservationRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  // eslint-disable-next-line no-console
  console.error(err);
  res.status(500).json({ message: "서버 오류가 발생했습니다." });
});

export default app;
