"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Star, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LeaderboardItem {
    rank: number;
    name: string;
    amount: number;
}

export default function CoordinatorLeaderboardPage() {
    const [data, setData] = useState<LeaderboardItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await fetch("/api/coordinator/leaderboard");
                if (res.ok) {
                    const result = await res.json();
                    setData(result);
                }
            } catch (error) {
                console.error("Error loading leaderboard", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh] bg-[#FFF9ED]">
                <Loader2 className="w-8 h-8 animate-spin text-[#115E59]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF9ED] pb-20 font-sans">
            {/* Header - MATCHING PUBLIC STYLE */}
            <div className="bg-[#115e59] text-white pt-8 pb-16 px-6 relative mb-5 shadow-xl rounded-b-[2.5rem]">
                <div className="flex items-center mb-6">
                    <Link href="/coordinator/dashboard">
                        <Button variant="secondary" size="sm" className="rounded-full bg-white text-[#134E4A] hover:bg-white/90 font-bold px-6 h-9 shadow-md">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back
                        </Button>
                    </Link>
                </div>
                <div className="flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-left tracking-wide">Batch<br />Leaderboard</h1>
                    <Trophy className="w-12 h-12 text-[#FFE8A3] opacity-90 drop-shadow-md" />
                </div>
            </div>

            <div className="px-4 space-y-3 max-w-[520px] mx-auto mt-8 relative z-10">
                {data.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-[2rem] shadow-sm border border-gray-100">
                        <p className="text-gray-400 font-medium">No contributions yet.</p>
                    </div>
                ) : (
                    data.map((item) => {
                        const starColors: Record<number, string> = { 1: '#fbbf24', 2: '#9ca3af', 3: '#cd7f32' };
                        const starColor = starColors[item.rank];

                        return (
                            <div key={item.rank} className="bg-[#FFE8A3]/40 rounded-[1.2rem] p-3 pl-4 flex items-center justify-between shadow-sm border-none active:scale-[0.99] transition-transform">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <div className="w-12 h-12 rounded-full bg-[#115e59] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                            {item.rank}
                                        </div>
                                        {starColor && (
                                            <div className="absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-[#FFE8A3]/40 shadow-sm" style={{ backgroundColor: starColor }}>
                                                <Star className="w-3 h-3 text-white fill-current" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-bold text-lg text-black truncate max-w-[180px]">{item.name}</h3>
                                        <p className="text-xs text-[#115E59] font-bold tracking-wide uppercase">Rank #{item.rank}</p>
                                    </div>
                                </div>

                                <div className="bg-white/50 backdrop-blur-sm rounded-full px-4 py-1.5 border border-[#115E59]/20 text-sm font-bold text-[#115E59] shadow-sm">
                                    {formatCurrency(item.amount)}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
