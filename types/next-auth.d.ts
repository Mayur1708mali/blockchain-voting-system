import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
      approved: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    role: Role;
    approved: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    approved: boolean;
  }
}
