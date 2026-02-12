"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
    LayoutDashboard,
    Users,
    Settings,
    CreditCard,
    BarChart,
    LogOut,
    Menu,
    MapPin,
    Building2,
    Layers,
} from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const [isMobileOpen, setIsMobileOpen] = useState(false)

    const sidebarItems = [
        { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { name: "Donations", href: "/admin/donations", icon: CreditCard },
        { name: "Places", href: "/admin/places", icon: MapPin },
        { name: "Batches", href: "/admin/batches", icon: Layers },
        { name: "Units", href: "/admin/units", icon: Building2 },
        { name: "Reports", href: "/admin/reports", icon: BarChart },
        { name: "Slides", href: "/admin/slides", icon: Layers },
        { name: "Settings", href: "/admin/settings", icon: Settings },
    ]

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-[#115E59] text-white">
            <div className="flex h-20 items-center border-b border-teal-800 px-6">
                <Link href="/" className="flex items-center gap-3 font-semibold">
                    <div className="relative w-8 h-8">
                        <Image
                            src="/left_side.png"
                            alt="Logo"
                            fill
                            className="object-contain brightness-0 invert"
                        />
                    </div>
                    <span className="text-lg tracking-tight">Jariya Admin</span>
                </Link>
            </div>
            <div className="flex-1 overflow-auto py-6">
                <nav className="grid items-start px-4 text-sm font-medium space-y-1">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setIsMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all hover:text-white hover:bg-white/10",
                                pathname === item.href
                                    ? "bg-white/20 text-white shadow-sm"
                                    : "text-teal-100"
                            )}
                        >
                            <item.icon className="h-4 w-4" />
                            {item.name}
                        </Link>
                    ))}
                </nav>
            </div>
            <div className="mt-auto p-4 border-t border-teal-800">
                <button
                    onClick={async () => {
                        await fetch("/api/auth/logout", { method: "POST" });
                        window.location.href = "/login";
                    }}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-teal-100 transition-all hover:text-white hover:bg-white/10"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    )

    return (
        <div className="flex h-screen w-full bg-gray-50/50">
            {/* Desktop Sidebar */}
            <aside className="hidden w-64 flex-col border-r bg-[#115E59] md:flex shadow-xl z-20">
                <SidebarContent />
            </aside>

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <header className="flex h-16 items-center gap-4 border-b bg-white px-6 shadow-sm md:hidden">
                    <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-6 w-6 text-[#115E59]" />
                                <span className="sr-only">Toggle navigation menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 border-r-[#115E59] w-64 bg-[#115E59]">
                            <SidebarContent />
                        </SheetContent>
                    </Sheet>
                    <div className="flex items-center gap-2 font-semibold text-[#115E59]">
                        <div className="relative w-8 h-8">
                            <Image
                                src="/left_side.png"
                                alt="Logo"
                                fill
                                className="object-contain" // Keep original color on mobile header if desired, or invert. Let's keep original for white bg. 
                            />
                        </div>
                        <span>Jariya</span>
                    </div>
                </header>
                <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                    <div className="max-w-7xl mx-auto space-y-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
