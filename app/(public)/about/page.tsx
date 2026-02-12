"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#FFF9ED] text-gray-800 font-sans p-6">
            <div className="container mx-auto max-w-3xl">
                <Link href="/">
                    <Button variant="ghost" className="mb-6 hover:bg-transparent pl-0 text-gray-600">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Back to Home
                    </Button>
                </Link>

                {/* Header Logos */}
                <div className="flex justify-center items-center gap-8 mb-12">
                    <img src="/left_side.png" alt="Jariya Logo" className="h-20 w-auto object-contain" />
                    <img src="/right_side.png" alt="College Logo" className="h-20 w-auto object-contain" />
                </div>

                <div className="bg-white rounded-[2rem] p-8 shadow-sm">
                    <h1 className="text-3xl font-bold mb-6 text-[#115e59] text-center">About Us</h1>

                    <div className="space-y-6 text-gray-600 leading-relaxed">
                        <p className="text-lg font-medium text-center mb-8">
                            Jariya fundraising campaign by Sabeelul Hidaya Islamic College
                        </p>

                        <p>
                            Sabeelul Hidaya Islamic College is dedicated to providing quality education and fostering a community of learning and growth. Our "Jariya" campaign aims to support ongoing educational initiatives and infrastructure development.
                        </p>

                        <p>
                            Through this platform, we enable our community, alumni, and well-wishers to contribute seamlessly to our various causes. Your support helps us in our mission to nurture the next generation of leaders and scholars.
                        </p>

                        <div className="bg-[#FFF9ED] rounded-xl p-6 mt-8">
                            <h3 className="font-bold text-[#115e59] mb-2">Contact Us</h3>
                            <p className="mb-1">Sabeelul Hidaya Islamic College</p>
                            <p className="mb-1">Parappur, Kottakkal</p>
                            <p className="mb-1">Malappuram, Kerala - 676503</p>
                            <p>Email: admin@sabeelulhidaya.org</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
