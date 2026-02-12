import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const password = await bcrypt.hash("admin123", 10);
    const user = await prisma.user.upsert({
        where: { email: "admin@jariya.com" },
        update: {},
        create: {
            email: "admin@jariya.com",
            name: "Super Admin",
            password,
            role: "SUPERADMIN",
        },
    });
    console.log({ user });
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
