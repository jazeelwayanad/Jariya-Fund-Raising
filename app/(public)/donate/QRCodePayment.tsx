import React from "react"
import { ArrowLeft, Clock, Info, Loader2, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { QRCodeCanvas } from "qrcode.react"

interface QRCodePaymentProps {
    amount: string
    payerName: string
    description: string
    organization: string
    qrUrl: string
    qrString?: string // New optional prop for raw data
    expiryTime?: number // seconds
    onCancel: () => void
    onCheckStatus: () => void
    isCheckingStatus: boolean
}

export function QRCodePayment({
    amount,
    payerName,
    description,
    organization,
    qrUrl,
    qrString,
    expiryTime = 900, // 15 mins default
    onCancel,
    onCheckStatus,
    isCheckingStatus
}: QRCodePaymentProps) {
    const [timeLeft, setTimeLeft] = React.useState(expiryTime)

    React.useEffect(() => {
        if (!timeLeft) return
        const interval = setInterval(() => {
            setTimeLeft(t => t > 0 ? t - 1 : 0)
        }, 1000)
        return () => clearInterval(interval)
    }, [timeLeft])

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s < 10 ? '0' : ''}${s}`
    }

    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans flex flex-col">
            {/* Header */}
            <div className="bg-[#8B4513] text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Scan UPI QR Code</h1>
            </div>

            <div className="flex-1 px-4 py-6 space-y-6 max-w-md mx-auto w-full">

                {/* Amount/Details Card */}
                <div className="bg-[#5F8C78] text-white rounded-2xl overflow-hidden shadow-lg p-5 pb-4">
                    <div className="flex justify-between items-start mb-6">
                        <div className="space-y-1">
                            <div className="text-white/80 text-sm font-medium">Payment Amount</div>
                            <div className="text-4xl font-bold">₹{amount}</div>
                        </div>
                        <div className="px-3 py-1.5 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-1.5 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2 text-xs">
                        <div className="flex gap-2">
                            <span className="text-white/70 w-20 shrink-0">Payer:</span>
                            <span className="font-medium">{payerName}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-white/70 w-20 shrink-0">To:</span>
                            <span className="font-medium uppercase">{organization}</span>
                        </div>
                        <div className="flex gap-2">
                            <span className="text-white/70 w-20 shrink-0">Description:</span>
                            <span className="font-mono">{description}</span>
                        </div>
                    </div>
                </div>

                {/* Instruction Alert */}
                <div className="bg-[#FDF2D0] rounded-xl p-4 flex gap-3 border border-[#E8D4A2]">
                    <Info className="w-5 h-5 text-[#8B4513] shrink-0 fill-current/10" />
                    <p className="text-[#8B4513] text-xs leading-relaxed font-medium">
                        Scan the QR code with any UPI app. Complete payment and wait for bank confirmation.
                    </p>
                </div>

                {/* QR Code Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center min-h-[300px]">
                    <div className="relative group">
                        {/* Border Corners */}
                        <div className="absolute -top-4 -left-4 w-8 h-8 border-t-4 border-l-4 border-[#8B4513] rounded-tl-lg"></div>
                        <div className="absolute -top-4 -right-4 w-8 h-8 border-t-4 border-r-4 border-[#8B4513] rounded-tr-lg"></div>
                        <div className="absolute -bottom-4 -left-4 w-8 h-8 border-b-4 border-l-4 border-[#8B4513] rounded-bl-lg"></div>
                        <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-4 border-r-4 border-[#8B4513] rounded-br-lg"></div>

                        {qrString ? (
                            <QRCodeCanvas
                                value={qrString}
                                size={220}
                                level={"H"}
                                includeMargin={true}
                                imageSettings={{
                                    src: "https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg",
                                    x: undefined,
                                    y: undefined,
                                    height: 40,
                                    width: 40,
                                    excavate: true,
                                }}
                            />
                        ) : (
                            <img
                                src={qrUrl}
                                alt="Payment QR"
                                className="w-64 h-auto object-contain mix-blend-multiply"
                            />
                        )}
                    </div>
                </div>

            </div>

            {/* Footer Buttons */}
            <div className="p-4 bg-white border-t border-gray-100 sticky bottom-0 z-10 flex gap-3 pb-8">
                <Button
                    variant="outline"
                    className="flex-1 h-12 rounded-xl border-[#126C72] text-[#126C72] hover:bg-[#126C72]/5"
                    onClick={onCancel}
                >
                    Cancel
                </Button>
                <Button
                    className="flex-1 h-12 rounded-xl bg-[#126C72] hover:bg-[#72112a] text-white"
                    onClick={onCheckStatus}
                    disabled={isCheckingStatus}
                >
                    {isCheckingStatus ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Checking...
                        </>
                    ) : (
                        <>
                            <RefreshCw className="w-4 h-4 mr-2" /> Check Status
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
