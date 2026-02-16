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
                            {["name", "amount", "date"].map((field) => {
                                const cfg = config[field] || {};
                                const value = field === "name"
                                    ? (donation.name || "Anonymous")
                                    : field === "amount"
                                        ? `₹${donation.amount}`
                                        : formattedDate;

                                // Transform logic based on alignment
                                let transform = "translate(-50%, -50%)"; // Default Center
                                if (cfg.align === "left") transform = "translate(0, -50%)";
                                if (cfg.align === "right") transform = "translate(-100%, -50%)";

                                return (
                                    <div
                                        key={field}
                                        className="absolute whitespace-nowrap"
                                        style={{
                                            left: `${cfg.x}%`,
                                            top: `${cfg.y}%`,
                                            transform: transform,
                                            fontSize: `${cfg.fontSize}px`,
                                            color: cfg.color,
                                            fontWeight: cfg.fontWeight || "bold",
                                            letterSpacing: `${cfg.letterSpacing || 0}px`,
                                            textAlign: cfg.align || "center",
                                        }}
                                    >
                                        {value}
                                    </div>
                                );
                            })}
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
