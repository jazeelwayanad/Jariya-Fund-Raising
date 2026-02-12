"use client";

import { useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Share2, Loader2, X } from "lucide-react";
import { toPng, toBlob } from "html-to-image";
import { toast } from "sonner";

interface ViewReceiptDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    donation: any;
    settings: any;
}

export function ViewReceiptDialog({ open, onOpenChange, donation, settings }: ViewReceiptDialogProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    if (!donation || !settings?.receiptImage) return null;

    const config = settings.receiptConfig || {
        name: { x: 50, y: 50, fontSize: 20, color: "#000000" },
        amount: { x: 50, y: 100, fontSize: 20, color: "#000000" },
        date: { x: 50, y: 150, fontSize: 20, color: "#000000" },
    };

    const formattedDate = new Date(donation.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const handleDownload = async () => {
        if (!receiptRef.current) return;

        try {
            const dataUrl = await toPng(receiptRef.current, { pixelRatio: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `receipt-${donation.transactionId || donation.id}.png`;
            link.click();
            toast.success("Receipt downloaded!");
        } catch (error) {
            console.error("Error generating receipt:", error);
            toast.error("Failed to download receipt");
        }
    };

    const handleShare = async () => {
        if (!receiptRef.current) return;

        try {
            const blob = await toBlob(receiptRef.current, { pixelRatio: 2 });
            if (!blob) return;

            const file = new File([blob], `receipt-${donation.transactionId || donation.id}.png`, { type: "image/png" });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    files: [file],
                    title: "Donation Receipt",
                    text: `Receipt for donation of ₹${donation.amount}`,
                });
                toast.success("Shared successfully!");
            } else {
                handleDownload();
                toast.info("Share not supported on this device. Downloaded instead.");
            }
        } catch (error) {
            console.error("Error sharing receipt:", error);
            toast.error("Failed to share receipt");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>View Receipt</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden bg-gray-50 p-2">
                        <div
                            ref={receiptRef}
                            className="relative overflow-hidden bg-white mx-auto"
                            style={{ position: "relative" }}
                        >
                            <img
                                src={settings.receiptImage}
                                alt="Receipt Template"
                                className="w-full h-auto object-contain block"
                            />

                            {/* Overlays */}
                            {/* Name */}
                            <div
                                className="absolute font-bold transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                                style={{
                                    left: `${config.name.x}%`,
                                    top: `${config.name.y}%`,
                                    fontSize: `${config.name.fontSize}px`, // Simple px mapping, might need scaling logic if image width varies significantly from config base
                                    // In ReceiptContent.tsx, they used clamp. Here we might need to be careful. 
                                    // However, since we are doing toPng on this container, relative positioning % works content-wise.
                                    // Font size is the tricky part. The editor uses px relative to the image?
                                    // Re-checking ReceiptContent: fontSize: "clamp(1rem, 2vw, 2rem)"
                                    // The admin editor saves specific fontSize number (e.g. 20).
                                    // Admin Settings Page preview uses: fontSize: `${config...fontSize}px`.
                                    // Use the same logic as Admin Settings Page for consistency.
                                    color: config.name.color,
                                }}
                            >
                                {donation.name || "Anonymous"}
                            </div>

                            {/* Amount */}
                            <div
                                className="absolute font-bold transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                                style={{
                                    left: `${config.amount.x}%`,
                                    top: `${config.amount.y}%`,
                                    fontSize: `${config.amount.fontSize}px`,
                                    color: config.amount.color,
                                }}
                            >
                                ₹{donation.amount}
                            </div>

                            {/* Date */}
                            <div
                                className="absolute font-bold transform -translate-x-1/2 -translate-y-1/2 whitespace-nowrap"
                                style={{
                                    left: `${config.date.x}%`,
                                    top: `${config.date.y}%`,
                                    fontSize: `${config.date.fontSize}px`,
                                    color: config.date.color,
                                }}
                            >
                                {formattedDate}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleShare}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Share
                        </Button>
                        <Button onClick={handleDownload}>
                            <Download className="w-4 h-4 mr-2" />
                            Download
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
