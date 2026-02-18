import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, year, description, status, slug } = body

        const updatedBatch = await prisma.batch.update({
            where: { id },
            data: { name, slug, year, description, status }
        })

        return NextResponse.json(updatedBatch)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update batch" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        await prisma.batch.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete batch" }, { status: 500 })
    }
}
