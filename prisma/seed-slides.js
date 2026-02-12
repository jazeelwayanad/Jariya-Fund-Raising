const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
    console.log("Seeding slides...");

    // Delete existing slides
    await prisma.slide.deleteMany();

    // Create sample slides
    await prisma.slide.createMany({
        data: [
            {
                title: "സമസ്ത ഇസ്തിഖാമ",
                description: "റിസർച്ച് & ഡെവലപ്മെൻ്റ് സെൻ്റർ",
                imageUrl: "https://images.unsplash.com/photo-1562774053-701939374585?w=1200&h=600&fit=crop",
                order: 0,
                isActive: true,
            },
            {
                title: "ജാരിയ ഫണ്ട്‌റെയ്‌സിംഗ്",
                description: "ഇന്താനവഴിയിൽ ചേരിന്നുനിൽക്കാം",
                imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&h=600&fit=crop",
                order: 1,
                isActive: true,
            },
        ],
    });

    console.log("Slides seeded successfully!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
