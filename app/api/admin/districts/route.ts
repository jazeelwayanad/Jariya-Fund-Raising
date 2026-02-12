import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// POST: Create a new District under a Section
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, sectionId } = body

        if (!name || !sectionId) {
            return NextResponse.json({ error: "Name and Section ID are required" }, { status: 400 })
        }

        const newDistrict = await prisma.district.create({
            data: {
                name,
                sectionId
            },
            include: {
                places: true
            }
        })

        // Map 'places' to 'panchayats' for frontend compatibility
        return NextResponse.json({
            ...newDistrict,
            panchayats: newDistrict.places
        })
    } catch (error) {
        console.error("Error creating district:", error)
        return NextResponse.json({ error: "Failed to create district" }, { status: 500 })
    }
}
