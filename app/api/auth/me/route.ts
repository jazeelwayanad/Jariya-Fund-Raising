import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;

        if (!token) {
            return NextResponse.json({ isLoggedIn: false, role: null });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);

        return NextResponse.json({
            isLoggedIn: true,
            role: payload.role,
        });
    } catch (error) {
        return NextResponse.json({ isLoggedIn: false, role: null });
    }
}
