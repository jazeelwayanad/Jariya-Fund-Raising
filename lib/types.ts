export type Role = 'SUPERADMIN' | 'STAFF' | 'VIEWER';
export type PaymentMethod = 'UPI' | 'QR' | 'RAZORPAY' | 'CASH';
export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    createdAt: Date;
    updatedAt: Date;
}

export interface Donation {
    id: string;
    amount: number;
    name?: string | null;
    mobile?: string | null;
    hideName: boolean;
    batchId?: string | null;
    districtId?: string | null;
    municipalityId?: string | null;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    transactionId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    // Relations (optional/partial)
    batch?: Batch | null;
    district?: District | null;
    municipality?: Municipality | null;
}

export interface Batch {
    id: string;
    name: string;
    totalAmount: number;
}

export interface District {
    id: string;
    name: string;
}

export interface Municipality {
    id: string;
    name: string;
    districtId: string;
}

export interface Settings {
    id: string;
    campaignTitle: string;
    campaignStatus: 'ACTIVE' | 'PAUSED';
    totalAmountCached: number;
    bannerImage?: string | null;
    razorpayKeyId?: string | null;
    razorpayKeySecret?: string | null;
    upiId?: string | null;
}
