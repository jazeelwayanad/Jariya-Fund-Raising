import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const createCoordinatorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    batchId: z.string().min(1, "Batch is required"),
});

export async function GET(req: NextRequest) {
    try {
        const coordinators = await prisma.user.findMany({
            where: {
                role: "COORDINATOR",
            },
            include: {
                batch: {
                    select: {
                        name: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Remove password from response
        const safeCoordinators = coordinators.map((coord) => {
            const { password, ...rest } = coord;
            return rest;
        });

        return NextResponse.json(safeCoordinators);
    } catch (error) {
        console.error("Error fetching coordinators:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validation
        const result = createCoordinatorSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json(
                { error: result.error.issues[0].message },
                { status: 400 }
            );
        }

        const { name, email, username, password, batchId } = result.data;

        // Check for existing user
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email }, { username }],
            },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email or username already exists" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create Coordinator
        const newCoordinator = await prisma.user.create({
            data: {
                name,
                email,
                username,
                password: hashedPassword,
                role: "COORDINATOR",
                batchId,
            },
        });

        const { password: _, ...safeCoordinator } = newCoordinator;

        return NextResponse.json(safeCoordinator, { status: 201 });
    } catch (error) {
        console.error("Error creating coordinator:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
