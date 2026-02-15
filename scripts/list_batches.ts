import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const coordinators = await prisma.user.findMany({
        where: { role: "COORDINATOR" },
        include: { batch: true },
        orderBy: { username: 'asc' }, // usually 'batchX'
    });

    if (coordinators.length === 0) {
        console.log("No coordinators found.");
        return;
    }

    console.log("Found " + coordinators.length + " coordinators:");
    coordinators.forEach(c => {
        // Simple heuristic for expected password based on seed pattern
        // Pattern 1: batch{i}shic
        // Pattern 2: batch2@shic (special case?)
        let expectedPassword = "Unknown (Manual)";
        const match = c.username?.match(/batch(\d+)$/i);
        if (match) {
            const num = match[1];
            // Based on seedC.ts which used `batch${i}shic`
            expectedPassword = `batch${num}shic`;
        }

        console.log(`----------------------------------------`);
        console.log(`Name:     ${c.name}`);
        console.log(`Username: ${c.username}`);
        console.log(`Email:    ${c.email}`);
        console.log(`Batch:    ${c.batch?.name || "None"}`);
        console.log(`Password: ${expectedPassword} (Assuming default seed pattern)`);
    });
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
