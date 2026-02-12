import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const donationId = searchParams.get('donationId');

    if (!donationId) {
        return NextResponse.json({ error: 'Donation ID is required' }, { status: 400 });
    }

    try {
        const donation = await prisma.donation.findUnique({
            where: { id: donationId },
            select: { paymentStatus: true }
        });

        if (!donation) {
            return NextResponse.json({ error: 'Donation not found' }, { status: 404 });
        }

        return NextResponse.json({ status: donation.paymentStatus });

    } catch (error) {
        console.error('Error fetching donation status:', error);
        return NextResponse.json({ error: 'Error fetching status' }, { status: 500 });
    }
}
