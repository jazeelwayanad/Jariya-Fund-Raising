import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET: Fetch all places (flat list) - supports category filter for donate page
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const search = searchParams.get('search')
        const category = searchParams.get('category') // "KERALA" or "OTHERS"

        const where: any = {}

        if (search) {
            where.OR = [
                { name: { contains: search } },
            ]
        }

        if (category) {
            where.district = {
                section: {
                    category: category.toUpperCase()
                }
            }
        }

        const places = await prisma.place.findMany({
            where,
            include: {
                district: {
                    include: {
                        section: true
                    }
                }
            },
            orderBy: { name: 'asc' }
        })

        return NextResponse.json(places)
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch places" }, { status: 500 })
    }
}

// POST: Create a new Place (Panchayat/Municipality/Area) under a District
export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, type, districtId } = body

        if (!name || !type || !districtId) {
            return NextResponse.json({ error: "Name, Type, and District ID are required" }, { status: 400 })
        }

        const newPlace = await prisma.place.create({
            data: {
                name,
                type,
                districtId
            }
        })

        return NextResponse.json(newPlace)
    } catch (error) {
        console.error("Error creating place:", error)
        return NextResponse.json({ error: "Failed to create place" }, { status: 500 })
    }
}
