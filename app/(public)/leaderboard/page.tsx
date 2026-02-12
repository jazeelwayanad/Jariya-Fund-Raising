"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Star, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface LeaderboardItem {
    id?: string;
    name: string;
    amount: number;
    rank?: number;
    batch?: string;
}

export default function LeaderboardPage() {
    const [activeTab, setActiveTab] = useState("batches");
    const [data, setData] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch top 50
                const res = await fetch(`/api/stats/leaderboard?type=${activeTab}&limit=50`);
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Failed to fetch leaderboard", error);
                setData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-white text-foreground pb-20 font-sans">
            {/* Header */}
            <div className="bg-[#116C72] text-white pt-8 pb-16 px-6 relative mb-5 shadow-xl">
                <div className="flex items-center mb-8">
                    <Link href="/">
                        <Button variant="secondary" size="sm" className="rounded-full bg-white text-[#134E4A] hover:bg-white/90 font-bold px-6 h-9">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    </Link>
                </div>
                <h1 className="text-4xl font-bold text-left tracking-wide">Leaderboard</h1>
            </div>

            {/* Tabs & List */}
            <div className="container px-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center">
                    <TabsList className="bg-transparent gap-2 flex-nowrap h-auto justify-start mb-6 w-full max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                        {["Batches", "Individuals", "Units", "Districts", "Municipalities", "Panchayats"].map((tab) => (
                            <TabsTrigger
                                key={tab}
                                value={tab.toLowerCase()}
                                className="flex-none rounded-full border border-black/40 px-4 py-1.5 bg-transparent text-gray-800 font-bold text-sm shadow-none data-[state=active]:!bg-[#FFF1C5] data-[state=active]:!text-gray-800 data-[state=active]:!border-[#FFE8A3] data-[state=active]:!shadow-none hover:!text-gray-800"
                            >
                                {tab}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="w-full space-y-3">
                        {loading ? (
                            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
                        ) : data.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">No data available for this category yet.</div>
                        ) : (
                            data.map((item, index) => {
                                const rank = item.rank || index + 1;
                                const starColors: Record<number, string> = { 1: '#fbbf24', 2: '#9ca3af', 3: '#cd7f32' };
                                const starColor = starColors[rank];
                                return (
                                    <div key={index} className="bg-[#FFE8A3]/40 rounded-[1.2rem] p-3 pl-4 flex items-center justify-between shadow-sm border-none">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-12 h-12 rounded-full bg-[#115e59] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                                    {rank}
                                                </div>
                                                {starColor && (
                                                    <div className="absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-[#FFE8A3]/40 shadow-sm" style={{ backgroundColor: starColor }}>
                                                        <Star className="w-3 h-3 text-white fill-current" />
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-bold text-lg text-black">{item.name}</p>
                                                {item.batch && <p className="text-xs text-gray-500 font-medium">{item.batch}</p>}
                                            </div>
                                        </div>
                                        <div className="bg-transparent rounded-full px-4 py-1.5 border border-black/80 text-sm font-bold text-black shadow-none">
                                            {formatCurrency(item.amount)}
                                        </div>
                                    </div>
                                );
                            })

                        )}
                    </div>
                </Tabs>
            </div>

            <Footer />

        </div>
    )
}
