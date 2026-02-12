"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Footer } from "@/components/Footer"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { ArrowLeft, QrCode, CreditCard, Loader2, Share2, ChevronDown, Check, Home } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { PaymentWaiting } from "./PaymentWaiting"
import { QRCodePayment } from "./QRCodePayment"
import { PaymentScreens } from "@/components/PaymentScreens"

interface Batch {
    id: string
    name: string
}

interface PlaceItem {
    id: string
    name: string
    type: string
}

interface DistrictItem {
    id: string
    name: string
    panchayats: PlaceItem[]
}

interface SectionItem {
    id: string
    name: string
    type: string
    districts: DistrictItem[]
}

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
]

export default function DonatePage() {
    const [amount, setAmount] = React.useState("")
    const [name, setName] = React.useState("")
    const [phone, setPhone] = React.useState("")
    const [hideName, setHideName] = React.useState(false)
    const [isGeneral, setIsGeneral] = React.useState(false)

    // Data state
    const [batches, setBatches] = React.useState<Batch[]>([])
    const [sections, setSections] = React.useState<SectionItem[]>([])
    const [loading, setLoading] = React.useState(true)

    // Selection state
    const [selectedBatch, setSelectedBatch] = React.useState<string>("")
    const [selectedPlace, setSelectedPlace] = React.useState<string>("")
    const [activeSection, setActiveSection] = React.useState<string>("") // section id
    const [placeSearch, setPlaceSearch] = React.useState<string>("")

    // Country Code state
    const [countryCode, setCountryCode] = React.useState("+91")
    const [countrySearch, setCountrySearch] = React.useState("")
    const [openCountryDropdown, setOpenCountryDropdown] = React.useState(false)

    // Dropdown state
    const [openPlaceDropdown, setOpenPlaceDropdown] = React.useState(false)
    const [openBatchDropdown, setOpenBatchDropdown] = React.useState(false)
    const dropdownRef = React.useRef<HTMLDivElement>(null)
    const batchDropdownRef = React.useRef<HTMLDivElement>(null)
    const countryDropdownRef = React.useRef<HTMLDivElement>(null)

    const presets = ["500", "1,000", "2,000", "5,000", "10,000"]

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpenPlaceDropdown(false)
            }
            if (batchDropdownRef.current && !batchDropdownRef.current.contains(event.target as Node)) {
                setOpenBatchDropdown(false)
            }
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
                setOpenCountryDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                const [batchesRes, placesRes] = await Promise.all([
                    fetch("/api/admin/batches"),
                    fetch("/api/admin/places")
                ])
                if (batchesRes.ok) {
                    const batchesData = await batchesRes.json()
                    setBatches(batchesData.filter((b: any) => b.status === "Active"))
                }
                if (placesRes.ok) {
                    const sectionsData: SectionItem[] = await placesRes.json()
                    setSections(sectionsData)
                    // Auto-select first section
                    if (sectionsData.length > 0) setActiveSection(sectionsData[0].id)
                }
            } catch (error) {
                console.error("Error loading data", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    // Get all places under the active section (flattened from districts)
    const allSectionPlaces = React.useMemo(() => {
        const section = sections.find(s => s.id === activeSection)
        if (!section) return []
        const places: { id: string; name: string; districtName: string }[] = []
        if (section.districts.length === 0) {
            // No children — show section itself
            places.push({ id: `section-${section.id}`, name: section.name, districtName: section.type })
        } else {
            for (const district of section.districts) {
                if (district.panchayats.length === 0) {
                    // District has no places — show district itself
                    places.push({ id: `district-${district.id}`, name: district.name, districtName: section.name })
                } else {
                    for (const place of district.panchayats) {
                        places.push({ id: place.id, name: place.name, districtName: district.name })
                    }
                }
            }
        }
        return places
    }, [sections, activeSection])

    // Filter by search
    const filteredPlaces = React.useMemo(() => {
        if (!placeSearch.trim()) return allSectionPlaces
        const q = placeSearch.toLowerCase()
        return allSectionPlaces.filter(p => p.name.toLowerCase().includes(q) || p.districtName.toLowerCase().includes(q))
    }, [allSectionPlaces, placeSearch])

    const selectedPlaceName = React.useMemo(() => {
        return allSectionPlaces.find(p => p.id === selectedPlace)?.name
    }, [allSectionPlaces, selectedPlace])

    const selectedBatchName = React.useMemo(() => {
        return batches.find(b => b.id === selectedBatch)?.name
    }, [batches, selectedBatch])

    const filteredCountries = React.useMemo(() => {
        if (!countrySearch.trim()) return countries
        const q = countrySearch.toLowerCase()
        return countries.filter(c => c.name.toLowerCase().includes(q) || c.code.includes(q))
    }, [countrySearch])

    const selectedCountry = React.useMemo(() => {
        return countries.find(c => c.code === countryCode) || countries[0]
    }, [countryCode])

    // Selection state
    const [paymentMethod, setPaymentMethod] = React.useState("upi")
    const [showReceipt, setShowReceipt] = React.useState(false)
    const [receiptData, setReceiptData] = React.useState<any>(null)

    // Payment UI State
    const [qrData, setQrData] = React.useState<{ imageUrl: string, donationId: string, qrString?: string } | null>(null)
    const [showQrModal, setShowQrModal] = React.useState(false)
    const [showPaymentWaiting, setShowPaymentWaiting] = React.useState(false)
    const [paymentOrderId, setPaymentOrderId] = React.useState("")
    const [isCheckingStatus, setIsCheckingStatus] = React.useState(false)

    // Helper to check status
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
                    amount: amount,
                    name: name,
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

    // Poll for QR Status
    React.useEffect(() => {
        let interval: NodeJS.Timeout;
        if (showQrModal && qrData?.donationId) {
            interval = setInterval(() => {
                checkQrStatus(); // Silent poll
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [showQrModal, qrData, checkQrStatus]);


    const loadRazorpay = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => {
                resolve(true);
            };
            script.onerror = () => {
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const handlePayment = async () => {
        if (!amount) {
            toast.error("Please enter an amount")
            return
        }
        if (!name) {
            toast.error("Please enter your name")
            return
        }
        if (!selectedPlace) {
            toast.error("Please select a Place/Municipality")
            return
        }
        if (!isGeneral && !selectedBatch) {
            toast.error("Please select a Batch")
            return
        }

        setLoading(true);

        try {
            // === QR CODE FLOW ===
            if (paymentMethod === 'qr') {
                const res = await fetch("/api/razorpay/qr", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount,
                        name,
                        mobile: `${countryCode} ${phone}`,
                        hideName,
                        batchId: isGeneral ? null : selectedBatch,
                        unitId: null,
                        placeId: selectedPlace,
                    })
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast.error(err.error || "Failed to generate QR");
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                console.log("QR Response Data:", data);
                setQrData({
                    imageUrl: data.qr_image_url,
                    donationId: data.donationId,
                    qrString: data.qr_string
                });
                setShowQrModal(true);
                setLoading(false);
            }
            // === STANDARD CHECKOUT FLOW (UPI Apps, Cards) ===
            else {
                const res = await loadRazorpay();

                if (!res) {
                    toast.error('Razorpay SDK failed to load. Are you online?');
                    setLoading(false);
                    return;
                }

                // 1. Create Order
                const orderRes = await fetch("/api/razorpay/order", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount,
                        name,
                        mobile: `${countryCode} ${phone}`,
                        hideName,
                        batchId: isGeneral ? null : selectedBatch,
                        unitId: null,
                        placeId: selectedPlace,
                    })
                })

                if (!orderRes.ok) {
                    const errorData = await orderRes.json()
                    toast.error(errorData.error || "Failed to create order")
                    setLoading(false);
                    return
                }

                const orderData = await orderRes.json();
                setPaymentOrderId(orderData.id); // Save Order ID for reference
                setShowPaymentWaiting(true); // Show Waiting Screen

                // Determine Config ID based on payment method
                let configId = undefined;
                if (paymentMethod === 'upi') {
                    configId = process.env.NEXT_PUBLIC_RAZORPAY_CONFIG_UPI;
                } else if (paymentMethod === 'card') {
                    configId = process.env.NEXT_PUBLIC_RAZORPAY_CONFIG_ALL;
                }

                console.log(`Using Razorpay Config: ${configId} for method: ${paymentMethod}`);

                // 2. Open Razorpay Checkout
                const options: any = {
                    key: orderData.keyId,
                    amount: orderData.amount,
                    currency: orderData.currency,
                    name: "Jariya Fundraising | Sabeelul Hidaya Islamic College",
                    description: "Donation Transaction",
                    order_id: orderData.id,
                    config_id: configId, // Pass the Configuration ID
                    handler: async function (response: any) {
                        // 3. Verify Payment
                        const verifyRes = await fetch("/api/razorpay/verify", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        })

                        const verifyData = await verifyRes.json();

                        if (verifyData.status === 'success') {
                            toast.success("Donation successful!");
                            setShowPaymentWaiting(false); // Hide waiting screen
                            setReceiptData({
                                amount: amount,
                                name: name,
                                transactionId: verifyData.donation.transactionId,
                                date: new Date().toLocaleString()
                            });
                            setShowReceipt(true);
                        } else {
                            toast.error("Payment verification failed. Please contact support.");
                            setShowPaymentWaiting(false);
                        }
                        setLoading(false);
                    },
                    prefill: {
                        name: name,
                        contact: `${countryCode} ${phone}`
                    },
                    notes: {
                        name: name,
                        contact: `${countryCode} ${phone}`,
                        address: "Jariya Fund Raising Sabeelul Hidaya Islamic College"
                    },
                    theme: {
                        color: "#126C72" // Updated color to match UI
                    },
                    modal: {
                        ondismiss: function () {
                            setLoading(false);
                            setShowPaymentWaiting(false);
                            toast("Payment cancelled");
                        }
                    }
                };

                const paymentObject = new (window as any).Razorpay(options);
                paymentObject.open();
            }

        } catch (error) {
            console.error("Error submitting donation", error)
            toast.error("An error occurred. Please try again.")
            setLoading(false);
        }
    }

    if (showReceipt && receiptData) {
        // Redirect to receipt page
        if (typeof window !== 'undefined') {
            window.location.href = `/receipt/${receiptData.transactionId}`;
        }
        return (
            <div className="min-h-screen bg-[#FFF9ED] font-sans flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-[#115E59] mx-auto" />
                    <p className="mt-4 text-gray-600">Redirecting to receipt...</p>
                </div>
            </div>
        )
    }

    // 1. Payment Waiting (Standard Checkout)
    if (showPaymentWaiting) {
        return (
            <PaymentWaiting
                amount={amount}
                payerName={name}
                mobile={`${countryCode} ${phone}`}
                organization="Sabeelul Hidaya Islamic College"
                referenceId={paymentOrderId}
                onBack={() => {
                    // Logic to cancel/back? 
                    // Technically Razorpay frame might still be open. 
                    // Ideally we should close it if we could, but here we just go back to form.
                    setShowPaymentWaiting(false)
                    setLoading(false)
                }}
            />
        )
    }

    // 2. QR Code Payment Screen
    if (showQrModal && qrData) {
        return (
            <QRCodePayment
                amount={amount}
                payerName={name}
                description="Donation Transaction"
                organization="Sabeelul Hidaya Islamic College" // Or fetch from config
                qrUrl={qrData.imageUrl}
                onCancel={() => {
                    setShowQrModal(false)
                    setLoading(false)
                }}
                onCheckStatus={checkQrStatus}
                isCheckingStatus={isCheckingStatus}
            />
        )
    }

    // 3. Loading (General)
    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#FFF9ED]"><Loader2 className="h-8 w-8 animate-spin text-[#115E59]" /></div>

    // 4. Main Form
    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans relative">
            {/* Header */}
            <div className="container px-6 pt-10 pb-6 flex items-center justify-between">
                <Link href="/">
                    <Button size="sm" className="rounded-full bg-[#8B4513] hover:bg-[#723a10] text-white px-5 h-9 text-xs font-semibold shadow-sm">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>Contribute Now</h1>
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
                            <Label htmlFor="name" className="text-gray-700 font-medium text-xs">Enter Name<span className="text-red-500">*</span></Label>
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
                        {/* Country Code Dropdown Trigger */}
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

                        {/* Country Dropdown */}
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

                    {/* Batch Payment Section */}
                    <div className="space-y-2" ref={batchDropdownRef}>
                        <div className="flex justify-between items-center">
                            <Label className="text-xs text-gray-700 font-medium">Batch Payment</Label>
                            <div className="flex items-center gap-1.5">
                                <Checkbox
                                    id="gen-payment"
                                    className="w-4 h-4 rounded-[3px] border-gray-700 data-[state=checked]:bg-[#115E59] data-[state=checked]:border-[#115E59]"
                                    checked={isGeneral}
                                    onCheckedChange={(c) => setIsGeneral(c as boolean)}
                                />
                                <Label htmlFor="gen-payment" className="text-[10px] text-gray-600 font-medium cursor-pointer">General Payment</Label>
                            </div>
                        </div>

                        <div className="relative">
                            <div
                                onClick={() => !isGeneral && setOpenBatchDropdown(!openBatchDropdown)}
                                className={`h-12 w-full border border-[#115E59] rounded-xl bg-white px-3 flex items-center justify-between cursor-pointer transition-colors ${isGeneral ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:border-[#115E59]"}`}
                            >
                                <span className={`text-sm ${selectedBatchName ? "text-black" : "text-gray-400"}`}>
                                    {selectedBatchName || "Select Batch"}
                                </span>
                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openBatchDropdown ? "rotate-180" : ""}`} />
                            </div>

                            {openBatchDropdown && !isGeneral && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                        {batches.map(b => (
                                            <div
                                                key={b.id}
                                                onClick={() => {
                                                    setSelectedBatch(b.id)
                                                    setOpenBatchDropdown(false)
                                                }}
                                                className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors hover:bg-teal-50 flex items-center justify-between cursor-pointer ${selectedBatch === b.id ? "bg-teal-50 text-teal-800 font-medium" : "text-gray-700"
                                                    }`}
                                            >
                                                <span>{b.name}</span>
                                                {selectedBatch === b.id && <Check className="w-3 h-3 text-teal-600" />}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center gap-4 pt-3 pb-1">
                            {sections.map(section => (
                                <button
                                    key={section.id}
                                    onClick={() => { setActiveSection(section.id); setSelectedPlace(""); setPlaceSearch("") }}
                                    className={`rounded-xl h-10 px-8 font-semibold text-base transition-all border ${activeSection === section.id
                                        ? "bg-[#115E59] text-white border-[#115E59] shadow-md"
                                        : "bg-white border-gray-200 text-black hover:bg-gray-50"
                                        }`}
                                >
                                    {section.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Place / Area */}
                    <div className="space-y-2" ref={dropdownRef}>
                        <Label className="text-gray-700 font-medium text-xs">Panchayath/Municipality<span className="text-red-500">*</span></Label>

                        <div className="relative">
                            <div
                                onClick={() => setOpenPlaceDropdown(!openPlaceDropdown)}
                                className="h-12 w-full border border-[#115E59] rounded-xl bg-white px-3 flex items-center justify-between cursor-pointer hover:border-[#115E59] transition-colors"
                            >
                                <span className={`text-sm ${selectedPlaceName ? "text-black" : "text-gray-400"}`}>
                                    {selectedPlaceName || "Select Panchayath/Municipality"}
                                </span>

                                <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${openPlaceDropdown ? "rotate-180" : ""}`} />
                            </div>

                            {openPlaceDropdown && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 p-2 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <Input
                                        autoFocus
                                        placeholder="Search..."
                                        value={placeSearch}
                                        onChange={(e) => setPlaceSearch(e.target.value)}
                                        className="h-10 text-sm mb-2 border-gray-200"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <div className="max-h-[220px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                        {filteredPlaces.length === 0 ? (
                                            <div className="p-3 text-center text-xs text-gray-400">No places found</div>
                                        ) : (
                                            filteredPlaces.map(p => (
                                                <div
                                                    key={p.id}
                                                    onClick={() => {
                                                        setSelectedPlace(p.id)
                                                        setOpenPlaceDropdown(false)
                                                        setPlaceSearch("")
                                                    }}
                                                    className={`w-full text-left px-3 py-2.5 text-sm rounded-lg transition-colors hover:bg-teal-50 flex items-center justify-between cursor-pointer ${selectedPlace === p.id ? "bg-teal-50 text-teal-800 font-medium" : "text-gray-700"
                                                        }`}
                                                >
                                                    <span>{p.name}</span>
                                                    <span className="text-[10px] text-gray-400 ml-2">{p.districtName}</span>
                                                    {selectedPlace === p.id && <Check className="w-3 h-3 text-teal-600" />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
                            {/* 
                            <Label htmlFor="qr" className={`flex items-center justify-between border border-gray-400 rounded-xl px-4 py-3.5 bg-white shadow-none cursor-pointer hover:bg-gray-50 ${paymentMethod === 'qr' ? 'ring-2 ring-black border-transparent' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center">
                                        <QrCode className="w-7 h-7 text-black" />
                                    </div>
                                    <span className="font-semibold text-base text-gray-800">Scan UPI QR Code</span>
                                </div>
                                <RadioGroupItem value="qr" id="qr" className="w-5 h-5 text-black border-2 border-black" />
                            </Label> */}

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

                    <Button onClick={handlePayment} className="w-full h-12 text-xl font-bold rounded-[1.25rem] bg-[#115E59] hover:bg-[#0d4a46] mt-4 shadow-lg text-white">
                        Continue to Pay
                    </Button>

                </div>




                {/* Payment Modals */}
                {showQrModal && qrData && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <QRCodePayment
                            amount={amount}
                            payerName={name}
                            description="Donation Transaction"
                            organization="Simulated Organization"
                            qrUrl={qrData.imageUrl}
                            qrString={qrData.qrString}
                            onCancel={() => {
                                setShowQrModal(false);
                                setQrData(null);
                            }}
                            onCheckStatus={checkQrStatus}
                            isCheckingStatus={isCheckingStatus}
                        />
                    </div>
                )}

                {showPaymentWaiting && (
                    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
                        <PaymentWaiting
                            amount={amount}
                            payerName={name}
                            mobile={phone}
                            organization="Samastha Centenary International Conference"
                            referenceId={paymentOrderId}
                            onBack={() => {
                                setShowPaymentWaiting(false);
                                setPaymentOrderId("");
                            }}
                        />
                    </div>
                )}

            </div>
            <Footer />
        </div>
    )
}
