
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { status } = body;

        // Validate the status value
        if (!status || !['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be PENDING, SUCCESS, or FAILED.' },
                { status: 400 }
            );
        }

        // Fetch the current donation to check if it exists and get its current state
        const existingDonation = await prisma.donation.findUnique({
            where: { id },
        });

        if (!existingDonation) {
            return NextResponse.json(
                { error: 'Donation not found' },
                { status: 404 }
            );
        }

        const oldStatus = existingDonation.paymentStatus;
        const newStatus = status as PaymentStatus;

        // Update the donation status
        const updatedDonation = await prisma.donation.update({
            where: { id },
            data: { paymentStatus: newStatus },
            include: {
                batch: { select: { name: true } },
                unit: { select: { name: true } },
                place: { select: { name: true } },
            },
        });

        // Adjust Batch totalAmount based on status transitions
        if (existingDonation.batchId) {
            if (oldStatus === 'SUCCESS' && newStatus !== 'SUCCESS') {
                // Was SUCCESS, now it's not — subtract from batch total
                await prisma.batch.update({
                    where: { id: existingDonation.batchId },
                    data: { totalAmount: { decrement: existingDonation.amount } },
                });
            } else if (oldStatus !== 'SUCCESS' && newStatus === 'SUCCESS') {
                // Was not SUCCESS, now it is — add to batch total
                await prisma.batch.update({
                    where: { id: existingDonation.batchId },
                    data: { totalAmount: { increment: existingDonation.amount } },
                });
            }
        }

        return NextResponse.json(updatedDonation);
    } catch (error) {
        console.error('Error updating donation status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
