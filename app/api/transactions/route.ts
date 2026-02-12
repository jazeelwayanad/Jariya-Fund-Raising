import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""
    const limit = parseInt(searchParams.get("limit") || "20")

    try {
        const where: any = {
            paymentStatus: "SUCCESS"
        }

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { transactionId: { contains: search, mode: 'insensitive' } },
                // Search by amount needs exact match or string conversion, usually exact for numbers but let's try strict.
                // Prisma doesn't support 'contains' on Float easily. We'll skip amount search or try exact match if it looks like a number.
            ]
            if (!isNaN(parseFloat(search))) {
                where.OR.push({ amount: parseFloat(search) })
            }
        }

        const transactions = await prisma.donation.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                batch: true,
                place: {
                    include: {
                        district: true
                    }
                },
                unit: true
            }
        })

        const formatted = transactions.map(tx => {
            const details = []
            if (tx.place) {
                details.push(tx.place.name)
                if (tx.place.district) details.push(tx.place.district.name)
            }
            if (tx.batch) details.push(tx.batch.name)
            if (!tx.batch && !tx.place) details.push("General Donation")

            return {
                id: tx.id,
                name: tx.name || "Anonymous",
                amount: tx.amount,
                date: tx.createdAt, // Frontend will format this
                details: details,
                transactionId: tx.transactionId
            }
        })

        return NextResponse.json(formatted)
    } catch (error) {
        console.error("Error fetching transactions:", error)
        return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 })
    }
}
