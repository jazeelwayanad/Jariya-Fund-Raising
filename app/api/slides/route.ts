import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const slides = await prisma.slide.findMany({
            where: { isActive: true },
            orderBy: { order: "asc" },
            select: {
                id: true,
                title: true,
                description: true,
                imageUrl: true,
                link: true,
                order: true,
            },
        });
        return NextResponse.json(slides);
    } catch (error) {
        console.error("Failed to fetch slides:", error);
        return NextResponse.json(
            { error: "Failed to fetch slides" },
            { status: 500 }
        );
    }
}
