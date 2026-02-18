import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { batchId: true },
        });

        if (!user || !user.batchId) {
            return NextResponse.json({ error: "No batch assigned" }, { status: 403 });
        }

        const transactions = await prisma.donation.findMany({
            where: {
                batchId: user.batchId,
                paymentStatus: "SUCCESS",
            },
            orderBy: {
                createdAt: "desc",
            },
            select: {
                id: true,
                amount: true,
                name: true,
                mobile: true,
                paymentStatus: true,
                transactionId: true,
                createdAt: true,
            },
        });

        return NextResponse.json(transactions);

    } catch (error) {
        console.error("Error fetching transactions:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
