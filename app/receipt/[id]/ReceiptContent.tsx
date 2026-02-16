"use client";

import { ArrowLeft, Check, Phone, User, MapPin, Calendar, Building, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { toPng, toBlob } from "html-to-image";

interface ReceiptContentProps {
    receiptImage: string;
    config: any;
    donation: {
        name: string;
        amount: number;
        transactionId: string;
        mobile: string | null;
        formattedDate: string;
        formattedDateTime: string;
        placeName: string;
    };
}

export default function ReceiptContent({ receiptImage, config, donation }: ReceiptContentProps) {
    const router = useRouter();

    const handleDownload = async () => {
        const element = document.getElementById("receipt-container");
        if (!element) return;

        try {
            const dataUrl = await toPng(element, { pixelRatio: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `receipt-${donation.transactionId}.png`;
            link.click();
            toast.success("Receipt downloaded!");
        } catch (error) {
            console.error("Error generating receipt image:", error);
            toast.error("Failed to download receipt");
        }
    };

    const handleShare = async () => {
        const element = document.getElementById("receipt-container");
        if (!element) return;

        try {
            const blob = await toBlob(element, { pixelRatio: 2 });
            if (!blob) return;

            const file = new File([blob], `receipt-${donation.transactionId}.png`, { type: "image/png" });

            if (navigator.share && navigator.canShare?.({ files: [file] })) {
                try {
                    await navigator.share({
                        files: [file],
                        title: "Donation Receipt",
                        text: `Receipt for donation of ₹${donation.amount}`,
                    });
                    toast.success("Shared successfully!");
                } catch (err) {
                    if ((err as Error).name !== "AbortError") {
                        toast.error("Failed to share");
                    }
                }
            } else {
                // Fallback: download the image
                handleDownload();
                toast.info("Share not supported. Downloaded instead!");
            }
        } catch (error) {
            console.error("Error sharing receipt:", error);
            toast.error("Failed to share receipt");
        }
    };

    const maskMobile = (mobile: string | null) => {
        if (!mobile) return "N/A";
        const cleaned = mobile.replace(/\s+/g, "");
        if (cleaned.length > 4) {
            return cleaned.slice(0, -4).replace(/./g, "*") + cleaned.slice(-4);
        }
        return mobile;
    };

    const details = [
        { icon: <Check className="w-4 h-4 text-white" />, label: "Transaction ID", value: donation.transactionId, valueClassName: "text-xs font-mono" },
        { icon: <Phone className="w-4 h-4 text-white" />, label: "Mobile", value: maskMobile(donation.mobile) },
        { icon: <User className="w-4 h-4 text-white" />, label: "Name", value: donation.name },
        { icon: <MapPin className="w-4 h-4 text-white" />, label: "Place", value: donation.placeName },
        { icon: <Calendar className="w-4 h-4 text-white" />, label: "Date & Time", value: donation.formattedDateTime },
        { icon: <Building className="w-4 h-4 text-white" />, label: "Organization", value: "Sabeelul Hidaya Islamic College" },
    ];

    const handleBack = () => {
        if (window.history.length > 1) {
            router.back();
        } else {
            router.push("/");
        }
    };

    return (
        <div className="min-h-screen">
            <div className="relative flex min-h-screen flex-col bg-[#FFF9ED] max-w-[520px] mx-auto shadow-2xl border-x border-gray-200">
                {/* Header */}
                <div className="sticky top-0 z-10 bg-[#115e59] px-4 h-14 flex items-center shadow-md">
                    <button onClick={handleBack} className="mr-3 w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors">
                        <ArrowLeft className="w-5 h-5 text-white" />
                    </button>
                    <h1 className="text-lg font-semibold text-white">Receipt</h1>
                </div>

                {/* Content */}
                <div className="p-4">
                    {/* Receipt Image Card */}
                    <div className="bg-white rounded-[2rem] p-3 shadow-sm border border-gray-100">
                        <div
                            id="receipt-container"
                            className="relative overflow-hidden rounded-[1.5rem]"
                            style={{ maxWidth: "100%", aspectRatio: "auto" }}
                        >
                            <img
                                src={receiptImage}
                                alt="Receipt"
                                className="w-full h-auto"
                            />

                            {/* Overlays */}
                            {["name", "amount", "date"].map((field) => {
                                const cfg = config[field] || {};
                                const value = field === "name"
                                    ? donation.name
                                    : field === "amount"
                                        ? `₹${donation.amount}`
                                        : donation.formattedDate;

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

                    {/* Details Card */}
                    <div className="mt-5 bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100">
                        {details.map((detail, index) => (
                            <div key={detail.label}>
                                <div className="flex items-center gap-3 px-5 py-3.5">
                                    <div className="w-8 h-8 rounded-full bg-[#115e59] flex items-center justify-center flex-shrink-0">
                                        {detail.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs text-gray-400 font-medium">{detail.label}</p>
                                        <p className={`text-sm font-semibold text-gray-900 truncate ${detail.valueClassName || ""}`}>{detail.value}</p>
                                    </div>
                                </div>
                                {index < details.length - 1 && (
                                    <div className="mx-5 border-b border-gray-100" />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 space-y-3 pb-8">
                        <Button
                            onClick={handleShare}
                            variant="outline"
                            className="w-full h-12 rounded-full border-2 border-[#115E59] text-[#115E59] hover:bg-teal-50 font-semibold text-sm"
                        >
                            <Share2 className="w-4 h-4 mr-2" />
                            Share Receipt
                        </Button>

                        <Button
                            onClick={handleDownload}
                            className="w-full h-12 rounded-full bg-[#859F3D] hover:bg-[#6f8533] text-white font-bold text-sm shadow-md"
                        >
                            Download Receipt
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
