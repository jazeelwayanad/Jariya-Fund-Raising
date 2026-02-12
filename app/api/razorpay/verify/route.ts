
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = body;

        const secret = process.env.RAZORPAY_KEY_SECRET!;
        const generated_signature = crypto
            .createHmac('sha256', secret)
            .update(razorpay_order_id + '|' + razorpay_payment_id)
            .digest('hex');

        if (generated_signature === razorpay_signature) {
            // Payment is successful
            const donation = await prisma.donation.update({
                where: { transactionId: razorpay_order_id }, // Find by order_id
                data: {
                    paymentStatus: 'SUCCESS',
                    transactionId: razorpay_payment_id, // Update to payment_id
                },
                include: { batch: true }
            });

            // Update Batch Total
            if (donation.batchId) {
                await prisma.batch.update({
                    where: { id: donation.batchId },
                    data: {
                        totalAmount: { increment: donation.amount }
                    }
                });
            }

            return NextResponse.json({ status: 'success', donation });
        } else {
            return NextResponse.json({ status: 'failure', message: 'Invalid signature' }, { status: 400 });
        }
    } catch (error) {
        console.error('Error verifying payment:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
