"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LogOut, Home, LayoutDashboard, History, Users } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

export default function CoordinatorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/login"); // Redirect to login
    };

    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans flex flex-col max-w-[520px] mx-auto shadow-2xl border-x relative">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-[#115E59] text-white shadow-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/coordinator/dashboard" className="flex items-center gap-3">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/left_side.png"
                                alt="Logo"
                                fill
                                className="object-contain brightness-0 invert"
                            />
                        </div>
                        <span className="font-bold text-lg tracking-tight inline-block">Jariya Coordinator</span>
                    </Link>

                    <nav className="flex items-center gap-1">
                        <Link href="/coordinator/dashboard">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`flex-col h-auto py-1 px-2 gap-0.5 hover:bg-white/10 ${pathname === '/coordinator/dashboard' ? 'text-white' : 'text-teal-100 hover:text-white'}`}
                            >
                                <LayoutDashboard className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Home</span>
                            </Button>
                        </Link>
                        <Link href="/coordinator/transactions">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`flex-col h-auto py-1 px-2 gap-0.5 hover:bg-white/10 ${pathname === '/coordinator/transactions' ? 'text-white' : 'text-teal-100 hover:text-white'}`}
                            >
                                <History className="w-5 h-5" />
                                <span className="text-[10px] font-medium">History</span>
                            </Button>
                        </Link>
                        <Link href="/coordinator/profile">
                            <Button
                                variant="ghost"
                                size="sm"
                                className={`flex-col h-auto py-1 px-2 gap-0.5 hover:bg-white/10 ${pathname === '/coordinator/profile' ? 'text-white' : 'text-teal-100 hover:text-white'}`}
                            >
                                <Users className="w-5 h-5" />
                                <span className="text-[10px] font-medium">Profile</span>
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLogout}
                            className="flex-col h-auto py-1 px-2 gap-0.5 text-red-200 hover:text-red-100 hover:bg-red-900/20"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="text-[10px] font-medium">Logout</span>
                        </Button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-4 pb-8">
                {children}
            </main>

            <Footer />
        </div>
    );
}
