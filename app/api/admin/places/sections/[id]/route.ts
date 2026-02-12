import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, type } = body

        // Auto-set category based on type
        const category = (type === "State" || type === "Section") ? "KERALA" : "OTHERS"

        const updatedSection = await prisma.section.update({
            where: { id },
            data: { name, type, category }
        })

        return NextResponse.json(updatedSection)
    } catch (error) {
        return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params

        // Cascade delete: places → districts → section
        const districts = await prisma.district.findMany({ where: { sectionId: id }, select: { id: true } })
        const districtIds = districts.map(d => d.id)

        if (districtIds.length > 0) {
            await prisma.place.deleteMany({ where: { districtId: { in: districtIds } } })
            await prisma.district.deleteMany({ where: { sectionId: id } })
        }

        await prisma.section.delete({ where: { id } })
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting section:", error)
        return NextResponse.json({ error: "Failed to delete section" }, { status: 500 })
    }
}
