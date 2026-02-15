
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const batchId = searchParams.get('batchId');
        const unitId = searchParams.get('unitId');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        const where: any = {};

        if (batchId) where.batchId = batchId;
        if (unitId) where.unitId = unitId;
        if (status) where.paymentStatus = status as PaymentStatus;

        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { transactionId: { contains: search, mode: 'insensitive' } },
                { mobile: { contains: search, mode: 'insensitive' } },
            ];
        }

        const donations = await prisma.donation.findMany({
            where,
            include: {
                batch: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                collectedBy: {
                    select: {
                        name: true,
                        username: true
                    }
                },
                unit: { select: { id: true, name: true } },
                place: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(donations);
    } catch (error) {
        console.error('Error fetching donations:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            amount,
            name,
            mobile,
            batchId,
            unitId,
            placeId,
            paymentMethod,
            transactionId,
            hideName
        } = body;

        if (!amount || !paymentMethod) {
            return NextResponse.json({ error: 'Amount and Payment Method are required' }, { status: 400 });
        }

        const donation = await prisma.donation.create({
            data: {
                amount: parseFloat(amount),
                name,
                mobile,
                batchId,
                unitId,
                placeId,
                paymentMethod: paymentMethod as PaymentMethod,
                transactionId,
                hideName: hideName || false,
                paymentStatus: 'SUCCESS', // default to success for manual entry, or PENDING if from public form (handled elsewhere usually)
                // For admin manual entry, we usually assume it's verified or SUCCESS.
            },
        });

        // Update Batch totalAmount
        if (batchId) {
            await prisma.batch.update({
                where: { id: batchId },
                data: {
                    totalAmount: { increment: parseFloat(amount) }
                }
            });
        }

        return NextResponse.json(donation);
    } catch (error) {
        console.error('Error creating donation:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
