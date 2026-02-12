import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET: Fetch all units
export async function GET() {
    try {
        const units = await prisma.unit.findMany()
        return NextResponse.json(units)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch units" }, { status: 500 })
    }
}

// POST: Create a new Unit
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, placeIds, status } = body

        if (!name) {
            return NextResponse.json({ error: "Name is required" }, { status: 400 })
        }

        const newUnit = await prisma.unit.create({
            data: {
                name,
                placeIds: placeIds || [],
                status: status || "Active"
            }
        })

        return NextResponse.json(newUnit)
    } catch (error) {
        console.error("Error creating unit:", error)
        return NextResponse.json({ error: "Failed to create unit" }, { status: 500 })
    }
}
