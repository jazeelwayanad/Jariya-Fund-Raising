"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { CreditCard, Users, MapPin, Layers, ArrowUpRight, Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

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

    if (loading) {
        return (
            <div className="flex h-[calc(100vh-200px)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-[#115E59]" />
            </div>
        )
    }

    if (!stats) return <div className="text-red-500">Failed to load data.</div>

    const { metrics, recentDonations } = stats

    const StatCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <div className={cn("p-2 rounded-full bg-opacity-10", colorClass)}>
                    <Icon className={cn("h-4 w-4", colorClass.replace("bg-", "text-"))} />
                </div>
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-[#115E59]">{value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                    {subtext}
                </p>
            </CardContent>
        </Card>
    )

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
                    <p className="text-muted-foreground mt-1">Overview of your campaign performance.</p>
                </div>
                {/* Potential Action Buttons */}
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Revenue"
                    value={`₹${metrics.totalRevenue.toLocaleString()}`}
                    subtext="Collected so far"
                    icon={CreditCard}
                    colorClass="bg-teal-100 text-teal-600"
                />
                <StatCard
                    title="Total Donations"
                    value={metrics.totalDonations}
                    subtext="Successful contributions"
                    icon={Users}
                    colorClass="bg-blue-100 text-blue-600"
                />
                <StatCard
                    title="Total Batches"
                    value={metrics.totalBatches}
                    subtext={`${metrics.activeBatches} active campaigns`}
                    icon={Layers}
                    colorClass="bg-amber-100 text-amber-600"
                />
                <StatCard
                    title="Total Units"
                    value={metrics.totalUnits}
                    subtext="Across all districts"
                    icon={MapPin}
                    colorClass="bg-purple-100 text-purple-600"
                />
            </div>

            {/* Recent Transactions */}
            <Card className="border-none shadow-md overflow-hidden">
                <CardHeader className="bg-white border-b border-gray-100">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-bold text-gray-900">Recent Transactions</CardTitle>
                            <CardDescription>
                                Latest donation activity across all channels.
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" className="hidden sm:flex" asChild>
                            <a href="/admin/donations" className="flex items-center gap-2">
                                View All <ArrowUpRight className="h-4 w-4" />
                            </a>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="w-[200px] font-semibold text-gray-600">Donor</TableHead>
                                <TableHead className="font-semibold text-gray-600">Amount</TableHead>
                                <TableHead className="font-semibold text-gray-600">Batch</TableHead>
                                <TableHead className="font-semibold text-gray-600">Method</TableHead>
                                <TableHead className="font-semibold text-gray-600">Status</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {recentDonations.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32 text-muted-foreground">
                                        No recent transactions found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                recentDonations.map((txn: any) => (
                                    <TableRow key={txn.id} className="hover:bg-gray-50/50 transition-colors">
                                        <TableCell className="font-medium text-gray-900">
                                            {txn.name || "Anonymous"}
                                            {txn.hideName && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-normal">Hidden</span>}
                                        </TableCell>
                                        <TableCell className="font-bold text-[#115E59]">₹{txn.amount.toLocaleString()}</TableCell>
                                        <TableCell>
                                            {txn.batch ? <Badge variant="secondary" className="font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border-none">{txn.batch.name}</Badge> : "-"}
                                        </TableCell>
                                        <TableCell className="text-gray-600 text-sm">{txn.paymentMethod}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    txn.paymentStatus === "SUCCESS"
                                                        ? "default"
                                                        : txn.paymentStatus === "PENDING"
                                                            ? "outline"
                                                            : "destructive"
                                                }
                                                className={cn(
                                                    "capitalize shadow-none border-none",
                                                    txn.paymentStatus === "SUCCESS" && "bg-green-100 text-green-700 hover:bg-green-100/80",
                                                    txn.paymentStatus === "PENDING" && "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80",
                                                    txn.paymentStatus === "FAILED" && "bg-red-100 text-red-700 hover:bg-red-100/80"
                                                )}
                                            >
                                                {txn.paymentStatus.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-gray-500 text-sm">
                                            {new Date(txn.createdAt).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
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


