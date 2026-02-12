import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        const batches = await prisma.batch.findMany({
            orderBy: { createdAt: 'desc' }
        })
        return NextResponse.json(batches)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch batches" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    console.log("DEBUG: DATABASE_URL =", process.env.DATABASE_URL)
    try {
        const body = await req.json()
        const { name, year, description, status } = body

        const newBatch = await prisma.batch.create({
            data: {
                name,
                year,
                description,
                status: status || "Active"
            }
        })

        return NextResponse.json(newBatch)
    } catch (error) {
        return NextResponse.json({ error: "Failed to create batch", details: String(error), dbUrl: process.env.DATABASE_URL }, { status: 500 })
    }
}
