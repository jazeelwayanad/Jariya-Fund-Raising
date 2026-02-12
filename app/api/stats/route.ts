import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        // 1. Total Amount Collected
        const totalAgg = await prisma.donation.aggregate({
            _sum: {
                amount: true
            },
            where: {
                paymentStatus: "SUCCESS" // Only count successful payments
            }
        })
        const totalAmount = totalAgg._sum.amount || 0

        // 2. Top Batches (by total amount collected)
        // Note: We need to aggregate donations by batchId. 
        // Prisma's groupBy is perfect for this.
        const topBatchesAgg = await prisma.donation.groupBy({
            by: ['batchId'],
            _sum: {
                amount: true
            },
            where: {
                paymentStatus: "SUCCESS",
                batchId: { not: null }
            },
            orderBy: {
                _sum: {
                    amount: 'desc'
                }
            },
            take: 3
        })

        // Fetch Batch details for the top batches
        const batchIds = topBatchesAgg.map(item => item.batchId).filter(id => id !== null) as string[]
        const batches = await prisma.batch.findMany({
            where: {
                id: { in: batchIds }
            }
        })

        // Combine data
        const topBatches = topBatchesAgg.map(item => {
            const batch = batches.find(b => b.id === item.batchId)
            return {
                id: batch?.id,
                name: batch?.name || "Unknown Batch",
                amount: item._sum.amount || 0
            }
        })

        return NextResponse.json({
            totalAmount,
            topBatches
        })
    } catch (error) {
        console.error("Error fetching stats:", error)
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 })
    }
}
