"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Loader2, ArrowUpRight, ArrowDownLeft, Calendar, Download, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface Transaction {
    id: string;
    amount: number;
    name: string | null;
    mobile: string | null;
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED";
    transactionId: string | null;
    createdAt: string;
}

export default function CoordinatorTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, SUCCESS, PENDING, FAILED

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const res = await fetch("/api/coordinator/transactions");
                if (res.ok) {
                    const data = await res.json();
                    setTransactions(data);
                } else {
                    toast.error("Failed to load transactions");
                }
            } catch (error) {
                console.error("Error loading transactions", error);
                toast.error("An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.transactionId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (t.mobile || "").includes(searchQuery);

        const matchesStatus = statusFilter === "ALL" || t.paymentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-[#115E59]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header Area */}
            <div className="flex flex-col gap-3 sticky top-16 bg-[#FFF9ED] z-10 py-2">
                <div className="flex justify-between items-end">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#115E59]">Transactions</h1>
                        <p className="text-xs sm:text-sm text-gray-500">History of batch donations.</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search..."
                            className="pl-9 bg-white border-gray-200 h-9 text-sm rounded-xl focus-visible:ring-[#115E59]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[110px] h-9 bg-white border-gray-200 rounded-xl text-xs font-medium">
                            <Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All Status</SelectItem>
                            <SelectItem value="SUCCESS">Success</SelectItem>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="FAILED">Failed</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                        <p className="text-gray-400 text-sm">No transactions found.</p>
                        {(searchQuery || statusFilter !== "ALL") && (
                            <Button
                                variant="link"
                                onClick={() => { setSearchQuery(""); setStatusFilter("ALL"); }}
                                className="text-[#115E59] text-xs mt-2"
                            >
                                Clear Filters
                            </Button>
                        )}
                    </div>
                ) : (
                    filteredTransactions.map((t) => (
                        <div
                            key={t.id}
                            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3 active:scale-[0.99] transition-transform"
                        >
                            <div className="flex items-center justify-between gap-3">
                                {/* Left: Icon & Info */}
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.paymentStatus === 'SUCCESS' ? 'bg-teal-50 text-teal-600' :
                                        t.paymentStatus === 'FAILED' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'
                                        }`}>
                                        {t.paymentStatus === 'SUCCESS' ? <ArrowDownLeft className="w-5 h-5" /> : <Loader2 className="w-5 h-5" />}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-gray-900 text-sm truncate">
                                            {t.name || "Anonymous Donor"}
                                        </h3>
                                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                            <span className="truncate max-w-[80px] font-mono">{t.transactionId?.slice(-6) || "---"}</span>
                                            <span>•</span>
                                            <span>{new Date(t.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Right: Amount */}
                                <div className="text-right shrink-0">
                                    <div className={`font-bold text-sm ${t.paymentStatus === 'SUCCESS' ? 'text-teal-700' : 'text-gray-500'
                                        }`}>
                                        {t.paymentStatus === 'SUCCESS' ? '+' : ''}{formatCurrency(t.amount)}
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Actions Row (only for success) */}
                            {t.paymentStatus === 'SUCCESS' && (
                                <div className="pt-2 border-t border-gray-50 flex justify-end">
                                    <Link href={`/receipt/${t.transactionId || t.id}`} className="inline-flex items-center">
                                        <Button variant="ghost" size="sm" className="h-7 text-xs text-[#115E59] hover:bg-teal-50 px-2 rounded-lg">
                                            <Download className="w-3.5 h-3.5 mr-1.5" />
                                            Download Receipt
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
