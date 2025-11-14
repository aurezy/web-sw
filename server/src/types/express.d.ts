import type { User } from "@prisma/client";

declare global {
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface Request {
      currentUser?: Pick<User, "id" | "email" | "name">;
    }
  }
}

export {};
