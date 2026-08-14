import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as any;

  // Public routes - no auth required
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // If not authenticated, redirect to login
  if (!user) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Admin routes - require admin roles
  if (pathname.startsWith("/admin")) {
    const adminRoles = ["SUPER_ADMIN", "ELECTION_MANAGER", "AUDITOR"];
    if (!adminRoles.includes(user.role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Vote routes - require approved voter
  if (pathname.startsWith("/vote")) {
    if (user.role !== "VOTER") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    if (!user.approved) {
      return NextResponse.redirect(new URL("/pending-approval", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public).*)",
  ],
};
