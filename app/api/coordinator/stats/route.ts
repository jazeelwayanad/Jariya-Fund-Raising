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
            include: {
                batch: {
                    include: {
                        _count: {
                            select: { donations: true },
                        },
                    },
                },
            },
        });

        if (!user || !user.batch) {
            return NextResponse.json({ error: "No batch assigned" }, { status: 404 });
        }

        // Calculate total amount collected by this batch (sum of donations with batchId)
        // Wait, schema says Batch has totalAmount field. Is it updated automatically?
        // Or should I calculate it from donations?
        // Let's calculate it from donations to be safe, or check if 'totalAmount' in Batch model is maintained.
        // Looking at schema, Batch has 'totalAmount Float @default(0)'.
        // Assuming it's maintained or I should use aggregation.
        // Let's aggregate for accuracy.

        const agregated = await prisma.donation.aggregate({
            where: {
                batchId: user.batch.id,
                paymentStatus: "SUCCESS",
            },
            _sum: {
                amount: true,
            },
        });

        const totalCollected = agregated._sum.amount || 0;

        return NextResponse.json({
            batch: {
                id: user.batch.id,
                name: user.batch.name,
                slug: user.batch.slug,
                year: user.batch.year,
                description: user.batch.description,
                totalCollected: totalCollected,
                transactionCount: await prisma.donation.count({
                    where: {
                        batchId: user.batch.id,
                        paymentStatus: "SUCCESS"
                    }
                })
                // Let's count success donations independently
            },
            user: {
                name: user.name,
                username: user.username,
            },
        });

    } catch (error) {
        console.error("Error fetching coordinator stats:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
