import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    // // 1. Super Admin
    // const adminPassword = await bcrypt.hash("JariyaAdMin@7017", 10);
    // const admin = await prisma.user.upsert({
    //     where: { email: "jariyaadmin@sabeelulhidaya.info" },
    //     update: {},
    //     create: {
    //         email: "jariyaadmin@sabeelulhidaya.info",
    //         name: "Super Admin",
    //         password: adminPassword,
    //         role: "SUPERADMIN",
    //     },
    // });
    // console.log("Super Admin seeded:", admin.email);

    // 2. Batches and Coordinators (Batch 2 to 18)
    for (let i = 2; i <= 18; i++) {
        const batchName = `Batch ${i}`;
        const username = `batch${i}`;
        const email = `batch${i}@sabeelulhidaya.info`;
        const rawPassword = `batch${i}shic`; // password pattern
        const hashedPassword = await bcrypt.hash(rawPassword, 10);

        // upsert batch
        const batch = await prisma.batch.upsert({
            where: { name: batchName },
            update: {},
            create: {
                name: batchName,
                year: "2024", // Default year or handle dynamically
                description: `Batch ${i} Description`,
                status: "Active"
            }
        });

        // upsert coordinator
        const coordinator = await prisma.user.upsert({
            where: { email }, // Check by email
            update: {
                username: username,
                batchId: batch.id,
                password: hashedPassword // Ensure password is updated if it changed
            },
            create: {
                name: batchName, // Or "Coordinator Batch X"
                email,
                username,
                password: hashedPassword,
                role: "COORDINATOR",
                batchId: batch.id
            }
        });
        console.log(`Seeded: ${batchName} -> ${coordinator.username}`);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
