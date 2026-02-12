"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#FFF9ED] text-gray-800 font-sans p-6">
            <div className="container mx-auto max-w-3xl">
                <Link href="/">
                    <Button variant="ghost" className="mb-6 hover:bg-transparent pl-0 text-gray-600">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
                    </Button>
                </Link>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                    <h1 className="text-3xl font-bold mb-8 text-[#115e59]">Terms of Service</h1>

                    <div className="space-y-6 text-gray-600 leading-relaxed">
                        <p className="text-sm text-gray-400 mb-4">Last Updated: February 2026</p>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Acceptance of Terms</h2>
                            <p>
                                By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">2. Donations</h2>
                            <p>
                                All donations made through this platform are voluntary. We ensure that all funds are utilized for the stated purposes of Sabeelul Hidaya Islamic College.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">3. User Conduct</h2>
                            <p>
                                Users agree to use the website only for lawful purposes and in a way that does not infringe the rights of, restrict or inhibit anyone else's use and enjoyment of the website.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Disclaimer</h2>
                            <p>
                                The materials on this website are provided on an 'as is' basis. Sabeelul Hidaya Islamic College makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
