import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';
import { z } from 'zod';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const orderSchema = z.object({
    amount: z.coerce.number().positive("Amount must be positive"),
    name: z.string().optional(),
    mobile: z.string().min(1, "Mobile number is required"),
    batchId: z.string().optional().nullable(),
    unitId: z.string().optional().nullable(),
    placeId: z.string().optional().nullable(),
    hideName: z.boolean().optional(),
    category: z.enum(['BATCH', 'GENERAL', 'PARENT']).optional(),
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
            hideName,
            category
        } = result.data;

        // Verify Authentication (Optional: Only if cookie exists)
        let collectedById = null;
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (token) {
            try {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secret);
                // If token is valid, we assume the user is the one collecting
                if (payload.id) {
                    collectedById = payload.id as string;
                }
            } catch (e) {
                // Token invalid or expired, ignore (treat as anonymous/public donation)
                // console.log("Token verification failed in order route", e);
            }
        }

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
                category: category || 'GENERAL',
                collectedById: collectedById, // Link to coordinator if logged in
            },
        });

        return NextResponse.json({ ...order, keyId: process.env.RAZORPAY_KEY_ID });
    } catch (error) {
        console.error('Error creating Razorpay order:', error);
        return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
    }
}
