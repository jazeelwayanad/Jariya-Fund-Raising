"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                toast.error(data.error || "Login failed");
                return;
            }

            toast.success("Login successful");
            router.push("/admin");
        } catch (error: any) {
            toast.error(error.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
            {/* Left Side - Branding (Hidden on mobile) */}
            <div className="hidden lg:flex flex-col justify-center items-center bg-[#115E59] p-10 text-white relative overflow-hidden">
                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-[#1A6D66] opacity-50 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#0D4B47] opacity-50 blur-3xl"></div>

                <div className="relative z-10 flex flex-col items-center text-center space-y-6 max-w-lg">
                    {/* Whitened Logo */}
                    <div className="relative w-55 h-55 mb-[-30px]">
                        <Image
                            src="/left_side.png"
                            alt="Jariya Logo"
                            fill
                            className="object-contain brightness-0 invert"
                            priority
                        />
                    </div>

                    <div className="space-y-4">
                        <h1 className="text-5xl font-bold tracking-tight">Jariya Fundraising</h1>
                        <p className="text-xl text-teal-100 font-medium tracking-wide">
                            Sabeelul Hidaya Islamic College
                        </p>
                    </div>

                    <div className="pt-8">
                        <blockquote className="text-lg italic text-teal-50/90 max-w-sm mx-auto">
                            &ldquo;Empowering our community through transparent and efficient fundraising management.&rdquo;
                        </blockquote>
                    </div>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
                <div className="w-full max-w-md space-y-8">
                    {/* Logos Header */}
                    <div className="flex justify-center items-center gap-6 mb-8">
                        <div className="relative w-30 h-30 mb-[-5px]">
                            <Image
                                src="/left_side.png"
                                alt="Jariya Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <div className="h-8 w-[1px] bg-gray-200"></div>
                        <div className="relative w-30 h-30 mb-[-5px]">
                            <Image
                                src="/right_side.png"
                                alt="College Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                            Welcome back
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            Please sign in to your account
                        </p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                        <div className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    placeholder="admin@jariya.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-11 border-gray-200 focus-visible:ring-[#115E59] focus-visible:ring-offset-0"
                                />
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-700">Password</Label>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-11 border-gray-200 focus-visible:ring-[#115E59] focus-visible:ring-offset-0"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-[#115E59] hover:bg-[#0f504c] text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign in <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </Button>
                    </form>

                    <p className="text-center text-xs text-gray-400 mt-6">
                        © {new Date().getFullYear()} Jariya Campaign via Sabeelul Hidaya Islamic College
                    </p>
                </div>
            </div>
        </div>
    );
}
