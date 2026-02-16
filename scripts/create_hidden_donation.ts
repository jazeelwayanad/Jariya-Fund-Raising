
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const hiddenDonation = await prisma.donation.create({
            data: {
                amount: 123.45,
                name: "Test Hidden Donor",
                mobile: "9999999999",
                hideName: true,
                paymentMethod: "CASH",
                paymentStatus: "SUCCESS",
                transactionId: "HIDDEN_TEST_" + Date.now(),
            },
        });
        console.log("Created hidden donation ID:", hiddenDonation.id);
        console.log("Created hidden donation Transaction ID:", hiddenDonation.transactionId);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
