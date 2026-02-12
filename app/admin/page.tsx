"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Activity, CreditCard, DollarSign, Users, MapPin, Layers } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch("/api/admin/stats")
                if (res.ok) {
                    const data = await res.json()
                    setStats(data)
                }
            } catch (error) {
                console.error("Failed to load stats", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="flex h-96 items-center justify-center text-muted-foreground">Loading dashboard...</div>
    if (!stats) return <div className="text-red-500">Failed to load data.</div>

    const { metrics, recentDonations } = stats

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Revenue
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{metrics.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">
                            Collected so far
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Donations
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalDonations}</div>
                        <p className="text-xs text-muted-foreground">
                            Successful contributions
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Batches</CardTitle>
                        <Layers className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalBatches}</div>
                        <p className="text-xs text-muted-foreground">
                            {metrics.activeBatches} active
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{metrics.totalUnits}</div>
                        <p className="text-xs text-muted-foreground">
                            across all districts
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Transactions */}
            <Card>
                <CardHeader>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription>
                        Latest donation activity.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Donor</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Batch</TableHead>
                                <TableHead>Method</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentDonations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">No recent transactions</TableCell>
                                </TableRow>
                            ) : (
                                recentDonations.map((txn: any) => (
                                    <TableRow key={txn.id}>
                                        <TableCell className="font-medium">
                                            {txn.name || "Anonymous"}
                                            {txn.hideName && <span className="ml-2 text-xs text-muted-foreground">(Hidden)</span>}
                                        </TableCell>
                                        <TableCell className="font-bold">₹{txn.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {txn.batch ? <Badge variant="outline">{txn.batch.name}</Badge> : "-"}
                                        </TableCell>
                                        <TableCell>{txn.paymentMethod}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    txn.paymentStatus === "SUCCESS"
                                                        ? "default"
                                                        : txn.paymentStatus === "PENDING"
                                                            ? "outline"
                                                            : "destructive"
                                                }
                                                className={
                                                    txn.paymentStatus === "SUCCESS" ? "bg-green-500 hover:bg-green-600" : ""
                                                }
                                            >
                                                {txn.paymentStatus}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-sm">
                                            {new Date(txn.createdAt).toLocaleDateString()}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
