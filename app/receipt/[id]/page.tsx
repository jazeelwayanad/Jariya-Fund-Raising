import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReceiptContent from "./ReceiptContent";

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    // Try to find by ID first, then transactionId
    let donation = await prisma.donation.findUnique({ where: { id } });
    if (!donation) {
        donation = await prisma.donation.findUnique({ where: { transactionId: id } });
    }

    const settings = await prisma.settings.findFirst();

    if (!donation || !settings?.receiptImage || !settings?.receiptConfig) {
        return notFound();
    }

    const config = settings.receiptConfig as any;

    // Helper to format date
    const formattedDate = new Date(donation.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const formattedDateTime = new Date(donation.createdAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
    });

    // Get place information
    const place = donation.placeId ? await prisma.place.findUnique({
        where: { id: donation.placeId },
        include: { district: true }
    }) : null;

    return (
        <ReceiptContent
            receiptImage={settings.receiptImage}
            config={config}
            donation={{
                name: (donation.hideName ? "Well Wisher" : donation.name) || "Anonymous",
                amount: donation.amount,
                transactionId: donation.transactionId || donation.id,
                mobile: donation.mobile,
                formattedDate,
                formattedDateTime,
                placeName: place ? `${place.name}, ${place.district.name}` : "N/A",
            }}
        />
    );
}
