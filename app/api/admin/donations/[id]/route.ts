
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
        const {
            status,
            amount,
            name,
            mobile,
            transactionId,
            batchId,
            unitId,
            placeId,
            paymentMethod
        } = body;

        // If status is provided, validate it
        if (status && !['PENDING', 'SUCCESS', 'FAILED'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be PENDING, SUCCESS, or FAILED.' },
                { status: 400 }
            );
        }

        // Fetch the current donation to check if it exists and get its current state
        const existingDonation = await prisma.donation.findUnique({
            where: { id },
            include: { batch: true }
        });

        if (!existingDonation) {
            return NextResponse.json(
                { error: 'Donation not found' },
                { status: 404 }
            );
        }

        const oldStatus = existingDonation.paymentStatus;
        const newStatus = status ? (status as PaymentStatus) : oldStatus;

        const oldAmount = existingDonation.amount;
        const newAmount = amount !== undefined ? parseFloat(amount) : oldAmount;

        const oldBatchId = existingDonation.batchId;
        const newBatchId = batchId !== undefined ? (batchId === "none" || batchId === null ? null : batchId) : oldBatchId;

        // Prepare update data
        const updateData: any = {};
        if (status) updateData.paymentStatus = status;
        if (amount !== undefined) updateData.amount = parseFloat(amount);
        if (name !== undefined) updateData.name = name;
        if (mobile !== undefined) updateData.mobile = mobile;
        if (transactionId !== undefined) updateData.transactionId = transactionId;
        if (batchId !== undefined) updateData.batchId = newBatchId;
        if (unitId !== undefined) updateData.unitId = unitId === "none" || unitId === null ? null : unitId;
        if (placeId !== undefined) updateData.placeId = placeId === "none" || placeId === null ? null : placeId;
        if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
        if (body.hideName !== undefined) updateData.hideName = body.hideName;
        if (body.category !== undefined) updateData.category = body.category;

        // Transaction to ensure data consistency
        const Result = await prisma.$transaction(async (tx) => {
            // 1. Update Donation
            const updatedDonation = await tx.donation.update({
                where: { id },
                data: updateData,
                include: {
                    batch: { select: { name: true } },
                    unit: { select: { name: true } },
                    place: { select: { name: true } },
                },
            });

            // 2. Handle Batch Total Updates
            // Scenario A: Status Changed
            // Scenario B: Amount Changed (and status is SUCCESS)
            // Scenario C: Batch Changed (and status is SUCCESS)

            // Simplification: Revert old contribution, Add new contribution

            // Revert Old (if it was SUCCESS)
            if (oldStatus === 'SUCCESS' && oldBatchId) {
                await tx.batch.update({
                    where: { id: oldBatchId },
                    data: { totalAmount: { decrement: oldAmount } }
                });
            }

            // Apply New (if it is SUCCESS)
            if (newStatus === 'SUCCESS' && newBatchId) {
                await tx.batch.update({
                    where: { id: newBatchId },
                    data: { totalAmount: { increment: newAmount } }
                });
            }

            return updatedDonation;
        });

        return NextResponse.json(Result);
    } catch (error) {
        console.error('Error updating donation status:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
