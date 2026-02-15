"use client";

import Link from "next/link";
import Slideshow from "@/components/Slideshow";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, Star, MessageCircle, Phone, Share2, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Batch {
  id?: string;
  name: string;
  amount: number;
  rank?: number;
  batch?: string; // For individuals
}

export default function Home() {
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Leaderboard State
  const [activeTab, setActiveTab] = useState("batches");
  const [leaderboardData, setLeaderboardData] = useState<Batch[]>([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);

  useEffect(() => {
    // Initial fetch for total amount
    const fetchTotal = async () => {
      try {
        const res = await fetch("/api/stats");
        if (res.ok) {
          const data = await res.json();
          setTotalAmount(data.totalAmount);
        }
      } catch (error) {
        console.error("Failed to fetch total stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTotal();
  }, []);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLeaderboardLoading(true);
      try {
        const res = await fetch(`/api/stats/leaderboard?type=${activeTab}&limit=3`);
        if (res.ok) {
          const data = await res.json();
          setLeaderboardData(data);
        }
      } catch (error) {
        console.error("Failed to fetch leaderboard", error);
        setLeaderboardData([]);
      } finally {
        setLeaderboardLoading(false);
      }
    };

    fetchLeaderboard();
  }, [activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-[#FFF9ED] text-foreground font-sans">
      {/* Header Logos */}
      <header className="container px-6 py-6 flex justify-between items-center">
        <img src="/left_side.png" alt="Jariya Logo" className="h-14 w-auto object-contain" />
        <img src="/right_sided.png" alt="College Logo" className="h-14 w-auto object-contain" />
      </header>

      {/* Slideshow */}
      <section className="container px-4 mb-6">
        <Slideshow />
      </section>

      {/* Collection Card */}
      <section className="container px-4 mb-8">
        <div className="bg-[#115e59] rounded-[2.5rem] pt-10 pb-16 px-6 text-center text-white relative overflow-hidden mx-auto">
          <div className="flex items-center justify-center gap-2 mb-2 opacity-90">
            <Wallet className="w-5 h-5 text-white" />
            <span className="text-lg font-medium tracking-wide">Together We Collected</span>
          </div>

          <div className="bg-[#1A6D66] rounded-2xl py-3 px-6 inline-block mb-8 w-full max-w-sm mx-auto shadow-inner">
            <h2 className="text-4xl font-bold tracking-wider">
              {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : formatCurrency(totalAmount)}
            </h2>
          </div>

          <div className="flex justify-center gap-4 relative z-10 w-full max-w-sm mx-auto">
            <Link href="/leaderboard" className="flex-1">
              <Button className="w-full rounded-full bg-[#2D7A75] border-none text-white hover:bg-[#256661] hover:text-white px-2 py-5 shadow-sm text-sm font-medium">
                Toppers
              </Button>
            </Link>
            <Link href="/transactions" className="flex-1">
              <Button className="w-full rounded-full bg-[#2D7A75] border-none text-white hover:bg-[#256661] hover:text-white px-2 py-5 shadow-sm text-sm font-medium">
                Transactions
              </Button>
            </Link>
          </div>
        </div>

        {/* Contribute Button - Floating overlap */}
        <div className="mt-[-45px] flex justify-center relative z-20">
          <Link href="/donate">
            <Button className="rounded-full bg-[#859F3D] hover:bg-[#6f8533] text-white text-lg font-bold px-23 py-4 h-auto border-[7px] border-[#FFF9ED]">
              Contribute Now
            </Button>
          </Link>
        </div>
      </section>

      {/* Leading Today Section */}
      <section className="container px-4 py-6 bg-white">
        <h3 className="text-center text-xl font-bold mb-5 text-black">Leading Today</h3>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col items-center text-gray-800">
          <TabsList className="bg-transparent gap-2 flex-nowrap h-auto justify-start mb-6 w-full max-w-full overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-gray-800">
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
            {leaderboardLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">No data available yet.</div>
            ) : (
              leaderboardData.map((item, i) => {
                const rank = item.rank || i + 1;
                const starColors: Record<number, string> = { 1: '#fbbf24', 2: '#9ca3af', 3: '#cd7f32' };
                const starColor = starColors[rank];
                return (
                  <div key={i} className="bg-[#FFF1C5]/40 rounded-3xl p-3 pl-4 flex items-center justify-between  border-none">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-[#115e59] flex items-center justify-center text-white font-bold text-lg shadow-sm ">
                          {rank}
                        </div>
                        {starColor && (
                          <div className="absolute -bottom-1 -right-1 rounded-full p-1 border-2 border-[#FFE8A3]/40 shadow-sm" style={{ backgroundColor: starColor }}>
                            <Star className="w-3 h-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-[15px] text-black">{item.name}</p>
                        <p className="text-xs text-black/60 font-medium">
                          {item.batch}
                        </p>
                      </div>
                    </div>
                    <div className="bg-transparent rounded-full px-4 py-1.5 border border-black/80 shadow-none">
                      <span className="font-bold text-black text-sm">{formatCurrency(item.amount)}</span>
                    </div>
                  </div>
                );
              })

            )}
          </div>
        </Tabs>
      </section>

      {/* Need Support Section */}
      {/*<section className="container px-4 mb-4">
        <div className="bg-white rounded-[2rem] p-6">
          <h3 className="font-bold text-lg mb-1 text-black">Need Support?</h3>
          <p className="text-gray-500 text-sm mb-5">We Are here to help!</p>
          <div className="flex gap-4">
            <Button className="rounded-full bg-[#115e59] hover:bg-[#0f504c] text-white shadow-md h-10 px-6 text-sm font-medium">
              <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
            </Button>
            <Button className="rounded-full bg-[#115e59] hover:bg-[#0f504c] text-white shadow-md h-10 px-6 text-sm font-medium">
              <Phone className="w-4 h-4 mr-2" /> Call
            </Button>
          </div>
        </div>
      </section>
*/}
      {/* Divider
      <div className="container px-4">
        <hr className="border-gray-200 mb-4" />
      </div> */}

      {/* Spread the Word Section */}
      <section className="container px-4 my-4">
        <div className="bg-white rounded-[2rem] p-6">
          <h3 className="font-bold text-lg mb-1 text-black">Spread the word</h3>
          <p className="text-gray-500 text-sm mb-5">Be a part of this good deed - share and support the fundraising.</p>
          <Button className="w-full rounded-full bg-[#115e59] hover:bg-[#0f504c] h-12 text-base text-white shadow-md font-medium">
            <Share2 className="w-4 h-4 mr-2" /> Share the Campaign
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
