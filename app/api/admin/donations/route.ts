
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

        // If specific status requested (e.g. from filter dropdown), use it
        if (status) {
            where.paymentStatus = status as PaymentStatus;
        } else {
            // Otherwise, apply global display settings
            const settings = await prisma.settings.findFirst();
            const displayStatuses = settings?.displayStatuses || ["SUCCESS"]; // Default safe fallback
            where.paymentStatus = { in: displayStatuses };
        }

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

        if (!mobile) {
            return NextResponse.json({ error: 'Mobile number is required' }, { status: 400 });
        }

        // Generate a unique transactionId if not provided, to avoid unique constraint violations
        const finalTransactionId = transactionId && transactionId.trim() !== ''
            ? transactionId.trim()
            : `ADMIN-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

        const donation = await prisma.donation.create({
            data: {
                amount: parseFloat(amount),
                name,
                mobile,
                batchId,
                unitId,
                placeId,
                paymentMethod: paymentMethod as PaymentMethod,
                transactionId: finalTransactionId,
                hideName: hideName || false,
                paymentStatus: 'SUCCESS',
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
