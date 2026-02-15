"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
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
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Users, MoreHorizontal, Plus, Search, Pencil, Trash2, Loader2, UserPlus } from "lucide-react"
import { toast } from "sonner"

interface Coordinator {
    id: string
    name: string
    email: string
    username: string
    batchId: string
    batch?: {
        name: string
    }
}

interface Batch {
    id: string
    name: string
}

export default function CoordinatorsPage() {
    const [coordinators, setCoordinators] = useState<Coordinator[]>([])
    const [batches, setBatches] = useState<Batch[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    const [dialogOpen, setDialogOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [processing, setProcessing] = useState(false)

    // Form
    const [formName, setFormName] = useState("")
    const [formEmail, setFormEmail] = useState("")
    const [formUsername, setFormUsername] = useState("")
    const [formPassword, setFormPassword] = useState("")
    const [formBatchId, setFormBatchId] = useState("")

    useEffect(() => {
        const loadData = async () => {
            setLoading(true)
            await Promise.all([fetchCoordinators(), fetchBatches()])
            setLoading(false)
        }
        loadData()
    }, [])

    const fetchCoordinators = async () => {
        try {
            const res = await fetch("/api/admin/coordinators")
            if (res.ok) {
                const data = await res.json()
                setCoordinators(data)
            }
        } catch (error) {
            toast.error("Failed to load coordinators")
        }
    }

    const fetchBatches = async () => {
        try {
            const res = await fetch("/api/admin/batches")
            if (res.ok) {
                const data = await res.json()
                // Only active batches? Or all? Let's show all for now or filter if needed.
                // Assuming API returns all.
                setBatches(data.filter((b: any) => b.status === 'Active'))
            }
        } catch (error) {
            console.error("Failed to load batches")
        }
    }

    const handleSave = async () => {
        if (!formName || !formEmail || !formUsername || !formBatchId) {
            toast.error("Please fill all required fields")
            return
        }
        if (!editMode && !formPassword) {
            toast.error("Password is required for new coordinators")
            return
        }

        setProcessing(true)
        try {
            const payload: any = {
                name: formName,
                email: formEmail,
                username: formUsername,
                batchId: formBatchId,
            }
            if (formPassword) payload.password = formPassword

            if (editMode && editId) {
                const res = await fetch(`/api/admin/coordinators/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    fetchCoordinators()
                    toast.success("Coordinator updated")
                    setDialogOpen(false)
                    resetForm()
                } else {
                    const err = await res.json()
                    toast.error(err.error || "Failed to update")
                }
            } else {
                const res = await fetch("/api/admin/coordinators", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    fetchCoordinators()
                    toast.success("Coordinator created")
                    setDialogOpen(false)
                    resetForm()
                } else {
                    const err = await res.json()
                    toast.error(err.error || "Failed to create")
                }
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure? This will delete the coordinator account.")) return
        try {
            const res = await fetch(`/api/admin/coordinators/${id}`, { method: "DELETE" })
            if (res.ok) {
                setCoordinators(coordinators.filter(c => c.id !== id))
                toast.success("Coordinator deleted")
            } else {
                toast.error("Failed to delete")
            }
        } catch (error) {
            toast.error("Error deleting coordinator")
        }
    }

    const startEdit = (coord: Coordinator) => {
        setEditMode(true)
        setEditId(coord.id)
        setFormName(coord.name)
        setFormEmail(coord.email)
        setFormUsername(coord.username)
        setFormBatchId(coord.batchId)
        setFormPassword("") // Don't fill password
        setDialogOpen(true)
    }

    const resetForm = () => {
        setEditMode(false)
        setEditId(null)
        setFormName("")
        setFormEmail("")
        setFormUsername("")
        setFormPassword("")
        setFormBatchId("")
    }

    const filteredCoordinators = coordinators.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.batch?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Coordinators</h1>
                    <p className="text-muted-foreground">Manage batch coordinators and their access.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button className="bg-[#115E59] hover:bg-[#0f504c] text-white">
                            <Plus className="mr-2 h-4 w-4" /> Add Coordinator
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editMode ? "Edit Coordinator" : "Add Coordinator"}</DialogTitle>
                            <DialogDescription>
                                Create an account for a batch coordinator.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" placeholder="John Doe" value={formName} onChange={(e) => setFormName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="john@example.com" value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="username">Username</Label>
                                    <Input id="username" placeholder="johndoe" value={formUsername} onChange={(e) => setFormUsername(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="batch">Assigned Batch</Label>
                                <Select value={formBatchId} onValueChange={setFormBatchId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Batch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {batches.map(b => (
                                            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="password">{editMode ? "New Password (Optional)" : "Password"}</Label>
                                <PasswordInput id="password" placeholder="••••••••" value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} disabled={processing} className="bg-[#115E59] hover:bg-[#0f504c] text-white">
                                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {editMode ? "Save Changes" : "Create Account"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Coordinators</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{coordinators.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Assigned Batches</CardTitle>
                        <UserPlus className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{new Set(coordinators.map(c => c.batchId)).size}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search coordinators..."
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
                                <TableHead>Username / Email</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCoordinators.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No coordinators found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredCoordinators.map((coord) => (
                                    <TableRow key={coord.id}>
                                        <TableCell className="font-medium">{coord.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{coord.username}</span>
                                                <span className="text-xs text-muted-foreground">{coord.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {coord.batch ? (
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {coord.batch.name}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
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
                                                    <DropdownMenuItem onClick={() => startEdit(coord)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(coord.id)}>
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
