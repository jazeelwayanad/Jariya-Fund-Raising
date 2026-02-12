
import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            amount, // in rupees
            name,
            mobile,
            batchId,
            unitId,
            placeId,
            hideName
        } = body;

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 });
        }

        // Create Order in Razorpay
        const options = {
            amount: Math.round(parseFloat(amount) * 100), // amount in paise
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
                amount: parseFloat(amount),
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
