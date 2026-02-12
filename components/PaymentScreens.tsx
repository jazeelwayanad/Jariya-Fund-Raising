"use client"

import * as React from "react"
import { Loader2, QrCode, ArrowLeft, CheckCircle2, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentScreensProps {
    type: "razorpay" | "qr"
    amount: string
    name: string
    qrImageUrl?: string
    donationId?: string
    onCancel: () => void
    onSuccess: (data: any) => void
}

export function PaymentScreens({
    type,
    amount,
    name,
    qrImageUrl,
    donationId,
    onCancel,
    onSuccess
}: PaymentScreensProps) {
    const [timeLeft, setTimeLeft] = React.useState(300) // 5 minutes in seconds

    // Timer for QR flow
    React.useEffect(() => {
        if (type !== 'qr' || timeLeft <= 0) return
        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1)
        }, 1000)
        return () => clearInterval(timer)
    }, [type, timeLeft])

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    // Polling for status
    React.useEffect(() => {
        let interval: NodeJS.Timeout
        if (donationId) {
            interval = setInterval(async () => {
                try {
                    const res = await fetch(`/api/razorpay/status?donationId=${donationId}`)
                    const data = await res.json()
                    if (data.status === 'SUCCESS') {
                        onSuccess({
                            amount,
                            name,
                            transactionId: donationId,
                            date: new Date().toLocaleString()
                        })
                    }
                } catch (e) {
                    console.error("Status polling error:", e)
                }
            }, 3000)
        }
        return () => clearInterval(interval)
    }, [donationId, amount, name, onSuccess])

    if (type === "razorpay") {
        return (
            <div className="flex flex-col items-center justify-center p-8 space-y-8 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100 min-h-[400px]">
                <div className="relative">
                    <div className="absolute inset-0 bg-teal-100/50 rounded-full animate-ping scale-150 opacity-20"></div>
                    <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center relative z-10">
                        <Loader2 className="w-10 h-10 text-[#115E59] animate-spin" />
                    </div>
                </div>

                <div className="space-y-3">
                    <h2 className="text-2xl font-bold text-gray-900">Payment in Progress</h2>
                    <p className="text-gray-500 max-w-xs mx-auto">
                        A secure Razorpay window has been opened for your donation of <span className="font-bold text-black">₹{amount}</span>.
                    </p>
                </div>

                <div className="w-full bg-teal-50/50 p-4 rounded-2xl border border-teal-100/50 text-left space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Donor Name:</span>
                        <span className="font-medium text-gray-900">{name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Amount:</span>
                        <span className="font-bold text-teal-700 font-mono">₹{amount}</span>
                    </div>
                </div>

                <div className="space-y-4 w-full">
                    <p className="text-xs text-gray-400">
                        Please don't close this window until the payment is complete.
                    </p>
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl"
                    >
                        Cancel Payment
                    </Button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-6 text-center bg-white rounded-[2rem] shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                    <QrCode className="w-4 h-4 text-[#115E59]" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Scan to Pay</h2>
            </div>

            <div className="relative p-3 bg-white border-2 border-[#115E59]/20 rounded-3xl group transition-all hover:border-[#115E59]/40">
                <div className="absolute -top-3 -right-3">
                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1.5 transition-colors ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-700'}`}>
                        <Clock className="w-3 h-3" />
                        {timeLeft > 0 ? formatTime(timeLeft) : "Expired"}
                    </div>
                </div>
                {qrImageUrl ? (
                    <img
                        src={qrImageUrl}
                        alt="UPI QR Code"
                        className="w-64 h-64 object-contain rounded-xl"
                    />
                ) : (
                    <div className="w-64 h-64 flex items-center justify-center">
                        <Loader2 className="animate-spin text-gray-300" />
                    </div>
                )}
            </div>

            <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-gray-700">₹{amount}</p>
                <p className="text-xs text-gray-500 leading-relaxed px-4">
                    Scan this QR using any UPI app like Google Pay, PhonePe, or Paytm to complete your donation.
                </p>
            </div>

            <div className="w-full flex items-center justify-center gap-2 py-1">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 rounded-full border border-teal-100">
                    <Loader2 className="w-3 h-3 animate-spin text-teal-600" />
                    <span className="text-[10px] text-teal-800 font-semibold tracking-wide uppercase">Waiting for payment</span>
                </div>
            </div>

            <Button
                variant="outline"
                onClick={onCancel}
                className="w-full border-gray-200 text-gray-500 hover:bg-gray-50 h-12 rounded-2xl font-semibold"
            >
                <ArrowLeft className="w-4 h-4 mr-2" /> Change Method
            </Button>

            <div className="flex items-center gap-1 text-[10px] text-gray-300 font-medium">
                <CheckCircle2 className="w-3 h-3" />
                SECURE UPI PAYMENT BY RAZORPAY
            </div>
        </div>
    )
}
