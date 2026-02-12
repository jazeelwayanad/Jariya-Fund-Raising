import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, type } = body

        const updatedPlace = await prisma.place.update({
            where: { id },
            data: { name, type }
        })

        return NextResponse.json(updatedPlace)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update place" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.place.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete place" }, { status: 500 })
    }
}
