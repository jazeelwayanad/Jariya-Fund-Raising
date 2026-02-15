"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Check, ChevronDown, CreditCard, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { PaymentWaiting } from "@/components/payment/PaymentWaiting";
import { QRCodePayment } from "@/components/payment/QRCodePayment";

// Same country list as public page
const countries = [
    { code: "+91", name: "India", iso: "in", flag: "🇮🇳" },
    { code: "+971", name: "UAE", iso: "ae", flag: "🇦🇪" },
    { code: "+966", name: "Saudi Arabia", iso: "sa", flag: "🇸🇦" },
    { code: "+1", name: "USA", iso: "us", flag: "🇺🇸" },
    { code: "+44", name: "UK", iso: "gb", flag: "🇬🇧" },
    { code: "+974", name: "Qatar", iso: "qa", flag: "🇶🇦" },
    { code: "+965", name: "Kuwait", iso: "kw", flag: "🇰🇼" },
    { code: "+968", name: "Oman", iso: "om", flag: "🇴🇲" },
    { code: "+973", name: "Bahrain", iso: "bh", flag: "🇧🇭" },
    { code: "+60", name: "Malaysia", iso: "my", flag: "🇲🇾" },
    { code: "+65", name: "Singapore", iso: "sg", flag: "🇸🇬" },
];

interface CoordinatorStats {
    batch: {
        id: string;
        name: string;
    };
    user: {
        name: string;
        username: string;
    };
}

