import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user as any;

  // Public routes - no auth required
  if (
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/pending-approval" ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Home page - redirect authenticated users to their dashboard
  if (pathname === "/") {
    if (user) {
      const role = user.role;
      if (role === "VOTER") {
        if (!user.approved) {
          return NextResponse.redirect(new URL("/pending-approval", req.url));
        }
        return NextResponse.redirect(new URL("/vote", req.url));
      }
      if (["SUPER_ADMIN", "ELECTION_MANAGER", "AUDITOR"].includes(role)) {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
    }
    return NextResponse.next();
  }

  // Election results pages are public
  if (pathname.startsWith("/elections/") && pathname.endsWith("/results")) {
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
