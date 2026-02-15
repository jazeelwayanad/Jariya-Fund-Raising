import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
    try {
        console.log("API: /api/coordinator/leaderboard hit");
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            console.log("API: No token");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                role: true,
                batchId: true,
            },
        });

        if (!user) {
            console.log("API: User not found");
            return NextResponse.json({ error: "User not found" }, { status: 403 });
        }

        console.log(`API: User ID ${userId}, Role: ${user.role}, Batch: ${user.batchId}`);

        if (user.role !== "COORDINATOR" || !user.batchId) {
            console.log("API: Invalid role or batch");
            return NextResponse.json({ error: "Invalid coordinator or batch assignment" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "50");

        // Fetch donations first to verify data existence
        const count = await prisma.donation.count({
            where: {
                batchId: user.batchId,
                paymentStatus: "SUCCESS"
            }
        });
        console.log(`API: Found ${count} successful donations for batch ${user.batchId}`);

        const agg = await prisma.donation.groupBy({
            by: ['name', 'mobile'],
            _sum: { amount: true },
            where: {
                batchId: user.batchId,
                paymentStatus: "SUCCESS",
            },
            orderBy: { _sum: { amount: 'desc' } },
            take: limit
        });

        console.log(`API: GroupBy returned ${agg.length} items`);

        // Map to simpler format
        const result = agg.map((item, index) => ({
            rank: index + 1,
            name: item.name || "Anonymous",
            mobile: item.mobile, // Maybe mask?
            amount: item._sum.amount || 0
        }));

        return NextResponse.json(result);

    } catch (error) {
        console.error("Error fetching coordinator leaderboard:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
