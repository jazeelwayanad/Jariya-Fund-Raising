import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const settings = await prisma.settings.findFirst({
            select: {
                presetAmounts: true,
            },
        });

        return NextResponse.json({
            presetAmounts: settings?.presetAmounts ?? [500, 1000, 2000, 5000, 10000],
        });
    } catch (error) {
        console.error("Error fetching public settings:", error);
        return NextResponse.json({
            presetAmounts: [500, 1000, 2000, 5000, 10000],
        });
    }
}
