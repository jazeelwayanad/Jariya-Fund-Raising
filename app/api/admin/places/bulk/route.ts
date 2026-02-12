import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { PlaceType } from "@prisma/client"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const places = body.places

        if (!Array.isArray(places) || places.length === 0) {
            return NextResponse.json({ error: "Invalid data format or empty list" }, { status: 400 })
        }

        let count = 0
        const errors = []

        for (const p of places) {
            try {
                const sectionName = p.section?.trim() || "Kerala"
                const districtName = p.district?.trim()
                const placeName = p.name?.trim()
                const placeTypeStr = p.type?.trim()

                if (!placeName || !districtName) {
                    console.warn("Skipping row with missing name or district", p)
                    continue
                }

                // 1. Find or Create Section
                let section = await prisma.section.findFirst({
                    where: { name: { equals: sectionName, mode: "insensitive" } }
                })

                if (!section) {
                    section = await prisma.section.create({
                        data: {
                            name: sectionName,
                            type: "Section", // Default enum value
                            category: sectionName.toUpperCase() === "KERALA" ? "KERALA" : "OTHERS"
                        }
                    })
                }

                // 2. Find or Create District
                let district = await prisma.district.findFirst({
                    where: {
                        name: { equals: districtName, mode: "insensitive" },
                        sectionId: section.id
                    }
                })

                if (!district) {
                    district = await prisma.district.create({
                        data: {
                            name: districtName,
                            sectionId: section.id
                        }
                    })
                }

                // 3. Find or Create Place
                const existingPlace = await prisma.place.findFirst({
                    where: {
                        name: { equals: placeName, mode: "insensitive" },
                        districtId: district.id
                    }
                })

                if (!existingPlace) {
                    // Map string to Enum safely
                    let placeType: PlaceType = PlaceType.Other
                    if (placeTypeStr) {
                        const normalizedType = placeTypeStr.charAt(0).toUpperCase() + placeTypeStr.slice(1).toLowerCase()
                        if (Object.values(PlaceType).includes(normalizedType as PlaceType)) {
                            placeType = normalizedType as PlaceType
                        }
                    }

                    await prisma.place.create({
                        data: {
                            name: placeName,
                            type: placeType,
                            districtId: district.id
                        }
                    })
                    count++
                }

            } catch (innerError) {
                console.error("Error processing row:", p, innerError)
                errors.push({ row: p, error: String(innerError) })
            }
        }

        return NextResponse.json({
            success: true,
            count,
            message: `Successfully processed ${count} new places.`,
            errors: errors.length > 0 ? errors : undefined
        })

    } catch (error) {
        console.error("Bulk upload API error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
