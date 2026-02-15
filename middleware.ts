import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("auth_token")?.value;
    const { pathname } = req.nextUrl;

    // 1. Redirect to /admin if logged in and accessing /login
    if (pathname === "/login") {
        if (token) {
            try {
                const secret = new TextEncoder().encode(
                    process.env.JWT_SECRET
                );
                const { payload } = await jwtVerify(token, secret);
                const role = payload.role as string;
                if (role === "COORDINATOR") {
                    return NextResponse.redirect(new URL("/coordinator/dashboard", req.url));
                }
                return NextResponse.redirect(new URL("/admin", req.url));
            } catch (err) {
                // Invalid token, allow access to login
            }
        }
        return NextResponse.next();
    }

    // 2. Protect /admin routes
    if (pathname.startsWith("/admin")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        try {
            const secret = new TextEncoder().encode(
                process.env.JWT_SECRET
            );
            await jwtVerify(token, secret);
            return NextResponse.next();
        } catch (err) {
            console.error("Token verification failed:", err);
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    // 3. Protect /coordinator routes
    if (pathname.startsWith("/coordinator")) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        try {
            const secret = new TextEncoder().encode(
                process.env.JWT_SECRET
            );
            const { payload } = await jwtVerify(token, secret);

            if (payload.role !== "COORDINATOR") {
                // Determine where to redirect based on role
                if (payload.role === "SUPERADMIN" || payload.role === "STAFF") {
                    return NextResponse.redirect(new URL("/admin", req.url));
                }
                return NextResponse.redirect(new URL("/login", req.url));
            }
            return NextResponse.next();
        } catch (err) {
            console.error("Token verification failed:", err);
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/admin/:path*", "/login", "/coordinator/:path*"],
};
