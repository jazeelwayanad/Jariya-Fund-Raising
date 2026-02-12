"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ChevronDown,
    ChevronRight,
    Plus,
    MoreHorizontal,
    Pencil,
    Trash2,
    MapPin,
    Building,
    Landmark,
    Globe,
    Loader2
} from "lucide-react"
import { toast } from "sonner" // Assuming sonner or use standard alert/toast

// --- Types ---
interface Panchayat {
    id: string
    name: string
    type: "Municipality" | "Panchayat" | "Corporation" | "Other"
}

interface District {
    id: string
    name: string
    panchayats: Panchayat[]
}

interface Section {
    id: string
    name: string
    type: "State" | "Section" | "Country" | "Other"
    category: "KERALA" | "OTHERS"
    districts: District[]
}

export default function AdminPlacesPage() {
    const [sections, setSections] = useState<Section[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
    const [expandedDistricts, setExpandedDistricts] = useState<Set<string>>(new Set())

    // Dialog states
    const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
    const [districtDialogOpen, setDistrictDialogOpen] = useState(false)
    const [panchayatDialogOpen, setPanchayatDialogOpen] = useState(false)

    const [newName, setNewName] = useState("")
    const [newType, setNewType] = useState<string>("State")
    const [targetSectionId, setTargetSectionId] = useState("")
    const [targetDistrictId, setTargetDistrictId] = useState("")

    const [editMode, setEditMode] = useState(false)
    const [editId, setEditId] = useState("")
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchSections()
    }, [])

    const fetchSections = async () => {
        try {
            const res = await fetch("/api/admin/places")
            if (res.ok) {
                const data = await res.json()
                setSections(data)
            } else {
                toast.error("Failed to load places.")
            }
        } catch (error) {
            console.error("Failed to load places", error)
            toast.error("An unexpected error occurred while loading places.")
        } finally {
            setLoading(false)
        }
    }

    const toggleSection = (id: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    const toggleDistrict = (id: string) => {
        setExpandedDistricts((prev) => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    // --- Helpers for Dynamic Labels ---
    const getHierarchyLabels = (type: Section["type"]) => {
        switch (type) {
            case "Country":
                return {
                    l2Singular: "State",
                    l2Plural: "states",
                    l3Singular: "City/Area",
                    l3Plural: "cities/areas"
                }
            case "Other":
                return {
                    l2Singular: "Place",
                    l2Plural: "places",
                    l3Singular: "Sub-area",
                    l3Plural: "sub-areas"
                }
            default: // State or Section
                return {
                    l2Singular: "District",
                    l2Plural: "districts",
                    l3Singular: "Place",
                    l3Plural: "places"
                }
        }
    }

    // --- Section CRUD ---
    const addSection = async () => {
        if (!newName.trim()) return
        setProcessing(true)
        try {
            if (editMode) {
                const res = await fetch(`/api/admin/places/sections/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, type: newType })
                })
                if (res.ok) {
                    fetchSections()
                    toast.success("Section updated successfully.")
                } else {
                    toast.error("Failed to update section.")
                }
            } else {
                const res = await fetch("/api/admin/places", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, type: newType })
                })
                if (res.ok) {
                    fetchSections()
                    toast.success("Section added successfully.")
                } else {
                    toast.error("Failed to add section.")
                }
            }
            setNewName("")
            setNewType("State")
            setEditMode(false)
            setSectionDialogOpen(false)
        } catch (error) {
            console.error("Error saving section", error)
            toast.error("An unexpected error occurred.")
        } finally {
            setProcessing(false)
        }
    }

    const deleteSection = async (id: string) => {
        if (!confirm("Are you sure you want to delete this section? All contained data will be lost.")) return
        try {
            const res = await fetch(`/api/admin/places/sections/${id}`, { method: "DELETE" })
            if (res.ok) {
                fetchSections()
                toast.success("Section deleted successfully.")
            } else {
                toast.error("Failed to delete section.")
            }
        } catch (error) {
            console.error("Error deleting section", error)
            toast.error("An unexpected error occurred.")
        }
    }

    const editSection = (section: Section) => {
        setNewName(section.name)
        setNewType(section.type)
        setEditId(section.id)
        setEditMode(true)
        setSectionDialogOpen(true)
    }

    // --- District CRUD ---
    const addDistrict = async () => {
        if (!newName.trim() || !targetSectionId) return
        setProcessing(true)
        try {
            if (editMode) {
                const res = await fetch(`/api/admin/districts/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName })
                })
                if (res.ok) {
                    fetchSections()
                    toast.success("Sub-region updated successfully.")
                } else {
                    toast.error("Failed to update sub-region.")
                }
            } else {
                const res = await fetch("/api/admin/districts", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, sectionId: targetSectionId })
                })
                if (res.ok) {
                    fetchSections()
                    setExpandedSections(prev => new Set(prev).add(targetSectionId))
                    toast.success("Sub-region added successfully.")
                } else {
                    toast.error("Failed to add sub-region.")
                }
            }
            setNewName("")
            setEditMode(false)
            setDistrictDialogOpen(false)
        } catch (error) {
            console.error("Error saving district", error)
            toast.error("An unexpected error occurred.")
        } finally {
            setProcessing(false)
        }
    }

    const deleteDistrict = async (sectionId: string, districtId: string) => {
        if (!confirm("Delete this sub-region? All contained data will be lost.")) return
        try {
            const res = await fetch(`/api/admin/districts/${districtId}`, { method: "DELETE" })
            if (res.ok) {
                fetchSections()
                toast.success("Sub-region deleted successfully.")
            } else {
                toast.error("Failed to delete sub-region.")
            }
        } catch (error) {
            console.error("Error deleting district", error)
            toast.error("An unexpected error occurred.")
        }
    }

    const editDistrict = (sectionId: string, district: District) => {
        setNewName(district.name)
        setEditId(district.id)
        setTargetSectionId(sectionId)
        setEditMode(true)
        setDistrictDialogOpen(true)
    }

    // --- Panchayat CRUD ---
    const addPanchayat = async () => {
        if (!newName.trim() || !targetSectionId || !targetDistrictId) return
        setProcessing(true)
        try {
            if (editMode) {
                const res = await fetch(`/api/admin/panchayats/${editId}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, type: newType })
                })
                if (res.ok) {
                    fetchSections()
                    toast.success("Place updated successfully.")
                } else {
                    toast.error("Failed to update place.")
                }
            } else {
                const res = await fetch("/api/admin/panchayats", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name: newName, type: newType, districtId: targetDistrictId })
                })
                if (res.ok) {
                    fetchSections()
                    setExpandedDistricts(prev => new Set(prev).add(targetDistrictId))
                    toast.success("Place added successfully.")
                } else {
                    toast.error("Failed to add place.")
                }
            }
            setNewName("")
            setNewType("Panchayat")
            setEditMode(false)
            setPanchayatDialogOpen(false)
        } catch (error) {
            console.error("Error saving place", error)
            toast.error("An unexpected error occurred.")
        } finally {
            setProcessing(false)
        }
    }

    const deletePanchayat = async (sectionId: string, districtId: string, panchayatId: string) => {
        if (!confirm("Delete this place?")) return
        try {
            const res = await fetch(`/api/admin/panchayats/${panchayatId}`, { method: "DELETE" })
            if (res.ok) {
                fetchSections()
                toast.success("Place deleted successfully.")
            } else {
                toast.error("Failed to delete place.")
            }
        } catch (error) {
            console.error("Error deleting place", error)
            toast.error("An unexpected error occurred.")
        }
    }

    const editPanchayat = (sectionId: string, districtId: string, panchayat: Panchayat) => {
        setNewName(panchayat.name)
        setNewType(panchayat.type)
        setEditId(panchayat.id)
        setTargetSectionId(sectionId)
        setTargetDistrictId(districtId)
        setEditMode(true)
        setPanchayatDialogOpen(true)
    }

    const totalDistricts = sections.reduce((a, s) => a + s.districts.length, 0)
    const totalPanchayats = sections.reduce(
        (a, s) => a + s.districts.reduce((b, d) => b + d.panchayats.length, 0),
        0
    )

    const typeColor = (type: string) => {
        switch (type) {
            case "Corporation": return "bg-purple-100 text-purple-700"
            case "Municipality": return "bg-blue-100 text-blue-700"
            case "Panchayat": return "bg-green-100 text-green-700"
            case "Country": return "bg-indigo-100 text-indigo-700"
            case "State": return "bg-orange-100 text-orange-700"
            default: return "bg-gray-100 text-gray-700"
        }
    }

    // Get current labels for active dialog
    const activeSection = sections.find(s => s.id === targetSectionId)
    const activeLabels = activeSection ? getHierarchyLabels(activeSection.type) : getHierarchyLabels("State")

    if (loading) {
        return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Places</h1>
                <Dialog open={sectionDialogOpen} onOpenChange={(open) => { setSectionDialogOpen(open); if (!open) { setEditMode(false); setNewName(""); setNewType("State") } }}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Add Section / State / Country
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editMode ? "Edit" : "Add"} Root Region</DialogTitle>
                            <DialogDescription>
                                Add a high-level region like State, Country, or Section.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="section-name">Name</Label>
                                <Input
                                    id="section-name"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    placeholder="e.g. Kerala, UAE"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label>Type</Label>
                                <Select value={newType} onValueChange={setNewType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="State">State</SelectItem>
                                        <SelectItem value="Section">Section</SelectItem>
                                        <SelectItem value="Country">Country</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={addSection} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (editMode ? "Save" : "Add")}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Sections / Regions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{sections.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Sub-regions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDistricts}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Places</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPanchayats}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tree View */}
            <Card>
                <CardHeader>
                    <CardTitle>Place Hierarchy</CardTitle>
                    <CardDescription>
                        Manage your geographical structure.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {sections.length === 0 && (
                        <div className="text-center py-10 text-muted-foreground">
                            No regions added yet. Click &quot;Add Section&quot; to get started.
                        </div>
                    )}
                    <div className="space-y-1">
                        {sections.map((section) => {
                            const labels = getHierarchyLabels(section.type)
                            return (
                                <div key={section.id} className="border rounded-lg">
                                    {/* Section Row */}
                                    <div
                                        className="flex items-center justify-between p-3 hover:bg-muted/50 cursor-pointer rounded-t-lg"
                                        onClick={() => toggleSection(section.id)}
                                    >
                                        <div className="flex items-center gap-2">
                                            {expandedSections.has(section.id) ? (
                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                            )}
                                            {section.type === "Country" ? (
                                                <Globe className="h-4 w-4 text-indigo-600" />
                                            ) : (
                                                <MapPin className="h-4 w-4 text-primary" />
                                            )}
                                            <span className="font-semibold">{section.name}</span>
                                            <Badge variant="outline" className={`text-[10px] ${typeColor(section.type)}`}>
                                                {section.type}
                                            </Badge>
                                            <Badge variant="outline" className={`text-[10px] ${section.category === "KERALA" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                                {section.category === "KERALA" ? "Kerala" : "Others"}
                                            </Badge>
                                            <Badge variant="secondary" className="text-xs ml-2">
                                                {section.districts.length} {labels.l2Plural}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setTargetSectionId(section.id)
                                                    setNewName("")
                                                    setEditMode(false)
                                                    setDistrictDialogOpen(true)
                                                }}
                                            >
                                                <Plus className="h-3 w-3 mr-1" /> {labels.l2Singular}
                                            </Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => editSection(section)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() => deleteSection(section.id)}
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    {/* L2 (Districts/States) */}
                                    {expandedSections.has(section.id) && (
                                        <div className="border-t">
                                            {section.districts.length === 0 && (
                                                <div className="text-sm text-muted-foreground text-center py-4 pl-10">
                                                    No {labels.l2Plural} yet. Add one above.
                                                </div>
                                            )}
                                            {section.districts.map((district) => (
                                                <div key={district.id} className="border-b last:border-b-0">
                                                    {/* District Row */}
                                                    <div
                                                        className="flex items-center justify-between p-3 pl-10 hover:bg-muted/30 cursor-pointer"
                                                        onClick={() => toggleDistrict(district.id)}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            {expandedDistricts.has(district.id) ? (
                                                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                            ) : (
                                                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                                            )}
                                                            <Building className="h-4 w-4 text-orange-500" />
                                                            <span className="font-medium">{district.name}</span>
                                                            <Badge variant="outline" className="text-xs">
                                                                {district.panchayats.length} {labels.l3Plural}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setTargetSectionId(section.id)
                                                                    setTargetDistrictId(district.id)
                                                                    setNewName("")
                                                                    setNewType("Panchayat")
                                                                    setEditMode(false)
                                                                    setPanchayatDialogOpen(true)
                                                                }}
                                                            >
                                                                <Plus className="h-3 w-3 mr-1" /> {labels.l3Singular}
                                                            </Button>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => editDistrict(section.id, district)}>
                                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="text-red-600"
                                                                        onClick={() => deleteDistrict(section.id, district.id)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>

                                                    {/* L3 (Panchayats/Places/Areas) */}
                                                    {expandedDistricts.has(district.id) && (
                                                        <div className="bg-muted/20">
                                                            {district.panchayats.length === 0 && (
                                                                <div className="text-sm text-muted-foreground text-center py-3 pl-20">
                                                                    No {labels.l3Plural} yet. Add one above.
                                                                </div>
                                                            )}
                                                            {district.panchayats.map((p) => (
                                                                <div
                                                                    key={p.id}
                                                                    className="flex items-center justify-between p-2.5 pl-20 hover:bg-muted/40 border-t"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Landmark className="h-3.5 w-3.5 text-teal-600" />
                                                                        <span className="text-sm">{p.name}</span>
                                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${typeColor(p.type)}`}>
                                                                            {p.type}
                                                                        </span>
                                                                    </div>
                                                                    <DropdownMenu>
                                                                        <DropdownMenuTrigger asChild>
                                                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                                <MoreHorizontal className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </DropdownMenuTrigger>
                                                                        <DropdownMenuContent align="end">
                                                                            <DropdownMenuItem onClick={() => editPanchayat(section.id, district.id, p)}>
                                                                                <Pencil className="mr-2 h-4 w-4" /> Edit
                                                                            </DropdownMenuItem>
                                                                            <DropdownMenuItem
                                                                                className="text-red-600"
                                                                                onClick={() => deletePanchayat(section.id, district.id, p.id)}
                                                                            >
                                                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                                            </DropdownMenuItem>
                                                                        </DropdownMenuContent>
                                                                    </DropdownMenu>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Add District/State/Place Dialog */}
            <Dialog open={districtDialogOpen} onOpenChange={(open) => { setDistrictDialogOpen(open); if (!open) { setEditMode(false); setNewName("") } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editMode ? "Edit" : "Add"} {activeLabels.l2Singular}</DialogTitle>
                        <DialogDescription>
                            {editMode ? `Update this ${activeLabels.l2Singular.toLowerCase()}.` : `Add a new ${activeLabels.l2Singular.toLowerCase()} under ${sections.find(s => s.id === targetSectionId)?.name || "the section"}.`}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="district-name">{activeLabels.l2Singular} Name</Label>
                            <Input
                                id="district-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder={`e.g. ${activeLabels.l2Singular === "State" ? "Dubai" : "Malappuram"}`}
                                onKeyDown={(e) => e.key === "Enter" && addDistrict()}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={addDistrict} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (editMode ? "Save" : "Add")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Panchayat/Municipality/Area Dialog */}
            <Dialog open={panchayatDialogOpen} onOpenChange={(open) => { setPanchayatDialogOpen(open); if (!open) { setEditMode(false); setNewName(""); setNewType("Panchayat") } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editMode ? "Edit" : "Add"} {activeLabels.l3Singular}</DialogTitle>
                        <DialogDescription>
                            Add a place to this {activeLabels.l2Singular.toLowerCase()}.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="place-name">Name</Label>
                            <Input
                                id="place-name"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                placeholder="e.g. Kondotty"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Type</Label>
                            <Select value={newType} onValueChange={(v) => setNewType(v as Panchayat["type"])}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Municipality">Municipality</SelectItem>
                                    <SelectItem value="Panchayat">Panchayat</SelectItem>
                                    <SelectItem value="Corporation">Corporation</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={addPanchayat} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin" /> : (editMode ? "Save" : "Add")}</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
