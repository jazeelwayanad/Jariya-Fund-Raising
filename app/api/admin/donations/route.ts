
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { PaymentStatus, PaymentMethod, DonationCategory } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Pagination
        const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
        const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
        const skip = (page - 1) * limit;

        // Filters
        const batchId  = searchParams.get('batchId');
        const unitId   = searchParams.get('unitId');
        const placeId  = searchParams.get('placeId');
        const status   = searchParams.get('status');
        const method   = searchParams.get('method');
        const category = searchParams.get('category');
        const search   = searchParams.get('search');

        const where: any = {};

        if (batchId)  where.batchId  = batchId;
        if (unitId)   where.unitId   = unitId;
        if (placeId)  where.placeId  = placeId;
        if (method)   where.paymentMethod = method as PaymentMethod;
        if (category) where.category = category as DonationCategory;

        if (status) {
            where.paymentStatus = status as PaymentStatus;
        } else {
            const settings = await prisma.settings.findFirst();
            const displayStatuses = settings?.displayStatuses ?? ['SUCCESS'];
            where.paymentStatus = { in: displayStatuses };
        }

        if (search) {
            where.OR = [
                { name:          { contains: search, mode: 'insensitive' } },
                { transactionId: { contains: search, mode: 'insensitive' } },
                { mobile:        { contains: search, mode: 'insensitive' } },
                { id:            { contains: search, mode: 'insensitive' } },
            ];
        }

        const include = {
            batch:       { select: { id: true, name: true } },
            collectedBy: { select: { name: true, username: true } },
            unit:        { select: { id: true, name: true } },
            place:       { select: { id: true, name: true } },
        };

        const [total, data] = await prisma.$transaction([
            prisma.donation.count({ where }),
            prisma.donation.findMany({
                where,
                include,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
        ]);

        return NextResponse.json({
            data,
            total,
            page,
            limit,
            totalPages: Math.max(1, Math.ceil(total / limit)),
        });
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


