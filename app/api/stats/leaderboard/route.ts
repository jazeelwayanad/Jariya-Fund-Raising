import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "batches"
    const limit = parseInt(searchParams.get("limit") || "10")

    try {
        let result: any[] = []

        if (type === "batches") {
            const agg = await prisma.donation.groupBy({
                by: ['batchId'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS", batchId: { not: null } },
                orderBy: { _sum: { amount: 'desc' } },
                take: limit
            })

            const ids = agg.map(i => i.batchId).filter(Boolean) as string[]
            const data = await prisma.batch.findMany({ where: { id: { in: ids } } })

            result = agg.map(item => {
                const d = data.find(x => x.id === item.batchId)
                return { name: d?.name || "Unknown", amount: item._sum.amount, id: d?.id }
            })

        } else if (type === "individuals") {
            // Group by mobile (unique identifier)
            // If mobile is missing, we might skip or group by name. 
            // For now, let's group by Name if mobile is null, or just group by Name + Mobile combination?
            // "Individuals" usually implies unique donors. Mobile is the best key.
            const agg = await prisma.donation.groupBy({
                by: ['name', 'mobile', 'batchId'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS" },
                orderBy: { _sum: { amount: 'desc' } },
                take: limit
            })

            // Need batch names for display
            const batchIds = [...new Set(agg.map(i => i.batchId).filter(Boolean))] as string[]
            const batches = await prisma.batch.findMany({ where: { id: { in: batchIds } } })

            result = agg.map((item, index) => {
                const b = batches.find(x => x.id === item.batchId)
                return {
                    rank: index + 1,
                    name: item.name || "Anonymous",
                    batch: b?.name || "General",
                    amount: item._sum.amount
                }
            })

        } else if (type === "units") {
            const agg = await prisma.donation.groupBy({
                by: ['unitId'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS", unitId: { not: null } },
                orderBy: { _sum: { amount: 'desc' } },
                take: limit
            })

            const ids = agg.map(i => i.unitId).filter(Boolean) as string[]
            const data = await prisma.unit.findMany({ where: { id: { in: ids } } })

            result = agg.map(item => {
                const d = data.find(x => x.id === item.unitId)
                return { name: d?.name || "Unknown", amount: item._sum.amount }
            })

        } else if (type === "municipalities") { // Places
            const agg = await prisma.donation.groupBy({
                by: ['placeId'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS", placeId: { not: null } },
                orderBy: { _sum: { amount: 'desc' } },
                take: limit
            })

            const ids = agg.map(i => i.placeId).filter(Boolean) as string[]
            const data = await prisma.place.findMany({ where: { id: { in: ids } } })

            result = agg.map(item => {
                const d = data.find(x => x.id === item.placeId)
                return { name: d?.name || "Unknown", amount: item._sum.amount }
            })

        } else if (type === "districts") {
            // Complex aggregation: Donation -> Place -> District
            // 1. Get all donations grouped by Place
            const placeAgg = await prisma.donation.groupBy({
                by: ['placeId'],
                _sum: { amount: true },
                where: { paymentStatus: "SUCCESS", placeId: { not: null } }
            })

            // 2. Get all Places with their District ID
            const placeIds = placeAgg.map(p => p.placeId).filter(Boolean) as string[]
            const places = await prisma.place.findMany({
                where: { id: { in: placeIds } },
                select: { id: true, districtId: true, district: { select: { name: true } } }
            })

            // 3. Aggregate by District in memory
            const districtMap = new Map<string, { name: string, amount: number }>()

            placeAgg.forEach(p => {
                const place = places.find(pl => pl.id === p.placeId)
                if (place && place.districtId) {
                    const current = districtMap.get(place.districtId) || { name: place.district.name, amount: 0 }
                    current.amount += (p._sum.amount || 0)
                    districtMap.set(place.districtId, current)
                }
            })

            // 4. Convert to array and sort
            result = Array.from(districtMap.values())
                .sort((a, b) => b.amount - a.amount)
                .slice(0, limit)
        }

        return NextResponse.json(result)
    } catch (error) {
        console.error("Error fetching leaderboard:", error)
        return NextResponse.json({ error: "Failed to fetch leaderboard" }, { status: 500 })
    }
}
