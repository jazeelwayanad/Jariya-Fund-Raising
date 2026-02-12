"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Loader2, X, Check } from "lucide-react"
import { toast } from "sonner"

// --- Types ---
interface Unit {
    id: string
    name: string
    placeIds: string[]
    status: "Active" | "Inactive"
}

// Flat list for selection
interface PlaceOption {
    id: string
    name: string
    type: string
    districtName: string
}

export default function AdminUnitsPage() {
    const [units, setUnits] = useState<Unit[]>([])
    const [places, setPlaces] = useState<PlaceOption[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    // Dialog & Form
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [formName, setFormName] = useState("")
    const [selectedPlaces, setSelectedPlaces] = useState<string[]>([])
    const [formStatus, setFormStatus] = useState<"Active" | "Inactive">("Active")
    const [processing, setProcessing] = useState(false)

    // For multi-select search
    const [placeSearch, setPlaceSearch] = useState("")

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [unitsRes, placesRes] = await Promise.all([
                fetch("/api/admin/units"),
                fetch("/api/admin/panchayats") // Need a flattened list of places
            ])

            if (unitsRes.ok && placesRes.ok) {
                const unitsData = await unitsRes.json()
                const placesData = await placesRes.json()
                setUnits(unitsData)
                // Flatten places for selection (assuming API returns list)
                // If API returns hierarchy, we'd need to flatten it here.
                // Our /api/admin/panchayats returns flat list if implemented that way, 
                // OR we can use /api/admin/places (hierarchy) and flatten it.
                // Let's assume /api/admin/panchayats returns Place[] with included district.

                const formattedPlaces = placesData.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    type: p.type,
                    districtName: p.district?.name || "Unknown"
                }))
                setPlaces(formattedPlaces)
            } else {
                toast.error("Failed to load data")
            }
        } catch (error) {
            console.error("Error fetching data", error)
            toast.error("An error occurred loading data")
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!formName || selectedPlaces.length === 0) {
            toast.error("Name and at least one place are required.")
            return
        }
        setProcessing(true)
        try {
            const payload = {
                name: formName,
                placeIds: selectedPlaces,
                status: formStatus
            }

            if (editMode && editId) {
                const res = await fetch(`/api/admin/units/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    fetchData()
                    toast.success("Unit updated")
                } else toast.error("Failed to update unit")
            } else {
                const res = await fetch("/api/admin/units", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                })
                if (res.ok) {
                    fetchData()
                    toast.success("Unit created")
                } else toast.error("Failed to create unit")
            }
            setDialogOpen(false)
            resetForm()
        } catch (error) {
            console.error(error)
            toast.error("An error occurred")
        } finally {
            setProcessing(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this unit?")) return
        try {
            const res = await fetch(`/api/admin/units/${id}`, { method: "DELETE" })
            if (res.ok) {
                setUnits(units.filter(u => u.id !== id))
                toast.success("Unit deleted")
            } else toast.error("Failed to delete unit")
        } catch (error) {
            toast.error("An error occurred")
        }
    }

    const startEdit = (unit: Unit) => {
        setEditMode(true)
        setEditId(unit.id)
        setFormName(unit.name)
        setSelectedPlaces(unit.placeIds)
        setFormStatus(unit.status)
        setDialogOpen(true)
    }

    const resetForm = () => {
        setEditMode(false)
        setEditId(null)
        setFormName("")
        setSelectedPlaces([])
        setFormStatus("Active")
    }

    const togglePlaceSelection = (placeId: string) => {
        setSelectedPlaces(prev =>
            prev.includes(placeId)
                ? prev.filter(id => id !== placeId)
                : [...prev, placeId]
        )
    }

    const filteredUnits = units.filter(u =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const filteredPlaces = places.filter(p =>
        p.name.toLowerCase().includes(placeSearch.toLowerCase()) ||
        p.districtName.toLowerCase().includes(placeSearch.toLowerCase())
    )

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Units</h1>
                    <p className="text-muted-foreground">Manage organizational units and their assigned areas.</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm() }}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4" /> Add Unit</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{editMode ? "Edit Unit" : "Create New Unit"}</DialogTitle>
                            <DialogDescription>
                                Define a unit and assign one or more places (Municipality/Panchayat) to it.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="unit-name">Unit Name</Label>
                                    <Input
                                        id="unit-name"
                                        placeholder="e.g. Kondotty Area"
                                        value={formName}
                                        onChange={(e) => setFormName(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status</Label>
                                    <Select value={formStatus} onValueChange={(v: any) => setFormStatus(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Assign Places ({selectedPlaces.length} selected)</Label>
                                <div className="border rounded-md p-2 space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            placeholder="Search places..."
                                            className="pl-8"
                                            value={placeSearch}
                                            onChange={(e) => setPlaceSearch(e.target.value)}
                                        />
                                    </div>
                                    <div className="h-48 overflow-y-auto space-y-1 p-1">
                                        {filteredPlaces.length === 0 ? (
                                            <p className="text-sm text-center text-muted-foreground py-4">No places found.</p>
                                        ) : (
                                            filteredPlaces.map(place => (
                                                <div
                                                    key={place.id}
                                                    className={`flex items-center space-x-2 p-2 rounded-sm cursor-pointer hover:bg-accent ${selectedPlaces.includes(place.id) ? "bg-accent/50" : ""}`}
                                                    onClick={() => togglePlaceSelection(place.id)}
                                                >
                                                    <Checkbox
                                                        checked={selectedPlaces.includes(place.id)}
                                                        onCheckedChange={() => togglePlaceSelection(place.id)}
                                                    />
                                                    <div className="flex-1 text-sm">
                                                        <span className="font-medium">{place.name}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">({place.districtName})</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px]">{place.type}</Badge>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleSave} disabled={processing}>{processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Unit</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{units.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Active Units</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{units.filter(u => u.status === "Active").length}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4">
                <div className="flex items-center gap-2">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search units..."
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
                                <TableHead>Unit Name</TableHead>
                                <TableHead>Covered Places</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUnits.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        No units found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUnits.map((unit) => (
                                    <TableRow key={unit.id}>
                                        <TableCell className="font-medium">{unit.name}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {unit.placeIds.map((pid) => {
                                                    const place = places.find(p => p.id === pid)
                                                    return place ? (
                                                        <Badge key={pid} variant="secondary" className="text-xs">
                                                            {place.name}
                                                        </Badge>
                                                    ) : null
                                                })}
                                                {unit.placeIds.length === 0 && <span className="text-muted-foreground text-sm">No places assigned</span>}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={unit.status === "Active" ? "default" : "secondary"}>
                                                {unit.status}
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
                                                    <DropdownMenuItem onClick={() => startEdit(unit)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(unit.id)}>
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
