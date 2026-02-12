"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Move, Type, Calendar, DollarSign, Save } from "lucide-react";

interface Config {
    x: number;
    y: number;
    fontSize: number;
    color: string;
}

interface ReceiptConfig {
    name: Config;
    amount: Config;
    date: Config;
}

interface ReceiptEditorProps {
    imageUrl: string;
    config: ReceiptConfig;
    onSave: (newConfig: ReceiptConfig) => void;
}

const PRESET_COLORS = [
    "#000000", // Black
    "#FFFFFF", // White
    "#1F2937", // Gray-800
    "#EF4444", // Red-500
    "#3B82F6", // Blue-500
    "#10B981", // Emerald-500
    "#F59E0B", // Amber-500
];

export function ReceiptEditor({ imageUrl, config, onSave }: ReceiptEditorProps) {
    const [localConfig, setLocalConfig] = useState<ReceiptConfig>(config);
    const [dragging, setDragging] = useState<string | null>(null);
    const [selectedField, setSelectedField] = useState<string | null>("name");
    const [previewMode, setPreviewMode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Initialize with config prop
    useEffect(() => {
        setLocalConfig(config);
    }, [config]);

    // Window-based drag handling
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragging || !containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();

            // Calculate position relative to container
            let x = e.clientX - containerRect.left;
            let y = e.clientY - containerRect.top;

            // Convert to percentage
            let xPercent = (x / containerRect.width) * 100;
            let yPercent = (y / containerRect.height) * 100;

            // Clamp values
            xPercent = Math.max(0, Math.min(100, xPercent));
            yPercent = Math.max(0, Math.min(100, yPercent));

            updateConfig(dragging, {
                x: Number(xPercent.toFixed(2)),
                y: Number(yPercent.toFixed(2))
            });
        };

        const handleMouseUp = () => {
            setDragging(null);
        };

        if (dragging) {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        }

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [dragging]);

    const updateConfig = (field: string, updates: Partial<Config>) => {
        setLocalConfig((prev) => ({
            ...prev,
            [field]: { ...prev[field as keyof ReceiptConfig], ...updates }
        }));
    };

    const handleMouseDown = (e: React.MouseEvent, field: string) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(field);
        setSelectedField(field);
    };

    const getPreviewText = (field: string) => {
        switch (field) {
            case "name": return "John Doe";
            case "amount": return "₹ 5,000";
            case "date": return "12 Oct 2023";
            default: return field.toUpperCase();
        }
    };

    const getIconForField = (field: string) => {
        switch (field) {
            case "name": return <Type className="h-4 w-4" />;
            case "amount": return <DollarSign className="h-4 w-4" />;
            case "date": return <Calendar className="h-4 w-4" />;
            default: return <Move className="h-4 w-4" />;
        }
    };

    return (
        <div className="flex flex-col md:flex-row gap-8 h-[calc(95vh-4rem)]">
            {/* Canvas Area - Left/Top */}
            <div className="flex-1 bg-neutral-100/50 rounded-xl border flex flex-col overflow-hidden relative group shadow-inner">
                {/* Dot Pattern Background */}
                <div className="absolute inset-0 opacity-[0.4]" style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '20px 20px'
                }}></div>

                {/* Toolbar overlay */}
                <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm border opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-2 group-hover:translate-y-0">
                    <div className="flex items-center gap-2 px-3 py-1">
                        <Label htmlFor="preview-mode" className="text-xs font-medium cursor-pointer select-none">Preview Mode</Label>
                        <Switch id="preview-mode" checked={previewMode} onCheckedChange={setPreviewMode} className="scale-75 origin-right" />
                    </div>
                </div>

                <div className="flex-1 overflow-auto flex items-center justify-center p-8 relative" onClick={() => setSelectedField(null)}>
                    <div
                        ref={containerRef}
                        className="relative w-full max-w-lg shadow-2xl rounded-sm overflow-hidden select-none bg-white transition-all duration-300 ease-in-out ring-1 ring-black/5"
                        style={{ cursor: dragging ? "grabbing" : "default" }}
                    >
                        <img
                            src={imageUrl}
                            alt="Receipt Template"
                            className="w-full h-auto pointer-events-none block"
                        />

                        {["name", "amount", "date"].map((field) => {
                            const cfg = localConfig[field as keyof ReceiptConfig];
                            const isSelected = selectedField === field;

                            return (
                                <div
                                    key={field}
                                    className={`absolute flex items-center justify-center whitespace-nowrap transition-all duration-150 ease-out
                                        ${!previewMode
                                            ? "cursor-grab hover:bg-primary/5"
                                            : ""
                                        }
                                        ${!previewMode && isSelected
                                            ? "ring-[1.5px] ring-primary z-10"
                                            : !previewMode
                                                ? "ring-1 ring-dashed ring-slate-300 bg-white/40 hover:ring-primary/50"
                                                : ""
                                        }
                                    `}
                                    style={{
                                        left: `${cfg.x}%`,
                                        top: `${cfg.y}%`,
                                        transform: "translate(-50%, -50%)",
                                        fontSize: `${cfg.fontSize}px`,
                                        color: cfg.color,
                                        pointerEvents: previewMode ? "none" : "auto",
                                        fontWeight: 600,
                                        padding: previewMode ? 0 : '4px 8px',
                                        borderRadius: '4px',
                                    }}
                                    onMouseDown={(e) => handleMouseDown(e, field)}
                                >
                                    {previewMode ? getPreviewText(field) : field.toUpperCase()}

                                    {/* Clean Resize Handles (Figma Style) */}
                                    {!previewMode && isSelected && (
                                        <>
                                            <div className="absolute -top-[5px] -left-[5px] w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm"></div>
                                            <div className="absolute -top-[5px] -right-[5px] w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm"></div>
                                            <div className="absolute -bottom-[5px] -left-[5px] w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm"></div>
                                            <div className="absolute -bottom-[5px] -right-[5px] w-2.5 h-2.5 bg-white border-[1.5px] border-primary rounded-full shadow-sm"></div>
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="h-10 border-t bg-white/80 backdrop-blur flex items-center justify-between px-4 text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    <span>{imageUrl.split('/').pop()}</span>
                    <span>{Math.round(localConfig.name.x * 10) / 10}%, {Math.round(localConfig.name.y * 10) / 10}%</span>
                </div>
            </div>

            {/* Inspector Panel - Right/Bottom */}
            <div className="w-full md:w-80 flex flex-col gap-4">
                <Card className="flex-1 flex flex-col border-none shadow-none md:border md:shadow-sm">
                    <div className="p-4 border-b bg-gray-50/30">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            Config Inspector
                        </h3>
                    </div>

                    <div className="p-4 flex-1 overflow-y-auto space-y-6">
                        {/* Layer Selection */}
                        <div className="space-y-3">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Layers</Label>
                            <div className="grid gap-2">
                                {["name", "amount", "date"].map((field) => (
                                    <button
                                        key={field}
                                        onClick={() => setSelectedField(field)}
                                        className={`flex items-center gap-3 w-full p-2.5 rounded-lg border text-sm transition-all duration-200 group
                                            ${selectedField === field
                                                ? "bg-primary/5 border-primary ring-1 ring-primary/20 text-primary font-medium"
                                                : "hover:bg-gray-50 border-transparent hover:border-gray-200 text-gray-600"
                                            }
                                        `}
                                    >
                                        <div className={`p-1.5 rounded-md transition-colors ${selectedField === field ? "bg-primary text-primary-foreground" : "bg-gray-100 text-gray-500 group-hover:text-gray-700"}`}>
                                            {getIconForField(field)}
                                        </div>
                                        <span className="capitalize">{field}</span>
                                        {selectedField === field && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedField && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-2 duration-300">
                                <div className="h-px bg-border" />

                                {/* Selected Field Settings */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                                            Properties
                                        </Label>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 text-[10px] px-2 text-muted-foreground hover:text-foreground"
                                            onClick={() => updateConfig(selectedField, { x: 50, y: 50 })}
                                        >
                                            Reset Pos
                                        </Button>
                                    </div>

                                    {/* Position Inputs Grouped */}
                                    <div className="grid grid-cols-2 gap-px bg-border rounded-md overflow-hidden border">
                                        <div className="bg-white p-2 flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground w-4 text-center font-mono">X</span>
                                            <Input
                                                type="number"
                                                min="0" max="100" step="0.1"
                                                value={localConfig[selectedField as keyof ReceiptConfig].x}
                                                onChange={(e) => updateConfig(selectedField, { x: parseFloat(e.target.value) || 0 })}
                                                className="h-7 border-none shadow-none focus-visible:ring-0 px-0 text-right font-mono"
                                            />
                                        </div>
                                        <div className="bg-white p-2 flex items-center gap-2">
                                            <span className="text-xs text-muted-foreground w-4 text-center font-mono">Y</span>
                                            <Input
                                                type="number"
                                                min="0" max="100" step="0.1"
                                                value={localConfig[selectedField as keyof ReceiptConfig].y}
                                                onChange={(e) => updateConfig(selectedField, { y: parseFloat(e.target.value) || 0 })}
                                                className="h-7 border-none shadow-none focus-visible:ring-0 px-0 text-right font-mono"
                                            />
                                        </div>
                                    </div>

                                    {/* Appearance Inputs */}
                                    <div className="space-y-4 pt-2">
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <Label className="text-xs">Font Size</Label>
                                                <span className="text-xs font-mono text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded">{localConfig[selectedField as keyof ReceiptConfig].fontSize}px</span>
                                            </div>
                                            <Slider
                                                value={[localConfig[selectedField as keyof ReceiptConfig].fontSize]}
                                                min={8}
                                                max={72}
                                                step={1}
                                                onValueChange={(vals) => updateConfig(selectedField, { fontSize: vals[0] })}
                                                className="py-1"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-xs">Color</Label>
                                            <div className="flex gap-2 mb-2">
                                                {PRESET_COLORS.map(color => (
                                                    <button
                                                        key={color}
                                                        className={`w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary ${localConfig[selectedField as keyof ReceiptConfig].color === color ? 'ring-2 ring-offset-1 ring-primary scale-110' : ''}`}
                                                        style={{ backgroundColor: color }}
                                                        onClick={() => updateConfig(selectedField, { color })}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <div className="relative w-9 h-9 rounded-md overflow-hidden border shadow-sm shrink-0">
                                                    <Input
                                                        type="color"
                                                        className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 border-none cursor-pointer"
                                                        value={localConfig[selectedField as keyof ReceiptConfig].color}
                                                        onChange={(e) => updateConfig(selectedField, { color: e.target.value })}
                                                    />
                                                </div>
                                                <Input
                                                    type="text"
                                                    className="flex-1 font-mono uppercase text-xs"
                                                    value={localConfig[selectedField as keyof ReceiptConfig].color}
                                                    onChange={(e) => updateConfig(selectedField, { color: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 border-t bg-gray-50/50">
                        <Button onClick={() => onSave(localConfig)} className="w-full gap-2 shadow-sm font-semibold h-10">
                            <Save className="h-4 w-4" /> Save Configuration
                        </Button>
                    </div>
                </Card>
            </div>
        </div>
    );
}
