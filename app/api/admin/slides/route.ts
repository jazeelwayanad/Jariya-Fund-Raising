import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const slides = await prisma.slide.findMany({
            orderBy: {
                order: "asc",
            },
        });
        return NextResponse.json(slides);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch slides" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { title, description, imageUrl, link, order, isActive } = body;

        if (!imageUrl) {
            return NextResponse.json(
                { error: "Image URL is required" },
                { status: 400 }
            );
        }

        const slide = await prisma.slide.create({
            data: {
                title,
                description,
                imageUrl,
                link,
                order: order ? parseInt(order) : 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(slide, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to create slide" },
            { status: 500 }
        );
    }
}
