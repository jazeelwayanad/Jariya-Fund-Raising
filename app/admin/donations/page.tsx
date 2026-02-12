"use client"

import { useState, useEffect } from "react"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { MoreHorizontal, Check, X, Trash, Loader2, Download, Plus, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { ViewReceiptDialog } from "@/components/ViewReceiptDialog"

interface Donation {
    id: string
    transactionId: string | null
    amount: number
    name: string | null
    mobile: string | null
    paymentMethod: string
    paymentStatus: "PENDING" | "SUCCESS" | "FAILED"
    createdAt: string
    batch?: { id: string; name: string }
    unit?: { id: string; name: string }
    place?: { id: string; name: string }
}

interface Batch {
    id: string
    name: string
}

interface Unit {
    id: string
    name: string
    placeIds: string[]
}

interface Place {
    id: string
    name: string
    districtName: string
}

export default function AdminDonationsPage() {
    const [donations, setDonations] = useState<Donation[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("ALL")
    const [methodFilter, setMethodFilter] = useState<string>("ALL")
    const [batchFilter, setBatchFilter] = useState<string>("ALL")
    const [unitFilter, setUnitFilter] = useState<string>("ALL")
    const [placeFilter, setPlaceFilter] = useState<string>("ALL")

    // Manual Entry Data
    const [batches, setBatches] = useState<Batch[]>([])
    const [units, setUnits] = useState<Unit[]>([])
    const [places, setPlaces] = useState<Place[]>([])
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [newDonation, setNewDonation] = useState({
        amount: "",
        name: "",
        mobile: "",
        paymentMethod: "CASH",
        transactionId: "",
        batchId: "none",
        unitId: "none",
        placeId: "none",
    })
    const [submitting, setSubmitting] = useState(false)

    // Receipt View
    const [viewReceiptOpen, setViewReceiptOpen] = useState(false)
    const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
    const [settings, setSettings] = useState<any>(null)

    useEffect(() => {
        fetchDonations()
        fetchMetadata()
    }, [])

    const fetchDonations = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/donations")
            if (res.ok) {
                const data = await res.json()
                setDonations(data)
            } else {
                toast.error("Failed to fetch donations")
            }
        } catch (error) {
            console.error(error)
            toast.error("Error loading donations")
        } finally {
            setLoading(false)
        }
    }

    const fetchMetadata = async () => {
        try {
            // Fetch Batches
            const batchRes = await fetch("/api/admin/batches")
            if (batchRes.ok) setBatches(await batchRes.json())

            // Fetch Units
            const unitRes = await fetch("/api/admin/units")
            if (unitRes.ok) setUnits(await unitRes.json())

            // Fetch Places and flatten
            const placeRes = await fetch("/api/admin/places")
            if (placeRes.ok) {
                const sections = await placeRes.json()
                const flatPlaces: Place[] = []
                sections.forEach((section: any) => {
                    section.districts.forEach((district: any) => {
                        district.places.forEach((place: any) => {
                            flatPlaces.push({
                                id: place.id,
                                name: place.name,
                                districtName: district.name
                            })
                        })
                    })
                })
                setPlaces(flatPlaces)
            }

            // Fetch Settings for Receipt
            const settingsRes = await fetch("/api/admin/settings")
            if (settingsRes.ok) setSettings(await settingsRes.json())

        } catch (error) {
            console.error("Error fetching metadata:", error)
        }
    }

    const filteredDonations = donations.filter((d) => {
        const matchesSearch = (d.name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.transactionId?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
            (d.mobile || "").includes(searchQuery) ||
            (d.id.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (d.batch?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.unit?.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
            (d.place?.name || "").toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === "ALL" || d.paymentStatus === statusFilter
        const matchesMethod = methodFilter === "ALL" || d.paymentMethod === methodFilter
        const matchesBatch = batchFilter === "ALL" || (d.batch?.id === batchFilter)

        // Match explicit Unit ID OR if the donation's Place is part of the selected Unit
        const matchesUnit = unitFilter === "ALL" ||
            (d.unit?.id === unitFilter) ||
            (d.place?.id ? units.find(u => u.id === unitFilter)?.placeIds.includes(d.place.id) : false)

        const matchesPlace = placeFilter === "ALL" || (d.place?.id === placeFilter)

        return matchesSearch && matchesStatus && matchesMethod && matchesBatch && matchesUnit && matchesPlace
    })


    const handleStatusChange = async (id: string, newStatus: string) => {
        try {
            const res = await fetch(`/api/admin/donations/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })
            if (res.ok) {
                toast.success(`Donation status updated to ${newStatus}`)
                fetchDonations()
            } else {
                const data = await res.json()
                toast.error(data.error || 'Failed to update status')
            }
        } catch (error) {
            console.error(error)
            toast.error('Error updating donation status')
        }
    }

    const handleCreateDonation = async () => {
        if (!newDonation.amount || !newDonation.paymentMethod) {
            toast.error("Amount and Payment Method are required")
            return
        }

        setSubmitting(true)
        try {
            const payload = {
                ...newDonation,
                batchId: newDonation.batchId === "none" ? undefined : newDonation.batchId,
                unitId: newDonation.unitId === "none" ? undefined : newDonation.unitId,
                placeId: newDonation.placeId === "none" ? undefined : newDonation.placeId,
            }

            const res = await fetch("/api/admin/donations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (res.ok) {
                toast.success("Donation added successfully")
                setIsAddDialogOpen(false)
                setNewDonation({
                    amount: "",
                    name: "",
                    mobile: "",
                    paymentMethod: "CASH",
                    transactionId: "",
                    batchId: "none",
                    unitId: "none",
                    placeId: "none",
                })
                fetchDonations()
            } else {
                const data = await res.json()
                toast.error(data.error || "Failed to add donation")
            }
        } catch (error) {
            console.error("Error adding donation:", error)
            toast.error("Failed to add donation")
        } finally {
            setSubmitting(false)
        }
    }

    const handleExportCSV = () => {
        const headers = ["ID", "Date", "Name", "Mobile", "Amount", "Method", "Transaction ID", "Status", "Batch", "Unit", "Place"]
        const csvContent = [
            headers.join(","),
            ...filteredDonations.map(d => [
                d.id,
                new Date(d.createdAt).toLocaleDateString(),
                `"${d.name || ""}"`,
                d.mobile || "",
                d.amount,
                d.paymentMethod,
                d.transactionId || "",
                d.paymentStatus,
                d.batch?.name || "",
                d.unit?.name || "",
                d.place?.name || ""
            ].join(","))
        ].join("\n")

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `donations_export_${new Date().toISOString().split('T')[0]}.csv`)
            link.style.visibility = 'hidden'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Donations</h1>
                    <p className="text-muted-foreground text-sm mt-1">View, filter and manage donation transactions.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleExportCSV}>
                        <Download className="mr-2 h-4 w-4" />
                        Export CSV
                    </Button>
                    <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Add Donation
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Add Manual Donation</DialogTitle>
                                <DialogDescription>
                                    Enter details for a manual donation entry.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="amount">Amount (₹) *</Label>
                                        <Input
                                            id="amount"
                                            type="number"
                                            placeholder="0.00"
                                            value={newDonation.amount}
                                            onChange={(e) => setNewDonation({ ...newDonation, amount: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="method">Payment Method *</Label>
                                        <Select
                                            value={newDonation.paymentMethod}
                                            onValueChange={(val) => setNewDonation({ ...newDonation, paymentMethod: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select method" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="CASH">Cash</SelectItem>
                                                <SelectItem value="UPI">UPI</SelectItem>
                                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                                <SelectItem value="QR">QR Code</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">Donor Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Name"
                                        value={newDonation.name}
                                        onChange={(e) => setNewDonation({ ...newDonation, name: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="mobile">Mobile Number</Label>
                                        <Input
                                            id="mobile"
                                            placeholder="Mobile"
                                            value={newDonation.mobile}
                                            onChange={(e) => setNewDonation({ ...newDonation, mobile: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="txnId">Transaction ID</Label>
                                        <Input
                                            id="txnId"
                                            placeholder="Optional"
                                            value={newDonation.transactionId}
                                            onChange={(e) => setNewDonation({ ...newDonation, transactionId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="batch">Batch</Label>
                                    <Select
                                        value={newDonation.batchId}
                                        onValueChange={(val) => setNewDonation({ ...newDonation, batchId: val })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Batch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">None</SelectItem>
                                            {batches.map((batch) => (
                                                <SelectItem key={batch.id} value={batch.id}>
                                                    {batch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="unit">Unit</Label>
                                        <Select
                                            value={newDonation.unitId}
                                            onValueChange={(val) => setNewDonation({ ...newDonation, unitId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Unit" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {units.map((unit) => (
                                                    <SelectItem key={unit.id} value={unit.id}>
                                                        {unit.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="place">Place</Label>
                                        <Select
                                            value={newDonation.placeId}
                                            onValueChange={(val) => setNewDonation({ ...newDonation, placeId: val })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select Place" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">None</SelectItem>
                                                {places.map((place) => (
                                                    <SelectItem key={place.id} value={place.id}>
                                                        {place.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
                                <Button onClick={handleCreateDonation} disabled={submitting}>
                                    {submitting ? "Adding..." : "Add Donation"}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 bg-gray-50/50 p-4 rounded-lg border">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, ID or Transaction ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 bg-white"
                    />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[130px] bg-white">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Status</SelectItem>
                        <SelectItem value="SUCCESS">Success</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Payment Method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Methods</SelectItem>
                        <SelectItem value="UPI">UPI</SelectItem>
                        <SelectItem value="QR">QR Code</SelectItem>
                        <SelectItem value="RAZORPAY">Razorpay</SelectItem>
                        <SelectItem value="CASH">Cash</SelectItem>
                        <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={batchFilter} onValueChange={setBatchFilter}>
                    <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Batch" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Batches</SelectItem>
                        {batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                                {batch.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={unitFilter} onValueChange={setUnitFilter}>
                    <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Unit" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Units</SelectItem>
                        {units.map((unit) => {
                            const unitPlaces = unit.placeIds?.map(pid => places.find(p => p.id === pid)?.name).filter(Boolean).join(", ")
                            return (
                                <SelectItem key={unit.id} value={unit.id}>
                                    {unit.name} {unitPlaces ? `(${unitPlaces})` : ""}
                                </SelectItem>
                            )
                        })}
                    </SelectContent>
                </Select>

                <Select value={placeFilter} onValueChange={setPlaceFilter}>
                    <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="Place" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ALL">All Places</SelectItem>
                        {places.map((place) => (
                            <SelectItem key={place.id} value={place.id}>
                                {place.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Donor</TableHead>
                            <TableHead>Batch / Unit</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredDonations.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No donations found matching criteria.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredDonations.map((donation) => (
                                <TableRow key={donation.id}>
                                    <TableCell className="font-medium text-xs font-mono text-muted-foreground">
                                        {donation.id.substring(0, 8)}...
                                    </TableCell>
                                    <TableCell className="text-sm">
                                        {new Date(donation.createdAt).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="font-medium">{donation.name || "Anonymous"}</span>
                                            {donation.mobile && <span className="text-xs text-muted-foreground">{donation.mobile}</span>}
                                            {donation.place && <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <span className="w-1 h-1 rounded-full bg-slate-400"></span>
                                                {donation.place.name}
                                            </span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col text-xs">
                                            {donation.batch ? (
                                                <span className="font-medium inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                                                    {donation.batch.name}
                                                </span>
                                            ) : <span className="text-muted-foreground italic">No Batch</span>}
                                            {donation.unit && <span className="text-muted-foreground mt-0.5">{donation.unit.name}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm">{donation.paymentMethod}</span>
                                            {donation.transactionId && <span className="text-[10px] text-muted-foreground font-mono">{donation.transactionId}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-bold text-base">₹{donation.amount.toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                donation.paymentStatus === "SUCCESS"
                                                    ? "default"
                                                    : donation.paymentStatus === "PENDING"
                                                        ? "outline"
                                                        : "destructive"
                                            }
                                            className={
                                                donation.paymentStatus === "SUCCESS"
                                                    ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shdow-none"
                                                    : donation.paymentStatus === "PENDING"
                                                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                                                        : "bg-red-100 text-red-700 hover:bg-red-100 border-red-200"
                                            }
                                        >
                                            {donation.paymentStatus}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" className="h-8 w-8 p-0">
                                                    <span className="sr-only">Open menu</span>
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(donation.id)}>
                                                    Copy ID
                                                </DropdownMenuItem>

                                                <DropdownMenuItem onClick={() => {
                                                    setSelectedDonation(donation)
                                                    setViewReceiptOpen(true)
                                                }}>
                                                    <FileText className="mr-2 h-4 w-4" />
                                                    View Receipt
                                                </DropdownMenuItem>

                                                <DropdownMenuSeparator />

                                                <DropdownMenuItem onClick={() => handleStatusChange(donation.id, "SUCCESS")}>
                                                    <Check className="mr-2 h-4 w-4 text-green-600" /> Verify / Approve
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusChange(donation.id, "PENDING")}>
                                                    <Loader2 className="mr-2 h-4 w-4 text-yellow-600" /> Mark Pending
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleStatusChange(donation.id, "FAILED")}>
                                                    <X className="mr-2 h-4 w-4" /> Reject
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Receipt Dialog */}
            <ViewReceiptDialog
                open={viewReceiptOpen}
                onOpenChange={setViewReceiptOpen}
                donation={selectedDonation}
                settings={settings}
            />
        </div>
    )
}
