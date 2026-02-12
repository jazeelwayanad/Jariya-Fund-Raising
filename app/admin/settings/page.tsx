"use strict";
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ReceiptEditor } from "@/components/ReceiptEditor";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { BulkPlaceUploader } from "@/components/admin/BulkPlaceUploader";

export default function AdminSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState({
        campaignTitle: "",
        campaignStatus: "ACTIVE",
        bannerImage: "",
        upiId: "",
        razorpayKeyId: "",
        razorpayKeySecret: "",
        receiptImage: "",
        receiptConfig: {
            name: { x: 50, y: 50, fontSize: 20, color: "#000000" },
            amount: { x: 50, y: 100, fontSize: 20, color: "#000000" },
            date: { x: 50, y: 150, fontSize: 20, color: "#000000" },
        },
    });

    const [isEditorOpen, setIsEditorOpen] = useState(false);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch("/api/admin/settings");
                if (response.ok) {
                    const data = await response.json();
                    setSettings({
                        campaignTitle: data.campaignTitle || "",
                        campaignStatus: data.campaignStatus || "ACTIVE",
                        bannerImage: data.bannerImage || "",
                        upiId: data.upiId || "",
                        razorpayKeyId: data.razorpayKeyId || "",
                        razorpayKeySecret: data.razorpayKeySecret || "",
                        receiptImage: data.receiptImage || "",
                        receiptConfig: data.receiptConfig || {
                            name: { x: 50, y: 50, fontSize: 20, color: "#000000" },
                            amount: { x: 50, y: 100, fontSize: 20, color: "#000000" },
                            date: { x: 50, y: 150, fontSize: 20, color: "#000000" },
                        },
                    });
                } else {
                    toast.error("Failed to load settings");
                }
            } catch (error) {
                console.error("Error loading settings:", error);
                toast.error("Error loading settings");
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setSettings((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSelectChange = (value: string) => {
        setSettings((prev) => ({
            ...prev,
            campaignStatus: value,
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch("/api/admin/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                toast.success("Settings saved successfully");
            } else {
                toast.error("Failed to save settings");
            }
        } catch (error) {
            console.error("Error saving settings:", error);
            toast.error("Error saving settings");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div>Loading settings...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Campaign Settings</h1>
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Bulk Data Management</CardTitle>
                        <CardDescription>
                            Import places and other data in bulk.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <BulkPlaceUploader />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>General Campaign Info</CardTitle>
                        <CardDescription>
                            Update the campaign title, status, and visual elements.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="campaignTitle">Campaign Title</Label>
                            <Input
                                id="campaignTitle"
                                value={settings.campaignTitle}
                                onChange={handleChange}
                                placeholder="Jariya Fundraising"
                            />
                        </div>

                        {/* Removed Campaign Status and Banner Image URL as per user request */}
                    </CardContent>
                </Card>

                {/* Payment Configuration removed as per user request */}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Receipt Configuration</CardTitle>
                    <CardDescription>
                        Upload a receipt template and configure text positioning.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-2">
                        <Label htmlFor="receiptImage">Receipt Template Image</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                id="receiptImage"
                                type="file"
                                accept="image/*"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const formData = new FormData();
                                        formData.append("file", file);
                                        try {
                                            const res = await fetch("/api/upload", {
                                                method: "POST",
                                                body: formData,
                                            });
                                            if (res.ok) {
                                                const data = await res.json();
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    receiptImage: data.url,
                                                }));
                                                toast.success("Image uploaded successfully");
                                                setIsEditorOpen(true);
                                            } else {
                                                toast.error("Failed to upload image");
                                            }
                                        } catch (error) {
                                            console.error("Upload error:", error);
                                            toast.error("Upload failed");
                                        }
                                    }
                                }}
                            />
                            {settings.receiptImage && (
                                <div className="relative h-20 w-20 overflow-hidden rounded border">
                                    <img
                                        src={settings.receiptImage}
                                        alt="Receipt Template"
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {settings.receiptImage && (
                        <div className="space-y-4">
                            <div className="flex justify-end">
                                <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline">Edit Receipt Configuration</Button>
                                    </DialogTrigger>
                                    <DialogContent className="!max-w-[98vw] !w-[98vw] !h-[95vh] max-h-[95vh] overflow-hidden p-0">
                                        <DialogHeader>
                                            <DialogTitle>Configure Receipt</DialogTitle>
                                            <DialogDescription>
                                                Drag the elements to position them on the receipt.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <ReceiptEditor
                                            imageUrl={settings.receiptImage}
                                            config={settings.receiptConfig as any}
                                            onSave={(newConfig) => {
                                                setSettings((prev) => ({
                                                    ...prev,
                                                    receiptConfig: newConfig,
                                                }));
                                                setIsEditorOpen(false);
                                                toast.success("Configuration updated. Dont forget to save changes!");
                                            }}
                                        />
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <div className="relative w-full overflow-hidden rounded border bg-gray-100" style={{ height: "300px" }}>
                                <img
                                    src={settings.receiptImage}
                                    alt="Preview"
                                    className="h-full w-full object-contain mx-auto w-[600px]"
                                />
                                {["name", "amount", "date"].map((field) => (
                                    <div
                                        key={field}
                                        className="absolute border border-dashed border-blue-500 bg-white/50 px-2 py-1 text-sm font-bold text-black transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                                        style={{
                                            left: `${settings.receiptConfig[field as keyof typeof settings.receiptConfig].x}%`,
                                            top: `${settings.receiptConfig[field as keyof typeof settings.receiptConfig].y}%`,
                                            fontSize: `${settings.receiptConfig[field as keyof typeof settings.receiptConfig].fontSize}px`,
                                            color: settings.receiptConfig[field as keyof typeof settings.receiptConfig].color,
                                        }}
                                    >
                                        {field.toUpperCase()}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

        </div>
    );
}
