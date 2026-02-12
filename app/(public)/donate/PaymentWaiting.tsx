import React from "react"
import { ArrowLeft, Wallet, ShieldCheck, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaymentWaitingProps {
    amount: string
    payerName: string
    mobile: string
    organization: string
    referenceId: string
    onBack: () => void
}

export function PaymentWaiting({
    amount,
    payerName,
    mobile,
    organization,
    referenceId,
    onBack
}: PaymentWaitingProps) {
    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans flex flex-col">
            {/* Header */}
            <div className="bg-[#126C72] text-white px-4 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-md">
                <button onClick={onBack} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="text-lg font-semibold">Razorpay Payment</h1>
            </div>

            <div className="flex-1 px-4 py-6 space-y-6 max-w-md mx-auto w-full">

                {/* Icon Circle */}
                <div className="flex justify-center -mt-2 mb-2">
                    <div className="w-20 h-20 bg-[#126C72] rounded-full flex items-center justify-center shadow-lg border-4 border-[#FFF9ED]">
                        <Wallet className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Amount/Details Card */}
                <div className="bg-[#5F8C78] text-white rounded-2xl overflow-hidden shadow-lg relative">
                    <div className="p-5 pb-8 space-y-1">
                        <div className="flex justify-between items-start">
                            <span className="text-white/80 text-sm font-medium">Payment Amount</span>
                            <CreditCard className="w-5 h-5 text-white/80" />
                        </div>
                        <div className="text-4xl font-bold">₹{amount}</div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm p-5 space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-white/70">Payer:</span>
                            <span className="font-medium">{payerName}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Mobile:</span>
                            <span className="font-medium">{mobile}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Organization:</span>
                            <span className="font-medium text-right max-w-[60%] truncate">{organization}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-white/70">Reference:</span>
                            <span className="font-mono font-medium">{referenceId}</span>
                        </div>
                    </div>
                </div>

                {/* Secure Badge */}
                <div className="bg-[#FDF2D0] rounded-xl p-4 flex gap-3 border border-[#E8D4A2]">
                    <ShieldCheck className="w-6 h-6 text-[#8B4513] shrink-0" />
                    <div>
                        <h3 className="text-[#8B4513] font-bold text-sm">Secure Payment via Razorpay</h3>
                        <p className="text-[#8B4513]/70 text-xs mt-0.5 leading-relaxed">
                            Supports UPI, Credit/Debit Cards, Net Banking, and Wallets
                        </p>
                    </div>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-gray-200 border-t-[#126C72] rounded-full animate-spin"></div>
                    </div>
                    <div>
                        <h3 className="text-[#126C72] font-bold text-lg">Payment Gateway Opened</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Complete your payment in the Razorpay window
                        </p>
                    </div>
                </div>

                <div className="flex justify-center">
                    <div className="flex items-center gap-2 text-gray-400 text-[10px]">
                        <ShieldCheck className="w-3 h-3" />
                        <span>256-bit SSL Encrypted • PCI DSS Compliant</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
