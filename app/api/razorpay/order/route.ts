import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';

const orderSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    name: z.string().optional(),
    mobile: z.string().optional(),
    batchId: z.string().optional().nullable(),
    unitId: z.string().optional().nullable(),
    placeId: z.string().optional().nullable(),
    hideName: z.boolean().optional(),
});

export async function POST(request: Request) {
    try {
        const body = await request.json();

        const result = orderSchema.safeParse(body);
        if (!result.success) {
            return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
        }

        const {
            amount,
            name,
            mobile,
            batchId,
            unitId,
            placeId,
            hideName
        } = result.data;

        // Create Order in Razorpay
        const options = {
            amount: Math.round(amount * 100), // amount in paise
            currency: 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);

        // Parse Place ID for hierarchy
        let finalPlaceId = placeId;
        let finalDistrictId = null;
        let finalSectionId = null;

        if (placeId && placeId.startsWith('district-')) {
            finalDistrictId = placeId.replace('district-', '');
            finalPlaceId = null;
        } else if (placeId && placeId.startsWith('section-')) {
            finalSectionId = placeId.replace('section-', '');
            finalPlaceId = null;
        }

        // Create Pending Donation in Database
        await prisma.donation.create({
            data: {
                amount: amount,
                name,
                mobile,
                batchId: batchId || null,
                unitId: unitId || null,
                placeId: finalPlaceId || null,
                districtId: finalDistrictId || null,
                sectionId: finalSectionId || null,
                hideName: hideName || false,
                paymentMethod: 'RAZORPAY' as PaymentMethod,
                transactionId: order.id, // Store order_id initially
                paymentStatus: 'PENDING',
            },
        });

        return NextResponse.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
    }
}
