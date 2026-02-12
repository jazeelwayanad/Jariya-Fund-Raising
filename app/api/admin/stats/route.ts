
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Total Revenue
        const revenue = await prisma.donation.aggregate({
            _sum: { amount: true },
            where: { paymentStatus: 'SUCCESS' }
        });
        const totalRevenue = revenue._sum.amount || 0;

        // 2. Active Donors (Total unique successful donations for now, or just total successful donations)
        const totalDonations = await prisma.donation.count({
            where: { paymentStatus: 'SUCCESS' }
        });

        // 3. Total Batches
        const totalBatches = await prisma.batch.count();
        const activeBatches = await prisma.batch.count({ where: { status: 'Active' } });

        // 4. Total Units
        const totalUnits = await prisma.unit.count();

        // 5. Recent Transactions
        const recentDonations = await prisma.donation.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                batch: { select: { name: true } },
            }
        });

        // 6. Payment Method Stats (for Reports)
        const paymentStats = await prisma.donation.groupBy({
            by: ['paymentMethod'],
            _sum: { amount: true },
            where: { paymentStatus: 'SUCCESS' },
        });

        // 7. Top Batches (for Reports - might be heavy, optimise later if needed)
        // We can use the totalAmount field in Batch model if we keep it updated.
        const topBatches = await prisma.batch.findMany({
            take: 5,
            orderBy: { totalAmount: 'desc' },
            select: {
                name: true,
                totalAmount: true,
                _count: { select: { donations: true } }
            }
        });

        // 8. Monthly Stats (for Reports - Current Month)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyRevenue = await prisma.donation.aggregate({
            _sum: { amount: true },
            where: {
                paymentStatus: 'SUCCESS',
                createdAt: { gte: firstDay }
            }
        });

        return NextResponse.json({
            metrics: {
                totalRevenue,
                totalDonations,
                totalBatches,
                activeBatches,
                totalUnits,
                monthlyRevenue: monthlyRevenue._sum.amount || 0
            },
            recentDonations,
            reports: {
                paymentStats,
                topBatches
            }
        });

    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
