
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(request: Request) {
    try {
        const body = await request.text(); // Webhook signature verification needs raw body
        const signature = request.headers.get('x-razorpay-signature');
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            console.error('RAZORPAY_WEBHOOK_SECRET is not defined');
            return NextResponse.json({ error: 'Configuration Error' }, { status: 500 });
        }

        if (!signature) {
            return NextResponse.json({ error: 'Missing Signature' }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(body)
            .digest('hex');

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: 'Invalid Signature' }, { status: 400 });
        }

        const event = JSON.parse(body);

        if (event.event === 'payment.captured' || event.event === 'order.paid') {
            const payment = event.payload.payment.entity;
            const order_id = payment.order_id;
            const donationId = payment.notes?.donationId;

            let donation = null;

            // 1. Try finding by donationId from notes (Best for QR & Custom flows)
            if (donationId) {
                donation = await prisma.donation.findUnique({
                    where: { id: donationId }
                });
            }

            // 2. Fallback: Find by transactionId (order_id)
            if (!donation && order_id) {
                donation = await prisma.donation.findUnique({
                    where: { transactionId: order_id }
                });
            }

            if (donation && donation.paymentStatus !== 'SUCCESS') {
                // Update Donation
                await prisma.donation.update({
                    where: { id: donation.id },
                    data: {
                        paymentStatus: 'SUCCESS',
                        transactionId: payment.id, // Update to payment_id
                    }
                });

                // Increment Batch
                if (donation.batchId) {
                    await prisma.batch.update({
                        where: { id: donation.batchId },
                        data: { totalAmount: { increment: donation.amount } }
                    });
                }
            }
        }

        return NextResponse.json({ status: 'ok' });
    } catch (error) {
        console.error('Error processing webhook:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
