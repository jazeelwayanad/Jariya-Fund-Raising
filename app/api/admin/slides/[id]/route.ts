import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { title, description, imageUrl, link, order, isActive } = body;

        const slide = await prisma.slide.update({
            where: { id },
            data: {
                title,
                description,
                imageUrl,
                link,
                order: order ? parseInt(order) : 0,
                isActive: isActive !== undefined ? isActive : true,
            },
        });

        return NextResponse.json(slide);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to update slide" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.slide.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Slide deleted successfully" });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete slide" },
            { status: 500 }
        );
    }
}
