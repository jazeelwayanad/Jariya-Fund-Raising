"use client";

import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import { toPng } from "html-to-image";

export default function ReceiptDownloader() {
    const handleDownload = async () => {
        const element = document.getElementById("receipt-container");
        if (!element) return;

        try {
            const dataUrl = await toPng(element, { pixelRatio: 2 });
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = "receipt.png";
            link.click();
        } catch (error) {
            console.error("Error generating receipt image:", error);
        }
    };

    return (
        <div className="flex gap-4 print:hidden">
            <Button onClick={handleDownload} className="flex items-center gap-2 bg-[#115E59] hover:bg-[#0d4a46] text-white">
                <Download className="h-4 w-4" />
                Download Image
            </Button>
            <Button onClick={() => window.print()} variant="outline" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Print / Save as PDF
            </Button>
        </div>
    );
}
