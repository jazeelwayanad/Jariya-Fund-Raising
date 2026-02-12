import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name } = body

        const updatedDistrict = await prisma.district.update({
            where: { id },
            data: { name }
        })

        return NextResponse.json(updatedDistrict)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update district" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

        // Cascade delete: places → district
        await prisma.place.deleteMany({ where: { districtId: id } })
        await prisma.district.delete({ where: { id } })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting district:", error)
        return NextResponse.json({ error: "Failed to delete district" }, { status: 500 })
    }
}
