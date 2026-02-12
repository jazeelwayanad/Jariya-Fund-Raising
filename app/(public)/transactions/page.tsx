"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";

interface Transaction {
    id: string;
    name: string;
    details: string[];
    amount: number;
    date: string;
    transactionId?: string;
}

export default function TransactionsPage() {
    const [search, setSearch] = useState("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTransactions(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    const fetchTransactions = async (query: string) => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (query) p.append("search", query);
            p.append("limit", "50");

            const res = await fetch(`/api/transactions?${p.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } catch (error) {
            console.error("Failed to fetch transactions", error);
            setTransactions([]);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-IN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-white text-foreground pb-10 font-sans">
            {/* Header */}
            <div className="bg-[#134E4A] text-white pt-8 pb-16 px-6  relative mb-8 shadow-xl">
                <div className="flex items-center mb-8">
                    <Link href="/">
                        <Button variant="secondary" size="sm" className="rounded-full bg-white text-[#134E4A] hover:bg-white/90 font-bold px-6 h-9">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    </Link>
                </div>
                <h1 className="text-4xl font-bold text-left tracking-wide">Transactions</h1>
            </div>

            {/* Search Bar */}
            <div className="container px-4 mb-6">
                <div className="flex items-center gap-0">
                    <Input
                        placeholder="Search by Name/Transaction ID/Amount"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-12 border border-gray-300 rounded-l-xl rounded-r-none bg-white px-4 text-sm placeholder:text-gray-400 shadow-sm flex-1"
                    />
                    <button className="h-12 w-12 bg-[#115e59] rounded-r-xl flex items-center justify-center shadow-sm shrink-0">
                        <Search className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* Transaction List */}
            <div className="container px-4 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                ) : transactions.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">No transactions found.</div>
                ) : (
                    transactions.map((tx, index) => (
                        <div key={index} className="bg-white rounded-2xl p-5 shadow-md border border-gray-100">
                            <div className="flex justify-between items-start">
                                {/* Left side - Details */}
                                <div className="space-y-2 text-sm flex-1">
                                    <div className="flex">
                                        <span className="text-[#134E4A] font-bold w-24 shrink-0">Name</span>
                                        <span className="text-gray-400 mr-2">:</span>
                                        <span className="text-black font-medium">{tx.name}</span>
                                    </div>
                                    <div className="flex">
                                        <span className="text-[#134E4A] font-bold w-24 shrink-0">Details</span>
                                        <span className="text-gray-400 mr-2">:</span>
                                        <div className="text-black font-medium">
                                            {tx.details.join(", ")}
                                        </div>
                                    </div>
                                    <div className="flex">
                                        <span className="text-[#134E4A] font-bold w-24 shrink-0">Date & Time</span>
                                        <span className="text-gray-400 mr-2">:</span>
                                        <span className="text-black font-medium">{formatDate(tx.date)}</span>
                                    </div>
                                    {tx.transactionId && (
                                        <div className="flex">
                                            <span className="text-[#134E4A] font-bold w-24 shrink-0">Tx ID</span>
                                            <span className="text-gray-400 mr-2">:</span>
                                            <span className="text-black font-medium text-xs self-center">{tx.transactionId}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Right side - Amount & Receipt */}
                                <div className="flex flex-col items-end gap-2 ml-4">
                                    <span className="text-2xl font-bold text-black">{formatCurrency(tx.amount)}</span>
                                    <Link href={`/receipt/${tx.transactionId || tx.id}`} target="_blank">
                                        <Button size="sm" className="rounded-full bg-[#115e59] hover:bg-[#0f504c] text-white text-xs px-5 h-7 font-medium shadow-sm">
                                            Receipt
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Footer */}
            <Footer />
        </div>
    )
}
