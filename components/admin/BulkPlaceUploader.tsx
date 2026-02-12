"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Download } from "lucide-react"
import { toast } from "sonner"
import * as XLSX from "xlsx"

interface ParsedPlace {
    name: string
    type: string
    district: string
    section: string
}

export function BulkPlaceUploader() {
    const [isOpen, setIsOpen] = useState(false)
    const [parsedData, setParsedData] = useState<ParsedPlace[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadComplete, setUploadComplete] = useState(false)

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setIsParsing(true)
        setUploadComplete(false)

        try {
            const data = await file.arrayBuffer()
            const workbook = XLSX.read(data)
            const worksheet = workbook.Sheets[workbook.SheetNames[0]]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

            // Skip header row if present (simple check for "Name" in first row)
            const startIndex = jsonData[0]?.[0]?.toString().toLowerCase().includes("name") ? 1 : 0

            const places: ParsedPlace[] = jsonData.slice(startIndex).map((row) => ({
                name: row[0]?.toString().trim() || "",
                type: row[1]?.toString().trim() || "Panchayat",
                district: row[2]?.toString().trim() || "",
                section: row[3]?.toString().trim() || "Kerala"
            })).filter(p => p.name && p.district) // Filter out empty rows

            if (places.length === 0) {
                toast.error("No valid data found in file")
                return
            }

            setParsedData(places)
            toast.success(`Parsed ${places.length} rows successfully`)
        } catch (error) {
            console.error(error)
            toast.error("Failed to parse file")
        } finally {
            setIsParsing(false)
        }
    }

    const handleUpload = async () => {
        setIsUploading(true)
        try {
            const res = await fetch("/api/admin/places/bulk", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ places: parsedData }),
            })

            const data = await res.json()

            if (res.ok) {
                toast.success(`Successfully added ${data.count} places`)
                setUploadComplete(true)
                // Optional: clear data after success or keep for reference
            } else {
                toast.error(data.error || "Failed to upload places")
            }
        } catch (error) {
            console.error(error)
            toast.error("An error occurred during upload")
        } finally {
            setIsUploading(false)
        }
    }

    const downloadTemplate = () => {
        const ws = XLSX.utils.json_to_sheet([
            { Name: "Example Place", Type: "Panchayat", District: "Malappuram", Section: "Kerala" },
            { Name: "Another Place", Type: "Municipality", District: "Kozhikode", Section: "Kerala" }
        ])
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, "Template")
        XLSX.writeFile(wb, "places_template.xlsx")
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (!open) {
                setParsedData([])
                setUploadComplete(false)
            }
        }}>
            <DialogTrigger asChild>
                <Button className="bg-[#115E59] hover:bg-[#0f504c] text-white">
                    <Upload className="mr-2 h-4 w-4" /> Import Places Bulk
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Bulk Import Places</DialogTitle>
                    <DialogDescription>
                        Upload an Excel or CSV file to add multiple places at once.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-4 py-4 flex-1 overflow-hidden">
                    {!parsedData.length ? (
                        <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-10 bg-gray-50 text-center gap-4">
                            <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                            <div className="text-sm text-muted-foreground">
                                <p>Drag and drop your file here, or click to browse.</p>
                                <p className="text-xs mt-1">Supports .xlsx, .xls, .csv</p>
                            </div>
                            <Input
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                id="file-upload"
                                onChange={handleFileUpload}
                                disabled={isParsing}
                            />
                            <Label htmlFor="file-upload" className="cursor-pointer">
                                <Button variant="secondary" asChild disabled={isParsing}>
                                    <span>
                                        {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                        Select File
                                    </span>
                                </Button>
                            </Label>
                            <Button variant="link" size="sm" onClick={downloadTemplate} className="text-[#115E59]">
                                <Download className="mr-2 h-4 w-4" /> Download Template
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col flex-1 overflow-hidden gap-4">
                            <div className="flex items-center justify-between">
                                <div className="text-sm font-medium">
                                    Previewing {parsedData.length} records
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setParsedData([])} disabled={isUploading || uploadComplete}>
                                    Reset
                                </Button>
                            </div>

                            <div className="border rounded-md overflow-auto flex-1">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-white">
                                        <TableRow>
                                            <TableHead>No.</TableHead>
                                            <TableHead>Place Name</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>District</TableHead>
                                            <TableHead>Section</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {parsedData.map((row, i) => (
                                            <TableRow key={i}>
                                                <TableCell className="text-muted-foreground text-xs">{i + 1}</TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.name}
                                                        onChange={(e) => {
                                                            const newData = [...parsedData]
                                                            newData[i].name = e.target.value
                                                            setParsedData(newData)
                                                        }}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.type}
                                                        onChange={(e) => {
                                                            const newData = [...parsedData]
                                                            newData[i].type = e.target.value
                                                            setParsedData(newData)
                                                        }}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.district}
                                                        onChange={(e) => {
                                                            const newData = [...parsedData]
                                                            newData[i].district = e.target.value
                                                            setParsedData(newData)
                                                        }}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        value={row.section}
                                                        onChange={(e) => {
                                                            const newData = [...parsedData]
                                                            newData[i].section = e.target.value
                                                            setParsedData(newData)
                                                        }}
                                                        className="h-8"
                                                    />
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            {uploadComplete && (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-md border border-green-200">
                                    <CheckCircle2 className="h-5 w-5" />
                                    <span className="text-sm font-medium">Upload completed successfully!</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    {parsedData.length > 0 && !uploadComplete && (
                        <Button
                            onClick={handleUpload}
                            disabled={isUploading}
                            className="bg-[#115E59] hover:bg-[#0f504c] text-white w-full sm:w-auto"
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Import {parsedData.length} Places
                                </>
                            )}
                        </Button>
                    )}
                    {uploadComplete && (
                        <Button onClick={() => setIsOpen(false)}>Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
