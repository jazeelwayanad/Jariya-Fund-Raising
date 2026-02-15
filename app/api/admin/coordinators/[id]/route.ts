import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const updateCoordinatorSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Invalid email address").optional(),
    username: z.string().min(3, "Username must be at least 3 characters").optional(),
    password: z.string().min(6, "Password must be at least 6 characters").optional(),
    batchId: z.string().min(1, "Batch is required").optional(),
});

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Check if user exists and is a coordinator
        const user = await prisma.user.findUnique({
            where: { id },
        });

        if (!user || user.role !== "COORDINATOR") {
            return NextResponse.json(
                { error: "Coordinator not found" },
                { status: 404 }
            );
        }

        await prisma.user.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting coordinator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();

        const result = updateCoordinatorSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const data = result.data;
        const updateData: any = { ...data };

        if (data.password) {
            updateData.password = await bcrypt.hash(data.password, 10);
        }

        // Check uniqueness if email/username changed
        if (data.email || data.username) {
            const existing = await prisma.user.findFirst({
                where: {
                    OR: [
                        data.email ? { email: data.email } : {},
                        data.username ? { username: data.username } : {},
                    ],
                    NOT: { id },
                },
            });

            if (existing) {
                return NextResponse.json(
                    { error: "Email or username already in use" },
                    { status: 409 }
                );
            }
        }

        const updatedCoordinator = await prisma.user.update({
            where: { id },
            data: updateData,
        });

        const { password: _, ...safeCoordinator } = updatedCoordinator;

        return NextResponse.json(safeCoordinator);
    } catch (error) {
        console.error("Error updating coordinator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
