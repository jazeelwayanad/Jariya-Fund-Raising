import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET: Fetch full hierarchy (Sections -> Districts -> Places)
export async function GET() {
    try {
        const sections = await prisma.section.findMany({
            include: {
                districts: {
                    include: {
                        places: true
                    }
                }
            }
        })

        // Transform to match frontend expected structure if needed, 
        // but Prisma structure should be close:
        // Section { districts: [ District { places: [ Place ] } ] }
        // Frontend expects 'panchayats' in District, but schema has 'places'.
        // We can map it here.

        const formattedSections = sections.map(section => ({
            ...section,
            districts: section.districts.map(district => ({
                ...district,
                panchayats: district.places // Map 'places' to 'panchayats' for frontend compatibility
            }))
        }))

        return NextResponse.json(formattedSections)
    } catch (error) {
        console.error("Error fetching places:", error)
        return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
    }
}

// POST: Create a new Section (Root Level)
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, type } = body

        if (!name || !type) {
            return NextResponse.json({ error: "Name and Type are required" }, { status: 400 })
        }

        // Auto-set category: State/Section types go under Kerala tab, others go under Others tab
        const category = (type === "State" || type === "Section") ? "KERALA" : "OTHERS"

        const newSection = await prisma.section.create({
            data: {
                name,
                type,
                category
            },
            include: {
                districts: true
            }
        })

        return NextResponse.json(newSection)
    } catch (error) {
        console.error("Error creating section:", error)
        return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
    }
}
