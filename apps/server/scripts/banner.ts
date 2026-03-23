import prisma from "@/db";

async function seed() {
    await prisma.banners.create({
        data: {
            carousel: [
                "https://www.feracemyagmur.com/idea/oq/07/themes/selftpl_66fb9f51159b4/assets/uploads/slider_1.jpg?revision=8.0.0.0-2-1758372471",
                "https://www.feracemyagmur.com/idea/oq/07/themes/selftpl_66fb9f51159b4/assets/uploads/slider_2.jpg?revision=8.0.0.0-2-1758372471"
            ],
            separator: "https://www.feracemyagmur.com/idea/oq/07/themes/selftpl_66fb9f51159b4/assets/uploads/slider_1.jpg?revision=8.0.0.0-2-1758372471"
        }
    }).then((x) => console.log("oluşturdum finally"))
}

await seed()