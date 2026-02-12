import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, placeIds, status } = body

        const updatedUnit = await prisma.unit.update({
            where: { id },
            data: { name, placeIds, status }
        })

        return NextResponse.json(updatedUnit)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update unit" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.unit.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete unit" }, { status: 500 })
    }
}
