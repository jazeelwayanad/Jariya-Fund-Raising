"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import { Pencil, Trash2, Plus, GripVertical } from "lucide-react"
import { toast } from "sonner"

interface Slide {
    id: string
    title: string | null
    description: string | null
    imageUrl: string
    link: string | null
    order: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export default function SlidesPage() {
    const [slides, setSlides] = useState<Slide[]>([])
    const [loading, setLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSlide, setEditingSlide] = useState<Slide | null>(null)
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        imageUrl: "",
        link: "",
        order: 0,
        isActive: true,
    })

    const fetchSlides = async () => {
        try {
            const res = await fetch("/api/admin/slides")
            if (res.ok) {
                const data = await res.json()
                setSlides(data)
            }
        } catch (error) {
            console.error("Failed to fetch slides", error)
            toast.error("Failed to fetch slides")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSlides()
    }, [])

    const handleOpenDialog = (slide?: Slide) => {
        if (slide) {
            setEditingSlide(slide)
            setFormData({
                title: slide.title || "",
                description: slide.description || "",
                imageUrl: slide.imageUrl,
                link: slide.link || "",
                order: slide.order,
                isActive: slide.isActive,
            })
        } else {
            setEditingSlide(null)
            setFormData({
                title: "",
                description: "",
                imageUrl: "",
                link: "",
                order: slides.length,
                isActive: true,
            })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const url = editingSlide
                ? `/api/admin/slides/${editingSlide.id}`
                : "/api/admin/slides"
            const method = editingSlide ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                toast.success(
                    editingSlide ? "Slide updated successfully" : "Slide created successfully"
                )
                setIsDialogOpen(false)
                fetchSlides()
            } else {
                toast.error("Failed to save slide")
            }
        } catch (error) {
            console.error("Failed to save slide", error)
            toast.error("Failed to save slide")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this slide?")) return

        try {
            const res = await fetch(`/api/admin/slides/${id}`, {
                method: "DELETE",
            })

            if (res.ok) {
                toast.success("Slide deleted successfully")
                fetchSlides()
            } else {
                toast.error("Failed to delete slide")
            }
        } catch (error) {
            console.error("Failed to delete slide", error)
            toast.error("Failed to delete slide")
        }
    }

    if (loading) return <div>Loading...</div>

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Slides Management</h1>
                    <p className="text-muted-foreground">
                        Manage the slides displayed on the landing page.
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="mr-2 h-4 w-4" /> Add Slide
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Slides</CardTitle>
                    <CardDescription>
                        Drag and drop functionality is not implemented yet, please use the order field.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Image</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Order</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {slides.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No slides found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                slides.map((slide) => (
                                    <TableRow key={slide.id}>
                                        <TableCell>
                                            <img
                                                src={slide.imageUrl}
                                                alt={slide.title || "Slide"}
                                                className="h-10 w-16 object-cover rounded-md"
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">{slide.title || "Untitled"}</TableCell>
                                        <TableCell>{slide.order}</TableCell>
                                        <TableCell>
                                            <Switch
                                                checked={slide.isActive}
                                                onCheckedChange={async (checked) => {
                                                    // Optimistic update
                                                    const updatedSlides = slides.map(s => s.id === slide.id ? { ...s, isActive: checked } : s)
                                                    setSlides(updatedSlides)

                                                    try {
                                                        await fetch(`/api/admin/slides/${slide.id}`, {
                                                            method: "PUT",
                                                            headers: { "Content-Type": "application/json" },
                                                            body: JSON.stringify({ ...slide, isActive: checked }),
                                                        })
                                                        toast.success("Status updated")
                                                    } catch (error) {
                                                        toast.error("Failed to update status")
                                                        fetchSlides() // Revert on error
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleOpenDialog(slide)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDelete(slide.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingSlide ? "Edit Slide" : "Add Slide"}</DialogTitle>
                        <DialogDescription>
                            {editingSlide
                                ? "Update the details of the slide."
                                : "Fill in the details to create a new slide."}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) =>
                                    setFormData({ ...formData, title: e.target.value })
                                }
                                placeholder="Slide Title"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({ ...formData, description: e.target.value })
                                }
                                placeholder="Slide Description"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="imageUrl">Image URL (Required)</Label>
                            <Input
                                id="imageUrl"
                                value={formData.imageUrl}
                                onChange={(e) =>
                                    setFormData({ ...formData, imageUrl: e.target.value })
                                }
                                placeholder="https://example.com/image.jpg"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="link">Link (Optional)</Label>
                            <Input
                                id="link"
                                value={formData.link}
                                onChange={(e) =>
                                    setFormData({ ...formData, link: e.target.value })
                                }
                                placeholder="https://example.com"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="order">Order</Label>
                                <Input
                                    id="order"
                                    type="number"
                                    value={formData.order}
                                    onChange={(e) =>
                                        setFormData({ ...formData, order: parseInt(e.target.value) })
                                    }
                                />
                            </div>
                            <div className="flex items-center gap-2 pt-8">
                                <Switch
                                    id="isActive"
                                    checked={formData.isActive}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, isActive: checked })
                                    }
                                />
                                <Label htmlFor="isActive">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit">Save</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
