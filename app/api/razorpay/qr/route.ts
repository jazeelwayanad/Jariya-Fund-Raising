import { NextResponse } from 'next/server';
import { razorpay } from '@/lib/razorpay';
import prisma from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        console.log('QR Create Request Body:', body);
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

        // Verify Authentication (Optional: Only if cookie exists)
        let collectedById = null;
        const cookieStore = await cookies();
        const token = cookieStore.get("auth_token")?.value;

        if (token) {
            try {
                const secret = new TextEncoder().encode(process.env.JWT_SECRET);
                const { payload } = await jwtVerify(token, secret);
                if (payload.id) {
                    collectedById = payload.id as string;
                }
            } catch (e) {
                // Ignore invalid token
            }
        }

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

        console.log('Location:', { finalPlaceId, finalDistrictId, finalSectionId });

        // 1. Create Pending Donation in Database first to get ID
        const donation = await prisma.donation.create({
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
                paymentMethod: 'RAZORPAY' as PaymentMethod, // We can distinguish if needed, but RAZORPAY is fine
                transactionId: `PENDING_QR_${Date.now()}`, // Temporary ID
                paymentStatus: 'PENDING',
                collectedById: collectedById,
            },
        });

        console.log('Donation created in DB:', donation.id);

        // 2. Create QR Code in Razorpay (Direct API Call to debug SDK issue)
        const qrPayload = {
            type: "upi_qr",
            name: "Jariya Donation",
            usage: "single_use",
            fixed_amount: true,
            payment_amount: Math.round(parseFloat(amount) * 100),
            description: `Donation by ${name}`,
            notes: {
                donationId: donation.id,
            }
        };

        console.log('Razorpay KR API Payload:', qrPayload);

        const basicAuth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

        const qrRes = await fetch('https://api.razorpay.com/v1/payments/qr_codes', {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${basicAuth}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(qrPayload)
        });

        const qrResponseData = await qrRes.json();

        if (!qrRes.ok) {
            console.error('Razorpay API Error:', qrResponseData);
            return NextResponse.json({
                error: 'Razorpay QR Generation Failed',
                details: qrResponseData
            }, { status: qrRes.status });
        }

        const qr = qrResponseData;
        console.log('Razorpay QR Response:', JSON.stringify(qr, null, 2));

        // 3. Update donation with the QR ID (optional, but good for tracking)
        await prisma.donation.update({
            where: { id: donation.id },
            data: {
                transactionId: qr.id, // Store QR ID as transaction ID for now
            }
        });

        // Attempt to find the raw string
        // standard structure for upi_qr often has payload.upi.string
        let rawQrString = qr.payload?.upi?.string || qr.qr_string;

        // If no raw string, try resolving the short URL if it exists
        if (!rawQrString && qr.image_url && qr.image_url.includes('rzp.io')) {
            try {
                // First try: simple fetch to follow redirects or get content
                const resolveRes = await fetch(qr.image_url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                // If it redirected to a upi:// link (unlikely for fetch but possible) or returned a body
                const text = await resolveRes.text();

                // Search for upi:// pattern in the response body (common in Razorpay redirection pages)
                const upiMatch = text.match(/upi:\/\/pay\?[^"']+/);

                if (upiMatch && upiMatch[0]) {
                    rawQrString = upiMatch[0];
                    console.log("Resolved UPI Intent from Body:", rawQrString);
                } else if (resolveRes.url && resolveRes.url.startsWith('upi://')) {
                    rawQrString = resolveRes.url;
                    console.log("Resolved UPI Intent from Redirect:", rawQrString);
                }
            } catch (e) {
                console.error("Error resolving QR shortlink:", e);
            }
        }

        // Fallback to image_url if still no string (frontend will handle this by showing image)
        if (!rawQrString) rawQrString = qr.image_url;

        return NextResponse.json({
            ...qr,
            qr_image_url: qr.image_url,
            donationId: donation.id,
            qr_id: qr.id,
            qr_string: rawQrString
        });

    } catch (error: any) {
        console.error('Error creating Razorpay QR:', error);
        return NextResponse.json({
            error: 'Error creating QR code',
            details: error.message || error
        }, { status: 500 });
    }
}
