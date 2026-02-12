"use client"

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
import { Badge } from "@/components/ui/badge"
import { BarChart, PieChart, TrendingUp, Calendar, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function AdminReportsPage() {
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
                console.error("Failed to load reports", error)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) return <div className="flex h-96 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    if (!stats) return <div className="text-red-500">Failed to load reports.</div>

    const { metrics, reports } = stats
    const { paymentStats, topBatches } = reports

    // Calculate Payment Method Percentages
    const totalPaymentAmount = paymentStats.reduce((acc: number, curr: any) => acc + (curr._sum.amount || 0), 0)

    const getPaymentPercentage = (amount: number) => {
        if (totalPaymentAmount === 0) return 0
        return Math.round((amount / totalPaymentAmount) * 100)
    }

    const getPaymentAmount = (method: string) => {
        const stat = paymentStats.find((s: any) => s.paymentMethod === method)
        return stat ? (stat._sum.amount || 0) : 0
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
            </div>

            {/* Overview Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{metrics.totalRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">All time revenue</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Donation</CardTitle>
                        <BarChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ₹{metrics.totalDonations > 0 ? Math.round(metrics.totalRevenue / metrics.totalDonations).toLocaleString() : 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Per successful donation</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                        <PieChart className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">100%</div>
                        <p className="text-xs text-muted-foreground">Of recorded transactions</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₹{metrics.monthlyRevenue.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Payment Methods */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Payment Methods</CardTitle>
                        <CardDescription>
                            Distribution of donation methods.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {["UPI", "QR", "RAZORPAY", "CASH"].map((method) => {
                            const amount = getPaymentAmount(method)
                            const percentage = getPaymentPercentage(amount)
                            let color = "bg-primary"
                            if (method === "QR") color = "bg-orange-500"
                            if (method === "RAZORPAY") color = "bg-blue-500"
                            if (method === "CASH") color = "bg-gray-500"

                            return (
                                <div className="space-y-2" key={method}>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="font-medium">{method}</span>
                                        <span className="text-muted-foreground">{percentage}% (₹{amount.toLocaleString()})</span>
                                    </div>
                                    <div className="h-2 w-full rounded-full bg-secondary">
                                        <div className={`h-2 rounded-full ${color}`} style={{ width: `${percentage}%` }} />
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                {/* Top Batches */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Top Performing Batches</CardTitle>
                        <CardDescription>
                            Batches with highest total contributions.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Batch</TableHead>
                                    <TableHead>Donations Count</TableHead>
                                    <TableHead className="text-right">Total Raised</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {topBatches.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No data available</TableCell>
                                    </TableRow>
                                ) : (
                                    topBatches.map((batch: any) => (
                                        <TableRow key={batch.name}>
                                            <TableCell className="font-medium">{batch.name}</TableCell>
                                            <TableCell>{batch._count.donations}</TableCell>
                                            <TableCell className="text-right font-bold">₹{batch.totalAmount.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
