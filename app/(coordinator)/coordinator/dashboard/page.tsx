"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Wallet, Star, History, Users, ArrowRight, Copy, Pencil, Link as LinkIcon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { string } from "zod";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CoordinatorStats {
    batch: {
        id: string;
        name: string;
        slug?: string;
        totalCollected: number;
    };
    user: {
        name: string;
        username: string;
    };
}


export default function CoordinatorDashboard() {
    const [stats, setStats] = useState<CoordinatorStats | null>(null);
    const [loading, setLoading] = useState(true);

    const [editSlugOpen, setEditSlugOpen] = useState(false);
    const [slugForm, setSlugForm] = useState("");
    const [updatingSlug, setUpdatingSlug] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/coordinator/stats");
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                    setSlugForm(data.batch.slug || "");
                }
            } catch (error) {
                console.error("Error loading stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const handleCopyLink = () => {
        if (!stats) return;
        const identifier = stats.batch.slug ? encodeURIComponent(stats.batch.slug) : encodeURIComponent(stats.batch.name);
        const url = `${window.location.origin}/donate?batch=${identifier}`;
        navigator.clipboard.writeText(url);
        toast.success("Referral link copied to clipboard");
    };

    const handleUpdateSlug = async () => {
        setUpdatingSlug(true);
        try {
            const res = await fetch("/api/coordinator/batch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ slug: slugForm }),
            });

            if (res.ok) {
                const data = await res.json();
                setStats(prev => prev ? { ...prev, batch: { ...prev.batch, slug: data.batch.slug } } : null);
                setEditSlugOpen(false);
                toast.success("Referral link updated");
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to update slug");
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setUpdatingSlug(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFF9ED] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#115E59]" />
            </div>
        );
    }

    if (!stats) return (
        <div className="min-h-screen bg-[#FFF9ED] flex flex-col items-center justify-center space-y-4">
            <p className="text-red-500 font-medium">Failed to load dashboard data.</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans pb-20">
            {/* Header / Nav */}
            <header className="container px-6 py-6 flex justify-between items-center text-[#115e59]">
                <div className="flex flex-col">
                    <h1 className="text-xl font-bold tracking-tight">Coordinator Dashboard</h1>
                    <p className="text-xs font-medium text-[#115e59]/70">Welcome, {stats.user.name}</p>
                </div>
                <div className="flex gap-2">
                    {/* Add logout or profile button if needed */}
                </div>
            </header>

            {/* Main Stats Card (Matches Public UI) */}
            <section className="container px-4 mb-8">
                <div className="bg-[#115e59] rounded-[2.5rem] pt-10 pb-16 px-6 text-center text-white relative overflow-hidden mx-auto shadow-xl">
                    <div className="flex items-center justify-center gap-2 mb-2 opacity-90">
                        <Wallet className="w-5 h-5 text-white" />
                        <span className="text-lg font-medium tracking-wide">{stats.batch.name} Batch Collection</span>
                    </div>
                    <div className="bg-[#1A6D66] rounded-2xl py-3 px-4 sm:px-6 inline-block mb-6 sm:mb-8 w-full max-w-sm mx-auto shadow-inner">
                        <h2 className="text-3xl sm:text-4xl font-bold tracking-wider break-all">
                            {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : formatCurrency(stats.batch.totalCollected)}
                        </h2>
                    </div>

                    <div className="flex justify-center gap-3 sm:gap-4 relative z-10 w-full max-w-sm mx-auto px-2 sm:px-0">
                        <Link href="/coordinator/transactions" className="flex-1">
                            <Button className="w-full rounded-full bg-[#2D7A75] border-none text-white hover:bg-[#256661] hover:text-white px-2 py-4 sm:py-5 shadow-sm text-xs sm:text-sm font-medium h-auto whitespace-normal leading-tight">
                                <span>Batch Transactions</span>
                            </Button>
                        </Link>
                        {/* Maybe add Leaderboard link or Members link later? */}
                        <Link href="/coordinator/leaderboard" className="flex-1">
                            <Button className="w-full rounded-full bg-[#2D7A75] border-none text-white hover:bg-[#256661] hover:text-white px-2 py-4 sm:py-5 shadow-sm text-xs sm:text-sm font-medium h-auto whitespace-normal leading-tight">
                                <span>Batch Leaderboard</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Make Payment Button - Floating overlap style */}
                <div className="mt-[-35px] sm:mt-[-45px] flex justify-center relative z-20">
                    <Link href="/coordinator/payment">
                        <Button className="rounded-full bg-[#859F3D] hover:bg-[#6f8533] text-white text-base sm:text-lg font-bold px-16 sm:px-23 py-6 sm:py-4 h-auto border-[5px] sm:border-[7px] border-[#FFF9ED] shadow-lg">
                            Deposit Funds
                        </Button>
                    </Link>
                </div>
            </section>

            {/* Referral Link Card */}
            <section className="container px-4 py-4 space-y-4">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/50">
                    <h3 className="font-bold text-lg mb-4 text-black flex items-center gap-2">
                        <LinkIcon className="w-5 h-5 text-[#115e59]" />
                        Referral Link
                    </h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Share this link to collect funds</span>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={handleCopyLink} className="h-8 px-3 text-[#115e59] border-[#115e59]/20 hover:bg-teal-50">
                                    <Copy className="w-3 h-3 mr-2" /> Copy
                                </Button>
                                <Dialog open={editSlugOpen} onOpenChange={setEditSlugOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-8 px-3 text-[#115e59] border-[#115e59]/20 hover:bg-teal-50">
                                            <Pencil className="w-3 h-3 mr-2" /> Edit
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Referral Link</DialogTitle>
                                            <DialogDescription>
                                                Customize your batch's unique referral link.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="slug">Short Code / Slug</Label>
                                                <Input
                                                    id="slug"
                                                    placeholder="e.g. batch-name"
                                                    value={slugForm}
                                                    onChange={(e) => setSlugForm(e.target.value)}
                                                />
                                                <p className="text-xs text-muted-foreground">
                                                    Example: {window.location.origin}/donate?batch={slugForm || stats.batch.name}
                                                </p>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setEditSlugOpen(false)}>Cancel</Button>
                                            <Button onClick={handleUpdateSlug} disabled={updatingSlug} className="bg-[#115E59] text-white">
                                                {updatingSlug && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Save Changes
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl text-sm text-gray-600 font-mono break-all border border-gray-100 flex items-center justify-between group">
                            <span>{window.location.origin}/donate?batch={stats.batch.slug || encodeURIComponent(stats.batch.name)}</span>
                            <Button variant="ghost" size="icon" onClick={handleCopyLink} className="h-6 w-6 text-gray-400 hover:text-[#115e59] opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <Copy className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Batch Info / Quick Actions */}
            <section className="container px-4 py-4 space-y-4">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100/50">
                    <h3 className="font-bold text-lg mb-4 text-black flex items-center gap-2">
                        <Users className="w-5 h-5 text-[#115e59]" />
                        Batch Details
                    </h3>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500 text-sm">Batch Name</span>
                            <span className="font-semibold text-gray-900">{stats.batch.name}</span>
                        </div>



                        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500 text-sm">Coordinator</span>
                            <span className="font-semibold text-gray-900">{stats.user.name}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500 text-sm">Username</span>
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-600">@{stats.user.username}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                            <span className="text-gray-500 text-sm">Status</span>
                            <span className="bg-teal-50 text-teal-700 text-xs font-bold px-2.5 py-1 rounded-full border border-teal-100">Active</span>
                        </div>
                    </div>
                </div>
            </section>


        </div>
    );
}
