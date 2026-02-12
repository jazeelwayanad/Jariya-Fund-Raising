"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#FFF9ED] text-gray-800 font-sans p-6">
            <div className="container mx-auto max-w-3xl">
                <Link href="/">
                    <Button variant="ghost" className="mb-6 hover:bg-transparent pl-0 text-gray-600">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
                    </Button>
                </Link>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                    <h1 className="text-3xl font-bold mb-8 text-[#115e59]">Privacy Policy</h1>

                    <div className="space-y-6 text-gray-600 leading-relaxed">
                        <p className="text-sm text-gray-400 mb-4">Last Updated: February 2026</p>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">1. Information We Collect</h2>
                            <p>
                                We collect information you provide directly to us when you make a donation, including your name, contact information, and payment details.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Your Information</h2>
                            <p>
                                We use the information we collect to process your donations, communicate with you, and improve our services. We do not sell or share your personal information with third parties for marketing purposes.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">3. Security</h2>
                            <p>
                                We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-gray-800 mb-3">4. Updates to Policy</h2>
                            <p>
                                We may update this privacy policy from time to time. The updated version will be indicated by an updated "Revised" date and the updated version will be effective as soon as it is accessible.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
