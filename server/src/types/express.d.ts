import type { Role } from "./enums.js";

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      user?: {
        id: string;
        email: string;
        role: Role;
        organizationId: string;
        name: string;
      };
    }
  }
}

export {};
