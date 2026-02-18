import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { jwtVerify } from "jose";

export async function PATCH(req: NextRequest) {
    try {
        const token = req.cookies.get("auth_token")?.value;
        if (!token) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(token, secret);
        const userId = payload.id as string;

        const body = await req.json();
        const { slug } = body;

        // Basic validation
        if (slug && typeof slug !== "string") {
            return NextResponse.json({ error: "Invalid slug format" }, { status: 400 });
        }

        // Simple slug format validation (alphanumeric, hyphens)
        if (slug && !/^[a-z0-9-]+$/i.test(slug)) {
            return NextResponse.json({ error: "Slug must contain only letters, numbers, and hyphens" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { batch: true },
        });

        if (!user || !user.batch) {
            return NextResponse.json({ error: "No batch assigned or user not found" }, { status: 404 });
        }

        // Check uniqueness if slug is being changed
        if (slug && slug !== user.batch.slug) {
            const existingBatch = await prisma.batch.findUnique({
                where: { slug },
            });

            if (existingBatch) {
                return NextResponse.json({ error: "Slug already taken" }, { status: 409 });
            }
        }

        const updatedBatch = await prisma.batch.update({
            where: { id: user.batch.id },
            data: {
                slug: slug || null, // Allow clearing the slug
            },
        });

        return NextResponse.json({
            success: true,
            batch: {
                id: updatedBatch.id,
                name: updatedBatch.name,
                slug: updatedBatch.slug,
            }
        });

    } catch (error) {
        console.error("Error updating batch slug:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
