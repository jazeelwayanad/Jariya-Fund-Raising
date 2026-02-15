'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from 'next/link';

export default function CoordinatorProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '', // Only for updating
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/profile');
            if (res.ok) {
                const data = await res.json();
                setFormData({
                    name: data.name || '',
                    username: data.username || '',
                    email: data.email || '',
                    password: '',
                });
            } else {
                toast.error("Failed to load profile");
            }
        } catch (error) {
            toast.error("Error loading profile");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch('/api/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success("Profile updated successfully");
                setFormData(prev => ({ ...prev, password: '' }));
            } else {
                const error = await res.json();
                toast.error(error.error || "Failed to update profile");
            }
        } catch (error) {
            toast.error("Error updating profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#FFF9ED] flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#115E59]" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FFF9ED] font-sans relative pb-20">
            {/* Header */}
            <div className="container px-6 pt-10 pb-6 flex items-center justify-between">
                <Link href="/coordinator/dashboard">
                    <Button size="sm" className="rounded-full bg-[#8B4513] hover:bg-[#723a10] text-white px-5 h-9 text-xs font-semibold shadow-sm">
                        <ArrowLeft className="w-3 h-3 mr-1" /> Back
                    </Button>
                </Link>
                <div className="text-right">
                    <h1 className="text-xl font-bold text-black tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>My Profile</h1>
                    <p className="text-xs text-[#115E59] font-bold">Edit Details</p>
                </div>
            </div>

            <div className="container px-4 mt-2 mb-10 max-w-lg mx-auto space-y-6">
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 space-y-6">
                    <form onSubmit={handleSave} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700 font-medium text-xs">Full Name</Label>
                            <Input
                                id="name"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-12 border-[#115E59] rounded-xl bg-white px-4 text-gray-800 shadow-none focus-visible:ring-2 focus-visible:ring-[#115E59]"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-700 font-medium text-xs">Username</Label>
                            <Input
                                id="username"
                                value={formData.username}
                                onChange={e => setFormData({ ...formData, username: e.target.value })}
                                className="h-12 border-[#115E59] rounded-xl bg-white px-4 text-gray-800 shadow-none focus-visible:ring-2 focus-visible:ring-[#115E59]"
                                placeholder="Optional"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 font-medium text-xs">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="h-12 border-[#115E59] rounded-xl bg-white px-4 text-gray-800 shadow-none focus-visible:ring-2 focus-visible:ring-[#115E59]"
                                required
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h3 className="text-sm font-semibold mb-4 text-[#8B4513]">Change Password</h3>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-700 font-medium text-xs">New Password</Label>
                                <PasswordInput
                                    id="password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    className="h-12 border-[#115E59] rounded-xl bg-white px-4 text-gray-800 shadow-none focus-visible:ring-2 focus-visible:ring-[#115E59]"
                                    placeholder="Leave empty to keep current"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <Button type="submit" disabled={saving} className="w-full h-12 text-lg font-bold rounded-[1.25rem] bg-[#115E59] hover:bg-[#0d4a46] mt-4 shadow-lg text-white">
                            {saving ? <Loader2 className="animate-spin" /> : "Save Changes"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
