import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        console.log("Fetching settings...");
        // Find the first settings record, or create default if none exists
        let settings = await prisma.settings.findFirst();
        console.log("Settings found:", settings);

        if (!settings) {
            console.log("No settings found, creating default...");
            settings = await prisma.settings.create({
                data: {
                    campaignTitle: "Jariya Fundraising",
                    upiId: "",
                    razorpayKeyId: "",
                    razorpayKeySecret: "",
                },
            });
            console.log("Default settings created:", settings);
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error("Error fetching settings:", error);
        return NextResponse.json(
            { error: "Failed to fetch settings", details: String(error) },
            { status: 500 }
        );
    }
}

export async function PUT(req: Request) {
    try {
        console.log("API: PUT /api/admin/settings - Started");
        const body = await req.json();
        console.log("API: Request body:", body);
        const {
            campaignTitle,
            razorpayKeyId,
            razorpayKeySecret,
            upiId,
            receiptImage,
            receiptConfig,
            displayStatuses,
            editableFields
        } = body;

        // We assume a singleton pattern for settings, so we update the first record found
        // or create if somehow missing (though GET should handle creation)
        const existingSettings = await prisma.settings.findFirst();

        let updatedSettings;

        if (existingSettings) {
            updatedSettings = await prisma.settings.update({
                where: { id: existingSettings.id },
                data: {
                    campaignTitle,
                    razorpayKeyId,
                    upiId,
                    receiptImage,
                    receiptConfig,
                    displayStatuses,
                    editableFields,
                },
            });
        } else {
            updatedSettings = await prisma.settings.create({
                data: {
                    campaignTitle,
                    upiId,
                    razorpayKeyId,
                    razorpayKeySecret,
                    receiptImage,
                    receiptConfig,
                    displayStatuses,
                    editableFields,
                },
            });
        }

        return NextResponse.json(updatedSettings);
    } catch (error) {
        console.error("Error updating settings:", error);
        return NextResponse.json(
            { error: "Failed to update settings" },
            { status: 500 }
        );
    }
}