export default function CoordinatorPaymentPage() {
    // Core State
    const [amount, setAmount] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [hideName, setHideName] = useState(false);

    // Config/Data State
    const [stats, setStats] = useState<CoordinatorStats | null>(null);
    const [loadingStats, setLoadingStats] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Country/Phone Input State
    const [countryCode, setCountryCode] = useState("+91");
    const [countrySearch, setCountrySearch] = useState("");
    const [openCountryDropdown, setOpenCountryDropdown] = useState(false);
    const countryDropdownRef = useRef<HTMLDivElement>(null);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState("upi");
    const [showReceipt, setShowReceipt] = useState(false);
    const [receiptData, setReceiptData] = useState<any>(null);

    // Modals
    const [showQrModal, setShowQrModal] = useState(false);
    const [qrData, setQrData] = useState<{ imageUrl: string, donationId: string, qrString?: string } | null>(null);
    const [showPaymentWaiting, setShowPaymentWaiting] = useState(false);
    const [paymentOrderId, setPaymentOrderId] = useState("");
    const [isCheckingStatus, setIsCheckingStatus] = useState(false);

    const presets = ["500", "1,000", "2,000", "5,000", "10,000"];

    // 1. Load Stats (Batch Info)
    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/coordinator/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    // Pre-fill name if empty? Optional. Keeping it blank for custom entry.
                    // Actually, let's prefill if they want to pay as themselves? 
                    // Usually coordinators collect cash and deposit. The "Name" field should probably be the donor's name or Coordinator's name.
                    // I'll leave it empty to prompt for Name.
                } else {
                    toast.error("Failed to load batch info");
                }
            } catch (error) {
                console.error("Error loading stats", error);
            } finally {
                setLoadingStats(false);
            }
        };
        fetchStats();
    }, []);

    // 2. Click Outside Logic
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
                setOpenCountryDropdown(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // 3. Helper Logic
    const filteredCountries = useMemo(() => {
        if (!countrySearch.trim()) return countries;
        const q = countrySearch.toLowerCase();
        return countries.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q));
    }, [countrySearch]);

    const selectedCountry = useMemo(() => {
        return countries.find(c => c.code === countryCode) || countries[0];
    }, [countryCode]);


    const checkQrStatus = React.useCallback(async () => {
        if (!qrData?.donationId) return;
        setIsCheckingStatus(true);
        try {
            const res = await fetch(`/api/razorpay/status?donationId=${qrData.donationId}`);
            const data = await res.json();
            if (data.status === 'SUCCESS') {
                setShowQrModal(false);
                setQrData(null);
                setReceiptData({
                    amount,
                    name,
                    transactionId: qrData.donationId,
                    date: new Date().toLocaleString()
                });
                setShowReceipt(true);
                toast.success("Payment Received Successfully!");
            }
        } catch (e) {
            console.error("Polling error", e);
        } finally {
            setIsCheckingStatus(false);
        }
    }, [qrData, amount, name]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showQrModal && qrData?.donationId) {
            interval = setInterval(() => {
                checkQrStatus();
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [showQrModal, qrData, checkQrStatus]);


    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!amount) {
            toast.error("Please enter an amount");
            return;
        }
        if (!stats) return;

        // Name is optional here? Actually public page requires name.
        // If empty, let's default to "Coordinator Deposit" or something? 
        // Or enforce name. Let's enforce name for better records.
        if (!name) {
            toast.error("Please enter Payer Name");
            return;
        }

        setProcessing(true);

        try {
            // === QR CODE FLOW ===
            if (paymentMethod === 'qr') {
                const res = await fetch("/api/razorpay/qr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount,
                        name,
                        mobile: phone ? `${countryCode} ${phone}` : undefined,
                        hideName,
                        batchId: stats.batch.id, // Fixed to coordinator batch
                        unitId: null,
                        placeId: null, // No place selection for batch deposit
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error || "Failed to generate QR");
                    setProcessing(false);
                    return;
                }

                const data = await res.json();
                setQrData({
                    imageUrl: data.qr_image_url,
                    donationId: data.donationId,
                    qrString: data.qr_string
                });
                setShowQrModal(true);
                setProcessing(false);
            }
            // === STANDARD CHECKOUT FLOW ===
            else {
                const res = await loadRazorpay();
                if (!res) {
                    toast.error('Razorpay SDK failed to load');
                    setProcessing(false);
                    return;
                }

                // 1. Create Order
                const orderRes = await fetch("/api/razorpay/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: Number(amount),
                        name,
                        mobile: phone ? `${countryCode} ${phone}` : undefined,
                        hideName,
                        batchId: stats.batch.id, // Fixed
                        unitId: null,
                        placeId: null,
                    })
                });

                if (!orderRes.ok) {
                    const errorData = await orderRes.json();
                    toast.error(errorData.error || "Failed to create order");
                    setProcessing(false);
                    return;
                }

                const orderData = await orderRes.json();
                setPaymentOrderId(orderData.id);
                setShowPaymentWaiting(true);

                let configId = undefined;
                if (paymentMethod === 'upi') {
                    configId = process.env.NEXT_PUBLIC_RAZORPAY_CONFIG_UPI;
                } else if (paymentMethod === 'card') {
                    configId = process.env.NEXT_PUBLIC_RAZORPAY_CONFIG_ALL;
                }

                const options: any = {
                    key: orderData.keyId,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "Jariya Fundraising",
                    description: `Batch Deposit: ${stats.batch.name}`,
                    order_id: orderData.id,
                    config_id: configId,
                    handler: async function (response: any) {
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        });

                        const verifyData = await verifyRes.json();
                        if (verifyData.status === 'success') {
                            toast.success("Deposit successful!");
                            setShowPaymentWaiting(false);
                            setReceiptData({
                                amount,
                                name,
                                transactionId: verifyData.donation.transactionId,
                                date: new Date().toLocaleString()
                            });
                            setShowReceipt(true);
                            setAmount("");
                            setName("");
                            setPhone("");
                        } else {
                            toast.error("Payment verification failed");
                            setShowPaymentWaiting(false);
                        }
                        setProcessing(false);
                    },
                    prefill: {
                        name: name,
                        contact: phone ? `${countryCode} ${phone}` : undefined
                    },
                    theme: {
                        color: "#115E59"
                    },
                    modal: {
                        ondismiss: function () {
                            setProcessing(false);
                            setShowPaymentWaiting(false);
                            toast("Payment cancelled");
                        }
                    }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
            }
        } catch (error) {
            console.error("Payment Error", error);
            toast.error("Payment failed");
            setProcessing(false);
        }
    };

    if (loadingStats) {
        return (
            <div className="min-h-screen bg-[#FFF9ED] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#115E59]" />
            </div>
        );
    }

    if (!stats) return null;

    // 1. Receipt View
    if (showReceipt && receiptData) {
        if (typeof window !== 'undefined') {
            // Using same receipt page for now. 
            // Ideally receipt page should handle logged in state appropriately if needed.
            window.location.href = `/receipt/${receiptData.transactionId}`;
        }
        return (
            <div className="min-h-screen bg-[#FFF9ED] font-sans flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#115E59] mx-auto" />
                    <p className="mt-4 text-gray-600">Redirecting to receipt...</p>
                </div>
            </div>
        );
    }

    // 2. Waiting (Standard Checkout)
    if (showPaymentWaiting) {
        return (
            <PaymentWaiting
                amount={amount}
                payerName={name}
                mobile={`${countryCode} ${phone}`}
                organization="Jariya Fundraising"
                referenceId={paymentOrderId}
                onBack={() => {
                    setShowPaymentWaiting(false);
                    setProcessing(false);
                }}
            />
        );
    }

    // 3. QR Code View
    if (showQrModal && qrData) {
        return (
            <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                <QRCodePayment
                    amount={amount}
                    payerName={name}
                    description={`Batch Deposit: ${stats.batch.name}`}
                    organization="Sabeelul Hidaya Islamic College"
                    qrUrl={qrData.imageUrl}
                    qrString={qrData.qrString}
                    onCancel={() => {
                        setShowQrModal(false);
                        setProcessing(false);
                    }}
                    onCheckStatus={checkQrStatus}
                    isCheckingStatus={isCheckingStatus}
                />
            </div>
        );
    }

    if (processing) {
        return <div className="min-h-screen flex items-center justify-center bg-[#FFF9ED]"><Loader2 className="h-8 w-8 animate-spin text-[#115E59]" /></div>;
    }

    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans relative pb-20">
            {/* Header */}
            <div className="container px-6 pt-10 pb-6 flex items-center justify-between">
                <Link href="/coordinator/dashboard">
                    <Button size="sm" className="rounded-full bg-[#8B4513] hover:bg-[#723a10] text-white px-5 h-9 text-xs font-semibold shadow-sm">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                </Link>
                <div className="text-right">
                    <h1 className="text-xl font-bold text-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Deposit Funds</h1>
                    <p className="text-xs text-[#115E59] font-bold">{stats.batch.name}</p>
                </div>
            </div>

            <div className="container px-4 mt-2 mb-10 max-w-lg mx-auto space-y-6">
                {/* Main Content Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-5">

                    {/* Amount Section */}
                    <div className="space-y-2">
                        <Label htmlFor="amount" className="text-gray-700 font-medium text-xs">Enter Amount<span className="text-red-500">*</span></Label>
                        <Input
                            id="amount"
                            placeholder="Enter Amount"
                            value={amount}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*\.?\d*$/.test(val)) {
                                    setAmount(val);
                                }
                            }}
                            className="h-12 border-[#115E59] rounded-xl bg-white text-base px-4 shadow-none placeholder:text-gray-300 text-gray-800 focus-visible:ring-2 focus-visible:ring-[#115E59]"
                            type="text"
                            inputMode="decimal"
                        />
                        <div className="flex flex-wrap gap-2 pt-1">
                            {presets.map((val) => (
                                <button
                                    key={val}
                                    onClick={() => setAmount(val.replace(/,/g, ''))}
                                    className="bg-[#FDE68A] hover:bg-[#ffe066] text-black/90 text-[11px] font-bold py-1.5 px-3.5 rounded-full transition-all"
                                >
                                    ₹{val}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name Section */}
                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="name" className="text-gray-700 font-medium text-xs">Payer Name<span className="text-red-500">*</span></Label>
                            <div className="flex items-center gap-1.5">
                                <Checkbox
                                    id="hide-name"
                                    className="w-4 h-4 rounded-[3px] border-gray-700 data-[state=checked]:bg-black data-[state=checked]:border-black"
                                    checked={hideName}
                                    onCheckedChange={(c) => setHideName(c as boolean)}
                                />
                                <Label htmlFor="hide-name" className="text-[10px] text-gray-500 font-medium cursor-pointer">Hide Name</Label>
                            </div>
                        </div>
                        <Input
                            id="name"
                            placeholder="Enter Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="h-12 border-[#115E59] rounded-xl bg-white px-4 text-gray-800 shadow-none placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-[#115E59]"
                        />
                    </div>

                    {/* Phone Section */}
                    <div className="space-y-2 relative" ref={countryDropdownRef}>
                        <div
                            className="flex items-center absolute left-3 top-[10px] z-10 gap-2 cursor-pointer p-1 rounded hover:bg-gray-100 transition-colors"
                            onClick={() => setOpenCountryDropdown(!openCountryDropdown)}
                        >
                            <img
                                src={`https://flagcdn.com/w40/${selectedCountry.iso}.png`}
                                alt={selectedCountry.name}
                                className="w-5 h-3.5 object-cover rounded-[2px]"
                            />
                            <div className="h-4 w-[1px] bg-gray-300"></div>
                            <span className="text-sm font-medium text-black">{selectedCountry.code}</span>
                        </div>

                        {openCountryDropdown && (
                            <div className="absolute top-full left-0 w-[240px] mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                <Input
                                    autoFocus
                                    placeholder="Search country or code..."
                                    value={countrySearch}
                                    onChange={(e) => setCountrySearch(e.target.value)}
                                    className="h-9 text-xs mb-2 border-gray-200 text-gray-800"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                <div className="max-h-[200px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                    {filteredCountries.length === 0 ? (
                                        <div className="p-2 text-center text-xs text-gray-400">No countries found</div>
                                    ) : (
                                        filteredCountries.map(c => (
                                            <div
                                                key={c.code}
                                                onClick={() => {
                                                    setCountryCode(c.code)
                                                    setOpenCountryDropdown(false)
                                                    setCountrySearch("")
                                                }}
                                                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors hover:bg-teal-50 flex items-center justify-between cursor-pointer ${countryCode === c.code ? "bg-teal-50 text-teal-800 font-medium" : "text-gray-700"
                                                    }`}
                                            >
                                                <span className="flex items-center gap-2">
                                                    <img
                                                        src={`https://flagcdn.com/w40/${c.iso}.png`}
                                                        alt={c.name}
                                                        className="w-5 h-3.5 object-cover rounded-[2px]"
                                                    />
                                                    <span>{c.name}</span>
                                                </span>
                                                <span className="text-xs text-gray-400">{c.code}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        <Input
                            id="phone"
                            placeholder="Mobile Number"
                            value={phone}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (/^\d*$/.test(val)) {
                                    setPhone(val);
                                }
                            }}
                            className="h-12 border-[#115E59] rounded-xl text-gray-800 bg-white pl-[90px] px-4 pl-20 shadow-none placeholder:text-gray-300 focus-visible:ring-2 focus-visible:ring-[#115E59]"
                            type="text"
                            inputMode="numeric"
                        />
                    </div>

                    {/* Payment Methods */}
                    <div className="space-y-3 pt-2">
                        <Label className="text-xs font-medium text-gray-700">Payment Methods</Label>
                        <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                            <Label htmlFor="upi" className={`flex items-center justify-between border border-gray-400 rounded-xl px-4 py-3.5 bg-white shadow-none cursor-pointer hover:bg-gray-50 ${paymentMethod === 'upi' ? 'ring-2 ring-black border-transparent' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" alt="UPI" className="w-full h-full object-contain" />
                                    </div>
                                    <span className="font-semibold text-base text-gray-800">UPI Apps</span>
                                </div>
                                <RadioGroupItem value="upi" id="upi" className="w-5 h-5 text-black border-2 border-black" />
                            </Label>

                            <Label htmlFor="card" className={`flex items-center justify-between border border-gray-400 rounded-xl px-4 py-3.5 bg-white shadow-none cursor-pointer hover:bg-gray-50 ${paymentMethod === 'card' ? 'ring-2 ring-black border-transparent' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <CreditCard className="w-7 h-7 text-black" />
                                    </div>
                                    <span className="font-semibold text-base text-gray-800">Cards, Netbanking, UPI, Wallet</span>
                                </div>
                                <RadioGroupItem value="card" id="card" className="w-5 h-5 text-black border-2 border-black" />
                            </Label>
                        </RadioGroup>
                    </div>

                    <Button onClick={handlePayment} disabled={processing} className="w-full h-12 text-xl font-bold rounded-[1.25rem] bg-[#115E59] hover:bg-[#0d4a46] mt-4 shadow-lg text-white">
                        {processing ? <Loader2 className="animate-spin" /> : "Continue to Pay"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
