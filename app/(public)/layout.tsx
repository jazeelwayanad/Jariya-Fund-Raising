
"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Link } from "lucide-react"

export default function PublicLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 2500)
        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
                <div className="animate-in fade-in zoom-in duration-500">
                    <div className="relative w-40 h-40 md:w-56 md:h-56">
                        <Image
                            src="/loading_logo.png"
                            alt="Loading Logo"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
                <div className="absolute bottom-8 text-center space-y-1">
                    <p className="text-sm font-semibold text-[#115E59]">
                        © Sabeelul Hidaya Islamic College
                    </p>
                    <p className="text-xs text-muted-foreground">
                        Developed by <Link href="https://jazeelwayanad.me" target="_blank" className="hover:text-[#115e59] cursor-pointer">Jazeel Wayanad</Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="relative flex min-h-screen flex-col bg-background max-w-[520px] mx-auto shadow-2xl border-x">
            <main className="flex-1">{children}</main>
        </div>
    )
}
