"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, MoreHorizontal, Plus, Search, Pencil, Trash2, Archive, Loader2 } from "lucide-react"
import { toast } from "sonner"

// --- Types ---
interface Batch {
    id: string
    name: string
    year: string
    status: "Active" | "Completed" | "Archived"
    totalAmount: number
    description?: string
}

export default function AdminBatchesPage() {
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    // Form state
    const [formName, setFormName] = useState("")
    const [formYear, setFormYear] = useState(new Date().getFullYear().toString())
    const [formDesc, setFormDesc] = useState("")
    const [formStatus, setFormStatus] = useState<Batch["status"]>("Active")

    useEffect(() => {
        fetchBatches()
    }, [])

    const fetchBatches = async () => {
        setLoading(true)
        try {
            const res = await fetch("/api/admin/batches")
            if (res.ok) {
                const data = await res.json()
                setBatches(data)
            } else {
                toast.error("Failed to load batches")
            }
        } catch (error) {
            console.error("Error fetching batches", error)
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formName || !formYear) return
        setProcessing(true)
        try {
            const payload = {
                name: formName,
                year: formYear,
                description: formDesc,
                status: formStatus
            }

            if (editMode && editId) {
                const res = await fetch(`/api/admin/batches/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    fetchBatches()
                    toast.success("Batch updated")
                } else toast.error("Failed to update batch")
            } else {
                const res = await fetch("/api/admin/batches", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    fetchBatches()
                    toast.success("Batch created")
                } else toast.error("Failed to create batch")
            }
            setDialogOpen(false)
            resetForm()
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the batch.")) return
        try {
            const res = await fetch(`/api/admin/batches/${id}`, { method: "DELETE" })
            if (res.ok) {
                setBatches(batches.filter(b => b.id !== id))
                toast.success("Batch deleted")
            } else toast.error("Failed to delete batch")
        } catch (error) {
            toast.error("Error deleting batch")
        }
    }

    const startEdit = (batch: Batch) => {
        setEditMode(true)
        setEditId(batch.id)
        setFormName(batch.name)
        setFormYear(batch.year)
        setFormDesc(batch.description || "")
        setFormStatus(batch.status)
        setDialogOpen(true)
    }

    const resetForm = () => {
        setEditMode(false)
        setEditId(null)
        setFormName("")
        setFormYear(new Date().getFullYear().toString())
        setFormDesc("")
        setFormStatus("Active")
    }

    const filteredBatches = batches.filter(batch =>
        batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.year.includes(searchQuery)
    )

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Batches</h1>
                    <p className="text-muted-foreground">Manage fundraising batches/campaigns.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Create Batch
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editMode ? "Edit Batch" : "Create New Batch"}</DialogTitle>
                            <DialogDescription>
                                Set up a new collection period or campaign.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Batch Name</Label>
                                    <Input id="name" placeholder="e.g. Ramadan 2024" value={formName} onChange={(e) => setFormName(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="year">Year</Label>
                                    <Input id="year" placeholder="2024" value={formYear} onChange={(e) => setFormYear(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea id="description" placeholder="Optional details..." value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="status">Status</Label>
                                    <Select value={formStatus} onValueChange={(v: "Active" | "Completed" | "Archived") => setFormStatus(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">Active</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Archived">Archived</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Batch</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batches.filter(b => b.status === "Active").length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                        <Archive className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{batches.length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search batches..."
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Year</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Total Raised</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredBatches.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        No batches found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredBatches.map((batch) => (
                                    <TableRow key={batch.id}>
                                        <TableCell className="font-medium">{batch.name}</TableCell>
                                        <TableCell>{batch.year}</TableCell>
                                        <TableCell>
                                            <Badge variant={batch.status === "Active" ? "default" : "secondary"}>
                                                {batch.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">₹{batch.totalAmount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <span className="sr-only">Open menu</span>
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => startEdit(batch)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(batch.id)}>
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
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
            </div>
        </div>
    )
}
